// CLUBROOM v96 · Server-rendered share images (SVG → PNG via resvg): club link preview (1200×630) and session report.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {Resvg} from "@resvg/resvg-js";
const DIR=path.dirname(fileURLToPath(import.meta.url));
const FONTS=["Inter_500Medium.ttf","Inter_800ExtraBold.ttf","Inter_900Black.ttf"].map(f=>path.join(DIR,"assets","fonts",f)).filter(f=>fs.existsSync(f));
const MARK=(()=>{try{return "data:image/png;base64,"+fs.readFileSync(path.join(DIR,"public","assets","clubroom-mark.png")).toString("base64")}catch{return null}})();
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const N=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const RES={W:"#2dd4bf",D:"#fbbf24",L:"#fb7185"};
// rough text fitting (Inter ≈ 0.6em per char at heavy weights)
export function fit(text,maxPx,size,min=28){text=String(text||"");let s=size;while(s>min&&text.length*s*0.6>maxPx)s-=2;let t=text;while(t.length>3&&t.length*s*0.6>maxPx)t=t.slice(0,-2);if(t!==text)t=t.replace(/\s+$/,"")+"…";return {text:t,size:s}}
export function toPng(svg,width){const r=new Resvg(svg,{fitTo:{mode:"width",value:width},font:{fontFiles:FONTS,loadSystemFonts:false,defaultFontFamily:"Inter"}});return r.render().asPng()}

const SHIELD=`<path d="M0-96 L80-64 L80 8 C80 58 40 86 0 100 C-40 86 -80 58 -80 8 L-80-64 Z" fill="#13283c" stroke="#2dd4bf" stroke-width="5"/><path d="M0-40v80M-40 0h80" stroke="#2dd4bf" stroke-width="10" stroke-linecap="round"/>`;
const crestEl=(crest,cx,cy,size)=>crest?`<image href="${crest}" x="${cx-size/2}" y="${cy-size/2}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`:`<g transform="translate(${cx} ${cy}) scale(${size/220})">${SHIELD}</g>`;
const bg=(w,h)=>`<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a1120"/><stop offset="1" stop-color="#0f2236"/></linearGradient><radialGradient id="glow" cx=".2" cy=".35" r=".55"><stop offset="0" stop-color="#2dd4bf" stop-opacity=".22"/><stop offset="1" stop-color="#2dd4bf" stop-opacity="0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#glow)"/>`;
const brand=(x,y,url)=>`${MARK?`<image href="${MARK}" x="${x}" y="${y-30}" width="40" height="40"/>`:""}<text x="${x+52}" y="${y}" font-family="Inter" font-weight="900" font-size="26" fill="#eaf2fa" letter-spacing="3">CLUBROOM</text>${url?`<text x="${1200-60}" y="${y}" text-anchor="end" font-family="Inter" font-weight="500" font-size="22" fill="#8ea3bd">${esc(url)}</text>`:""}`;

