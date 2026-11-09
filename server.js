import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {migrate,enabled as dbEnabled,query} from "./db.js";
import {persistClubPayload,history,analytics,buildSessions} from "./storage.js";
import {isPremium,planOf,pruneAllFreeClubs,FREE_ARCHIVE_LIMIT} from "./entitlements.js";
import {dueClubs,rescheduleClub} from "./collector.js";
import {checkoutConfig,verifySignature,handleEvent} from "./paddle.js";
import {benchmarks} from "./benchmarks.js";

const app = express();
// Paddle webhook needs the exact raw body for signature verification, so it is registered before express.json.
app.post("/api/paddle/webhook",express.raw({type:"*/*",limit:"1mb"}),async(req,res)=>{
 if(!verifySignature(req.body,req.get("paddle-signature")))return res.status(401).json({error:"Invalid signature"});
 let ev;try{ev=JSON.parse(req.body.toString("utf8"))}catch{return res.status(400).json({error:"Invalid JSON"})}
 if(!dbEnabled)return res.status(503).json({error:"Database required"});
 try{const r=await handleEvent(ev);console.log("[PADDLE]",ev.event_type,JSON.stringify(r));res.json({ok:true})}
 catch(e){console.error("[PADDLE] webhook failed",ev.event_type,e.message);res.status(500).json({error:"Processing failed"})}
});
app.use(express.json({limit:"16kb"}));
const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const EA = "https://proclubs.ea.com/api/fc";
const cache = new Map();
const consentVersion="clubroom-pass-v1";
const consentText="I agree to the Terms of Service and understand that Clubroom Pass renews every month at 4 € until I cancel.";
// The checkbox is evidence of a request, NOT proof that statutory rights were lost.
const safeText=(v,n=160)=>String(v??"").trim().slice(0,n);
const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<=254;
const safePlatform=p=>["common-gen5","common-gen4","nx"].includes(p)?p:null;
const escapePattern=x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
async function hiddenNames(clubId,platform){
 if(!dbEnabled)return [];
 const {rows}=await query(`SELECT gamertag FROM privacy_hidden_players WHERE club_id=$1 AND platform=$2 AND active=true`,[clubId,platform]);
 return rows.map(r=>r.gamertag).filter(Boolean);
}
function maskObject(data,names){
 if(!names?.length)return data;
 const secrets=new Set(names.map(x=>x.toLocaleLowerCase()));
 function sanitize(v,k=""){
  if(typeof v==='string')return secrets.has(v.trim().toLocaleLowerCase())?'Hidden player':v;
  if(Array.isArray(v))return v.map(x=>sanitize(x,k));
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([a,b])=>[a,sanitize(b,a)]));
  return v;
 }
 return sanitize(data);
}
async function scopedJson(data,clubId,platform){return maskObject(data,await hiddenNames(clubId,platform));}
async function notifyOperator(record){
 const url=process.env.REMOVAL_WEBHOOK_URL;
 if(!url)return false;
 try{const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",...(process.env.REMOVAL_WEBHOOK_BEARER?{Authorization:`Bearer ${process.env.REMOVAL_WEBHOOK_BEARER}`}:{})},body:JSON.stringify({event:"privacy.removal.requested",reference:record.id,club:record.club,platform:record.platform,created_at:new Date().toISOString()})});return response.ok}
 catch(e){console.warn("Removal webhook failed:",e.message);return false}
}
app.post("/api/privacy/removal",async(req,res)=>{
 if(!dbEnabled)return res.status(503).json({error:"Removal request service requires a configured database. Contact [DOPLNIT privacy email]."});
 const b=req.body||{};
 if(b.website)return res.status(400).json({error:"Invalid submission."});
 const gamertag=safeText(b.gamertag,100),club=safeText(b.club,120),platform=safePlatform(b.platform),email=safeText(b.email,254),reason=safeText(b.reason,2000);
 if(!gamertag||!club||!platform||!validEmail(email)||!reason||b.privacyAcknowledged!=='on')return res.status(400).json({error:"Complete all required fields."});
 try{
  const {rows}=await query(`INSERT INTO privacy_removal_requests (gamertag,club,platform,email,reason) VALUES ($1,$2,$3,$4,$5) RETURNING id`,[gamertag,club,platform,email,reason]);
  const id=rows[0].id; const notificationSent=await notifyOperator({id,club,platform});
  if(notificationSent)await query(`UPDATE privacy_removal_requests SET notified_at=now() WHERE id=$1`,[id]);
  return res.status(202).json({reference:id});
 }catch(e){console.error("Removal request storage failed",e.message);return res.status(500).json({error:"Could not store request."})}
});
// Administrative approval is explicitly protected by a server-only secret.
app.post("/api/admin/privacy/removal/:id/approve",async(req,res)=>{
 const expected=process.env.PRIVACY_ADMIN_TOKEN;
 if(!dbEnabled||!expected)return res.status(503).json({error:"Administrative processing is not configured."});
 const provided=req.get("x-privacy-admin-token")||"";
 if(provided.length!==expected.length||!(await import('node:crypto')).timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return res.status(403).json({error:"Forbidden"});
 const clubId=safeText(req.body?.clubId,80).replace(/[^0-9]/g,'');
 if(!clubId)return res.status(400).json({error:"A verified numeric club ID is required."});
 try{const {rows}=await query(`SELECT * FROM privacy_removal_requests WHERE id=$1 FOR UPDATE`,[req.params.id]);if(!rows.length)return res.status(404).json({error:"Not found"});
  const r=rows[0];await query(`INSERT INTO privacy_hidden_players(club_id,platform,gamertag,active) VALUES($1,$2,$3,true) ON CONFLICT(club_id,platform,gamertag) DO UPDATE SET active=true`,[clubId,r.platform,r.gamertag]);
  await query(`UPDATE privacy_removal_requests SET status='approved',resolved_at=now(),verified_club_id=$2 WHERE id=$1`,[r.id,clubId]);
  clubCache.delete(`${r.platform}:${clubId}`);
  return res.json({ok:true,clubId,platform:r.platform});
 }catch(e){console.error("Removal approval failed",e.message);res.status(500).json({error:"Could not approve request"})}
});
// v78 Clubroom Pass entitlement. Payments are not live: a club is Pass-active only when listed
// in PASS_ACTIVE_CLUBS (comma separated club IDs) or, later, by a verified provider webhook.
const passActiveClubs=()=>new Set(String(process.env.PASS_ACTIVE_CLUBS||"").split(",").map(x=>x.replace(/[^0-9]/g,"")).filter(Boolean));
app.get("/api/pass/status",async(req,res)=>{const ids=String(req.query.ids||"").split(",").map(x=>x.replace(/[^0-9]/g,"")).filter(Boolean).slice(0,50);const out={};for(const id of ids){const plan=await planOf(id);out[id]={active:plan!=="free",plan}}res.json({price:{amount:4,currency:"EUR",interval:"month",scope:"club"},checkoutEnabled:checkoutConfig().enabled,freeArchiveLimit:FREE_ARCHIVE_LIMIT,clubs:out})});
// v78 Club honours for the Trophy Cabinet: EA playoff achievements + overall stats, cached 30 min.
const honoursCache=new Map();
app.get("/api/benchmarks",async(_,res)=>{try{res.set("Cache-Control","public, max-age=1800");res.json(await benchmarks())}catch(e){console.error("benchmarks",e.message);res.status(500).json({error:"Benchmarks unavailable",groups:{}})}});
app.get("/api/club-honours/:id",async(req,res)=>{
 const id=String(req.params.id).replace(/[^\d]/g,"");const p=validPlatform(req.query.platform);if(!id)return res.status(400).json({error:"Invalid club ID."});
 const key=`${p}:${id}`,hit=honoursCache.get(key);if(hit&&Date.now()-hit.at<1800000)return res.json(hit.data);
 const [achR,ovR]=await Promise.allSettled([ea("/club/playoffAchievements",{platform:p,clubId:id},1800000),ea("/clubs/overallStats",{platform:p,clubIds:id},300000)]);
 const ach=achR.status==="fulfilled"?achR.value:null,ov=ovR.status==="fulfilled"?((ovR.value&&ovR.value[id])||Object.values(ovR.value||{})[0]||ovR.value||{}):{};
 const honours=Array.isArray(ach)?ach:(ach&&typeof ach==="object"?Object.values(ach).flat().filter(x=>x&&typeof x==="object"):[]);
 const data={honours,overall:ov,errors:{achievements:achR.status==="rejected"?String(achR.reason?.message||"failed"):null}};
 honoursCache.set(key,{data,at:Date.now()});res.json(await scopedJson(data,id,p));
});
app.get("/api/pass/config",(_,res)=>res.json({...checkoutConfig(),consentVersion,consentText,price:{amount:4,currency:"EUR",interval:"month"}}));
app.post("/api/pass/checkout",async(req,res)=>{
 const cfg=checkoutConfig();if(!cfg.enabled)return res.status(503).json({error:"Clubroom Pass checkout is not open yet."});
 const b=req.body||{};
 if(b.consent!==true||b.consentVersion!==consentVersion)return res.status(400).json({error:"Please accept the Terms to continue."});
 const email=safeText(b.email,254),clubId=safeText(b.clubId,80).replace(/[^0-9]/g,'');
 if(!validEmail(email)||!clubId)return res.status(400).json({error:"A valid email and club ID are required."});
 if(await isPremium(clubId))return res.status(409).json({error:"This club already has an active Clubroom Pass."});
 try{const {rows}=await query(`INSERT INTO pass_consent_evidence(payer_email,club_id,consent_version,consent_text) VALUES($1,$2,$3,$4) RETURNING id`,[email,clubId,consentVersion,consentText]);
  res.json({ok:true,consentId:rows[0].id,clubId,email,priceId:cfg.priceId})}
 catch(e){console.error("pass checkout",e.message);res.status(500).json({error:"Could not start checkout. Try again."})}
});


app.use(express.static(path.join(DIR, "public"),{extensions:["html"]}));

const validPlatform = p => ["common-gen5","common-gen4","nx"].includes(p) ? p : "common-gen5";

async function ea(route, params, ttl=45000, timeoutMs=6500) {
  const u = new URL(EA + route);
  Object.entries(params).forEach(([k,v]) => v != null && u.searchParams.set(k,String(v)));
  const key = u.toString(), hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.data;
  const started=Date.now();
  const c = new AbortController();
  let timer;
  const timeout = new Promise((_,reject)=>{timer=setTimeout(()=>{c.abort();reject(new Error(`EA TIMEOUT ${timeoutMs}ms: ${route}`))},timeoutMs)});
  try {
    const request=(async()=>{
      const r = await fetch(u,{signal:c.signal,headers:{accept:"application/json","user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36"}});
      if(!r.ok) throw new Error(`EA ${r.status}: ${route}`);
      const data = await r.json();
      cache.set(key,{data,exp:Date.now()+ttl});
      return data;
    })();
    const data=await Promise.race([request,timeout]);
    console.log(`[EA] ${route} OK ${Date.now()-started}ms`);
    return data;
  } catch(e) {
    console.warn(`[EA] ${route} FAIL ${Date.now()-started}ms · ${e.message}`);
    throw e;
  } finally { clearTimeout(timer); }
}

app.get("/api/search", async (req,res)=>{
  try {
    const q=String(req.query.q||"").trim().slice(0,60);
    if(!q) return res.status(400).json({error:"Enter a club name."});
    res.json(await ea("/currentSeasonLeaderboard/search",
      {platform:validPlatform(req.query.platform),clubName:q,maxResultCount:20},30000));
  } catch(e) { res.status(502).json({error:"EA search failed.",detail:e.message}); }
});

app.get("/api/club-card/:id", async (req,res)=>{
  try{
    const id=String(req.params.id||"").replace(/[^\d]/g,"");
    if(!id)return res.status(400).json({error:"Invalid club ID."});
    const platform=validPlatform(req.query.platform);
    const [infoR,statsR]=await Promise.allSettled([ea("/clubs/info",{platform,clubIds:id},4500),ea("/clubs/overallStats",{platform,clubIds:id},4500)]);
    const info=infoR.status==="fulfilled"?((infoR.value&&infoR.value[id])||Object.values(infoR.value||{})[0]||{}):{};
    const stats=statsR.status==="fulfilled"?((statsR.value&&statsR.value[id])||Object.values(statsR.value||{})[0]||statsR.value||{}):{};
    res.json(await scopedJson({...stats,...info,clubId:id},id,platform));
  }catch(e){res.status(502).json({error:"EA club card failed.",detail:e.message})}
});

const clubCache = new Map();
const refreshes = new Map();
const EVENT_MATCH_TYPES = ["tournamentMatch","tournament","eventMatch","liveEventMatch","clubTournamentMatch"];
function tagMatches(x,t,eaType=null){return Array.isArray(x)?x.map(m=>({...m,_matchType:t,...(eaType?{_eaMatchType:eaType}:{})})):[]}
function finishClub(d,id,p){
 const eventMatches=[];
 for(const mt of EVENT_MATCH_TYPES){const k=`event_${mt}`;eventMatches.push(...tagMatches(d[k],"event",mt));delete d[k]}
 const all=[...tagMatches(d.league,"league","leagueMatch"),...tagMatches(d.playoff,"playoff","playoffMatch"),...tagMatches(d.friendly,"friendly","friendlyMatch"),...eventMatches];
 const seen=new Set();
 d.matches=all.sort((a,b)=>Number(b.timestamp||b.matchTimestamp||0)-Number(a.timestamp||a.matchTimestamp||0)).filter(m=>{const k=String(m.matchId||m.matchid||m.id||`${m.timestamp||m.matchTimestamp||0}:${m._eaMatchType||m._matchType}`);if(seen.has(k))return false;seen.add(k);return true});
 delete d.league;delete d.playoff;delete d.friendly;d.clubId=id;d.platform=p;d.errors=d.errors||{};return d
}
async function fetchSet(defs){const keys=Object.keys(defs),rr=await Promise.allSettled(keys.map(k=>ea(...defs[k]))),d={},errors={};rr.forEach((x,i)=>x.status==="fulfilled"?(d[keys[i]]=x.value):(d[keys[i]]=null,errors[keys[i]]=x.reason?.message||"unknown"));d.errors=errors;return d}
async function loadClubFast(id,p){const d=await fetchSet({info:["/clubs/info",{platform:p,clubIds:id},180000],overall:["/clubs/overallStats",{platform:p,clubIds:id},60000],career:["/members/career/stats",{platform:p,clubId:id},60000],members:["/members/stats",{platform:p,clubId:id},60000],league:["/clubs/matches",{platform:p,clubIds:id,matchType:"leagueMatch",maxResultCount:10},30000]});d.achievements=null;d.playoff=[];d.friendly=[];return finishClub(d,id,p)}
async function loadClubFull(id,p){
 const defs={info:["/clubs/info",{platform:p,clubIds:id},180000],overall:["/clubs/overallStats",{platform:p,clubIds:id},60000],career:["/members/career/stats",{platform:p,clubId:id},60000],members:["/members/stats",{platform:p,clubId:id},60000],achievements:["/club/playoffAchievements",{platform:p,clubId:id},180000],league:["/clubs/matches",{platform:p,clubIds:id,matchType:"leagueMatch",maxResultCount:10},30000],playoff:["/clubs/matches",{platform:p,clubIds:id,matchType:"playoffMatch",maxResultCount:10},30000],friendly:["/clubs/matches",{platform:p,clubIds:id,matchType:"friendlyMatch",maxResultCount:10},30000]};
 for(const mt of EVENT_MATCH_TYPES)defs[`event_${mt}`]=["/clubs/matches",{platform:p,clubIds:id,matchType:mt,maxResultCount:10},30000];
 return finishClub(await fetchSet(defs),id,p)
}
function archiveInBackground(id,p,seed=null){const key=`${p}:${id}`;if(refreshes.has(key))return;const job=(async()=>{try{if(seed)await persistClubPayload(id,p,seed);const full=await loadClubFull(id,p);await persistClubPayload(id,p,full);clubCache.set(key,{data:full,at:Date.now()})}catch(e){console.warn("background archive",id,e.message)}finally{refreshes.delete(key)}})();refreshes.set(key,job)}

app.get("/api/club/:id", async (req,res)=>{
 const started=Date.now();const id=String(req.params.id).replace(/[^\d]/g,"");const p=validPlatform(req.query.platform);if(!id)return res.status(400).json({error:"Invalid club ID."});
 const key=`${p}:${id}`,hit=clubCache.get(key),age=hit?Date.now()-hit.at:Infinity;
 try{
  if(hit&&age<30000){console.log(`[CLUB] ${id} memory fresh ${Date.now()-started}ms`);return res.json({...await scopedJson(hit.data,id,p),_cache:"fresh"})}
  if(hit&&age<300000){console.log(`[CLUB] ${id} memory stale ${Date.now()-started}ms`);archiveInBackground(id,p);return res.json({...await scopedJson(hit.data,id,p),_cache:"stale"})}
  const d=await loadClubFast(id,p);clubCache.set(key,{data:d,at:Date.now()});
  console.log(`[CLUB] ${id} response ${Date.now()-started}ms · errors=${Object.keys(d.errors||{}).join(",")||"none"}`);
  res.json({...await scopedJson(d,id,p),_cache:"miss"});setImmediate(()=>archiveInBackground(id,p,d));
 }catch(e){console.warn(`[CLUB] ${id} FAIL ${Date.now()-started}ms · ${e.message}`);if(hit)return res.json({...await scopedJson(hit.data,id,p),_cache:"fallback",_refreshError:e.message});res.status(502).json({error:"EA club load failed.",detail:e.message})}
});

// v81 live session refresh: pull the newest EA matches into the archive now (max once per 60 s per club).
const liveRefreshAt=new Map();
app.post("/api/live-refresh/:id",async(req,res)=>{
 const id=String(req.params.id).replace(/[^\d]/g,"");const p=validPlatform(req.query.platform);if(!id)return res.status(400).json({error:"Invalid club ID."});
 const key=`${p}:${id}`,last=liveRefreshAt.get(key)||0;if(Date.now()-last<60000)return res.json({ok:true,throttled:true,nextInMs:60000-(Date.now()-last)});
 liveRefreshAt.set(key,Date.now());
 try{const d=await loadClubFast(id,p);clubCache.set(key,{data:d,at:Date.now()});if(dbEnabled)await persistClubPayload(id,p,d);res.json({ok:true,throttled:false,matches:Array.isArray(d.matches)?d.matches.length:0,archived:dbEnabled})}
 catch(e){res.status(502).json({ok:false,error:e.message})}
});
// v81 diagnostics: which fields EA actually sends in match data (used to find xG/xA). Read-only.
app.get("/api/ea-fields/:id",async(req,res)=>{
 const id=String(req.params.id).replace(/[^\d]/g,"");const p=validPlatform(req.query.platform);if(!id)return res.status(400).json({error:"Invalid club ID."});
 try{const rows=await ea("/clubs/matches",{platform:p,clubIds:id,matchType:"leagueMatch",maxResultCount:3},60000,12000);const arr=Array.isArray(rows)?rows:[];
  const playerKeys=new Map(),clubKeys=new Set(),events=new Map(),matchKeys=new Set();
  for(const m of arr){Object.keys(m||{}).forEach(k=>matchKeys.add(k));for(const c of Object.values(m.clubs||{})){Object.keys(c||{}).forEach(k=>clubKeys.add(k))}
   for(const club of Object.values(m.players||{}))for(const pl of Object.values(club||{})){for(const [k,v] of Object.entries(pl||{})){if(!playerKeys.has(k))playerKeys.set(k,typeof v==="string"?v.slice(0,40):v);
     if(k.startsWith("match_event_aggregate_")&&typeof v==="string")for(const t of v.split(/[;,| ]+/)){const mm=t.match(/^(\d+):(-?\d+(?:\.\d+)?)$/);if(mm){const e=events.get(mm[1])||{count:0,decimals:false,max:0};e.count++;e.max=Math.max(e.max,Number(mm[2]));if(mm[2].includes("."))e.decimals=true;events.set(mm[1],e)}}}}}
  const all=[...playerKeys.keys(),...clubKeys,...matchKeys];
  res.json({ok:true,matchesChecked:arr.length,xgCandidates:all.filter(k=>/xg|expect/i.test(k)),decimalEvents:[...events.entries()].filter(([,e])=>e.decimals).map(([id,e])=>({id,...e})),playerKeys:Object.fromEntries(playerKeys),clubKeys:[...clubKeys],matchKeys:[...matchKeys],eventIds:Object.fromEntries([...events.entries()].sort((a,b)=>Number(a[0])-Number(b[0])))});
 }catch(e){res.status(502).json({ok:false,error:e.message})}
});
app.get("/api/event-probe/:id",async(req,res)=>{
 try{
  const id=String(req.params.id||"").replace(/[^\d]/g,"");if(!id)return res.status(400).json({error:"Invalid club ID."});
  const platform=validPlatform(req.query.platform);
  const results={};
  for(const mt of EVENT_MATCH_TYPES){
   try{
    const rows=await ea("/clubs/matches",{platform,clubIds:id,matchType:mt,maxResultCount:10},5000,12000);
    const arr=Array.isArray(rows)?rows:[];
    results[mt]={ok:true,count:arr.length,matches:arr.slice(0,10).map(m=>({matchId:String(m.matchId||m.matchid||m.id||""),timestamp:m.timestamp||m.matchTimestamp||null,clubs:Object.values(m.clubs||{}).map(c=>c?.details?.name||c?.name||null).filter(Boolean)}))};
   }catch(e){results[mt]={ok:false,error:e.message}}
  }
  res.json({ok:true,clubId:id,platform,candidates:EVENT_MATCH_TYPES,results,time:new Date().toISOString()});
 }catch(e){res.status(500).json({ok:false,error:e.message})}
});


app.get("/api/db-export", async (req,res)=>{
  try{
    if(!dbEnabled) return res.status(503).json({error:"Database is not enabled."});
    const expected=String(process.env.EXPORT_TOKEN||"");
    const supplied=String(req.query.token||req.get("x-export-token")||"");
    if(!expected) return res.status(503).json({error:"EXPORT_TOKEN is not configured on the server."});
    if(supplied!==expected) return res.status(401).json({error:"Invalid export token."});

    const tables=[
      "clubs",
      "players",
      "club_memberships",
      "matches",
      "match_clubs",
      "player_match_stats",
      "player_match_events",
      "club_snapshots"
    ];
    const data={};
    const counts={};
    for(const table of tables){
      const r=await query(`SELECT * FROM ${table}`);
      data[table]=r.rows;
      counts[table]=r.rowCount;
    }
    const payload={
      format:"clubroom-postgres-json-backup",
      version:"88.0.0",
      exportedAt:new Date().toISOString(),
      counts,
      data
    };
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    res.setHeader("Content-Type","application/json; charset=utf-8");
    res.setHeader("Content-Disposition",`attachment; filename=clubroom-db-backup-${stamp}.json`);
    res.setHeader("Cache-Control","no-store");
    res.send(JSON.stringify(payload));
  }catch(e){
    console.error("db export",e);
    res.status(500).json({error:"Database export failed.",detail:e.message});
  }
});

app.get("/api/history/:id",async(req,res)=>{try{res.json(await scopedJson(await history(String(req.params.id).replace(/[^\d]/g,"")),String(req.params.id).replace(/[^\d]/g,""),validPlatform(req.query.platform)))}catch(e){res.status(500).json({error:e.message})}});
app.get("/api/analytics/:id",async(req,res)=>{try{res.json(await scopedJson(await analytics(String(req.params.id).replace(/[^\d]/g,"")),String(req.params.id).replace(/[^\d]/g,""),validPlatform(req.query.platform)))}catch(e){res.status(500).json({error:e.message})}});
app.get("/api/sessions/:id",async(req,res)=>{try{const id=String(req.params.id).replace(/[^\d]/g,"");const gap=Math.max(30,Math.min(240,Number(req.query.gap||90)));res.json(await scopedJson(await buildSessions(id,{gapMinutes:gap,activeMinutes:45}),id,validPlatform(req.query.platform)))}catch(e){res.status(500).json({error:e.message})}});
app.get("/api/health",(_,res)=>res.json({ok:true,version:"88.0.0",database:dbEnabled,collectorEnabled:dbEnabled && process.env.COLLECTOR_ENABLED!=="false",collectorIntervalMs:Number(process.env.COLLECTOR_INTERVAL_MS||300000),collectorBatch:Number(process.env.COLLECTOR_BATCH||20),time:new Date().toISOString()}));

for(const route of ["about","terms","privacy","cookies","removal","pass","refund"]){
 app.get('/'+route,(_,res)=>res.sendFile(path.join(DIR,'public',route+'.html')));
}
app.get("/pass/checkout",(_,res)=>res.sendFile(path.join(DIR,"public","pass","checkout.html")));
app.get("/fun",(_,res)=>res.redirect(302,"/misc"));
app.get("/club/:id/fun",(req,res)=>res.redirect(302,`/club/${req.params.id}/misc`));
app.get("/{*splat}",(_,res)=>res.sendFile(path.join(DIR,"public","index.html")));
await migrate();
// Background archive: clubs are discovered by real searches/visits, then refreshed in batches.
// This scales better than trying to enumerate every EA club on Earth, which would be both expensive and rather optimistic.
if(dbEnabled && process.env.COLLECTOR_ENABLED!=="false"){
 const runCollector=async()=>{try{for(const c of await dueClubs(Number(process.env.COLLECTOR_BATCH||20))){try{const d=await loadClubFull(String(c.club_id),validPlatform(c.platform));const saved=await persistClubPayload(String(c.club_id),validPlatform(c.platform),d);await rescheduleClub(String(c.club_id),validPlatform(c.platform),Number(saved?.newMatches||0));}catch(e){console.warn("collector",c.club_id,e.message)}}}catch(e){console.warn("collector batch",e.message)}};
 setTimeout(runCollector,15000);setInterval(runCollector,Number(process.env.COLLECTOR_INTERVAL_MS||300000));
 if(process.env.ARCHIVE_PRUNE&&process.env.ARCHIVE_PRUNE!=="off"){setTimeout(()=>pruneAllFreeClubs().then(n=>console.log(`[ARCHIVE] startup prune (${process.env.ARCHIVE_PRUNE}) removed ${n} matches`)),30000);setInterval(pruneAllFreeClubs,6*3600000)}
}
app.listen(PORT,()=>console.log(`CLUBROOM running on ${PORT} · DB ${dbEnabled?"ON":"OFF"}`));
