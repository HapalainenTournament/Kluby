// POSTGAME v92 · Stripe Billing + Managed Payments (Stripe/Link is merchant of record) for Postgame Pass.
// Env: PAYMENT_PROVIDER=stripe (default when STRIPE_SECRET_KEY is set), PASS_CHECKOUT=on,
//      STRIPE_SECRET_KEY (sk_test_… / sk_live_… or a restricted rk_ key), STRIPE_PRICE_ID (price_…), STRIPE_WEBHOOK_SECRET (whsec_…),
//      optional STRIPE_API_VERSION (default 2026-04-22.dahlia – first version with managed_payments), PUBLIC_URL.
// Pass is granted ONLY from signed webhooks – never from the success redirect.
import crypto from "node:crypto";
import {query,enabled} from "./db.js";
import {resetEntitlementCache} from "./entitlements.js";

export const STRIPE_API_VERSION=process.env.STRIPE_API_VERSION||"2026-04-22.dahlia";
export function stripeConfig(){
 const on=String(process.env.PASS_CHECKOUT||"off").toLowerCase()==="on";
 const key=String(process.env.STRIPE_SECRET_KEY||""),price=String(process.env.STRIPE_PRICE_ID||"");
 const ready=on&&enabled&&/^(sk|rk)_(test|live)_/.test(key)&&/^price_/.test(price)&&/^whsec_/.test(String(process.env.STRIPE_WEBHOOK_SECRET||""));
 return ready?{enabled:true,provider:"stripe",env:key.includes("_test_")?"test":"live",priceId:price}:{enabled:false,provider:"stripe"};
}

// application/x-www-form-urlencoded with Stripe's bracket notation
export function formEncode(obj,prefix="",out=[]){for(const [k,v] of Object.entries(obj)){if(v==null)continue;const key=prefix?`${prefix}[${k}]`:k;
 if(Array.isArray(v))v.forEach((x,i)=>typeof x==="object"?formEncode(x,`${key}[${i}]`,out):out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(x)}`));
 else if(typeof v==="object")formEncode(v,key,out);else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`)}return out.join("&")}

async function stripeApi(path,params,{idempotencyKey}={}){
 const r=await fetch(`https://api.stripe.com/v1/${path}`,{method:"POST",headers:{Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,"Content-Type":"application/x-www-form-urlencoded","Stripe-Version":STRIPE_API_VERSION,...(idempotencyKey?{"Idempotency-Key":idempotencyKey}:{})},body:formEncode(params)});
 const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j?.error?.message||`Stripe ${r.status}`);e.status=r.status;e.code=j?.error?.code;throw e}return j}

export function checkoutParams({clubId,email,consentId,origin}){
 const meta={club_id:clubId,consent_id:consentId};
 return {mode:"subscription",line_items:[{price:process.env.STRIPE_PRICE_ID,quantity:1}],managed_payments:{enabled:true},
  customer_email:email||undefined,client_reference_id:clubId,metadata:meta,subscription_data:{metadata:meta},
  success_url:`${origin}/pass/checkout?club=${encodeURIComponent(clubId)}&paid=1&session_id={CHECKOUT_SESSION_ID}`,
  cancel_url:`${origin}/pass/checkout?club=${encodeURIComponent(clubId)}&canceled=1`}}
export async function createCheckout(args){const s=await stripeApi("checkout/sessions",checkoutParams(args),{idempotencyKey:`clubroom-pass-${args.consentId}`});return {id:s.id,url:s.url}}

// Stripe-Signature: "t=1492774577,v1=<hex>[,v1=…][,v0=…]"; signed payload = `${t}.${rawBody}`.
export function verifyStripeSignature(raw,header,secret=process.env.STRIPE_WEBHOOK_SECRET,toleranceSec=300,now=Date.now()){
 if(!secret||!header||!raw)return false;const parts=String(header).split(",").map(x=>x.split("=")),t=parts.find(p=>p[0]==="t")?.[1],sigs=parts.filter(p=>p[0]==="v1").map(p=>p[1]);
 if(!t||!/^\d+$/.test(t)||!sigs.length)return false;if(Math.abs(now/1000-Number(t))>toleranceSec)return false;
 const exp=crypto.createHmac("sha256",secret).update(`${t}.`).update(Buffer.isBuffer(raw)?raw:Buffer.from(String(raw))).digest("hex");
 return sigs.some(s=>/^[0-9a-f]{64}$/i.test(s)&&crypto.timingSafeEqual(Buffer.from(s,"hex"),Buffer.from(exp,"hex")))}

