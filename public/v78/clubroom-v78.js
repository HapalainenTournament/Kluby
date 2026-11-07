/* CLUBROOM v78 · Misc tabs, Club Pulse, Trophy Cabinet, Clubroom Pass, Creativity tab, division fallback.
   Archive-only computations (S.history). No synthetic data is ever shown to users. Classic script, loaded after app.js. */
(function(){
'use strict';
const esc=v=>escapeHtml(String(v??''));
const n0=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const fx=(v,d=1)=>Number.isFinite(Number(v))?Number(v).toFixed(d):'--';
const pctS=(a,b)=>b?Math.round(a/b*100)+'%':'--';
const qs=new URLSearchParams(location.search);
const CFG={
  priceEur:4,
  minPlayerMatches:5,            // per-match rankings (creativity, streak form)
  minLuckyMatches:5,             // with/without samples for Lucky Charm
  minAwardMatches:{this:2,last:2,season:5},
  sessionGapMinutes:90,
  adGates:{enabled:qs.get('gates')==='1',tabs:['habits','lucky-charm','awards','wrapped'],hours:24}
};
window.CLUBROOM_MONETIZATION=CFG;
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};

/* ---------- icons (own SVG set, 24px grid, stroke) ---------- */
const P={
 trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>',
 cup:'<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M12 13v4M8 20h8M9.5 17h5"/><path class="d" d="M9.5 6.5h5"/>',
 flame:'<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.3 2.6-4.8 3.3-8.4 2.3 1.2 3.3 3.3 3.2 5 1-.6 1.7-1.7 1.9-3 1.9 1.6 3.6 3.8 3.6 6.4C18 18.6 15.6 21 12 21z"/><path class="d" d="M12 21c-1.4 0-2.5-1-2.5-2.4 0-1.5 1.2-2.2 1.5-3.8 1.4.8 3.5 2 3.5 3.8 0 1.4-1.1 2.4-2.5 2.4z"/>',
 snow:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="M9.5 4.5L12 6l2.5-1.5M9.5 19.5L12 18l2.5 1.5"/>',
 shield:'<path d="M12 3.2l6.5 2.4v5.6c0 4.3-2.4 7.3-6.5 9.8-4.1-2.5-6.5-5.5-6.5-9.8V5.6z"/><path class="d" d="M9 12l2.2 2.2L15.5 10"/>',
 ball:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.6l3.4 2.5-1.3 4h-4.2l-1.3-4z"/><path d="M12 3.5v4.1M15.4 10.1l4-1.3M14.1 14.1l2.4 3.5M9.9 14.1l-2.4 3.5M8.6 10.1l-4-1.3"/>',
 boot:'<path d="M5 15.5V5.5h5.5v5.2l7.4 2.6c1.3.5 2.1 1.6 2.1 3V18H5z"/><path class="d" d="M5 18h15M9 18v-2M13 18v-2M17 18v-2"/>',
 star:'<path d="M12 3.8l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z"/>',
 bolt:'<path d="M13 2.5L5.5 13.5h5.2L10 21.5l8-11.2h-5.3z"/>',
 calendar:'<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/><path class="d" d="M8 13h2M12 13h2M8 16.5h2"/>',
 glove:'<path d="M7 20l-1.5-6.5a1.6 1.6 0 0 1 1.6-1.9H8V6.2a1.4 1.4 0 0 1 2.8 0V11V4.8a1.4 1.4 0 0 1 2.8 0V11V6a1.4 1.4 0 0 1 2.8 0v6.5l.8-1.6a1.4 1.4 0 0 1 2.5 1.3L17.6 17 16 20z"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/>',
 target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle class="d" cx="12" cy="12" r="1"/>',
 drop:'<path d="M12 3.5c3 4 6 7.1 6 10.4A6 6 0 0 1 6 13.9c0-3.3 3-6.4 6-10.4z"/><path class="d" d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
 clover:'<path d="M12 12c-2.6-3.8-6.6-2.5-5.6.3.8 2.2 3.4 1.6 5.6-.3zM12 12c3.8-2.6 2.5-6.6-.3-5.6-2.2.8-1.6 3.4.3 5.6zM12 12c2.6 3.8 6.6 2.5 5.6-.3-.8-2.2-3.4-1.6-5.6.3zM12 12c-3.8 2.6-2.5 6.6.3 5.6 2.2-.8 1.6-3.4-.3-5.6z"/><path d="M12 12l3.5 8.5"/>',
 flag:'<path d="M6 21V4M6 4.5h10.5l-2 3.5 2 3.5H6"/>',
 archive:'<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-10"/><path class="d" d="M10 12.5h4"/>',
 unlock:'<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 6.8-1.2"/><path class="d" d="M12 14.5v2.5"/>',
 lock:'<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/><path class="d" d="M12 14.5v2.5"/>',
 share:'<circle cx="17.5" cy="5.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/><path d="M8.7 10.8l6.6-4M8.7 13.2l6.6 4"/>',
 ticket:'<path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5z"/><path class="d" d="M14.5 6.5v11" stroke-dasharray="1.6 2"/>',
 up:'<path d="M12 19V5M6 11l6-6 6 6"/>',down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
 dice:'<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle class="d" cx="9" cy="9" r="1.2"/><circle class="d" cx="15" cy="15" r="1.2"/><circle class="d" cx="12" cy="12" r="1.2"/>',
 eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
 card:'<rect x="7" y="3.5" width="10" height="17" rx="1.8"/>',
 wave:'<path d="M3 14c2.5 0 2.5-4 5-4s2.5 4 5 4 2.5-4 5-4 2.5 4 3 4"/>',
 crown:'<path d="M4.5 17l1.2-9 4 3.5L12 6l2.3 5.5 4-3.5 1.2 9z"/><path d="M5 20h14"/>',
 ghost:'<path d="M6 20V10a6 6 0 0 1 12 0v10l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><circle class="d" cx="10" cy="11" r=".9"/><circle class="d" cx="14" cy="11" r=".9"/>',
 backpack:'<rect x="6" y="7" width="12" height="13.5" rx="3"/><path d="M9.5 7V5.5a2.5 2.5 0 0 1 5 0V7M9 13h6v4H9z"/>',
 compass:'<circle cx="12" cy="12" r="8.5"/><path class="d" d="M15.5 8.5l-2 5-5 2 2-5z"/>',
 spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>'
};
const icon=(name,size=20,cls='')=>`<svg class="v78i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[name]||P.spark}</svg>`;
window.ClubroomIcons78={icon,names:Object.keys(P)};
function hydrateIcons(root=document){root.querySelectorAll('[data-v78-icon]').forEach(el=>{if(!el.firstElementChild)el.innerHTML=icon(el.dataset.v78Icon,20)})}

/* ---------- data prep ---------- */
let D=null,lastH=null;
const pidOf=r=>String(r?.player_id||r?.player_name||'').trim();
function livePlayer(id,name){const nm=String(name||'').toLowerCase();return (S.players||[]).find(p=>String(p.id)===String(id)||String(p.name||'').toLowerCase()===nm||String(p.accountName||'').toLowerCase()===nm)||null}
function prep(h){
  if(!h||!h.enabled)return null;
  const meta=new Map((h.players||[]).map(p=>[String(p.player_id),p]));
  const matches=(h.matches||[]).map(m=>{const ts=new Date(m.played_at||0);const og=n0(m.goals),tg=n0(m.opponent_goals);return {id:String(m.match_id),ts,og,tg,result:String(m.result||(og>tg?'W':og<tg?'L':'D')).toUpperCase(),type:String(m.match_type||''),opponent:m.opponent||'Opponent',raw:m.raw_json||null}}).filter(m=>!isNaN(m.ts)).sort((a,b)=>a.ts-b.ts);
  const mById=new Map(matches.map(m=>[m.id,m]));
  const rows=[],byMatch=new Map(),players=new Map();
  const seen=new Set();
  for(const r0 of h.playerMatches||[]){const id=pidOf(r0),mid=String(r0.match_id||'');const m=mById.get(mid);if(!id||!m)continue;const k=mid+'|'+id;if(seen.has(k))continue;seen.add(k);
    const r={...r0,pid:id,m,ts:m.ts,rating:n0(r0.rating)};rows.push(r);
    if(!byMatch.has(mid))byMatch.set(mid,[]);byMatch.get(mid).push(r);
    if(!players.has(id)){const md=meta.get(id),live=livePlayer(id,md?.pro_name||r0.player_name);players.set(id,{id,liveId:live?.id||id,name:live?.name||md?.pro_name||r0.player_name||'Player',position:live?.position||r0.position||'',rows:[]})}
    players.get(id).rows.push(r)}
  for(const p of players.values())p.rows.sort((a,b)=>a.ts-b.ts);
  const sessions=[];let cur=null;for(const m of matches){if(!cur||(m.ts-cur.end)/60000>CFG.sessionGapMinutes){cur={start:m.ts,end:m.ts,matches:[]};sessions.push(cur)}cur.end=m.ts;cur.matches.push(m);m.session=cur;m.sessionIndex=cur.matches.length}
  return {matches,rows,byMatch,players,sessions,mById};
}
const ply=id=>D?.players.get(String(id));
const av=(p,variant='mini')=>p?avatarMarkup({id:p.liveId,name:p.name,position:p.position},variant):'';
const pLink=p=>p?`<button type="button" class="v78Player" data-chem-profile="${esc(p.liveId)}">${av(p)}<b>${esc(p.name)}</b></button>`:'';
const mLink=(m,txt)=>m?`<button type="button" class="v78MatchLink" data-match-open73="${esc(m.id)}">${txt||'Open match'} ›</button>`:'';
const dFmt=d=>d?d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
const score=m=>`${m.og}<i>–</i>${m.tg}`;
const empty=t=>`<div class="v78Empty">${esc(t)}</div>`;
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const sd=a=>{const m=avg(a);return a.length>1?Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1)):null};
function runs(list,pred){let best=0,bestEnd=null,curr=0;for(const x of list){if(pred(x)){curr++;if(curr>best){best=curr;bestEnd=x}}else curr=0}return {best,bestEnd,current:curr}}
function spark(vals,w=90,h=26){if(vals.length<2)return '';const mn=Math.min(...vals),mx=Math.max(...vals),r=mx-mn||1;const pts=vals.map((v,i)=>`${(i/(vals.length-1)*w).toFixed(1)},${(h-2-(v-mn)/r*(h-4)).toFixed(1)}`).join(' ');return `<svg class="v78Spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}"/></svg>`}
const clubName=()=>S.club?.name||'Club';
const clubId=()=>String(S.club?.id||'');

