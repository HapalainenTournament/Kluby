
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const EA = "https://proclubs.ea.com/api/fc";
const cache = new Map();

app.use(express.static(path.join(__dirname, "public")));

function allowedPlatform(p) {
  return ["common-gen5", "common-gen4", "nx"].includes(p) ? p : "common-gen5";
}
async function eaFetch(route, params, ttl = 60000) {
  const url = new URL(EA + route);
  Object.entries(params).forEach(([k,v]) => v != null && url.searchParams.set(k, String(v)));
  const key = url.toString();
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "accept": "application/json",
        "user-agent": "ProClubsTracker/1.0"
      }
    });
    if (!res.ok) throw new Error(`EA API ${res.status}`);
    const data = await res.json();
    cache.set(key, { data, expires: Date.now() + ttl });
    return data;
  } finally { clearTimeout(timer); }
}

app.get("/api/search", async (req,res) => {
  try {
    const platform = allowedPlatform(req.query.platform);
    const clubName = String(req.query.q || "").trim().slice(0, 40);
    if (!clubName) return res.status(400).json({error:"Zadej název klubu."});
    const data = await eaFetch("/currentSeasonLeaderboard/search",
      {platform, clubName, maxResultCount: 20}, 30000);
    res.json(data);
  } catch(e) { res.status(502).json({error:"EA data se nepodařilo načíst.", detail:e.message}); }
});

app.get("/api/club/:id", async (req,res) => {
  const platform = allowedPlatform(req.query.platform);
  const clubIds = String(req.params.id).replace(/[^\d]/g,"");
  if (!clubIds) return res.status(400).json({error:"Neplatné club ID."});
  try {
    const [info, overall, members, league, playoff] = await Promise.allSettled([
      eaFetch("/clubs/info", {platform, clubIds}, 180000),
      eaFetch("/clubs/overallStats", {platform, clubIds}, 60000),
      eaFetch("/members/careerStats", {platform, clubIds}, 60000),
      eaFetch("/clubs/matches", {platform, clubIds, matchType:"leagueMatch", maxResultCount: 20}, 45000),
      eaFetch("/clubs/matches", {platform, clubIds, matchType:"playoffMatch", maxResultCount: 10}, 45000)
    ]);
    const val = x => x.status === "fulfilled" ? x.value : null;
    res.json({info:val(info), overall:val(overall), members:val(members), matches:[...(val(league)||[]), ...(val(playoff)||[])]});
  } catch(e) { res.status(502).json({error:"Klub se nepodařilo načíst.", detail:e.message}); }
});

app.get("/api/health", (_,res)=>res.json({ok:true, time:new Date().toISOString()}));
app.get("/{*splat}", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, ()=>console.log(`Pro Clubs Tracker běží na http://localhost:${PORT}`));