const DAY=86400000;
// Newer API versions keep the billing period on subscription items.
export const periodEnd=sub=>{const s=sub?.items?.data?.[0]?.current_period_end??sub?.current_period_end;return s?Number(s)*1000:0};
export function stripeAccessUntil(sub,now=Date.now()){const end=periodEnd(sub);
 switch(sub?.status){
  case "active":case "trialing":return new Date(Math.max(end,now)+2*DAY);
  case "past_due":return new Date(Math.max(end,now+3*DAY));   // Stripe is retrying the payment
  case "canceled":return new Date((Number(sub.ended_at||sub.canceled_at)||now/1000)*1000);
  default:return new Date(now)}}                                // incomplete, incomplete_expired, unpaid, paused
const clubOf=o=>String(o?.metadata?.club_id||o?.client_reference_id||"").replace(/[^0-9]/g,"");

export async function handleStripeEvent(ev){
 if(!ev?.id||!ev?.type)return {ignored:"malformed"};
 const seen=await query(`INSERT INTO billing_events(provider,event_id,event_type,occurred_at) VALUES('stripe',$1,$2,to_timestamp($3)) ON CONFLICT DO NOTHING RETURNING event_id`,[ev.id,ev.type,Number(ev.created)||Date.now()/1000]);
 if(!seen.rowCount)return {ignored:"duplicate"};
 const o=ev.data?.object||{},at=new Date((Number(ev.created)||Date.now()/1000)*1000).toISOString();
 if(ev.type.startsWith("customer.subscription.")){
  const club=clubOf(o);if(!club)return {ignored:"no club_id"};
  const until=stripeAccessUntil(o),isEnd=!["active","trialing","past_due"].includes(o.status);
  const r=await query(`INSERT INTO club_entitlements(club_id,platform,plan,source,provider_subscription_id,provider_customer_id,provider_status,provider_event_at,active_until,updated_at)
   VALUES($1,'any','pass','stripe',$2,$3,$4,$5,$6,now())
   ON CONFLICT(club_id,platform) DO UPDATE SET plan=CASE WHEN club_entitlements.plan='owner' THEN 'owner' ELSE 'pass' END,source='stripe',
    provider_subscription_id=EXCLUDED.provider_subscription_id,provider_customer_id=EXCLUDED.provider_customer_id,provider_status=EXCLUDED.provider_status,
    provider_event_at=EXCLUDED.provider_event_at,active_until=EXCLUDED.active_until,updated_at=now()
   WHERE (club_entitlements.provider_event_at IS NULL OR club_entitlements.provider_event_at<=EXCLUDED.provider_event_at)
     AND NOT ($7 AND club_entitlements.provider_subscription_id IS NOT NULL AND club_entitlements.provider_subscription_id<>EXCLUDED.provider_subscription_id AND club_entitlements.active_until>now())
   RETURNING club_id`,[club,o.id||null,typeof o.customer==="string"?o.customer:o.customer?.id||null,o.status||null,at,until,isEnd]);
  resetEntitlementCache();return {club,status:o.status,applied:r.rowCount>0,until:until.toISOString()};
 }
 if(ev.type==="checkout.session.completed"||ev.type==="checkout.session.async_payment_succeeded"){
  const id=String(o.metadata?.consent_id||"");if(/^[0-9a-f-]{36}$/i.test(id))await query(`UPDATE pass_consent_evidence SET status='paid',provider_transaction_id=COALESCE($2,provider_transaction_id) WHERE id=$1`,[id,o.id||null]);
  return {club:clubOf(o),session:o.id};
 }
 return {ignored:ev.type};
}