/* ---------- share as PNG ---------- */
async function sharePng(el,filename,width,height){
  try{const mod=await import('/cards/cardShared.js');const style=document.createElement('style');
    style.textContent=(await (await fetch('/style.css')).text())+'\n'+(await (await fetch('/v78/v78.css')).text())+'\n'+(await (await fetch('/v81/v81.css')).text());
    const blob=await mod.rasterizeCardElement({card:el,style,width,height,assetReplacer:async(clone,css)=>{const src=[...el.querySelectorAll('img')],tgt=[...clone.querySelectorAll('img')];for(let i=0;i<tgt.length;i++){const u=await mod.cardUrlToDataUrl(src[i]?.currentSrc||src[i]?.src);if(u)tgt[i].src=u}return {css}}});
    await mod.downloadCardBlob(blob,filename)}catch(e){console.warn('[v78 share]',e?.message||e)}
}
const watermark=()=>Pass.active()?'':'<span class="v78Watermark">clubroom</span>';

/* ================= MISC: RECORDS ================= */
function renderRecords(){
  const host=document.getElementById('miscRecords78');if(!host)return;
  if(!D||!D.matches.length){host.innerHTML=empty('Records appear once the Clubroom archive has matches.');return}
  const M=D.matches,R=D.rows;
  const by=(arr,f)=>arr.reduce((b,x)=>b==null||f(x)>f(b)?x:b,null);
  const wins=M.filter(m=>m.result==='W'),losses=M.filter(m=>m.result==='L');
  const bigWin=by(wins,m=>(m.og-m.tg)*100+m.og),bigLoss=by(losses,m=>(m.tg-m.og)*100+m.tg),wild=by(M,m=>m.og+m.tg);
  const topG=by(R.filter(r=>n0(r.goals)>0),r=>n0(r.goals)*100+r.rating),topR=by(R.filter(r=>r.rating>0),r=>r.rating);
  const ws=runs(M,m=>m.result==='W'),us=runs(M,m=>m.result!=='L');
  const card=(ic,label,val,sub,m,tone='')=>`<article class="recCard78 ${tone}"><div class="recHead78">${icon(ic,18)}<span class="label">${label}</span></div><strong>${val}</strong><p>${sub}</p><footer><small>${m?dFmt(m.ts):''}</small>${m&&m.id?mLink(m):''}</footer></article>`;
  const cards=[
    bigWin&&card('bolt','BIGGEST WIN',score(bigWin),`vs ${esc(bigWin.opponent)}`,bigWin,'win'),
    bigLoss&&card('down','HEAVIEST DEFEAT',score(bigLoss),`vs ${esc(bigLoss.opponent)}`,bigLoss,'loss'),
    wild&&card('flame','HIGHEST SCORING',score(wild),`${wild.og+wild.tg} goals vs ${esc(wild.opponent)}`,wild),
    topG&&card('ball','MOST GOALS IN A MATCH',`${n0(topG.goals)}`,`${esc(ply(topG.pid)?.name)} vs ${esc(topG.m.opponent)}`,topG.m),
    topR&&card('star','HIGHEST RATING',fx(topR.rating,1),`${esc(ply(topR.pid)?.name)} vs ${esc(topR.m.opponent)}`,topR.m),
    ws.best&&card('flame','LONGEST WIN STREAK',`${ws.best}`,`${ws.best===1?'win':'wins'} in a row · ended ${dFmt(ws.bestEnd?.ts)}`,null),
    us.best&&card('shield','LONGEST UNBEATEN RUN',`${us.best}`,`matches without defeat · ended ${dFmt(us.bestEnd?.ts)}`,null)
  ].filter(Boolean).join('');
  const hats=R.filter(r=>n0(r.goals)>=3).sort((a,b)=>b.ts-a.ts);
  // scorelines
  const cap=v=>Math.min(v,5),grid=Array.from({length:6},()=>Array(6).fill(0)),fav=new Map();
  for(const m of M){grid[cap(m.og)][cap(m.tg)]++;const k=`${m.og}–${m.tg}`;fav.set(k,(fav.get(k)||0)+1)}
  const favTop=[...fav.entries()].sort((a,b)=>b[1]-a[1])[0];const mx=Math.max(1,...grid.flat());
  const five=M.filter(m=>m.og+m.tg>=5).length,cs=M.filter(m=>m.tg===0).length;
  const lbl=i=>i===5?'5+':String(i);
  const gridHtml=`<table class="scoreGrid78"><thead><tr><th>Us \\ Them</th>${grid.map((_,j)=>`<th>${lbl(j)}</th>`).join('')}</tr></thead><tbody>${grid.map((row,i)=>`<tr><th>${lbl(i)}</th>${row.map((c,j)=>{const t=i>j?'w':i<j?'l':'d';return `<td class="${t}" style="--a:${(c/mx).toFixed(2)}" title="${lbl(i)}–${lbl(j)}: ${c} match${c===1?'':'es'}">${c||''}</td>`}).join('')}</tr>`).join('')}</tbody></table>`;
  host.innerHTML=`<div class="recGrid78">${cards}</div>
  <div class="v78Two">
    <section class="v78Panel"><div class="v78PanelHead"><span class="label">HAT-TRICKS</span><small>${hats.length}</small></div>${hats.length?`<div class="v78List">${hats.slice(0,8).map(r=>`<div class="v78Row">${pLink(ply(r.pid))}<span>${n0(r.goals)} goals vs ${esc(r.m.opponent)}</span><small>${dFmt(r.ts)}</small>${mLink(r.m,'Match')}</div>`).join('')}</div>`:empty('No hat-trick in the archive yet.')}</section>
    <section class="v78Panel"><div class="v78PanelHead"><span class="label">SCORELINES</span><small>${M.length} matches</small></div>
      <div class="scoreFacts78"><div><strong>${favTop?esc(favTop[0]):'--'}</strong><small>Your favourite score · ${favTop?favTop[1]:0}×</small></div><div><strong>${pctS(five,M.length)}</strong><small>matches with 5+ goals</small></div><div><strong>${pctS(cs,M.length)}</strong><small>clean sheets</small></div></div>${gridHtml}</section>
  </div>`;
  const cov=document.getElementById('recordsCoverage78');if(cov)cov.textContent=`${M.length} ARCHIVED MATCHES`;
}

