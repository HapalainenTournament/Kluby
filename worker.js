// POSTGAME v103 · Cloudflare Workers entry (replaces server.js on Render).
// Static files come from Workers Static Assets (./public). Postgres through Hyperdrive. Background jobs via Cron Triggers.
import {Hono} from "hono";
import {initWasm,Resvg} from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import F500 from "./assets/fonts/Inter_500Medium.ttf";
import F800 from "./assets/fonts/Inter_800ExtraBold.ttf";
import F900 from "./assets/fonts/Inter_900Black.ttf";
import MARK_PNG from "./public/assets/postgame-mark.png";
import {migrate,configureDb,enabled as dbEnabledLive,query} from "./db.js";
import {persistClubPayload,history,analytics,buildSessions} from "./storage.js";
import {isPremium,planOf,pruneAllFreeClubs,FREE_ARCHIVE_LIMIT} from "./entitlements.js";
import {dueClubs,rescheduleClub} from "./collector.js";
import {checkoutConfig,verifySignature,handleEvent} from "./paddle.js";
import {benchmarks} from "./benchmarks.js";
import {clubCardSvg,toPng,setRenderer,setMark} from "./og.js";
import {addWebhook,listWebhooks,removeWebhook,runDiscordJob,sessionImage} from "./discord.js";
import {stripeConfig,verifyStripeSignature,handleStripeEvent,createCheckout} from "./stripe.js";

const VERSION="102.0.3";
const dbOn=()=>dbEnabledLive;
const env$=k=>process.env[k];

/* ---------- per-isolate setup ---------- */
let migrated=null,ogReady=null;
function setup(env){
 configureDb(env.HYPERDRIVE?.connectionString||env.DATABASE_URL||null);
 if(dbOn()&&!migrated)migrated=migrate().catch(e=>{migrated=null;console.error("migrate",e.message)});
 return migrated||Promise.resolve();
}
function ensureOg(){if(!ogReady)ogReady=(async()=>{
  await initWasm(resvgWasm);
  const fonts=[F500,F800,F900].map(b=>new Uint8Array(b));
  setRenderer((svg,width)=>new Resvg(svg,{fitTo:{mode:"width",value:width},font:{fontBuffers:fonts,loadSystemFonts:false,defaultFontFamily:"Inter"}}).render().asPng());
  setMark("data:image/png;base64,"+Buffer.from(MARK_PNG).toString("base64"))})().catch(e=>{ogReady=null;throw e});
 return ogReady}

const PROVIDER=()=>String(env$("PAYMENT_PROVIDER")||(env$("STRIPE_SECRET_KEY")?"stripe":"paddle")).toLowerCase()==="paddle"?"paddle":"stripe";
const activeCheckout=()=>PROVIDER()==="stripe"?stripeConfig():{...checkoutConfig(),provider:"paddle"};
const EA="https://proclubs.ea.com/api/fc";
const cache=new Map();
const consentVersion="clubroom-pass-v1";
const consentText="I agree to the Terms of Service and understand that Postgame Pass renews every month at 4 € until I cancel.";
const safeText=(v,n=160)=>String(v??"").trim().slice(0,n);
const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=254;
const safePlatform=p=>["common-gen5","common-gen4","nx"].includes(p)?p:null;
const validPlatform=p=>["common-gen5","common-gen4","nx"].includes(p)?p:"common-gen5";
const digits=v=>String(v||"").replace(/[^\d]/g,"");

async function hiddenNames(clubId,platform){if(!dbOn())return [];const {rows}=await query(`SELECT gamertag FROM privacy_hidden_players WHERE club_id=$1 AND platform=$2 AND active=true`,[clubId,platform]);return rows.map(r=>r.gamertag).filter(Boolean)}
function maskObject(data,names){if(!names?.length)return data;const secrets=new Set(names.map(x=>x.toLocaleLowerCase()));
 const sanitize=v=>typeof v==="string"?(secrets.has(v.trim().toLocaleLowerCase())?"Hidden player":v):Array.isArray(v)?v.map(sanitize):v&&typeof v==="object"?Object.fromEntries(Object.entries(v).map(([a,b])=>[a,sanitize(b)])):v;return sanitize(data)}
async function scopedJson(data,clubId,platform){return maskObject(data,await hiddenNames(clubId,platform))}