/** Club link preview: crest, name, record, form, division. */
export function clubCardSvg(c){
 const W=1200,H=630,name=fit(c.name||"Pro Clubs club",640,76,40);
 const rec=[["W",c.wins,"#2dd4bf"],["D",c.ties,"#fbbf24"],["L",c.losses,"#fb7185"]];
 const form=(c.form||[]).slice(0,5);
 const meta=[c.division?`Division ${c.division}`:null,c.skill?`Skill ${c.skill}`:null,c.platformLabel||null].filter(Boolean).join("  ·  ");
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bg(W,H)}
  <rect x="40" y="40" width="${W-80}" height="${H-150}" rx="36" fill="#0d1826" fill-opacity=".72" stroke="#1f3247" stroke-width="2"/>
  ${crestEl(c.crest,215,300,250)}
  <text x="390" y="${c.pass?150:165}" font-family="Inter" font-weight="800" font-size="22" fill="#5eead4" letter-spacing="5">PRO CLUBS · CLUB PROFILE</text>
  ${c.pass?`<rect x="390" y="168" width="96" height="34" rx="17" fill="#f8d778"/><text x="438" y="192" text-anchor="middle" font-family="Inter" font-weight="900" font-size="18" fill="#1a1205" letter-spacing="3">PASS</text>`:""}
  <text x="390" y="${c.pass?272:250}" font-family="Inter" font-weight="900" font-size="${name.size}" fill="#ffffff">${esc(name.text)}</text>
  ${rec.map(([k,v,col],i)=>`<text x="${390+i*200}" y="370" font-family="Inter" font-weight="900" font-size="64" fill="${col}">${N(v)}<tspan font-size="34" fill="#8ea3bd" dx="6">${k}</tspan></text>`).join("")}
  ${form.length?`<text x="390" y="440" font-family="Inter" font-weight="800" font-size="20" fill="#8ea3bd" letter-spacing="4">FORM</text>${form.map((r,i)=>`<rect x="${480+i*56}" y="410" width="46" height="46" rx="12" fill="${RES[r]||"#334155"}"/><text x="${503+i*56}" y="442" text-anchor="middle" font-family="Inter" font-weight="900" font-size="24" fill="#06131a">${esc(r)}</text>`).join("")}`:""}
  ${meta?`<text x="390" y="${form.length?496:440}" font-family="Inter" font-weight="500" font-size="24" fill="#9fb2c8">${esc(meta)}</text>`:""}
  ${brand(64,580,c.url)}</svg>`;
}

/** Session report: date, record, results, awards, top stats. Height grows with the number of matches. */
export function sessionCardSvg(s){
 const W=1200,rows=(s.results||[]).slice(0,12),awards=(s.awards||[]).slice(0,4),H=400+rows.length*58+(awards.length?240:0);
 const title=fit(s.clubName||"Session",820,54,34);
 let y=0;
 const head=`${crestEl(s.crest,120,140,130)}
  <text x="220" y="112" font-family="Inter" font-weight="800" font-size="22" fill="#5eead4" letter-spacing="5">SESSION REPORT · ${esc(s.dateLabel||"")}</text>
  <text x="220" y="172" font-family="Inter" font-weight="900" font-size="${title.size}" fill="#ffffff">${esc(title.text)}</text>
  <text x="220" y="218" font-family="Inter" font-weight="500" font-size="24" fill="#9fb2c8">${esc(`${rows.length} matches · ${s.gf}:${s.ga} goals${s.duration?` · ${s.duration}`:""}`)}</text>
  ${[["W",s.w,"#2dd4bf"],["D",s.d,"#fbbf24"],["L",s.l,"#fb7185"]].map(([k,v,c],i)=>`<rect x="${880+i*92}" y="96" width="80" height="110" rx="18" fill="#0a1420" stroke="${c}" stroke-opacity=".5" stroke-width="2"/><text x="${920+i*92}" y="160" text-anchor="middle" font-family="Inter" font-weight="900" font-size="48" fill="${c}">${N(v)}</text><text x="${920+i*92}" y="190" text-anchor="middle" font-family="Inter" font-weight="800" font-size="18" fill="#8ea3bd">${k}</text>`).join("")}`;
 y=270;
 const list=rows.map((r,i)=>{const yy=y+i*58,opp=fit(r.opponent||"Opponent",560,28,20);return `<rect x="60" y="${yy}" width="${W-120}" height="50" rx="14" fill="#0d1826" stroke="#1a2c40"/>
  <rect x="76" y="${yy+9}" width="32" height="32" rx="9" fill="${RES[r.result]||"#334155"}"/><text x="92" y="${yy+32}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="18" fill="#06131a">${esc(r.result||"-")}</text>
  <text x="130" y="${yy+34}" font-family="Inter" font-weight="900" font-size="26" fill="#eaf2fa">${N(r.og)} : ${N(r.tg)}</text>
  <text x="250" y="${yy+34}" font-family="Inter" font-weight="500" font-size="${opp.size}" fill="#cfe0f1">${esc("vs "+opp.text)}</text>
  ${r.star?`<text x="${W-80}" y="${yy+34}" text-anchor="end" font-family="Inter" font-weight="800" font-size="20" fill="#f8d778">${esc(r.star)}</text>`:""}`}).join("");
 y+=rows.length*58+30;
 const aw=awards.length?`<text x="60" y="${y+10}" font-family="Inter" font-weight="800" font-size="20" fill="#8ea3bd" letter-spacing="4">AWARDS</text>${awards.map((a,i)=>{const x=60+i*((W-120)/awards.length),w=(W-120)/awards.length-16,nm=fit(a.player,w-36,30,18);return `<rect x="${x}" y="${y+30}" width="${w}" height="170" rx="20" fill="#0d1826" stroke="${i===0?"#f8d778":"#1f3247"}" stroke-width="2"/>
  <text x="${x+18}" y="${y+70}" font-family="Inter" font-weight="800" font-size="18" fill="${i===0?"#f8d778":"#5eead4"}" letter-spacing="2">${esc(String(a.title).toUpperCase())}</text>
  <text x="${x+18}" y="${y+120}" font-family="Inter" font-weight="900" font-size="${nm.size}" fill="#ffffff">${esc(nm.text)}</text>
  <text x="${x+18}" y="${y+168}" font-family="Inter" font-weight="800" font-size="26" fill="#eaf2fa">${esc(a.value)}<tspan font-weight="500" font-size="18" fill="#8ea3bd" dx="8">${esc(a.unit||"")}</tspan></text>`}).join("")}`:"";
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bg(W,H)}${head}${list}${aw}${brand(64,H-40,s.url)}</svg>`;
}