/* ================= MISC: STREAKS ================= */
function renderStreaks(){
  const host=document.getElementById('miscStreaks78');if(!host)return;
  if(!D||!D.rows.length){host.innerHTML=empty('Streaks need archived player matches.');return}
  const players=[...D.players.values()];
  const form=players.filter(p=>p.rows.length>=CFG.minPlayerMatches+3).map(p=>{const rs=p.rows.map(r=>r.rating).filter(x=>x>0),last=rs.slice(-5),base=avg(rs);return {p,last:avg(last),base,diff:avg(last)-base,series:rs.slice(-10)}}).filter(x=>x.last!=null);
  const fire=form.filter(x=>x.diff>0).sort((a,b)=>b.diff-a.diff),cold=form.filter(x=>x.diff<0).sort((a,b)=>a.diff-b.diff);
  const formRow=x=>`<div class="v78Row">${pLink(x.p)}<span class="formVal78 ${x.diff>=0?'up':'down'}">${icon(x.diff>=0?'up':'down',14)} ${x.diff>=0?'+':''}${fx(x.diff,2)}</span><small>last 5: ${fx(x.last,2)} · avg ${fx(x.base,2)}</small>${spark(x.series)}</div>`;
  const defs=[{k:'goals',t:'Scoring run',ic:'ball',f:r=>n0(r.goals)>0,u:'matches with a goal'},{k:'assists',t:'Assist run',ic:'boot',f:r=>n0(r.assists)>0,u:'matches with an assist'},{k:'rating',t:'8+ rating run',ic:'star',f:r=>r.rating>=8,u:'matches rated 8+'}];
  const streakCards=defs.map(d=>{let best={v:0,p:null},act=[];for(const p of players){const rr=runs(p.rows,d.f);if(rr.best>best.v)best={v:rr.best,p};if(rr.current>=2)act.push({p,v:rr.current})}act.sort((a,b)=>b.v-a.v);
    return `<section class="v78Panel"><div class="v78PanelHead">${icon(d.ic,16)}<span class="label">${d.t.toUpperCase()}</span><small>Best ever: ${best.v}${best.p?' · '+esc(best.p.name):''}</small></div>${act.length?`<div class="v78List">${act.map(a=>`<div class="v78Row">${pLink(a.p)}<span class="streakNum78">${a.v}</span><small>${d.u} in a row${a.v>=best.v?' · club record':''}</small></div>`).join('')}</div>`:empty('No active run of 2+ right now.')}</section>`}).join('');
  const drought=players.filter(p=>!/goal|gk/i.test(p.position)).map(p=>{let c=0;for(let i=p.rows.length-1;i>=0;i--){if(n0(p.rows[i].goals)>0)break;c++}return {p,c,never:c===p.rows.length}}).filter(x=>x.c>0).sort((a,b)=>b.c-a.c);
  const M=D.matches,cw=runs(M,m=>m.result==='W'),cu=runs(M,m=>m.result!=='L');
  host.innerHTML=`<div class="clubStreaks78"><div>${icon('flame',22)}<span class="label">CLUB WIN STREAK</span><strong>${cw.current}</strong><small>Best ever: ${cw.best}</small></div><div>${icon('shield',22)}<span class="label">CLUB UNBEATEN RUN</span><strong>${cu.current}</strong><small>Best ever: ${cu.best}</small></div></div>
  <div class="v78Two"><section class="v78Panel fire78"><div class="v78PanelHead">${icon('flame',16)}<span class="label">ON FIRE</span><small>last 5 vs own average rating</small></div>${fire.length?`<div class="v78List">${fire.map(formRow).join('')}</div>`:empty('Nobody is above their average right now.')}</section>
  <section class="v78Panel cold78"><div class="v78PanelHead">${icon('snow',16)}<span class="label">ICE COLD</span><small>last 5 vs own average rating</small></div>${cold.length?`<div class="v78List">${cold.map(formRow).join('')}</div>`:empty('Nobody is below their average right now.')}</section></div>
  <div class="v78Three">${streakCards}</div>
  <section class="v78Panel"><div class="v78PanelHead">${icon('drop',16)}<span class="label">DROUGHT</span><small>outfield players · matches since last goal</small></div>${drought.length?`<div class="v78List">${drought.map(x=>`<div class="v78Row">${pLink(x.p)}<span class="streakNum78 cold">${x.c}</span><small>${x.never?'no goal in the archive yet':'matches without a goal'}</small></div>`).join('')}</div>`:empty('Every outfield player scored in their latest match.')}</section>`;
}

/* ================= MISC: HABITS ================= */
function bars(items){const mx=100;return `<div class="habitBars78">${items.map(it=>{const ok=it.n>=3,rate=it.n?it.w/it.n*100:0;return `<div class="habitBar78 ${ok?'':'thin'}" title="${esc(it.label)}: ${it.w}W ${it.d}D ${it.l}L"><div class="habitTrack78"><span style="height:${ok?Math.max(4,rate/mx*100):4}%"></span></div><b>${ok?Math.round(rate)+'%':'--'}</b><small>${esc(it.label)}</small><em>${it.n} m</em>${it.extra?`<em>${it.extra}</em>`:''}</div>`}).join('')}</div>`}
function tally(list){return {n:list.length,w:list.filter(m=>m.result==='W').length,d:list.filter(m=>m.result==='D').length,l:list.filter(m=>m.result==='L').length}}
function renderHabits(){
  const host=document.getElementById('miscHabits78');if(!host)return;
  if(!D||!D.matches.length){host.innerHTML=empty('Habits need archived matches.');return}
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'local time';const tzEl=document.getElementById('habitsTz78');if(tzEl)tzEl.textContent=`TIMES IN ${tz.toUpperCase()}`;
  const M=D.matches;
  const blocks=[['Morning',6,12],['Afternoon',12,18],['Evening',18,22],['Night',22,24],['After midnight',0,6]];
  const tod=blocks.map(([label,a,b])=>({label,...tally(M.filter(m=>{const h=m.ts.getHours();return h>=a&&h<b}))}));
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],dayFull={Mon:'Mondays',Tue:'Tuesdays',Wed:'Wednesdays',Thu:'Thursdays',Fri:'Fridays',Sat:'Saturdays',Sun:'Sundays'};
  const dow=days.map((label,i)=>({label,...tally(M.filter(m=>(m.ts.getDay()+6)%7===i))}));
  const order=[1,2,3,4,5,6].map(k=>{const list=M.filter(m=>k<6?m.sessionIndex===k:m.sessionIndex>=6);const rs=list.flatMap(m=>(D.byMatch.get(m.id)||[]).map(r=>r.rating).filter(x=>x>0));return {label:k<6?`#${k}`:'#6+',...tally(list),extra:rs.length?`★ ${fx(avg(rs),2)}`:''}});
  const best=[...tod,...dow].filter(x=>x.n>=3).sort((a,b)=>b.w/b.n-a.w/a.n)[0];
  host.innerHTML=`${best?`<div class="habitHero78">${icon('clock',22)}<p>Your best slot is <b>${esc(dayFull[best.label]||best.label.toLowerCase())}</b> with a <b>${Math.round(best.w/best.n*100)}%</b> win rate over ${best.n} matches.</p></div>`:''}
  <div class="v78Two"><section class="v78Panel"><div class="v78PanelHead"><span class="label">TIME OF DAY</span><small>win rate</small></div>${bars(tod)}</section>
  <section class="v78Panel"><div class="v78PanelHead"><span class="label">DAY OF WEEK</span><small>win rate</small></div>${bars(dow)}</section></div>
  <section class="v78Panel"><div class="v78PanelHead"><span class="label">MATCH ORDER IN A SESSION</span><small>${D.sessions.length} sessions · new session after ${CFG.sessionGapMinutes} min break · ★ avg player rating</small></div>${bars(order)}</section>
  <p class="v78Note">Blocks with fewer than 3 matches are greyed out.</p>`;
}

