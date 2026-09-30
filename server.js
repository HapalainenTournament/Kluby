import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    const r = await fetch(u,{signal:c.signal,headers:{accept:"application/json","user-agent":"Clubroom/4.0"}});
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

app.get("/api/club/:id", async (req,res)=>{
  const id=String(req.params.id).replace(/[^\d]/g,"");
  const p=validPlatform(req.query.platform);
  if(!id) return res.status(400).json({error:"Neplatné club ID."});

  const defs={
    info:["/clubs/info",{platform:p,clubIds:id},180000],
    overall:["/clubs/overallStats",{platform:p,clubIds:id},60000],
    career:["/members/career/stats",{platform:p,clubId:id},60000],
    members:["/members/stats",{platform:p,clubId:id},60000],
    achievements:["/club/playoffAchievements",{platform:p,clubId:id},180000],
    league:["/clubs/matches",{platform:p,clubIds:id,matchType:"leagueMatch",maxResultCount:10},30000],
    playoff:["/clubs/matches",{platform:p,clubIds:id,matchType:"playoffMatch",maxResultCount:10},30000],
    friendly:["/clubs/matches",{platform:p,clubIds:id,matchType:"friendlyMatch",maxResultCount:10},30000]
  };

  const keys=Object.keys(defs), rr=await Promise.allSettled(keys.map(k=>ea(...defs[k])));
  const d={},errors={};
  rr.forEach((x,i)=>x.status==="fulfilled" ? d[keys[i]]=x.value :
    (d[keys[i]]=null,errors[keys[i]]=x.reason?.message||"unknown"));

  const tag=(x,t)=>Array.isArray(x)?x.map(m=>({...m,_matchType:t})):[];
  d.matches=[...tag(d.league,"league"),...tag(d.playoff,"playoff"),...tag(d.friendly,"friendly")]
    .sort((a,b)=>Number(b.timestamp||b.matchTimestamp||0)-Number(a.timestamp||a.matchTimestamp||0));
  delete d.league; delete d.playoff; delete d.friendly;
  d.clubId=id; d.platform=p; d.errors=errors;
  res.json(d);
});

app.get("/api/health",(_,res)=>res.json({ok:true,version:"4.1.0",time:new Date().toISOString()}));
app.get("/{*splat}",(_,res)=>res.sendFile(path.join(DIR,"public","index.html")));
app.listen(PORT,()=>console.log(`Clubroom v4.1 běží na ${PORT}`));
