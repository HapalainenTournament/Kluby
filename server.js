import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {migrate,enabled as dbEnabled} from "./db.js";
import {persistClubPayload,history,analytics} from "./storage.js";
import {dueClubs} from "./collector.js";

const app = express();
const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const EA = "https://proclubs.ea.com/api/fc";
const cache = new Map();

app.use(express.static(path.join(DIR, "public")));

const validPlatform = p => ["common-gen5","common-gen4","nx"].includes(p) ? p : "common-gen5";

async function ea(route, params, ttl=45000) {
  const u = new URL(EA + route);
  Object.entries(params).forEach(([k,v]) => v != null && u.searchParams.set(k,String(v)));
  const key = u.toString(), hit = cache.get(key);
  if (hit && hit.exp > Date.now()) return hit.data;
  const c = new AbortController(), timer = setTimeout(()=>c.abort(),15000);
  try {
    const r = await fetch(u,{signal:c.signal,headers:{accept:"application/json","user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36"}});
    if(!r.ok) throw new Error(`EA ${r.status}: ${route}`);
    const data = await r.json();
    cache.set(key,{data,exp:Date.now()+ttl});
    return data;
  } finally { clearTimeout(timer); }
}

app.get("/api/search", async (req,res)=>{
  try {
    const q=String(req.query.q||"").trim().slice(0,60);
    if(!q) return res.status(400).json({error:"Zadej název klubu."});
    res.json(await ea("/currentSeasonLeaderboard/search",
      {platform:validPlatform(req.query.platform),clubName:q,maxResultCount:20},30000));
  } catch(e) { res.status(502).json({error:"EA search selhal.",detail:e.message}); }
});

async function loadClub(id,p){
  const defs={
    info:["/clubs/info",{platform:p,clubIds:id},180000], overall:["/clubs/overallStats",{platform:p,clubIds:id},60000],
    career:["/members/career/stats",{platform:p,clubId:id},60000], members:["/members/stats",{platform:p,clubId:id},60000], achievements:["/club/playoffAchievements",{platform:p,clubId:id},180000],
    league:["/clubs/matches",{platform:p,clubIds:id,matchType:"leagueMatch",maxResultCount:10},30000], playoff:["/clubs/matches",{platform:p,clubIds:id,matchType:"playoffMatch",maxResultCount:10},30000], friendly:["/clubs/matches",{platform:p,clubIds:id,matchType:"friendlyMatch",maxResultCount:10},30000]
  };
  const keys=Object.keys(defs),rr=await Promise.allSettled(keys.map(k=>ea(...defs[k]))),d={},errors={};
  rr.forEach((x,i)=>x.status==="fulfilled"?(d[keys[i]]=x.value):(d[keys[i]]=null,errors[keys[i]]=x.reason?.message||"unknown"));
  const tag=(x,t)=>Array.isArray(x)?x.map(m=>({...m,_matchType:t})):[];
  d.matches=[...tag(d.league,"league"),...tag(d.playoff,"playoff"),...tag(d.friendly,"friendly")].sort((a,b)=>Number(b.timestamp||b.matchTimestamp||0)-Number(a.timestamp||a.matchTimestamp||0));
  delete d.league;delete d.playoff;delete d.friendly;d.clubId=id;d.platform=p;d.errors=errors;
  try{d.storage=await persistClubPayload(id,p,d)}catch(e){d.storage={enabled:dbEnabled,error:e.message}}
  return d;
}

app.get("/api/club/:id", async (req,res)=>{
 const id=String(req.params.id).replace(/[^\d]/g,"");const p=validPlatform(req.query.platform);if(!id)return res.status(400).json({error:"Neplatné club ID."});
 try{res.json(await loadClub(id,p))}catch(e){res.status(502).json({error:"EA club load selhal.",detail:e.message})}
});

app.get("/api/history/:id",async(req,res)=>{try{res.json(await history(String(req.params.id).replace(/[^\d]/g,"")))}catch(e){res.status(500).json({error:e.message})}});
app.get("/api/analytics/:id",async(req,res)=>{try{res.json(await analytics(String(req.params.id).replace(/[^\d]/g,"")))}catch(e){res.status(500).json({error:e.message})}});
app.get("/api/health",(_,res)=>res.json({ok:true,version:"16.0.0",database:dbEnabled,time:new Date().toISOString()}));
app.get("/{*splat}",(_,res)=>res.sendFile(path.join(DIR,"public","index.html")));
await migrate();
// Background archive: clubs are discovered by real searches/visits, then refreshed in batches.
// This scales better than trying to enumerate every EA club on Earth, which would be both expensive and rather optimistic.
if(dbEnabled && process.env.COLLECTOR_ENABLED!=="false"){
 const runCollector=async()=>{try{for(const c of await dueClubs(Number(process.env.COLLECTOR_BATCH||20))){try{await loadClub(String(c.club_id),validPlatform(c.platform));}catch(e){console.warn("collector",c.club_id,e.message)}}}catch(e){console.warn("collector batch",e.message)}};
 setTimeout(runCollector,15000);setInterval(runCollector,Number(process.env.COLLECTOR_INTERVAL_MS||900000));
}
app.listen(PORT,()=>console.log(`Clubroom FC27 v16 běží na ${PORT} · DB ${dbEnabled?"ON":"OFF"}`));