/* ================= MISC: LUCKY CHARM ================= */
function renderLucky(){
  const host=document.getElementById('miscLucky78');if(!host)return;
  if(!D||!D.matches.length){host.innerHTML=empty('Lucky Charm needs archived matches.');return}
  const M=D.matches;const res=[...D.players.values()].map(p=>{const ids=new Set(p.rows.map(r=>r.m.id));const w=tally(M.filter(m=>ids.has(m.id))),wo=tally(M.filter(m=>!ids.has(m.id)));return {p,w,wo,rw:w.n?w.w/w.n*100:null,rwo:wo.n?wo.w/wo.n*100:null}});
  const ok=res.filter(x=>x.w.n>=CFG.minLuckyMatches&&x.wo.n>=CFG.minLuckyMatches).map(x=>({...x,diff:x.rw-x.rwo})).sort((a,b)=>b.diff-a.diff);
  const low=res.filter(x=>!(x.w.n>=CFG.minLuckyMatches&&x.wo.n>=CFG.minLuckyMatches));
  const row=(x,i)=>{const tag=i===0&&x.diff>0?'<span class="luckTag78 good">LUCKY CHARM</span>':(i===ok.length-1&&x.diff<0?'<span class="luckTag78 bad">JINX</span>':'');return `<div class="luckRow78"><div class="luckWho78">${pLink(x.p)}${tag}</div><div class="luckBars78"><div><small>With</small><span class="luckTrack78"><i style="width:${x.rw}%"></i></span><b>${Math.round(x.rw)}%</b><em>${x.w.n} m</em></div><div><small>Without</small><span class="luckTrack78 muted"><i style="width:${x.rwo}%"></i></span><b>${Math.round(x.rwo)}%</b><em>${x.wo.n} m</em></div></div><strong class="${x.diff>=0?'up':'down'}">${x.diff>=0?'+':''}${Math.round(x.diff)} pp</strong></div>`};
  host.innerHTML=`${ok.length?`<div class="v78Panel">${ok.map(row).join('')}</div>`:empty(`Every player needs at least ${CFG.minLuckyMatches} matches with and ${CFG.minLuckyMatches} without them.`)}
  ${low.length?`<p class="v78Note">Not enough data yet: ${low.map(x=>esc(x.p.name)).join(', ')} (min. ${CFG.minLuckyMatches} matches with and without).</p>`:''}`;
}

/* ================= MISC: MILESTONES ================= */
const MS={goals:[10,25,50,100,250,500,1000],assists:[10,25,50,100,250,500],matches:[25,50,100,250,500,1000],motm:[5,10,25,50,100]};
const MS_CLUB={matches:[50,100,250,500,1000,2500],goals:[50,100,250,500,1000,2500],wins:[25,50,100,250,500,1000]};
const msLabel={goals:'goals',assists:'assists',matches:'matches',motm:'MOTM awards',wins:'wins'};
function renderMilestones(){
  const host=document.getElementById('miscMilestones78');if(!host)return;
  if(!D||!D.rows.length){host.innerHTML=empty('Milestones need archived player matches.');return}
  const upcoming=[],reached=[];
  for(const p of D.players.values()){const c={goals:0,assists:0,matches:0,motm:0};for(const r of p.rows){const prev={...c};c.goals+=n0(r.goals);c.assists+=n0(r.assists);c.matches++;c.motm+=n0(r.motm);for(const k in MS)for(const t of MS[k])if(prev[k]<t&&c[k]>=t)reached.push({who:p,k,t,m:r.m})}
    for(const k in MS){const t=MS[k].find(t=>t>c[k]);if(t)upcoming.push({who:p,k,t,v:c[k],left:t-c[k]})}}
  const club={matches:0,goals:0,wins:0};for(const m of D.matches){const prev={...club};club.matches++;club.goals+=m.og;club.wins+=m.result==='W'?1:0;for(const k in MS_CLUB)for(const t of MS_CLUB[k])if(prev[k]<t&&club[k]>=t)reached.push({who:null,k,t,m})}
  const clubUp=Object.keys(MS_CLUB).map(k=>{const t=MS_CLUB[k].find(t=>t>club[k]);return t?{who:null,k,t,v:club[k],left:t-club[k]}:null}).filter(Boolean);
  const all=[...clubUp,...upcoming].filter(x=>x.v>0).sort((a,b)=>b.v/b.t-a.v/a.t).slice(0,10);
  const upRow=x=>`<div class="msRow78">${x.who?pLink(x.who):`<span class="v78ClubTag">${icon('shield',16)}<b>${esc(clubName())}</b></span>`}<div class="msBody78"><span><b>${x.left}</b> ${msLabel[x.k]} to ${x.t}</span><span class="msTrack78"><i style="width:${Math.min(100,x.v/x.t*100)}%"></i></span></div><small>${x.v}/${x.t}</small></div>`;
  reached.sort((a,b)=>b.m.ts-a.m.ts);
  host.innerHTML=`<div class="v78Two"><section class="v78Panel"><div class="v78PanelHead">${icon('flag',16)}<span class="label">COMING UP</span><small>closest first</small></div>${all.length?all.map(upRow).join(''):empty('No upcoming milestones.')}</section>
  <section class="v78Panel"><div class="v78PanelHead">${icon('trophy',16)}<span class="label">REACHED</span><small>${reached.length}</small></div>${reached.length?`<ol class="msTimeline78">${reached.slice(0,20).map(x=>`<li><span class="msDot78"></span><div><b>${x.who?esc(x.who.name):esc(clubName())}</b> reached <b>${x.t} ${msLabel[x.k]}</b><small>${dFmt(x.m.ts)} · vs ${esc(x.m.opponent)}</small></div>${mLink(x.m,'Match')}</li>`).join('')}</ol>`:empty('No milestone reached in the archive yet.')}</section></div>
  <p class="v78Note">Counts use matches captured by Clubroom, not EA career totals.</p>`;
}