async function ea(route,params,ttl=45000,timeoutMs=6500){
 const u=new URL(EA+route);Object.entries(params).forEach(([k,v])=>v!=null&&u.searchParams.set(k,String(v)));
 const key=u.toString(),hit=cache.get(key);if(hit&&hit.exp>Date.now())return hit.data;
 const started=Date.now();
 try{const r=await fetch(u,{signal:AbortSignal.timeout(timeoutMs),headers:{accept:"application/json","user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36"}});
  if(!r.ok)throw new Error(`EA ${r.status}: ${route}`);const data=await r.json();cache.set(key,{data,exp:Date.now()+ttl});if(cache.size>2000)cache.delete(cache.keys().next().value);return data}
 catch(e){console.warn(`[EA] ${route} FAIL ${Date.now()-started}ms · ${e.message}`);throw e}}

const EVENT_MATCH_TYPES=["tournamentMatch","tournament","eventMatch","liveEventMatch","clubTournamentMatch"];
const tagMatches=(x,t,eaType=null)=>Array.isArray(x)?x.map(m=>({...m,_matchType:t,...(eaType?{_eaMatchType:eaType}:{})})):[];
function finishClub(d,id,p){const eventMatches=[];for(const mt of EVENT_MATCH_TYPES){const k=`event_${mt}`;eventMatches.push(...tagMatches(d[k],"event",mt));delete d[k]}
 const all=[...tagMatches(d.league,"league","leagueMatch"),...tagMatches(d.playoff,"playoff","playoffMatch"),...tagMatches(d.friendly,"friendly","friendlyMatch"),...eventMatches];const seen=new Set();
 d.matches=all.sort((a,b)=>Number(b.timestamp||b.matchTimestamp||0)-Number(a.timestamp||a.matchTimestamp||0)).filter(m=>{const k=String(m.matchId||m.matchid||m.id||`${m.timestamp||m.matchTimestamp||0}:${m._eaMatchType||m._matchType}`);if(seen.has(k))return false;seen.add(k);return true});
 delete d.league;delete d.playoff;delete d.friendly;d.clubId=id;d.platform=p;d.errors=d.errors||{};return d}
async function fetchSet(defs){const keys=Object.keys(defs),rr=await Promise.allSettled(keys.map(k=>ea(...defs[k]))),d={},errors={};rr.forEach((x,i)=>x.status==="fulfilled"?(d[keys[i]]=x.value):(d[keys[i]]=null,errors[keys[i]]=x.reason?.message||"unknown"));d.errors=errors;return d}
async function loadClubFast(id,p){const d=await fetchSet({info:["/clubs/info",{platform:p,clubIds:id},180000],overall:["/clubs/overallStats",{platform:p,clubIds:id},60000],career:["/members/career/stats",{platform:p,clubId:id},60000],members:["/members/stats",{platform:p,clubId:id},60000],league:["/clubs/matches",{platform:p,clubIds:id,matchType:"leagueMatch",maxResultCount:10},30000]});d.achievements=null;d.playoff=[];d.friendly=[];return finishClub(d,id,p)}
async function loadClubFull(id,p){const defs={info:["/clubs/info",{platform:p,clubIds:id},180000],overall:["/clubs/overallStats",{platform:p,clubIds:id},60000],career:["/members/career/stats",{platform:p,clubId:id},60000],members:["/members/stats",{platform:p,clubId:id},60000],achievements:["/club/playoffAchievements",{platform:p,clubId:id},180000],league:["/clubs/matches",{platform:p,clubIds:id,matchType:"leagueMatch",maxResultCount:10},30000],playoff:["/clubs/matches",{platform:p,clubIds:id,matchType:"playoffMatch",maxResultCount:10},30000],friendly:["/clubs/matches",{platform:p,clubIds:id,matchType:"friendlyMatch",maxResultCount:10},30000]};
 for(const mt of EVENT_MATCH_TYPES)defs[`event_${mt}`]=["/clubs/matches",{platform:p,clubIds:id,matchType:mt,maxResultCount:10},30000];return finishClub(await fetchSet(defs),id,p)}

const clubCache=new Map(),refreshes=new Map();
function archiveInBackground(id,p,seed=null){const key=`${p}:${id}`;if(refreshes.has(key))return refreshes.get(key);const job=(async()=>{try{if(seed&&dbOn())await persistClubPayload(id,p,seed);const full=await loadClubFull(id,p);if(dbOn())await persistClubPayload(id,p,full);clubCache.set(key,{data:full,at:Date.now()})}catch(e){console.warn("background archive",id,e.message)}finally{refreshes.delete(key)}})();refreshes.set(key,job);return job}

