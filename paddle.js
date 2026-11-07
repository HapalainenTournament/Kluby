// CLUBROOM v85 · Paddle Billing for Clubroom Pass (one subscription = one club).
// Env: PASS_CHECKOUT=on, PADDLE_ENV=sandbox|live, PADDLE_CLIENT_TOKEN, PADDLE_PRICE_ID, PADDLE_WEBHOOK_SECRET.
// The browser opens Paddle checkout with custom_data {club_id, consent_id}. Pass is activated ONLY from
// signed webhooks – never from anything the browser says.
import crypto from "node:crypto";
import {query,enabled} from "./db.js";
import {resetEntitlementCache} from "./entitlements.js";

export const paddleEnv=()=>String(process.env.PADDLE_ENV||"sandbox").toLowerCase()==="live"?"live":"sandbox";
export function checkoutConfig(){
 const on=String(process.env.PASS_CHECKOUT||"off").toLowerCase()==="on";
 const token=String(process.env.PADDLE_CLIENT_TOKEN||""),priceId=String(process.env.PADDLE_PRICE_ID||"");
 const ready=on&&enabled&&!!token&&/^pri_/.test(priceId)&&!!process.env.PADDLE_WEBHOOK_SECRET;
 return ready?{enabled:true,env:paddleEnv(),clientToken:token,priceId}:{enabled:false};
}

// Paddle-Signature: "ts=1671552777;h1=<hex>" (h1 may repeat during secret rotation). Signed payload = `${ts}:${rawBody}`.
export function verifySignature(raw,header,secret=process.env.PADDLE_WEBHOOK_SECRET,toleranceSec=300,now=Date.now()){
 if(!secret||!header||!raw)return false;
 const parts=String(header).split(";").map(x=>x.split("=")),ts=parts.find(p=>p[0]==="ts")?.[1],hs=parts.filter(p=>p[0]==="h1").map(p=>p[1]);
 if(!ts||!hs.length||!/^\d+$/.test(ts))return false;
 if(Math.abs(now/1000-Number(ts))>toleranceSec)return false;
 const exp=crypto.createHmac("sha256",secret).update(`${ts}:`).update(Buffer.isBuffer(raw)?raw:Buffer.from(String(raw))).digest("hex");
 return hs.some(h=>/^[0-9a-f]{64}$/i.test(h)&&crypto.timingSafeEqual(Buffer.from(h,"hex"),Buffer.from(exp,"hex")));
}

const DAY=86400000;
// How long a subscription in a given state keeps the club premium.
export function accessUntil(sub,now=Date.now()){
 const end=Date.parse(sub?.current_billing_period?.ends_at||"")||0;
 switch(sub?.status){
  case "active":case "trialing":return new Date(Math.max(end,now)+2*DAY);   // small buffer for the renewal webhook
  case "past_due":return new Date(Math.max(end,now+3*DAY));                  // Paddle is retrying the payment
  case "canceled":return new Date(Date.parse(sub.canceled_at||"")||now);
  default:return new Date(now);                                              // paused or unknown
 }
}
const clubOf=d=>String(d?.custom_data?.club_id||"").replace(/[^0-9]/g,"");

export async function handleEvent(ev){
 if(!ev?.event_id||!ev?.event_type)return {ignored:"malformed"};
 const seen=await query(`INSERT INTO paddle_events(event_id,event_type,occurred_at) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING event_id`,[ev.event_id,ev.event_type,ev.occurred_at||null]);
 if(!seen.rowCount)return {ignored:"duplicate"};
 const d=ev.data||{},club=clubOf(d),at=ev.occurred_at||new Date().toISOString();
 if(ev.event_type.startsWith("subscription.")){
  if(!club)return {ignored:"no club_id"};
  const until=accessUntil(d),isEnd=["canceled","paused"].includes(d.status);
  // A cancel/pause of an OLD subscription must not end a newer one; older events must not overwrite newer state.
  const r=await query(`INSERT INTO club_entitlements(club_id,platform,plan,source,provider_subscription_id,provider_customer_id,provider_status,provider_event_at,active_until,updated_at)
   VALUES($1,'any','pass','paddle',$2,$3,$4,$5,$6,now())
   ON CONFLICT(club_id,platform) DO UPDATE SET plan=CASE WHEN club_entitlements.plan='owner' THEN 'owner' ELSE 'pass' END,source='paddle',
    provider_subscription_id=EXCLUDED.provider_subscription_id,provider_customer_id=EXCLUDED.provider_customer_id,provider_status=EXCLUDED.provider_status,
    provider_event_at=EXCLUDED.provider_event_at,active_until=EXCLUDED.active_until,updated_at=now()
   WHERE (club_entitlements.provider_event_at IS NULL OR club_entitlements.provider_event_at<=EXCLUDED.provider_event_at)
     AND NOT ($7 AND club_entitlements.provider_subscription_id IS NOT NULL AND club_entitlements.provider_subscription_id<>EXCLUDED.provider_subscription_id
              AND club_entitlements.active_until>now())
   RETURNING club_id`,[club,d.id||null,d.customer_id||null,d.status||null,at,until,isEnd]);
  resetEntitlementCache();
  if(d.custom_data?.consent_id)await markConsent(d.custom_data.consent_id,null,"subscribed");
  return {club,status:d.status,applied:r.rowCount>0,until:until.toISOString()};
 }
 if(ev.event_type==="transaction.completed"){
  if(d.custom_data?.consent_id)await markConsent(d.custom_data.consent_id,d.id,"paid");
  return {club,transaction:d.id};
 }
 return {ignored:ev.event_type};
}
async function markConsent(id,txn,status){
 if(!/^[0-9a-f-]{36}$/i.test(String(id)))return;
 await query(`UPDATE pass_consent_evidence SET status=$2,provider_transaction_id=COALESCE($3,provider_transaction_id) WHERE id=$1`,[id,status,txn]);
}