/* ================= MISC: AWARDS (reveal) ================= */
let awardPeriod='this';
function weekStart(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
function periodRange(p){const now=new Date(),ws=weekStart(now);if(p==='this')return {from:ws,to:new Date(8.64e15),key:ws.toISOString().slice(0,10)};if(p==='last'){const f=new Date(ws);f.setDate(f.getDate()-7);return {from:f,to:ws,key:f.toISOString().slice(0,10)}}return {from:new Date(0),to:new Date(8.64e15),key:'season'}}
const AWARDS=[
 {id:'score',title:'Most Likely to Score',ic:'ball',v:s=>s.goals/s.g,f:v=>fx(v,2),u:'goals / match',why:s=>`${s.goals} goals in ${s.g} matches`},
 {id:'miss',title:'Most Likely to Miss',ic:'target',v:s=>(s.shots-s.goals)/s.g,f:v=>fx(v,2),u:'missed shots / match',why:s=>`${s.shots} shots, ${s.goals} goals`},
 {id:'sentoff',title:'Most Likely to Get Sent Off',ic:'card',v:s=>s.reds*5+(s.tAtt-s.tMade)/s.g,f:v=>fx(v,1),u:'reckless index',why:s=>`${s.reds} red card${s.reds===1?'':'s'} · ${s.tAtt-s.tMade} missed tackles`},
 {id:'backpack',title:'The Backpack',ic:'backpack',min:s=>s.winR.length>=2,v:s=>-avg(s.winR),f:v=>fx(-v,2),u:'avg rating in wins',why:s=>`carried through ${s.winR.length} wins`},
 {id:'architect',title:'The Architect',ic:'compass',v:s=>(s.through+s.assists*3)/s.g,f:v=>fx(v,2),u:'creation index / match',why:s=>`${s.assists} assists · ${s.through} through balls`},
 {id:'og',title:'The OG',ic:'calendar',v:s=>s.g,f:v=>String(v),u:'matches played',why:s=>`never misses a session`},
 {id:'main',title:'Main Character',ic:'spark',v:s=>(s.shots+s.dribbles)/s.g,f:v=>fx(v,1),u:'shots + dribbles / match',why:s=>`${s.shots} shots · ${s.dribbles} dribbles`},
 {id:'clutch',title:'Mr Clutch',ic:'bolt',min:s=>s.closeR.length>=2,v:s=>avg(s.closeR),f:v=>fx(v,2),u:'rating in 1-goal games',why:s=>`${s.closeR.length} one-goal matches`},
 {id:'reliable',title:'Mr Reliable',ic:'shield',min:s=>s.r.length>=4,v:s=>-sd(s.r),f:v=>fx(-v,2),u:'rating deviation (lower = steadier)',why:s=>`avg ${fx(avg(s.r),2)}, rarely off`},
 {id:'coaster',title:'Rollercoaster',ic:'wave',min:s=>s.r.length>=4,v:s=>sd(s.r),f:v=>fx(v,2),u:'rating deviation',why:s=>`between ${fx(Math.min(...s.r),1)} and ${fx(Math.max(...s.r),1)}`},
 {id:'assassin',title:'Silent Assassin',ic:'target',min:s=>s.shots>=3&&s.goals>=2,v:s=>s.goals/s.shots-s.shots/s.g/100,f:v=>Math.round(v*100)+'%',u:'shot conversion',why:s=>`${s.goals} from ${s.shots} shots`},
 {id:'tourist',title:'The Tourist',ic:'ghost',min:s=>!s.gk,v:s=>-((s.pAtt+s.tAtt+s.shots+s.dribbles)/s.g),f:v=>fx(-v,0),u:'involvements / match',why:s=>`barely touched the ball`},
 {id:'shame',title:'Hall of Shame',ic:'down',v:s=>-avg(s.r),f:v=>fx(-v,2),u:'avg rating',why:s=>`lowest average rating`}
];
function awardStats(range){const map=new Map();for(const r of D.rows){if(r.ts<range.from||r.ts>=range.to)continue;let s=map.get(r.pid);if(!s){const p=ply(r.pid);s={p,g:0,goals:0,shots:0,assists:0,through:0,dribbles:0,reds:0,tAtt:0,tMade:0,pAtt:0,r:[],winR:[],closeR:[],gk:/goal|gk/i.test(p?.position||r.position||'')};map.set(r.pid,s)}
  s.g++;s.goals+=n0(r.goals);s.shots+=n0(r.shots);s.assists+=n0(r.assists);s.through+=n0(r.through_balls);s.dribbles+=n0(r.dribbles);s.reds+=n0(r.red_cards);s.tAtt+=n0(r.tackle_attempts);s.tMade+=n0(r.tackles_made);s.pAtt+=n0(r.pass_attempts);if(r.rating>0){s.r.push(r.rating);if(r.m.result==='W')s.winR.push(r.rating);if(Math.abs(r.m.og-r.m.tg)===1)s.closeR.push(r.rating)}}
  return [...map.values()]}
function awardResults(){const range=periodRange(awardPeriod),min=CFG.minAwardMatches[awardPeriod],stats=awardStats(range).filter(s=>s.g>=min);
  return {range,min,stats,list:AWARDS.map(a=>{const c=stats.filter(s=>!a.min||a.min(s)).map(s=>({s,v:a.v(s)})).filter(x=>Number.isFinite(x.v)).sort((x,y)=>y.v-x.v);const top=c[0];const zero=!top||(['score','miss','architect','main','sentoff'].includes(a.id)&&top.v<=0);return {a,winner:zero?null:top,cands:c.map(x=>x.s.p).filter(Boolean)}})}}
const revealKey=r=>`clubroom78:awards:${clubId()}:${awardPeriod}:${r.key}`;
function awardCard(x,revealed){const a=x.a;if(!revealed)return `<button type="button" class="award78 back" data-award="${a.id}"><span class="awardIcon78">${icon(a.ic,30)}</span><b>${esc(a.title)}</b><small>Tap to reveal</small></button>`;
  if(!x.winner)return `<article class="award78 front none" data-award="${a.id}"><span class="awardIcon78">${icon(a.ic,22)}</span><b>${esc(a.title)}</b><div class="awardNone78">No winner this period</div></article>`;
  const s=x.winner.s;return `<article class="award78 front" data-award="${a.id}"><header><span class="awardIcon78">${icon(a.ic,18)}</span><b>${esc(a.title)}</b><button type="button" class="awardShare78" data-award-share="${a.id}" aria-label="Share award">${icon('share',15)}</button></header><div class="awardAvatar78">${av(s.p,'bust')}</div><strong class="awardName78">${esc(s.p?.name)}</strong><div class="awardVal78"><b>${a.f(x.winner.v)}</b><small>${esc(a.u)}</small></div><p>${esc(a.why(s))}</p>${watermark()}</article>`}
function renderAwards(){
  const host=document.getElementById('miscAwards78');if(!host)return;
  if(!D||!D.rows.length){host.innerHTML=empty('Awards need archived player matches.');return}
  const res=awardResults();const done=new Set(LS.get(revealKey(res.range),[]));
  if(!res.stats.length){host.innerHTML=empty(`No player has ${res.min}+ archived matches in this period yet.`);return}
  host.innerHTML=res.list.map(x=>awardCard(x,done.has(x.a.id))).join('');
}
function revealAward(id,instant=false){const res=awardResults(),x=res.list.find(x=>x.a.id===id),el=document.querySelector(`#miscAwards78 [data-award="${id}"]`);if(!x||!el||el.classList.contains('rolling'))return Promise.resolve();
  const key=revealKey(res.range),done=new Set(LS.get(key,[]));done.add(id);LS.set(key,[...done]);
  const finish=()=>{el.outerHTML=awardCard(x,true).replace('class="award78 front','class="award78 front flipIn')};
  const pool=x.cands.length?x.cands:[];if(instant||!pool.length||matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return Promise.resolve()}
  el.classList.add('rolling');el.innerHTML=`<span class="awardIcon78">${icon(x.a.ic,18)}</span><b>${esc(x.a.title)}</b><div class="rollSlot78"></div><small>Drawing…</small>`;const slot=el.querySelector('.rollSlot78');
  return new Promise(done2=>{let i=0,delay=60,t=0;const step=()=>{const p=pool[i++%pool.length];slot.innerHTML=`${av(p,'bust')}<span>${esc(p.name)}</span>`;t+=delay;delay*=1.13;if(t<1500)setTimeout(step,delay);else setTimeout(()=>{finish();done2()},260)};step()})}

/* ================= MISC: WRAPPED ================= */
let wrappedMonth=null;
const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const monthName=k=>{const [y,m]=k.split('-');return new Date(+y,+m-1,1).toLocaleDateString('en-GB',{month:'long',year:'numeric'})};
function renderWrapped(){
  const host=document.getElementById('miscWrapped78'),sel=document.getElementById('wrappedMonth78');if(!host||!sel)return;
  if(!D||!D.matches.length){host.innerHTML=empty('Wrapped needs archived matches.');sel.innerHTML='';return}
  const months=[...new Set(D.matches.map(m=>monthKey(m.ts)))].sort().reverse();if(!months.includes(wrappedMonth))wrappedMonth=months[0];
  sel.innerHTML=months.map(k=>`<option value="${k}" ${k===wrappedMonth?'selected':''}>${monthName(k)}</option>`).join('');
  const M=D.matches.filter(m=>monthKey(m.ts)===wrappedMonth),ids=new Set(M.map(m=>m.id)),R=D.rows.filter(r=>ids.has(r.m.id));
  const t=tally(M),gf=M.reduce((s,m)=>s+m.og,0),ga=M.reduce((s,m)=>s+m.tg,0);
  const sess=D.sessions.filter(s=>s.matches.some(m=>ids.has(m.id)));const mins=sess.reduce((s,x)=>s+(x.end-x.start)/60000+20,0);
  const per=new Map();for(const r of R){let x=per.get(r.pid);if(!x){x={p:ply(r.pid),g:0,goals:0,assists:0,motm:0,r:[]};per.set(r.pid,x)}x.g++;x.goals+=n0(r.goals);x.assists+=n0(r.assists);x.motm+=n0(r.motm);if(r.rating>0)x.r.push(r.rating)}
  const P2=[...per.values()];const top=(f,min=1)=>P2.filter(x=>x.g>=min).sort((a,b)=>f(b)-f(a))[0];
  const scorer=top(x=>x.goals*100+x.g),assister=top(x=>x.assists*100+x.g),mvp=top(x=>avg(x.r)*10+x.motm,3);
  const pairs=new Map();for(const m of M){const rs=(D.byMatch.get(m.id)||[]);for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const k=[rs[i].pid,rs[j].pid].sort().join('|');let x=pairs.get(k);if(!x){x={a:ply(rs[i].pid),b:ply(rs[j].pid),n:0,w:0};pairs.set(k,x)}x.n++;if(m.result==='W')x.w++}}
  const duo=[...pairs.values()].filter(x=>x.n>=3).sort((a,b)=>b.w/b.n-a.w/a.n||b.n-a.n)[0];
  const bigWin=M.filter(m=>m.result==='W').sort((a,b)=>(b.og-b.tg)-(a.og-a.tg)||b.og-a.og)[0];
  const days=new Map();for(const m of M){const k=m.ts.toDateString();if(!days.has(k))days.set(k,[]);days.get(k).push(m)}
  const worst=[...days.values()].filter(l=>l.length>=3).map(list=>({...tally(list),list,ppm:list.reduce((s,m)=>s+(m.result==='W'?3:m.result==='D'?1:0),0)/list.length})).sort((a,b)=>a.ppm-b.ppm)[0];
  const card=(cls,kicker,body)=>`<article class="wrap78 ${cls}"><header><span>${esc(clubName())}</span><b>${esc(monthName(wrappedMonth))}</b></header><span class="wrapKicker78">${kicker}</span>${body}<footer>${icon('ticket',14)} CLUBROOM WRAPPED${watermark()}</footer></article>`;
  const pcard=(cls,k,x,big,sub)=>x?card(cls,k,`<div class="wrapAvatar78">${av(x.p,'bust')}</div><strong class="wrapName78">${esc(x.p?.name)}</strong><div class="wrapBig78">${big}</div><p>${sub}</p>`):'';
  const cards=[
    card('c1','YOUR MONTH IN NUMBERS',`<div class="wrapBig78">${M.length}<small>matches</small></div><div class="wrapStats78"><span><b>≈${Math.round(mins/60)}</b> hours on the pitch</span><span><b>${sess.length}</b> sessions</span><span><b>${gf}</b> goals scored</span></div>`),
    card('c2','THE RECORD',`<div class="wrapRecord78"><b class="w">${t.w}W</b><b class="d">${t.d}D</b><b class="l">${t.l}L</b></div><div class="wrapBig78">${pctS(t.w,t.n)}<small>win rate</small></div><p>${gf} scored · ${ga} conceded</p>`),
    pcard('c3','TOP SCORER',scorer&&scorer.goals?scorer:null,`${scorer?.goals}<small>goals</small>`,`${fx(scorer?scorer.goals/scorer.g:0,2)} per match`),
    pcard('c4','TOP ASSIST',assister&&assister.assists?assister:null,`${assister?.assists}<small>assists</small>`,`in ${assister?.g} matches`),
    duo?card('c5','BEST DUO',`<div class="wrapDuo78"><div>${av(duo.a,'bust')}</div><div>${av(duo.b,'bust')}</div></div><strong class="wrapName78">${esc(duo.a?.name)} + ${esc(duo.b?.name)}</strong><div class="wrapBig78">${pctS(duo.w,duo.n)}<small>win rate together</small></div><p>${duo.n} matches together</p>`):'',
    bigWin?card('c6','BIGGEST WIN',`<div class="wrapBig78 score">${bigWin.og}–${bigWin.tg}</div><p>vs ${esc(bigWin.opponent)}</p><p>${dFmt(bigWin.ts)}</p>`):'',
    worst?card('c7','WORST NIGHT',`<div class="wrapBig78">${worst.w}-${worst.d}-${worst.l}</div><p>${worst.list[0].ts.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</p><p>${worst.list.length} matches. Let's not talk about it.</p>`):'',
    pcard('c8','MVP OF THE MONTH',mvp,`${fx(mvp?avg(mvp.r):null,2)}<small>avg rating</small>`,`${mvp?.motm||0} MOTM · ${mvp?.g} matches`)
  ].filter(Boolean);
  host.innerHTML=cards.map((c,i)=>`<div class="wrapSlot78">${c}<button type="button" class="v78Btn ghost" data-wrap-share="${i}">${icon('share',14)} Share</button></div>`).join('');
}