/* ---------- HTML helpers ---------- */
const adsClient=()=>{const c=String(env$("ADSENSE_CLIENT")||"").trim();return /^ca-pub-\d{10,20}$/.test(c)?c:null};
const adsOn=()=>!!adsClient()&&String(env$("ADS")||"off").toLowerCase()==="on";
function adsInject(html){const c=adsClient();
 if(!c)return html.replace("</head>",`<script>window.CLUBROOM_ADS={on:false}</script></head>`);
 if(!adsOn())return html.replace("</head>",`<script>window.CLUBROOM_ADS={on:false}</script><meta name="google-adsense-account" content="${c}"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${c}" crossorigin="anonymous"></script></head>`);
 const banner=String(env$("ADSENSE_SLOT_BANNER")||"").replace(/[^\d]/g,"")||null,rewarded=/^\/\d+\/[\w./-]+$/.test(String(env$("GAM_REWARDED_UNIT")||""))?env$("GAM_REWARDED_UNIT"):null;
 return html.replace("</head>",`<script>window.CLUBROOM_ADS=${JSON.stringify({on:true,client:c,banner,rewarded})}</script><meta name="google-adsense-account" content="${c}"><script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${c}" crossorigin="anonymous"></script>${rewarded?'<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script><script>window.googletag=window.googletag||{cmd:[]}</script>':""}<meta name="clubroom-ads" content="on"></head>`)}
