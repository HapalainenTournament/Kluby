// CLUBROOM v96 · Discord webhooks (Clubroom Pass): after a session ends, post a summary + session report image to the club's channel.
// Anyone can add a webhook for a Pass club (the data is public anyway); removing needs the key returned when it was added.
import crypto from "node:crypto";
import {query,enabled} from "./db.js";
import {isPremium} from "./entitlements.js";
import {buildSessions} from "./storage.js";
import {sessionSummary,sessionCardSvg,toPng} from "./og.js";

export const WEBHOOK_RE=/^https:\/\/(?:ptb\.|canary\.)?(?:discord|discordapp)\.com\/api\/webhooks\/(\d{15,25})\/([\w-]{20,120})$/;
export const MAX_WEBHOOKS=3;
const SESSION_GAP=90,ACTIVE_MIN=45;
const PUBLIC=()=>String(process.env.PUBLIC_URL||"https://kluby.onrender.com").replace(/\/$/,"");
const sha=s=>crypto.createHash("sha256").update(String(s)).digest("hex");
const dayLabel=iso=>{try{return new Date(iso).toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short",timeZone:process.env.CLUB_TZ||"Europe/Prague"})}catch{return""}};
const dur=m=>m>=60?`${Math.floor(m/60)} h ${m%60} min`:`${m} min`;

export function sessionImage({sess,clubName,crest}){const s=sessionSummary(sess);return {summary:s,png:toPng(sessionCardSvg({...s,clubName,crest,dateLabel:dayLabel(sess.startedAt),duration:dur(sess.durationMinutes||0),url:PUBLIC().replace(/^https?:\/\//,"")}),1200)}}

export function discordPayload({club,clubName,platform,s}){
 const rec=`**${s.w}W ${s.d}D ${s.l}L** · ${s.gf}:${s.ga} goals · ${s.count} matches`;
 const lines=s.results.slice(0,10).map(r=>`${r.result==="W"?"🟢":r.result==="D"?"🟡":"🔴"} ${r.og}:${r.tg} vs ${r.opponent||"Opponent"}`).join("\n");
 return {username:"Clubroom",avatar_url:`${PUBLIC()}/assets/icon-192.png`,allowed_mentions:{parse:[]},
  embeds:[{title:`Session report · ${clubName}`,url:`${PUBLIC()}/club/${club}/sessions`,description:`${rec}\n\n${lines}`.slice(0,4000),color:0x2dd4bf,
   fields:s.awards.slice(0,4).map(a=>({name:a.title,value:`**${a.player}** · ${a.value} ${a.unit||""}`.slice(0,1000),inline:true})),
   image:{url:"attachment://session.png"},footer:{text:"Clubroom · Pro Clubs stats"},timestamp:s.lastMatchAt}]};
}
export async function postDiscord(url,payload,png){
 const fd=new FormData();fd.append("payload_json",JSON.stringify(payload));if(png)fd.append("files[0]",new Blob([png],{type:"image/png"}),"session.png");
 const r=await fetch(url+"?wait=true",{method:"POST",body:fd});if(r.status===429){const j=await r.json().catch(()=>({}));const e=new Error("rate limited");e.retryAfter=Number(j.retry_after)||5;throw e}
 if(!r.ok){const e=new Error(`Discord ${r.status}`);e.status=r.status;throw e}return true}

export async function addWebhook({club,platform,url,clubName}){
 if(!enabled)throw Object.assign(new Error("Database required."),{status:503});
 if(!WEBHOOK_RE.test(String(url||"").trim()))throw Object.assign(new Error("Paste a Discord webhook URL (Server settings → Integrations → Webhooks → Copy URL)."),{status:400});
 if(!(await isPremium(club)))throw Object.assign(new Error("Discord reports are a Clubroom Pass feature."),{status:402});
 const n=(await query(`SELECT COUNT(*)::int n FROM club_webhooks WHERE club_id=$1 AND active`,[club])).rows[0].n;if(n>=MAX_WEBHOOKS)throw Object.assign(new Error(`This club already has ${MAX_WEBHOOKS} Discord channels connected.`),{status:409});
 const clean=String(url).trim();
 await postDiscord(clean,{username:"Clubroom",avatar_url:`${PUBLIC()}/assets/icon-192.png`,allowed_mentions:{parse:[]},embeds:[{title:`Clubroom connected · ${clubName||"club "+club}`,description:"Session reports will be posted here when a session ends (no match for 45 minutes).",color:0x2dd4bf,url:`${PUBLIC()}/club/${club}/sessions`}]}).catch(e=>{throw Object.assign(new Error(e.status===404||e.status===401?"Discord says this webhook does not exist. Copy the URL again.":"Could not reach Discord. Try again."),{status:400})});
 const key=crypto.randomBytes(18).toString("base64url");
 const r=await query(`INSERT INTO club_webhooks(club_id,platform,url,key_hash,last_session_start) VALUES($1,$2,$3,$4,(SELECT MAX(played_at) FROM matches m JOIN match_clubs mc ON mc.match_id=m.match_id AND mc.club_id=$1)) RETURNING id`,[club,platform,clean,sha(key)]);
 return {id:r.rows[0].id,key};
}
export async function listWebhooks(club){if(!enabled)return [];return (await query(`SELECT id,created_at,last_sent_at,fail_count FROM club_webhooks WHERE club_id=$1 AND active ORDER BY id`,[club])).rows.map(r=>({id:r.id,createdAt:r.created_at,lastSentAt:r.last_sent_at,failing:r.fail_count>0}))}
export async function removeWebhook({club,id,key}){if(!enabled)return false;const r=await query(`UPDATE club_webhooks SET active=false WHERE club_id=$1 AND id=$2 AND key_hash=$3 AND active RETURNING id`,[club,Number(id)||0,sha(key||"")]);return r.rowCount>0}

// Background job: one pass over clubs with active webhooks.
export async function runDiscordJob({clubName=async()=>null,crest=async()=>null,refresh=()=>{}}={}){
 if(!enabled)return {sent:0};let sent=0;
 const hooks=(await query(`SELECT id,club_id,platform,url,last_session_start,fail_count FROM club_webhooks WHERE active`)).rows;
 const byClub=new Map();for(const h of hooks){const a=byClub.get(h.club_id)||[];a.push(h);byClub.set(h.club_id,a)}
 for(const [club,list] of byClub){
  try{
   if(!(await isPremium(club)))continue;           // Pass ended → stay quiet (webhook kept for when it comes back)
   refresh(club,list[0].platform);                   // keep the archive fresh for clubs with Discord reports
   const {sessions}=await buildSessions(club,{gapMinutes:SESSION_GAP,activeMinutes:ACTIVE_MIN});
   const last=(sessions||[]).find(s=>!s.active);if(!last||(last.matches||[]).length<2)continue;
   const start=new Date(last.startedAt);
   const due=list.filter(h=>!h.last_session_start||new Date(h.last_session_start)<start);if(!due.length)continue;
   const name=(await clubName(club,list[0].platform))||`Club ${club}`,cr=await crest(club,list[0].platform);
   const {summary,png}=sessionImage({sess:last,clubName:name,crest:cr});
   const payload=discordPayload({club,clubName:name,platform:list[0].platform,s:summary});
   for(const h of due){
    try{await postDiscord(h.url,payload,png);sent++;await query(`UPDATE club_webhooks SET last_session_start=$2,last_sent_at=now(),fail_count=0 WHERE id=$1`,[h.id,start])}
    catch(e){console.warn("[DISCORD]",club,h.id,e.message);if(e.status===404||e.status===401)await query(`UPDATE club_webhooks SET active=false WHERE id=$1`,[h.id]);else if(!e.retryAfter)await query(`UPDATE club_webhooks SET fail_count=fail_count+1,active=(fail_count+1)<10 WHERE id=$1`,[h.id])}
   }
  }catch(e){console.warn("[DISCORD] club",club,e.message)}
 }
 return {sent};
}