/* ================= ANALYTICS: CREATIVITY ================= */
function renderCreativity(){
  const host=document.getElementById('analyticsCreativity78');if(!host)return;
  if(!D||!D.rows.length){host.innerHTML=empty('Creativity needs archived player matches.');return}
  const list=[...D.players.values()].map(p=>{const g=p.rows.length,dr=p.rows.reduce((s,r)=>s+n0(r.dribbles),0),sa=p.rows.reduce((s,r)=>s+n0(r.second_assists),0);return {p,g,dr,sa,score:g?(dr+2*sa)/g:0}});
  const ok=list.filter(x=>x.g>=CFG.minPlayerMatches).sort((a,b)=>b.score-a.score),low=list.filter(x=>x.g<CFG.minPlayerMatches).sort((a,b)=>b.score-a.score),mx=ok[0]?.score||1;
  const row=(x,i,muted)=>`<div class="creRow78 ${muted?'muted':''} ${!muted&&i===0?'gold':''}"><span class="creRank78">${muted?'—':'#'+(i+1)}</span>${pLink(x.p)}<span class="creTrack78"><i style="width:${Math.min(100,x.score/mx*100)}%"></i></span><b>${fx(x.score,2)}</b><small>${x.dr} dribbles · ${x.sa} 2nd assists · ${x.g} m${muted?` · min. ${CFG.minPlayerMatches} matches`:''}</small></div>`;
  host.innerHTML=`<p class="v78Note top">Score = (completed dribbles + 2 × second assists) ÷ archived matches.</p>${ok.map((x,i)=>row(x,i,false)).join('')||empty(`No player has ${CFG.minPlayerMatches}+ archived matches yet.`)}${low.map(x=>row(x,0,true)).join('')}`;
}

/* ================= OVERVIEW: CLUB PULSE ================= */
let liveOverall={};
function renderPulse(){
  const host=document.getElementById('clubPulse78');if(!host||!S.club)return;
  const o=liveOverall||{};const M=D?.matches||[];
  let win,unb,winBest,unbBest,src;
  if(M.length){const a=runs(M,m=>m.result==='W'),b=runs(M,m=>m.result!=='L');win=a.current;unb=b.current;winBest=a.best;unbBest=b.best;src=true}
  else{win=n0(o.wstreak??o.winStreak);unb=n0(o.unbeatenstreak??o.unbeatenStreak)}
  const last=(M.length?M.slice(-10).map(m=>m.result):(S.matches||[]).slice(0,10).map(m=>m.result).reverse());const lt=tally(last.map(r=>({result:r})));
  const promo=o.promotions,releg=o.relegations;
  const c=(cls,ic,label,body,foot='')=>`<article class="pulse78 ${cls}"><div class="pulseHead78">${icon(ic,17)}<span class="label">${label}</span></div>${body}${foot?`<small>${foot}</small>`:''}</article>`;
  host.innerHTML=[
    c(win>=3?'hot':'','flame','WIN STREAK',`<strong>${win}<span>${win===1?'win':'wins'}</span></strong>`,winBest!=null?`Best: ${winBest}`:''),
    c(unb>=3?'hot':'','shield','UNBEATEN RUN',`<strong>${unb}<span>${unb===1?'match':'matches'}</span></strong>`,unbBest!=null?`Best: ${unbBest}`:''),
    c('','wave','LAST 10',`<div class="pulseForm78">${last.map(r=>`<i class="${r.toLowerCase()}" title="${r}"></i>`).join('')||'<em>--</em>'}</div><b class="pulseRec78">${lt.w}W · ${lt.d}D · ${lt.l}L</b>`),
    c('','up','PROMOTIONS / RELEGATIONS',`<div class="pulseUpDown78"><span class="up">${icon('up',16)}<b>${promo??'--'}</b></span><span class="down">${icon('down',16)}<b>${releg??'--'}</b></span></div>`,'EA club history')
  ].join('')+(src?'<p class="pulseSrc78">streaks from Clubroom archive</p>':'');
}

/* ================= OVERVIEW: TROPHY CABINET ================= */
let honours=null;
const tone=div=>{const d=Number(div);return !Number.isFinite(d)?'bronze':d<=2?'gold':d<=5?'silver':'bronze'};
function trophySvg(kind,tier,label){const fill={gold:['#f8d778','#b8892a'],silver:['#e6edf5','#8b9bb0'],bronze:['#e2a170','#8a5530'],locked:['#3a4a60','#1c2838']}[tier]||['#e6edf5','#8b9bb0'];const id='g'+Math.random().toString(36).slice(2,8);
  const grad=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${fill[0]}"/><stop offset="1" stop-color="${fill[1]}"/></linearGradient></defs>`;
  if(kind==='shield')return `<svg viewBox="0 0 64 72" class="trophyArt78" aria-hidden="true">${grad}<path d="M32 3l25 9v19c0 18-10 30-25 38C17 61 7 49 7 31V12z" fill="url(#${id})" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/><path d="M32 10l18 6.5v14.5c0 13.5-7.4 22.7-18 29-10.6-6.3-18-15.5-18-29V16.5z" fill="#0b1524" opacity=".88"/><text x="32" y="44" text-anchor="middle" font-size="22" font-weight="900" fill="url(#${id})" font-family="Inter,system-ui,sans-serif">${esc(label)}</text></svg>`;
  if(kind==='medal')return `<svg viewBox="0 0 64 72" class="trophyArt78" aria-hidden="true">${grad}<path d="M20 2h9l3 20-9 2zM44 2h-9l-3 20 9 2z" fill="#2b4c7a" opacity=".9"/><circle cx="32" cy="44" r="21" fill="url(#${id})" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/><circle cx="32" cy="44" r="15" fill="#0b1524" opacity=".85"/><text x="32" y="51" text-anchor="middle" font-size="18" font-weight="900" fill="url(#${id})" font-family="Inter,system-ui,sans-serif">${esc(label)}</text></svg>`;
  return `<svg viewBox="0 0 64 72" class="trophyArt78" aria-hidden="true">${grad}<path d="M17 6h30v14c0 9-6.5 16-15 16S17 29 17 20z" fill="url(#${id})" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/><path d="M17 10H9c0 8 4 13 9 14M47 10h8c0 8-4 13-9 14" fill="none" stroke="url(#${id})" stroke-width="3"/><path d="M28 36h8v12h-8z" fill="url(#${id})"/><rect x="18" y="48" width="28" height="9" rx="2" fill="url(#${id})"/><rect x="14" y="57" width="36" height="8" rx="2" fill="#0b1524" stroke="url(#${id})" stroke-width="1.5"/><text x="32" y="25" text-anchor="middle" font-size="12" font-weight="900" fill="#0b1524" font-family="Inter,system-ui,sans-serif">${esc(label)}</text></svg>`}