/** Session numbers (shared by the PNG and the Discord message). */
export function sessionSummary(sess){
 const ms=(sess.matches||[]).slice().sort((a,b)=>new Date(a.played_at)-new Date(b.played_at));
 const w=ms.filter(m=>m.result==="W").length,d=ms.filter(m=>m.result==="D").length,l=ms.length-w-d;
 const gf=ms.reduce((a,m)=>a+N(m.goals),0),ga=ms.reduce((a,m)=>a+N(m.opponent_goals),0);
 const P=new Map();
 for(const m of ms)for(const p of m.players||[]){const k=String(p.player_id),x=P.get(k)||{name:p.player_name||"Player",n:0,goals:0,assists:0,motm:0,rating:0,rn:0,tackles:0,passes:0,att:0};
  x.n++;x.goals+=N(p.goals);x.assists+=N(p.assists);x.motm+=N(p.motm);x.tackles+=N(p.tackles_made);x.passes+=N(p.passes_made);x.att+=N(p.pass_attempts);if(N(p.rating)){x.rating+=N(p.rating);x.rn++}P.set(k,x)}
 const ps=[...P.values()],minN=ms.length>=3?2:1,el=ps.filter(p=>p.n>=minN);
 const best=(arr,f)=>arr.slice().sort((a,b)=>f(b)-f(a))[0];
 const awards=[];
 const mvp=best(el.filter(p=>p.rn),p=>p.rating/p.rn);if(mvp)awards.push({title:"MVP of the night",player:mvp.name,value:(mvp.rating/mvp.rn).toFixed(2),unit:"avg rating"});
 const sc=best(ps,p=>p.goals*10+p.assists);if(sc&&sc.goals)awards.push({title:"Top scorer",player:sc.name,value:String(sc.goals),unit:sc.goals===1?"goal":"goals"});
 const pm=best(ps,p=>p.assists*10+p.goals);if(pm&&pm.assists)awards.push({title:"Playmaker",player:pm.name,value:String(pm.assists),unit:pm.assists===1?"assist":"assists"});
 const wall=best(el,p=>p.tackles/p.n);if(wall&&wall.tackles)awards.push({title:"The Wall",player:wall.name,value:(wall.tackles/wall.n).toFixed(1),unit:"tackles / match"});
 const results=ms.map(m=>{const top=(m.players||[]).slice().sort((a,b)=>N(b.rating)-N(a.rating))[0];return {result:m.result,og:N(m.goals),tg:N(m.opponent_goals),opponent:m.opponent,star:top&&N(top.rating)?`★ ${top.player_name} ${N(top.rating).toFixed(1)}`:""}});
 return {w,d,l,gf,ga,results,awards,count:ms.length,startedAt:sess.startedAt,lastMatchAt:sess.lastMatchAt,durationMinutes:sess.durationMinutes};
}