async function asset(c,path){const r=await c.env.ASSETS.fetch(new Request(new URL(path,c.req.url)));if(!r.ok)throw new Error(`asset ${path} ${r.status}`);return r.text()}
const html=(c,body,status=200)=>c.body(body,status,{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-cache"});
const PUBLIC_URL=()=>String(env$("PUBLIC_URL")||"https://postgame.gg").replace(/\/$/,"");
const originOf=c=>String(env$("PUBLIC_URL")||new URL(c.req.url).origin).replace(/\/$/,"");
const crestUrlOf=id=>id?`https://eafc24.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l${id}.png`:null;
const crestCache=new Map();
async function crestData(crestId){if(!crestId)return null;const k=String(crestId),hit=crestCache.get(k);if(hit&&Date.now()-hit.at<6*3600000)return hit.v;
 let v=null;try{const r=await fetch(crestUrlOf(k),{signal:AbortSignal.timeout(2500)});if(r.ok&&String(r.headers.get("content-type")||"").includes("image"))v=`data:${r.headers.get("content-type")};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`}catch{}
 crestCache.set(k,{v,at:Date.now()});return v}
const PLATFORM_LABEL={"common-gen5":"PS5 / Xbox Series / PC","common-gen4":"PS4 / Xbox One","nx":"Switch"};
async function clubSummary(id,platform){
 const [infoR,statsR,leagueR]=await Promise.allSettled([ea("/clubs/info",{platform,clubIds:id},180000,3500),ea("/clubs/overallStats",{platform,clubIds:id},60000,3500),ea("/clubs/matches",{platform,clubIds:id,matchType:"leagueMatch",maxResultCount:5},60000,3500)]);
 const info=infoR.status==="fulfilled"?((infoR.value||{})[id]||Object.values(infoR.value||{})[0]||{}):{};
 const st=statsR.status==="fulfilled"?(Array.isArray(statsR.value)?statsR.value[0]:((statsR.value||{})[id]||statsR.value))||{}:{};
 const ms=leagueR.status==="fulfilled"&&Array.isArray(leagueR.value)?leagueR.value:[];
 const form=ms.slice().sort((a,b)=>Number(b.timestamp||0)-Number(a.timestamp||0)).slice(0,5).reverse().map(m=>{const us=m.clubs?.[id],them=Object.entries(m.clubs||{}).find(([k])=>k!==String(id))?.[1];if(!us||!them)return null;const a=Number(us.goals),b=Number(them.goals);return a>b?"W":a<b?"L":"D"}).filter(Boolean);
 const crestId=info?.customKit?.crestAssetId??info?.crestAssetId??null;
 return {name:info.name||st.name||null,wins:Number(st.wins||0),ties:Number(st.ties||0),losses:Number(st.losses||0),skill:st.skillRating||null,division:st.currentDivision||info.currentDivision||null,form,crestId,platformLabel:PLATFORM_LABEL[platform]}}
const BOT_RE=/discordbot|whatsapp|twitterbot|facebookexternalhit|slackbot|telegrambot|linkedinbot|skypeuripreview|redditbot|applebot|embedly|pinterest|vkshare|iframely/i;
async function previewTags(c){const path=new URL(c.req.url).pathname;const m=path.match(/^\/club\/(\d+)(?:\/([a-z]+))?/);if(!m)return "";const id=m[1],p=validPlatform(c.req.query("platform")),img=`${PUBLIC_URL()}/og/club/${id}.png${p!=="common-gen5"?`?platform=${p}`:""}`;
 let title="Pro Clubs club · Postgame",desc="Club stats, sessions, awards and player cards for EA SPORTS FC Pro Clubs.";
 if(BOT_RE.test(c.req.header("user-agent")||"")){try{const s=await clubSummary(id,p);if(s.name){title=`${s.name} · Postgame`;desc=`${s.wins}W · ${s.ties}D · ${s.losses}L${s.form.length?` · Form ${s.form.join("")}`:""}${s.division?` · Division ${s.division}`:""} — club stats, sessions and awards.`}}catch{}}
 const e=s=>String(s).replace(/[&<>"]/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[x]));
 return `<meta name="description" content="${e(desc)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Postgame"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(desc)}"><meta property="og:url" content="${e(PUBLIC_URL()+path)}"><meta property="og:image" content="${e(img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#2dd4bf">`}
async function sendIndex(c){let h=await asset(c,"/");try{const tags=await previewTags(c);if(tags)h=h.replace(/<meta (?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/g,"").replace(/<meta name="description"[^>]*>/,"").replace("</head>",tags+"</head>")}catch{}return html(c,adsInject(h))}
const legalEsc=s=>String(s).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const OPERATOR=()=>({name:env$("OPERATOR_NAME")||"Kryštof Kadlec",ico:env$("OPERATOR_ICO")||"",address:env$("OPERATOR_ADDRESS")||"",email:env$("CONTACT_EMAIL")||"admin@postgame.gg",effective:env$("LEGAL_EFFECTIVE_DATE")||"10 November 2026"});

/* ---------- app ---------- */
const app=new Hono();
app.use("*",async(c,next)=>{await setup(c.env);await next()});
app.onError((e,c)=>{console.error("unhandled",c.req.path,e.message);return c.json({error:"Server error"},500)});
const bg=(c,p)=>{try{c.executionCtx.waitUntil(p)}catch{}};

app.post("/api/paddle/webhook",async c=>{const raw=Buffer.from(await c.req.arrayBuffer());
 if(!verifySignature(raw,c.req.header("paddle-signature")))return c.json({error:"Invalid signature"},401);
 let ev;try{ev=JSON.parse(raw.toString("utf8"))}catch{return c.json({error:"Invalid JSON"},400)}
 if(!dbOn())return c.json({error:"Database required"},503);
 try{const r=await handleEvent(ev);console.log("[PADDLE]",ev.event_type,JSON.stringify(r));return c.json({ok:true})}catch(e){console.error("[PADDLE] webhook failed",e.message);return c.json({error:"Processing failed"},500)}});
app.post("/api/stripe/webhook",async c=>{const raw=Buffer.from(await c.req.arrayBuffer());
 if(!verifyStripeSignature(raw,c.req.header("stripe-signature")))return c.json({error:"Invalid signature"},400);
 let ev;try{ev=JSON.parse(raw.toString("utf8"))}catch{return c.json({error:"Invalid JSON"},400)}
 if(!dbOn())return c.json({error:"Database required"},503);
 try{const r=await handleStripeEvent(ev);console.log("[STRIPE]",ev.type,JSON.stringify(r));return c.json({received:true})}catch(e){console.error("[STRIPE] webhook failed",ev.type,e.message);return c.json({error:"Processing failed"},500)}});
const body=async c=>{try{const t=await c.req.text();if(t.length>16384)return null;return t?JSON.parse(t):{}}catch{return {}}};

app.post("/api/privacy/removal",async c=>{
 if(!dbOn())return c.json({error:"Removal request service requires a configured database."},503);
 const b=await body(c)||{};if(b.website)return c.json({error:"Invalid submission."},400);
 const gamertag=safeText(b.gamertag,100),club=safeText(b.club,120),platform=safePlatform(b.platform),email=safeText(b.email,254),reason=safeText(b.reason,2000);
 if(!gamertag||!club||!platform||!validEmail(email)||!reason||b.privacyAcknowledged!=="on")return c.json({error:"Complete all required fields."},400);
 try{const {rows}=await query(`INSERT INTO privacy_removal_requests (gamertag,club,platform,email,reason) VALUES ($1,$2,$3,$4,$5) RETURNING id`,[gamertag,club,platform,email,reason]);const id=rows[0].id;
  const url=env$("REMOVAL_WEBHOOK_URL");let sent=false;if(url){try{const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",...(env$("REMOVAL_WEBHOOK_BEARER")?{Authorization:`Bearer ${env$("REMOVAL_WEBHOOK_BEARER")}`}:{})},body:JSON.stringify({event:"privacy.removal.requested",reference:id,club,platform,created_at:new Date().toISOString()})});sent=r.ok}catch{}}
  if(sent)await query(`UPDATE privacy_removal_requests SET notified_at=now() WHERE id=$1`,[id]);return c.json({reference:id},202)}
 catch(e){console.error("Removal request storage failed",e.message);return c.json({error:"Could not store request."},500)}});
app.post("/api/admin/privacy/removal/:id/approve",async c=>{const expected=env$("PRIVACY_ADMIN_TOKEN");if(!dbOn()||!expected)return c.json({error:"Administrative processing is not configured."},503);
 const provided=c.req.header("x-privacy-admin-token")||"";const {timingSafeEqual}=await import("node:crypto");
 if(provided.length!==expected.length||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return c.json({error:"Forbidden"},403);
 const b=await body(c)||{};const clubId=digits(safeText(b.clubId,80));if(!clubId)return c.json({error:"A verified numeric club ID is required."},400);
 try{const {rows}=await query(`SELECT * FROM privacy_removal_requests WHERE id=$1`,[c.req.param("id")]);if(!rows.length)return c.json({error:"Not found"},404);const r=rows[0];
  await query(`INSERT INTO privacy_hidden_players(club_id,platform,gamertag,active) VALUES($1,$2,$3,true) ON CONFLICT(club_id,platform,gamertag) DO UPDATE SET active=true`,[clubId,r.platform,r.gamertag]);
  await query(`UPDATE privacy_removal_requests SET status='approved',resolved_at=now(),verified_club_id=$2 WHERE id=$1`,[r.id,clubId]);clubCache.delete(`${r.platform}:${clubId}`);return c.json({ok:true,clubId,platform:r.platform})}
 catch(e){console.error("Removal approval failed",e.message);return c.json({error:"Could not approve request"},500)}});

app.get("/api/pass/status",async c=>{const ids=String(c.req.query("ids")||"").split(",").map(digits).filter(Boolean).slice(0,50);const out={};for(const id of ids){const plan=await planOf(id);out[id]={active:plan!=="free",plan}}
 return c.json({price:{amount:4,currency:"EUR",interval:"month",scope:"club"},checkoutEnabled:activeCheckout().enabled,freeArchiveLimit:FREE_ARCHIVE_LIMIT,clubs:out})});
app.get("/api/pass/config",c=>c.json({...activeCheckout(),consentVersion,consentText,price:{amount:4,currency:"EUR",interval:"month"}}));
app.post("/api/pass/checkout",async c=>{const cfg=activeCheckout();if(!cfg.enabled)return c.json({error:"Postgame Pass checkout is not open yet."},503);
 const b=await body(c)||{};if(b.consent!==true||b.consentVersion!==consentVersion)return c.json({error:"Please accept the Terms to continue."},400);
 const email=safeText(b.email,254),clubId=digits(safeText(b.clubId,80));if(!validEmail(email)||!clubId)return c.json({error:"A valid email and club ID are required."},400);
 if(await isPremium(clubId))return c.json({error:"This club already has an active Postgame Pass."},409);
 try{const {rows}=await query(`INSERT INTO pass_consent_evidence(payer_email,club_id,consent_version,consent_text) VALUES($1,$2,$3,$4) RETURNING id`,[email,clubId,consentVersion,consentText]);const consentId=rows[0].id;
  if(cfg.provider==="stripe"){const s=await createCheckout({clubId,email,consentId,origin:originOf(c)});return c.json({ok:true,provider:"stripe",url:s.url,clubId})}
  return c.json({ok:true,provider:"paddle",consentId,clubId,email,priceId:cfg.priceId})}
 catch(e){console.error("pass checkout",e.status||"",e.message);return c.json({error:"Could not start checkout. Try again."},502)}});

app.get("/api/benchmarks",async c=>{try{c.header("Cache-Control","public, max-age=1800");return c.json(await benchmarks())}catch(e){console.error("benchmarks",e.message);return c.json({error:"Benchmarks unavailable",groups:{}},500)}});
const honoursCache=new Map();
app.get("/api/club-honours/:id",async c=>{const id=digits(c.req.param("id")),p=validPlatform(c.req.query("platform"));if(!id)return c.json({error:"Invalid club ID."},400);
 const key=`${p}:${id}`,hit=honoursCache.get(key);if(hit&&Date.now()-hit.at<1800000)return c.json(hit.data);
 const [achR,ovR]=await Promise.allSettled([ea("/club/playoffAchievements",{platform:p,clubId:id},1800000),ea("/clubs/overallStats",{platform:p,clubIds:id},300000)]);
 const ach=achR.status==="fulfilled"?achR.value:null,ov=ovR.status==="fulfilled"?((ovR.value&&ovR.value[id])||Object.values(ovR.value||{})[0]||ovR.value||{}):{};
 const honours=Array.isArray(ach)?ach:(ach&&typeof ach==="object"?Object.values(ach).flat().filter(x=>x&&typeof x==="object"):[]);
 const data={honours,overall:ov,errors:{achievements:achR.status==="rejected"?String(achR.reason?.message||"failed"):null}};honoursCache.set(key,{data,at:Date.now()});return c.json(await scopedJson(data,id,p))});

for(const [from,anchor] of Object.entries({terms:"terms",privacy:"privacy",cookies:"cookies",removal:"removal",refund:"refunds",about:"about"})){app.get("/"+from,c=>c.redirect(`/legal#${anchor}`,301));app.get("/"+from+".html",c=>c.redirect(`/legal#${anchor}`,301))}
const legal=async c=>{const o=OPERATOR();const details=[o.ico&&`IČO ${o.ico}`,o.address].filter(Boolean).map(x=>`<br>${legalEsc(x)}`).join("");
 const h=(await asset(c,"/legal")).replaceAll("{{OPERATOR_NAME}}",legalEsc(o.name)).replaceAll("{{OPERATOR_DETAILS}}",details).replaceAll("{{CONTACT_EMAIL}}",legalEsc(o.email)).replaceAll("{{EFFECTIVE_DATE}}",legalEsc(o.effective));return html(c,adsInject(h))};
app.get("/legal",legal);app.get("/legal.html",legal);
app.get("/ads.txt",c=>{const a=adsClient();return c.text(a?`google.com, ${a.replace("ca-","")}, DIRECT, f08c47fec0942fa0\n`:"# no ads configured\n")});
app.get("/pass/checkout",async c=>html(c,adsInject(await asset(c,"/pass/checkout"))));
app.get("/fun",c=>c.redirect("/misc",302));
app.get("/club/:id/fun",c=>c.redirect(`/club/${c.req.param("id")}/misc`,302));

app.get("/api/search",async c=>{try{const q=String(c.req.query("q")||"").trim().slice(0,60);if(!q)return c.json({error:"Enter a club name."},400);
 return c.json(await ea("/currentSeasonLeaderboard/search",{platform:validPlatform(c.req.query("platform")),clubName:q,maxResultCount:20},30000))}catch(e){return c.json({error:"EA search failed.",detail:e.message},502)}});
app.get("/api/club-card/:id",async c=>{try{const id=digits(c.req.param("id"));if(!id)return c.json({error:"Invalid club ID."},400);const platform=validPlatform(c.req.query("platform"));
 const [infoR,statsR]=await Promise.allSettled([ea("/clubs/info",{platform,clubIds:id},4500),ea("/clubs/overallStats",{platform,clubIds:id},4500)]);
 const info=infoR.status==="fulfilled"?((infoR.value&&infoR.value[id])||Object.values(infoR.value||{})[0]||{}):{};const stats=statsR.status==="fulfilled"?((statsR.value&&statsR.value[id])||Object.values(statsR.value||{})[0]||statsR.value||{}):{};
 return c.json(await scopedJson({...stats,...info,clubId:id},id,platform))}catch(e){return c.json({error:"EA club card failed.",detail:e.message},502)}});
app.get("/api/club/:id",async c=>{const id=digits(c.req.param("id")),p=validPlatform(c.req.query("platform"));if(!id)return c.json({error:"Invalid club ID."},400);
 const key=`${p}:${id}`,hit=clubCache.get(key),age=hit?Date.now()-hit.at:Infinity;
 try{if(hit&&age<30000)return c.json({...await scopedJson(hit.data,id,p),_cache:"fresh"});
  if(hit&&age<300000){bg(c,archiveInBackground(id,p));return c.json({...await scopedJson(hit.data,id,p),_cache:"stale"})}
  const d=await loadClubFast(id,p);clubCache.set(key,{data:d,at:Date.now()});if(clubCache.size>300)clubCache.delete(clubCache.keys().next().value);
  bg(c,archiveInBackground(id,p,d));return c.json({...await scopedJson(d,id,p),_cache:"miss"})}
 catch(e){if(hit)return c.json({...await scopedJson(hit.data,id,p),_cache:"fallback",_refreshError:e.message});return c.json({error:"EA club load failed.",detail:e.message},502)}});
const liveRefreshAt=new Map();
app.post("/api/live-refresh/:id",async c=>{const id=digits(c.req.param("id")),p=validPlatform(c.req.query("platform"));if(!id)return c.json({error:"Invalid club ID."},400);
 const key=`${p}:${id}`,last=liveRefreshAt.get(key)||0;if(Date.now()-last<60000)return c.json({ok:true,throttled:true,nextInMs:60000-(Date.now()-last)});liveRefreshAt.set(key,Date.now());
 try{const d=await loadClubFast(id,p);clubCache.set(key,{data:d,at:Date.now()});if(dbOn())await persistClubPayload(id,p,d);return c.json({ok:true,throttled:false,matches:Array.isArray(d.matches)?d.matches.length:0,archived:dbOn()})}catch(e){return c.json({ok:false,error:e.message},502)}});

app.get("/api/db-export",async c=>{if(!dbOn())return c.json({error:"Database is not enabled."},503);const expected=String(env$("EXPORT_TOKEN")||""),supplied=String(c.req.query("token")||c.req.header("x-export-token")||"");
 if(!expected)return c.json({error:"EXPORT_TOKEN is not configured on the server."},503);if(supplied!==expected)return c.json({error:"Invalid export token."},401);
 try{const data={},counts={};for(const t of ["clubs","players","club_memberships","matches","match_clubs","player_match_stats","player_match_events","club_snapshots"]){const r=await query(`SELECT * FROM ${t}`);data[t]=r.rows;counts[t]=r.rowCount}
  const stamp=new Date().toISOString().replace(/[:.]/g,"-");return c.body(JSON.stringify({format:"clubroom-postgres-json-backup",version:VERSION,exportedAt:new Date().toISOString(),counts,data}),200,{"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename=postgame-db-backup-${stamp}.json`,"Cache-Control":"no-store"})}
 catch(e){return c.json({error:"Database export failed.",detail:e.message},500)}});
app.get("/api/history/:id",async c=>{const id=digits(c.req.param("id"));try{return c.json(await scopedJson(await history(id),id,validPlatform(c.req.query("platform"))))}catch(e){return c.json({error:e.message},500)}});
app.get("/api/analytics/:id",async c=>{const id=digits(c.req.param("id"));try{return c.json(await scopedJson(await analytics(id),id,validPlatform(c.req.query("platform"))))}catch(e){return c.json({error:e.message},500)}});
app.get("/api/sessions/:id",async c=>{const id=digits(c.req.param("id"));try{const gap=Math.max(30,Math.min(240,Number(c.req.query("gap")||90)));return c.json(await scopedJson(await buildSessions(id,{gapMinutes:gap,activeMinutes:45}),id,validPlatform(c.req.query("platform"))))}catch(e){return c.json({error:e.message},500)}});
app.get("/api/health",c=>c.json({ok:true,version:VERSION,runtime:"cloudflare-workers",database:dbOn(),collectorBatch:Number(env$("COLLECTOR_BATCH")||8),time:new Date().toISOString()}));
// One-off check after deploy: can this Worker reach the EA API?
app.get("/api/health/ea",async c=>{const t=Date.now();try{const r=await ea("/currentSeasonLeaderboard/search",{platform:"common-gen5",clubName:"Skutec",maxResultCount:1},0,8000);return c.json({ok:true,ms:Date.now()-t,results:Array.isArray(r)?r.length:Object.keys(r||{}).length})}catch(e){return c.json({ok:false,ms:Date.now()-t,error:e.message},502)}});

const ogCache=new Map();
const png=(c,buf,maxAge,extra={})=>c.body(buf,200,{"Content-Type":"image/png","Cache-Control":`public, max-age=${maxAge}`,...extra});
const ogHandler=async c=>{const id=digits(c.req.param("id")),p=validPlatform(c.req.query("platform"));if(!id)return c.body(null,400);
 const k=`${p}:${id}`,hit=ogCache.get(k);if(hit&&Date.now()-hit.at<30*60000)return png(c,hit.png,1800);
 try{await ensureOg();const s=await clubSummary(id,p);const out=toPng(clubCardSvg({...s,crest:await crestData(s.crestId),pass:await isPremium(id).catch(()=>false),url:PUBLIC_URL().replace(/^https?:\/\//,"")}),1200);
  ogCache.set(k,{png:out,at:Date.now()});if(ogCache.size>100)ogCache.delete(ogCache.keys().next().value);return png(c,out,1800)}catch(e){console.warn("og club",id,e.message);return c.body(null,500)}};
app.get("/og/club/:id",c=>ogHandler(c));
const sessionCard=async c=>{const id=digits(c.req.param("id"));if(!id||!dbOn())return c.json({error:"Session reports need the archive."},404);
 try{await ensureOg();const {sessions}=await buildSessions(id,{gapMinutes:90,activeMinutes:45});const start=Number(c.req.query("start"))||0;
  const sess=(start?sessions.find(s=>Math.abs(Date.parse(s.startedAt)-start)<5*60000):null)||sessions.find(s=>!s.active)||sessions[0];if(!sess)return c.json({error:"No session found."},404);
  const p=validPlatform(c.req.query("platform")),s=await clubSummary(id,p).catch(()=>({}));const {png:out}=sessionImage({sess,clubName:s.name||c.req.query("name")||`Club ${id}`,crest:await crestData(s.crestId)});
  return png(c,out,600,{"Content-Disposition":`inline; filename="postgame-session-${id}-${String(sess.startedAt).slice(0,10)}.png"`})}
 catch(e){console.warn("session card",id,e.message);return c.json({error:"Could not render the session report."},500)}};
app.get("/api/session-card/:id",c=>sessionCard(c));

const discordAddAt=new Map();
app.get("/api/discord/:id",async c=>{const id=digits(c.req.param("id"));try{return c.json({premium:await isPremium(id),webhooks:await listWebhooks(id)})}catch(e){return c.json({error:e.message},500)}});
app.post("/api/discord/:id",async c=>{const id=digits(c.req.param("id"));const b=await body(c)||{};const p=validPlatform(b.platform);
 const now=Date.now(),last=discordAddAt.get(id)||0;if(now-last<20000)return c.json({error:"Wait a few seconds and try again."},429);discordAddAt.set(id,now);
 try{await ensureOg();const s=await clubSummary(id,p).catch(()=>({}));return c.json({ok:true,...await addWebhook({club:id,platform:p,url:b.url,clubName:s.name})})}catch(e){return c.json({error:e.message},e.status||500)}});
app.delete("/api/discord/:id/:hook",async c=>{const id=digits(c.req.param("id"));try{const ok=await removeWebhook({club:id,id:c.req.param("hook"),key:c.req.header("x-webhook-key")});return c.json({ok,error:ok?undefined:"Wrong key – only the person who connected this channel can remove it."},ok?200:403)}catch(e){return c.json({error:e.message},500)}});

app.all("/api/*",c=>c.json({error:"Not found"},404));
app.get("*",c=>sendIndex(c));

/* ---------- cron: archive collector + Discord session reports ---------- */
async function cron(env){await setup(env);if(!dbOn()||env$("COLLECTOR_ENABLED")==="false")return;
 const batch=Number(env$("COLLECTOR_BATCH")||8);let done=0;
 try{for(const c of await dueClubs(batch)){try{const p=validPlatform(c.platform),d=await loadClubFull(String(c.club_id),p);const saved=await persistClubPayload(String(c.club_id),p,d);await rescheduleClub(String(c.club_id),p,Number(saved?.newMatches||0));done++}catch(e){console.warn("collector",c.club_id,e.message)}}}catch(e){console.warn("collector batch",e.message)}
 try{await ensureOg();const r=await runDiscordJob({clubName:async(id,p)=>(await clubSummary(id,p).catch(()=>({}))).name,crest:async(id,p)=>crestData((await clubSummary(id,p).catch(()=>({}))).crestId),refresh:(id,p)=>archiveInBackground(id,validPlatform(p))});if(r?.sent)console.log(`[DISCORD] sent ${r.sent}`)}catch(e){console.warn("[DISCORD] job",e.message)}
 if(env$("ARCHIVE_PRUNE")&&env$("ARCHIVE_PRUNE")!=="off"&&new Date().getUTCHours()%6===0&&new Date().getUTCMinutes()<5){try{await pruneAllFreeClubs()}catch(e){console.warn("prune",e.message)}}
 console.log(`[CRON] collector refreshed ${done} clubs`)}

export default{fetch:app.fetch,scheduled:(event,env,ctx)=>ctx.waitUntil(cron(env))};