const achIcon={cup:'cup',calendar:'calendar',flame:'flame',shield:'shield',ball:'ball',glove:'glove',bolt:'bolt',star:'star'};
function achievementState(){
  const rules=window.CLUBROOM_ACHIEVEMENTS||[];const st={matches:0,wins:0,goals:0,cleanSheets:0,winStreak:0,unbeaten:0,bestMargin:0,hatTricks:0,playoffWins:0};const best={...st};const out=new Map();
  for(const m of D?.matches||[]){st.matches++;if(m.result==='W'){st.wins++;st.winStreak++;st.bestMargin=Math.max(st.bestMargin,m.og-m.tg);if(/playoff/i.test(m.type))st.playoffWins++}else st.winStreak=0;st.unbeaten=m.result==='L'?0:st.unbeaten+1;st.goals+=m.og;if(m.tg===0)st.cleanSheets++;st.hatTricks+=(D.byMatch.get(m.id)||[]).filter(r=>n0(r.goals)>=3).length;
    for(const k in st)best[k]=Math.max(best[k],st[k]);
    for(const r of rules)if(!out.has(r.id)&&best[r.metric]>=r.target)out.set(r.id,{m})}
  return rules.map(r=>({...r,value:best[r.metric]||0,unlocked:out.get(r.id)||null}));
}
async function loadHonours(){const id=clubId();if(!id)return;try{honours=await fetchJSON(`/api/club-honours/${id}?platform=${encodeURIComponent($('#platform')?.value||'common-gen5')}`,9000)}catch{honours={honours:[]}}if(clubId()===id)renderTrophies()}
let trophyItems=[];
/* EA sends internal keys like CLUBS_LEAGUE_CLOSED_SEASON_7 – turn them into readable labels. */
function seasonLabel(h){const raw=String(h.seasonName||h.seasonname||'').trim(),id=h.seasonId??h.seasonid;
  if(raw&&!/^[A-Z0-9_]+$/.test(raw))return raw;
  const num=(raw.match(/(\d+)\D*$/)||[])[1]||(id!=null&&/^\d+$/.test(String(id))?String(id):'');
  const kind=/PLAYOFF/i.test(raw)?'Playoffs':/CUP/i.test(raw)?'Cup':'Season';
  return num?`${kind} ${num}`:(raw?raw.replace(/^CLUBS_/,'').replace(/_/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()):'Season')}
function renderTrophies(){
  const hHost=document.getElementById('trophyHonours78'),aHost=document.getElementById('trophyAchievements78');if(!hHost||!aHost)return;
  const o={...(liveOverall||{}),...(honours?.overall||{})};trophyItems=[];
  const best=o.bestDivision??S.searchClub?.bestDivision;
  if(best!=null&&best!=='')trophyItems.push({kind:'shield',tier:tone(best),label:String(best),title:'Best division',sub:`Division ${best}`,desc:'Highest division this club has reached according to EA.'});
  for(const h of honours?.honours||[]){const div=h.bestDivision??h.division??h.div;const season=seasonLabel(h);const fin=h.bestFinishGroup??h.finishGroup;trophyItems.push({kind:fin!=null&&Number(fin)===1?'cup':'shield',tier:tone(div),label:div!=null?String(div):'?',title:'Playoff achievement',sub:`${season}${div!=null?` · Div ${div}`:''}${fin!=null?` · Group ${fin}`:''}`,desc:`EA playoff achievement${fin!=null?` · finish group ${fin}`:''}.`})}
  if(n0(o.promotions)>0)trophyItems.push({kind:'medal',tier:'silver',label:`×${n0(o.promotions)}`,title:'Promotions',sub:`${n0(o.promotions)} promotion${n0(o.promotions)===1?'':'s'}`,desc:'Total promotions reported by EA.'});
  hHost.innerHTML=trophyItems.length?trophyItems.map((t,i)=>`<button type="button" class="trophy78 ${t.tier}" data-trophy="h${i}">${trophySvg(t.kind,t.tier,t.label)}<b>${esc(t.title)}</b><small>${esc(t.sub)}</small></button>`).join(''):empty(honours?'EA has not reported club honours yet.':'Loading club honours…');
  const ach=D?achievementState():[];const seenKey=`clubroom78:ach-seen:${clubId()}`;let seen=LS.get(seenKey,null);const unlockedIds=ach.filter(a=>a.unlocked).map(a=>a.id);if(seen===null){seen=unlockedIds;if(D)LS.set(seenKey,seen)}const fresh=new Set(unlockedIds.filter(id=>!seen.includes(id)));if(fresh.size)LS.set(seenKey,[...new Set([...seen,...unlockedIds])]);
  aHost.innerHTML=ach.length&&D?ach.sort((a,b)=>(b.unlocked?1:0)-(a.unlocked?1:0)||(b.value/b.target)-(a.value/a.target)).map(a=>`<button type="button" class="trophy78 ach ${a.unlocked?a.tier:'locked'} ${fresh.has(a.id)?'fresh':''}" data-trophy="a:${a.id}">${fresh.has(a.id)?'<span class="newTag78">NEW</span>':''}<span class="achBadge78">${trophySvg('medal',a.unlocked?a.tier:'locked','')}<span class="achIcon78">${icon(achIcon[a.icon]||'star',18)}</span></span><b>${esc(a.title)}</b>${a.unlocked?`<small>${dFmt(a.unlocked.m.ts)}</small>`:`<span class="achTrack78"><i style="width:${Math.min(100,a.value/a.target*100)}%"></i></span><small>${Math.min(a.value,a.target)}/${a.target}</small>`}</button>`).join(''):empty('Achievements are computed once the Clubroom archive has matches.');
  const cnt=document.getElementById('trophyCount78');if(cnt)cnt.textContent=`${trophyItems.length} honours · ${ach.filter(a=>a.unlocked).length}/${ach.length} achievements`;
  window.__v78ach=ach;
}
function openTrophy(key){const dlg=document.getElementById('trophyDialog78'),body=document.getElementById('trophyDialogBody78');if(!dlg||!body)return;
  if(key.startsWith('h')){const t=trophyItems[+key.slice(1)];if(!t)return;body.innerHTML=`<div class="trophyDetail78 ${t.tier}">${trophySvg(t.kind,t.tier,t.label)}<h3 id="trophyDialogTitle78">${esc(t.title)}</h3><p>${esc(t.sub)}</p><small>${esc(t.desc)}</small></div>`}
  else{const a=(window.__v78ach||[]).find(x=>x.id===key.slice(2));if(!a)return;body.innerHTML=`<div class="trophyDetail78 ${a.unlocked?a.tier:'locked'}"><span class="achBadge78 big">${trophySvg('medal',a.unlocked?a.tier:'locked','')}<span class="achIcon78">${icon(achIcon[a.icon]||'star',26)}</span></span><h3 id="trophyDialogTitle78">${esc(a.title)}</h3><p>${esc(a.desc)}</p>${a.unlocked?`<small>Unlocked ${dFmt(a.unlocked.m.ts)} · vs ${esc(a.unlocked.m.opponent)}</small>${mLink(a.unlocked.m,'Open match')}`:`<span class="achTrack78 wide"><i style="width:${Math.min(100,a.value/a.target*100)}%"></i></span><small>How to unlock: ${esc(a.desc)} Progress ${a.value}/${a.target}.</small>`}</div>`}
  dlg.hidden=false}

/* ================= CLUBROOM PASS ================= */
const Pass={status:{},preview:qs.get('passPreview')==='1',
  active(id=clubId()){return !!id&&(!!this.status[id]?.active||(this.preview&&id===clubId()))},
  async load(ids){ids=[...new Set(ids.filter(Boolean).map(String))].filter(id=>!(id in this.status));if(!ids.length)return;try{const r=await fetchJSON(`/api/pass/status?ids=${ids.join(',')}`,6000);Object.assign(this.status,r.clubs||{})}catch{for(const id of ids)this.status[id]={active:false}}},
  apply(){const on=this.active();document.body.classList.toggle('passActive78',on);const row=document.querySelector('.heroClubCopy61>.kicker');let b=document.getElementById('passHeroBadge78');if(on&&row&&!b){b=document.createElement('span');b.id='passHeroBadge78';b.className='passBadge78';b.textContent='PASS';row.appendChild(b)}if(!on&&b)b.remove();
    const buy=document.getElementById('passBuy85');if(buy){buy.href='/pass/checkout'+(clubId()?'?club='+clubId():'');buy.hidden=on&&!this.preview}
    const st=document.getElementById('passStatus78');if(st){st.textContent=on?(this.preview&&!this.status[clubId()]?.active?'Preview mode – Pass visuals only':'Active for this club'):'Not active for this club';st.classList.toggle('on',on)}
    document.querySelectorAll('[data-saved-club49]').forEach(el=>{const id=el.dataset.savedClub49;const has=el.querySelector('.passBadge78');if(this.active(id)&&!has){const t=document.createElement('span');t.className='passBadge78 small';t.textContent='PASS';(el.querySelector('strong,b')||el).after(t)}else if(!this.active(id)&&has)has.remove()});
    applyGates()}
};
window.ClubroomPass=Pass;
async function decorateSaved(){const ids=[...document.querySelectorAll('[data-saved-club49]')].map(el=>el.dataset.savedClub49);await Pass.load(ids);Pass.apply()}

/* ---------- ad gates (placeholder, off by default) ---------- */
const gateKey=tab=>`clubroom78:unlock:${clubId()}:${tab}`;
function gateOpen(tab){if(!CFG.adGates.enabled||!CFG.adGates.tabs.includes(tab)||Pass.active())return true;const t=LS.get(gateKey(tab),0);return Date.now()-t<CFG.adGates.hours*3600e3}
function applyGates(){document.querySelectorAll('.miscPane78').forEach(p=>{const tab=p.dataset.miscPane,open=gateOpen(tab);p.classList.toggle('gated78',!open);let ov=p.querySelector('.gate78');if(!open&&!ov){ov=document.createElement('div');ov.className='gate78';ov.innerHTML=`<div class="gateCard78">${icon('lock',26)}<h4>Unlock ${esc(p.querySelector('h3')?.textContent||'this section')}</h4><p>Watch a short ad to unlock this section for ${CFG.adGates.hours} hours, or get Clubroom Pass for your whole club.</p><div><button type="button" class="v78Btn" data-gate-ad="${esc(tab)}">${icon('eye',15)} Watch a short ad</button><a class="passCta78 small" href="/pass">Get Clubroom Pass</a></div><small>Ads are a placeholder until the ad provider is approved.</small></div>`;p.appendChild(ov)}if(open&&ov)ov.remove()})}
function playAd(tab,btn){btn.disabled=true;let s=3;btn.textContent=`Ad placeholder… ${s}`;const t=setInterval(()=>{s--;if(s>0)btn.textContent=`Ad placeholder… ${s}`;else{clearInterval(t);LS.set(gateKey(tab),Date.now());applyGates()}},1000)}

/* ---------- misc tab switching ---------- */
function showMiscTab(tab){const btns=document.querySelectorAll('[data-misc-tab]');if(![...btns].some(b=>b.dataset.miscTab===tab))tab='chemistry';btns.forEach(b=>{const on=b.dataset.miscTab===tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false')});document.querySelectorAll('[data-misc-pane]').forEach(p=>{p.hidden=p.dataset.miscPane!==tab});LS.set('clubroom78:miscTab',tab);registerAvatarRoster?.()}

/* ---------- division fallback ---------- */
async function divisionFallback(id,name){const el=document.getElementById('divisionBadge');if(!el||!/^-*$|—/.test(el.textContent.trim()))return;
  try{const r=await fetchJSON(`/api/search?q=${encodeURIComponent(name)}&platform=${encodeURIComponent($('#platform')?.value||'common-gen5')}`,8000);const list=Array.isArray(r)?r:A(r);const hit=list.find(c=>String(c.clubId||c.clubid||c.id)===String(id));const div=hit&&P(hit,['currentDivision','division','divisionNumber'],null);
    if(div!=null&&clubId()===String(id)){el.textContent=String(div);el.dataset.tone=divisionTone61(div);if(currentClubBookmark49){currentClubBookmark49.currentDivision=div;addRecent49({...currentClubBookmark49})}}}catch{}}

/* ---------- render all archive-driven views ---------- */
function renderArchive(){const R=[()=>window.ClubroomV81?.render(),renderRecords,renderStreaks,renderHabits,renderLucky,renderMilestones,renderAwards,renderWrapped,renderCreativity,renderPulse,renderTrophies];for(const f of R){try{f()}catch(e){console.error('[v78]',f.name,e)}}registerAvatarRoster?.();applyGates()}
window.ClubroomV78={renderArchive,prep:h=>prep(h),data:()=>D,showMiscTab,revealAward,CFG,sharePng,icon,av:(p,v)=>av(p,v),pLink:p=>pLink(p),mLink:(m,t)=>mLink(m,t),watermark:()=>watermark()};

/* ---------- hooks ---------- */
const prevRenderFun=renderFun;renderFun=function(h,a){prevRenderFun.apply(this,arguments);try{lastH=h;D=prep(h);renderArchive()}catch(e){console.error('[v78] archive',e)}};
const prevRender=render;render=function(id,d,searchClub){const out=prevRender.apply(this,arguments);try{D=null;honours=null;liveOverall=(d?.overall&&(d.overall[id]||A(d.overall)[0]))||{};renderArchive();loadHonours();divisionFallback(id,S.club?.name||'');Pass.load([String(id)]).then(()=>Pass.apply());const keep=LS.get('clubroom78:miscTab','chemistry');showMiscTab(keep)}catch(e){console.error('[v78] live',e)}return out};
if(typeof renderSavedClubs49==='function'){const prevSaved=renderSavedClubs49;renderSavedClubs49=function(){const out=prevSaved.apply(this,arguments);decorateSaved();return out}}

document.addEventListener('click',e=>{
  const mt=e.target.closest('[data-misc-tab]');if(mt){showMiscTab(mt.dataset.miscTab);return}
  const ap=e.target.closest('[data-award-period]');if(ap){awardPeriod=ap.dataset.awardPeriod;document.querySelectorAll('[data-award-period]').forEach(b=>b.classList.toggle('active',b===ap));renderAwards();return}
  const sh=e.target.closest('[data-award-share]');if(sh){const card=sh.closest('.award78');if(card)sharePng(card,`clubroom-award-${sh.dataset.awardShare}.png`,800,1000);return}
  const aw=e.target.closest('.award78.back');if(aw){revealAward(aw.dataset.award);return}
  if(e.target.closest('#awardsRevealAll78')){const ids=[...document.querySelectorAll('#miscAwards78 .award78.back')].map(x=>x.dataset.award);(async()=>{for(const id of ids){revealAward(id);await new Promise(r=>setTimeout(r,280))}})();return}
  const ws=e.target.closest('[data-wrap-share]');if(ws){const card=ws.parentElement.querySelector('.wrap78');if(card)sharePng(card,`clubroom-wrapped-${wrappedMonth}-${+ws.dataset.wrapShare+1}.png`,1080,1920);return}
  if(e.target.closest('#wrappedDownload78')){(async()=>{for(const [i,c] of [...document.querySelectorAll('#miscWrapped78 .wrap78')].entries()){await sharePng(c,`clubroom-wrapped-${wrappedMonth}-${i+1}.png`,1080,1920)}})();return}
  const tr=e.target.closest('[data-trophy]');if(tr){openTrophy(tr.dataset.trophy);return}
  if(e.target.closest('[data-v78-close]')||e.target.id==='trophyDialog78'){document.getElementById('trophyDialog78').hidden=true;return}
  const g=e.target.closest('[data-gate-ad]');if(g){playAd(g.dataset.gateAd,g);return}
});
document.addEventListener('change',e=>{if(e.target.id==='wrappedMonth78'){wrappedMonth=e.target.value;renderWrapped()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const d=document.getElementById('trophyDialog78');if(d)d.hidden=true}});
hydrateIcons();decorateSaved();
/* v79: results directly under search; hide promo + features while results are shown */
(function(){const r=document.getElementById('results');if(!r)return;const sync=()=>{const has=!!r.textContent.trim()||!!r.children.length;document.body.classList.toggle('searching78',has);if(has&&!r.dataset.scrolled78){r.dataset.scrolled78='1';const top=r.getBoundingClientRect().top;if(top>window.innerHeight*.75)r.scrollIntoView({behavior:'smooth',block:'start'})}if(!has)delete r.dataset.scrolled78};new MutationObserver(sync).observe(r,{childList:true,subtree:true,characterData:true});sync();
 const q=document.getElementById('q');q?.addEventListener('input',()=>{if(!q.value.trim()){r.innerHTML='';sync()}})})();
})();
