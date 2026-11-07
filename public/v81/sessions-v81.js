/* CLUBROOM v81 · Live sessions, session detail, richer match detail, xG/xA detection.
   Built only from the Clubroom archive (S.history) and EA match payloads. Nothing is estimated or invented:
   xG/xA appear only when EA actually sends such a field. Classic script, loaded after v78. */
(function(){
'use strict';
const V=window.ClubroomV78;if(!V)return;
const esc=v=>escapeHtml(String(v??''));
const n0=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const fx=(v,d=1)=>v!=null&&Number.isFinite(Number(v))?Number(v).toFixed(d):'--';
const pct=(a,b)=>b?a/b*100:null;
const pctS=v=>v==null?'--':Math.round(v)+'%';
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const icon=(n,s)=>V.icon(n,s);
const CFG={liveMinutes:45,pollMs:120000,minSessionPlayerMatches:2};
window.CLUBROOM_SESSIONS=CFG;
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};

/* ---------- xG / xA detection (only real EA fields) ---------- */
const XG_KEYS=/^(xg|xgoals|expectedgoals|expected_goals|xgtotal)$/i,XA_KEYS=/^(xa|xassists|expectedassists|expected_assists)$/i;
window.eaExpected81=function(raw,kind){if(!raw||typeof raw!=='object')return null;const re=kind==='xa'?XA_KEYS:XG_KEYS;for(const [k,v] of Object.entries(raw)){if(re.test(k)){const n=Number(v);if(Number.isFinite(n))return n}}return null};

/* ---------- helpers on archive data ---------- */
const D=()=>V.data();
function oppRows(m){const raw=m.raw;if(!raw)return [];const our=String(S.club?.id||'');const src=raw.players||raw.playerStats||{};const out=[];for(const [cid,club] of Object.entries(src||{})){if(String(cid)===our)continue;for(const [pid,p] of Object.entries(club||{}))out.push(matchPlayer({...p,_playerId:pid,_clubId:cid}))}return out}
function teamAgg(rows,isArchive){let shots=0,goals=0,pm=0,pa=0,tm=0,ta=0,saves=0,r=[];for(const x of rows){shots+=n0(isArchive?x.shots:x.shots);goals+=n0(x.goals);pm+=n0(isArchive?x.passes_made:x.passes);pa+=n0(isArchive?x.pass_attempts:x.passAttempts);tm+=n0(isArchive?x.tackles_made:x.tackles);ta+=n0(isArchive?x.tackle_attempts:x.tackleAttempts);saves+=n0(x.saves);const rt=n0(x.rating);if(rt>0)r.push(rt)}return {shots,goals,pm,pa,tm,ta,saves,ratings:r}}
function careerAvg(pid){const p=D()?.players.get(String(pid));if(!p)return null;return avg(p.rows.map(r=>r.rating).filter(x=>x>0))}
window.v81VsAvgCell=function(pid,rating){const base=careerAvg(pid);if(!base||!rating)return '<td class="vsAvg81">--</td>';const d=rating-base;return `<td class="vsAvg81 ${d>=0?'up':'down'}" title="Archive average ${fx(base,2)}">${d>=0?'+':''}${fx(d,1)}</td>`};
const durS=min=>{min=Math.max(0,Math.round(min));const h=Math.floor(min/60),m=min%60;return h?`${h}h ${m}m`:`${m}m`};
const tFmt=d=>d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
const dFmt=d=>d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
const isLive=s=>s&&(Date.now()-s.end.getTime())<=CFG.liveMinutes*60000;
function sessionStats(s){const ms=s.matches,ids=new Set(ms.map(m=>m.id)),rows=D().rows.filter(r=>ids.has(r.m.id));
  const w=ms.filter(m=>m.result==='W').length,d=ms.filter(m=>m.result==='D').length,l=ms.length-w-d,gf=ms.reduce((a,m)=>a+m.og,0),ga=ms.reduce((a,m)=>a+m.tg,0),cs=ms.filter(m=>m.tg===0).length;
  const ours=teamAgg(rows,true),opp=teamAgg(ms.flatMap(oppRows),false),oppKnown=ms.some(m=>m.raw);
  const players=new Map();for(const r of rows){let x=players.get(r.pid);if(!x){x={p:D().players.get(r.pid),rows:[]};players.set(r.pid,x)}x.rows.push(r)}
  const pl=[...players.values()].map(x=>{const R=x.rows,s=k=>R.reduce((a,r)=>a+n0(r[k]),0),rt=R.map(r=>r.rating).filter(v=>v>0),base=careerAvg(x.p?.id);const g=s('goals'),a=s('assists'),sh=s('shots'),pm=s('passes_made'),pa=s('pass_attempts'),tm=s('tackles_made'),ta=s('tackle_attempts');
    return {p:x.p,n:R.length,rating:avg(rt),base,delta:avg(rt)!=null&&base!=null?avg(rt)-base:null,goals:g,assists:a,ga:g+a,shots:sh,conv:pct(g,sh),passPct:pct(pm,pa),passes:pm/R.length,tackles:tm/R.length,tacklePct:pct(tm,ta),interceptions:s('interceptions'),dribbles:s('dribbles'),saves:s('saves'),motm:s('motm'),secondAssists:s('second_assists'),through:s('through_balls'),gk:/goal|gk/i.test(x.p?.position||''),ratings:R.map(r=>({mid:r.m.id,v:r.rating}))}}).sort((a,b)=>(b.rating||0)-(a.rating||0));
  const minutes=(s.end-s.start)/60000+15;
  return {ms,rows,w,d,l,gf,ga,cs,ours,opp,oppKnown,players:pl,minutes,ppm:ms.length?(w*3+d)/ms.length:0}}

/* ---------- state ---------- */
let filterType=LS.get('clubroom81:sType','all'),filterPeriod=LS.get('clubroom81:sPeriod','all'),selected=null,metric=LS.get('clubroom81:sMetric','rating');
function filteredSessions(){const all=(D()?.sessions||[]).slice().reverse();const now=new Date();const weekStart=(()=>{const x=new Date(now);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x})(),monthStart=new Date(now.getFullYear(),now.getMonth(),1);
  return all.map(s=>({...s,matches:s.matches.filter(m=>filterType==='all'||(filterType==='league'?/league/i.test(m.type):/playoff|cup/i.test(m.type)))})).filter(s=>s.matches.length&&(filterPeriod==='all'||(filterPeriod==='week'?s.end>=weekStart:s.end>=monthStart)))}

/* ---------- live session card (Overview) + polling ---------- */
function renderLiveCard(){const host=document.getElementById('liveSession81');if(!host)return;const ss=D()?.sessions||[];const s=ss[ss.length-1];
  if(!s||!isLive(s)){host.innerHTML='';host.hidden=true;return}
  const x=sessionStats(s),mvp=x.players.filter(p=>p.n>=Math.min(2,x.ms.length))[0],ago=Math.round((Date.now()-s.end)/60000);
  host.hidden=false;host.innerHTML=`<div class="liveCard81"><div class="liveHead81"><span class="livePill81"><i></i>LIVE SESSION</span><small>started ${tFmt(s.start)} · last match ${ago<1?'just now':ago+' min ago'}</small></div>
   <div class="liveBody81"><div class="liveRec81"><b class="w">${x.w}</b><i>-</i><b class="d">${x.d}</b><i>-</i><b class="l">${x.l}</b><small>${x.ms.length} matches · ${durS(x.minutes)}</small></div>
   <div class="liveStat81"><b>${x.gf-x.ga>=0?'+':''}${x.gf-x.ga}</b><small>Goal diff · ${x.gf}:${x.ga}</small></div>
   <div class="liveForm81">${x.ms.map(m=>`<i class="${m.result.toLowerCase()}" title="${m.og}–${m.tg} vs ${esc(m.opponent)}"></i>`).join('')}</div>
   ${mvp?`<div class="liveMvp81">${V.av(mvp.p,'mini')}<span><small>MVP so far</small><b>${esc(mvp.p?.name)}</b><em>${fx(mvp.rating,1)} avg · ${mvp.ga} G+A</em></span></div>`:''}</div>
   <button type="button" class="v78Btn liveOpen81" data-open-session81="${s.start.getTime()}">Open live session ›</button></div>`;
  ensurePolling(true)}
let pollTimer=null;
function ensurePolling(on){if(on&&!pollTimer){pollTimer=setInterval(pollLive,CFG.pollMs)}if(!on&&pollTimer){clearInterval(pollTimer);pollTimer=null}}
async function pollLive(){const ss=D()?.sessions||[],s=ss[ss.length-1];if(!s||!isLive(s)){ensurePolling(false);renderLiveCard();return}if(document.hidden||!S.club?.id)return;
  try{await fetch(`/api/live-refresh/${encodeURIComponent(S.club.id)}?platform=${encodeURIComponent(document.getElementById('platform')?.value||'common-gen5')}`,{method:'POST'});await loadHistory(S.club.id)}catch{}}
setInterval(()=>{if(document.getElementById('liveSession81')&&!document.getElementById('liveSession81').hidden)renderLiveCard()},60000);

/* ---------- sessions page ---------- */
function toolbar(){const f=document.getElementById('sessionFilters42');if(!f||f.dataset.v81)return;f.dataset.v81='1';
  f.innerHTML=`<div class="v78Segment" role="tablist" aria-label="Match type">${[['all','All'],['league','League'],['playoff','Playoff']].map(([k,l])=>`<button type="button" data-s81-type="${k}" class="${filterType===k?'active':''}">${l}</button>`).join('')}</div><div class="v78Segment" role="tablist" aria-label="Period">${[['all','All time'],['month','This month'],['week','This week']].map(([k,l])=>`<button type="button" data-s81-period="${k}" class="${filterPeriod===k?'active':''}">${l}</button>`).join('')}</div>`}
function renderSessions(){toolbar();const list=document.getElementById('sessionList42'),sum=document.getElementById('sessionSummary42'),live=document.getElementById('sessionLive42'),cnt=document.getElementById('sessionArchiveCount43'),det=document.getElementById('sessionDetail43');if(!list||!det)return;
  if(!D()||!D().matches.length){list.innerHTML='<div class="v78Empty">Sessions appear once the Clubroom archive has matches.</div>';return}
  const ss=filteredSessions(),all=D().sessions,cur=all[all.length-1];
  if(live){live.classList.toggle('active',isLive(cur));live.textContent=isLive(cur)?`● LIVE · ${cur.matches.length} matches · ${durS((cur.end-cur.start)/60000+15)}`:'NO LIVE SESSION'}
  if(cnt)cnt.textContent=`${ss.length} session${ss.length===1?'':'s'}`;
  const tot=ss.flatMap(s=>s.matches),w=tot.filter(m=>m.result==='W').length,gd=tot.reduce((a,m)=>a+m.og-m.tg,0);
  if(sum)sum.innerHTML=`<div><small>SESSIONS</small><b>${ss.length}</b></div><div><small>MATCHES</small><b>${tot.length}</b></div><div><small>WIN RATE</small><b>${tot.length?Math.round(w/tot.length*100):0}%</b></div><div><small>GOAL DIFF</small><b>${gd>=0?'+':''}${gd}</b></div>`;
  if(!ss.some(s=>s.start.getTime()===selected))selected=ss[0]?.start.getTime()??null;
  list.innerHTML=ss.length?ss.map(s=>{const w=s.matches.filter(m=>m.result==='W').length,d=s.matches.filter(m=>m.result==='D').length,l=s.matches.length-w-d,lv=isLive(D().sessions.find(x=>x.start.getTime()===s.start.getTime()));return `<button type="button" class="sCard81 ${s.start.getTime()===selected?'selected':''} ${lv?'live':''}" data-open-session81="${s.start.getTime()}"><div><b>${dFmt(s.start)}</b><small>${tFmt(s.start)} – ${tFmt(s.end)}${lv?' · <em>LIVE</em>':''}</small></div><div class="sCardRec81"><span class="w">${w}</span>-<span class="d">${d}</span>-<span class="l">${l}</span></div><div class="sCardForm81">${s.matches.map(m=>`<i class="${m.result.toLowerCase()}"></i>`).join('')}</div></button>`}).join(''):'<div class="v78Empty">No sessions for this filter.</div>';
  const s=ss.find(x=>x.start.getTime()===selected);det.innerHTML=s?detailHtml(s):'<div class="v78Empty">Select a session.</div>';registerAvatarRoster?.()}

const METRICS=[['rating','Rating',p=>p.rating,v=>fx(v,1)],['ga','G+A',p=>p.ga,v=>String(v)],['goals','Goals / match',p=>p.goals/p.n,v=>fx(v,2)],['assists','Assists',p=>p.assists,v=>String(v)],['shots','Shots',p=>p.shots,v=>String(v)],['conv','Shot conv.',p=>p.conv,pctS],['passPct','Pass %',p=>p.passPct,pctS],['passes','Passes / match',p=>p.passes,v=>fx(v,1)],['tackles','Tackles / match',p=>p.tackles,v=>fx(v,1)],['tacklePct','Tackle %',p=>p.tacklePct,pctS],['interceptions','Interceptions',p=>p.interceptions,v=>String(v)],['dribbles','Dribbles',p=>p.dribbles,v=>String(v)],['secondAssists','2nd assists',p=>p.secondAssists,v=>String(v)],['saves','Saves',p=>p.saves,v=>String(v)]];
const AWARDS=[{id:'mvp',t:'MVP of the night',ic:'crown',v:p=>p.rating,f:v=>fx(v,2),u:'avg rating'},{id:'sniper',t:'Sniper',ic:'target',min:p=>p.shots>=3,v:p=>p.conv,f:pctS,u:'shot conversion'},{id:'engine',t:'Engine',ic:'bolt',v:p=>p.passes+p.tackles*2,f:v=>fx(v,1),u:'passes + 2×tackles / match'},{id:'creator',t:'Creator',ic:'compass',v:p=>p.assists*3+p.secondAssists+p.through/3,f:v=>fx(v,1),u:'creation index'},{id:'wall',t:'The Wall',ic:'shield',v:p=>p.tackles+p.interceptions/p.n+p.saves/p.n,f:v=>fx(v,1),u:'defensive actions / match'},{id:'backpack',t:'Backpack of the night',ic:'backpack',v:p=>-(p.rating||10),f:v=>fx(-v,2),u:'lowest avg rating'}];
function chart(s,x){const ms=s.matches,W=640,H=220,pad=34,n=ms.length;if(n<2)return '<div class="v78Empty">The rating chart needs at least 2 matches.</div>';const step=(W-pad*2)/(n-1),y=v=>H-pad-(Math.max(5,Math.min(10,v))-5)/5*(H-pad*2);
  const col=['#5eead4','#f8d778','#f472b6','#7cc8ff','#a78bfa','#fb923c'];const pl=x.players.slice(0,6);
  const lines=pl.map((p,i)=>{const pts=ms.map((m,j)=>{const r=p.ratings.find(q=>q.mid===m.id);return r&&r.v>0?[pad+j*step,y(r.v),r.v]:null});const seg=pts.filter(Boolean);return `<polyline points="${seg.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')}" style="stroke:${col[i]}"/>${seg.map(q=>`<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="3.5" style="fill:${col[i]}"><title>${esc(p.p?.name)} ${fx(q[2],1)}</title></circle>`).join('')}`}).join('');
  const team=ms.map((m,j)=>{const r=x.rows.filter(q=>q.m.id===m.id).map(q=>q.rating).filter(v=>v>0);return r.length?[pad+j*step,y(avg(r))]:null}).filter(Boolean);
  const grid=[5,6,7,8,9,10].map(v=>`<line x1="${pad}" x2="${W-pad}" y1="${y(v)}" y2="${y(v)}"/><text x="6" y="${y(v)+4}">${v}</text>`).join('');
  const xl=ms.map((m,j)=>`<text class="xl" x="${pad+j*step}" y="${H-8}" text-anchor="middle">${m.result}</text>`).join('');
  return `<div class="sChart81"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Player ratings across the session"><g class="grid">${grid}</g><polyline class="team" points="${team.map(q=>q[0].toFixed(1)+','+q[1].toFixed(1)).join(' ')}"/>${lines}${xl}</svg><div class="sLegend81"><span class="team">Team avg</span>${pl.map((p,i)=>`<span style="--c:${col[i]}">${esc(p.p?.name)}</span>`).join('')}</div></div>`}
function fatigue(s){const all=D().matches,by=k=>all.filter(m=>m.sessionIndex===k||(k===5&&m.sessionIndex>=5));const wr=l=>l.length?Math.round(l.filter(m=>m.result==='W').length/l.length*100):null;
  const early=s.matches.slice(0,3),late=s.matches.slice(3);const allEarly=all.filter(m=>m.sessionIndex<=3),allLate=all.filter(m=>m.sessionIndex>3);
  const pts=l=>l.length?(l.reduce((a,m)=>a+(m.result==='W'?3:m.result==='D'?1:0),0)/l.length):null;
  return `<div class="fatigue81"><div><small>THIS SESSION</small><p>Matches 1–3: <b>${pctS(wr(early))}</b> wins${late.length?` · matches 4+: <b>${pctS(wr(late))}</b>`:''}</p></div><div><small>ALL SESSIONS</small><p>Matches 1–3: <b>${pctS(wr(allEarly))}</b> · matches 4+: <b>${pctS(wr(allLate))}</b>${allLate.length>=5&&allEarly.length>=5?` <em class="${pts(allLate)<pts(allEarly)?'down':'up'}">${pts(allLate)<pts(allEarly)?'you fade late':'you get stronger late'}</em>`:''}</p></div><div class="fatigueBars81">${[1,2,3,4,5].map(k=>{const l=by(k),v=wr(l);return `<span><i style="height:${v??0}%"></i><b>${v==null?'--':v+'%'}</b><small>#${k}${k===5?'+':''}</small></span>`}).join('')}</div></div>`}
function awardsHtml(s,x){const key=`clubroom81:sAwards:${S.club?.id}:${s.start.getTime()}`,done=new Set(LS.get(key,[]));const elig=x.players.filter(p=>p.n>=Math.min(CFG.minSessionPlayerMatches,x.ms.length));
  return AWARDS.map(a=>{const c=elig.filter(p=>!a.min||a.min(p)).map(p=>({p,v:a.v(p)})).filter(q=>q.v!=null&&Number.isFinite(q.v)).sort((q,r)=>r.v-q.v)[0];
    if(!done.has(a.id))return `<button type="button" class="sAward81 back" data-s81-award="${a.id}" data-s81-key="${esc(key)}">${icon(a.ic,22)}<b>${esc(a.t)}</b><small>Tap to reveal</small></button>`;
    return c?`<div class="sAward81 front">${icon(a.ic,16)}<b>${esc(a.t)}</b>${V.av(c.p.p,'mini')}<strong>${esc(c.p.p?.name)}</strong><em>${a.f(c.v)} <small>${esc(a.u)}</small></em></div>`:`<div class="sAward81 front none">${icon(a.ic,16)}<b>${esc(a.t)}</b><small>No winner</small></div>`}).join('')}
function matchCards(s,x){return s.matches.map((m,i)=>{const rs=x.rows.filter(r=>r.m.id===m.id).sort((a,b)=>b.rating-a.rating),best=rs[0],motm=rs.find(r=>n0(r.motm)>0);const tags=[];if(rs.some(r=>n0(r.goals)>=3))tags.push('Hat-trick');if(m.tg===0)tags.push('Clean sheet');if(m.og+m.tg>=6)tags.push('Thriller');if(m.og-m.tg>=4)tags.push('Statement win');if(rs.some(r=>n0(r.red_cards)>0))tags.push('Red card');
  return `<button type="button" class="sMatch81 ${m.result.toLowerCase()}" data-match-open73="${esc(m.id)}"><div class="sMatchTop81"><span>#${i+1} · ${tFmt(m.ts)}</span><span class="chip">${/playoff|cup/i.test(m.type)?'Playoff':'League'}</span></div><div class="sMatchScore81"><b>${m.og}</b><i>–</i><b>${m.tg}</b></div><div class="sMatchOpp81">vs ${esc(m.opponent)}</div>${best?`<div class="sMatchBest81">${V.av(best.m&&D().players.get(best.pid),'mini')}<span>${esc(D().players.get(best.pid)?.name)}</span><em>${fx(best.rating,1)}</em></div>`:''}<div class="sMatchTags81">${motm?`<span class="gold">MOTM ${esc(D().players.get(motm.pid)?.name)}</span>`:''}${tags.map(t=>`<span>${t}</span>`).join('')}</div></button>`}).join('')}
function detailHtml(s){const x=sessionStats(s),full=D().sessions.find(q=>q.start.getTime()===s.start.getTime()),lv=isLive(full);const m=METRICS.find(q=>q[0]===metric)||METRICS[0];
  const lb=x.players.filter(p=>m[0]!=='saves'||p.gk||p.saves>0).map(p=>({p,v:m[2](p)})).filter(q=>q.v!=null&&Number.isFinite(q.v)).sort((a,b)=>b.v-a.v),mx=Math.max(...lb.map(q=>Math.abs(q.v)),0.0001);
  const cmp=(label,a,b,fmt=pctS)=>`<div class="sCmp81"><small>${label}</small><b>${fmt(a)}</b>${x.oppKnown?`<em>Opp ${fmt(b)}</em>`:''}</div>`;
  return `<article class="sDetail81" id="sessionCard81">
   <header class="sHead81"><div><span class="kicker">SESSION DETAIL</span><h3>${s.start.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}</h3><p>${tFmt(s.start)} – ${tFmt(s.end)} · ${durS(x.minutes)}</p></div><div class="sHeadActions81">${lv?'<span class="livePill81"><i></i>LIVE</span>':'<span class="donePill81">Completed</span>'}<button type="button" class="v78Btn ghost" data-share-session81>${icon('share',14)} Share</button></div></header>
   <div class="sMetrics81"><div><small>RECORD</small><b><span class="w">${x.w}</span>-<span class="d">${x.d}</span>-<span class="l">${x.l}</span></b><em>${x.ms.length} matches · ${fx(x.ppm,2)} pts/m</em></div><div><small>GOAL DIFF</small><b>${x.gf-x.ga>=0?'+':''}${x.gf-x.ga}</b><em>${x.gf} scored · ${x.ga} conceded</em></div>
    ${cmp('PASS ACCURACY',pct(x.ours.pm,x.ours.pa),pct(x.opp.pm,x.opp.pa))}${cmp('SHOT CONVERSION',pct(x.gf,x.ours.shots),pct(x.ga,x.opp.shots))}<div><small>CLEAN SHEETS</small><b>${x.cs}</b><em>across session</em></div><div><small>TEAM RATING</small><b>${fx(avg(x.ours.ratings),2)}</b>${x.oppKnown?`<em>Opp ${fx(avg(x.opp.ratings),2)}</em>`:''}</div></div>
   <section class="v78Panel"><div class="v78PanelHead">${icon('calendar',16)}<span class="label">MATCHES IN THIS SESSION</span><small>tap a match for detail</small></div><div class="sMatches81">${matchCards(s,x)}</div></section>
   <div class="v78Two">
    <section class="v78Panel"><div class="v78PanelHead">${icon('star',16)}<span class="label">PLAYERS</span><small>vs own archive average</small></div>${x.players.map(p=>`<div class="sPlayer81">${V.pLink(p.p)}<span class="sPRt81">${fx(p.rating,1)}</span>${p.delta!=null?`<span class="sPDelta81 ${p.delta>=0?'up':'down'}">${p.delta>=0?'+':''}${fx(p.delta,1)}</span>`:'<span></span>'}<small>${p.n} m · ${p.goals} G · ${p.assists} A${p.gk?` · ${p.saves} saves`:''}</small></div>`).join('')}</section>
    <section class="v78Panel"><div class="v78PanelHead">${icon('trophy',16)}<span class="label">SESSION LEADERBOARD</span></div><div class="sChips81">${METRICS.map(q=>`<button type="button" data-s81-metric="${q[0]}" class="${q[0]===m[0]?'active':''}">${q[1]}</button>`).join('')}</div>${lb.length?lb.map((q,i)=>`<div class="sLb81 ${i===0?'gold':''}"><span>#${i+1}</span>${V.pLink(q.p.p)}<span class="sLbTrack81"><i style="width:${Math.max(4,Math.abs(q.v)/mx*100)}%"></i></span><b>${m[3](q.v)}</b></div>`).join(''):'<div class="v78Empty">No data for this metric.</div>'}</section>
   </div>
   <section class="v78Panel"><div class="v78PanelHead">${icon('wave',16)}<span class="label">RATINGS THROUGH THE SESSION</span><small>top 6 players · dashed = team average</small></div>${chart(s,x)}</section>
   <div class="v78Two"><section class="v78Panel"><div class="v78PanelHead">${icon('crown',16)}<span class="label">SESSION AWARDS</span><small>min. ${CFG.minSessionPlayerMatches} matches</small></div><div class="sAwards81">${awardsHtml(s,x)}</div></section>
   <section class="v78Panel"><div class="v78PanelHead">${icon('clock',16)}<span class="label">FATIGUE CHECK</span><small>win rate by match order</small></div>${fatigue(s)}</section></div>
   ${V.watermark()}</article>`}

/* ---------- richer match detail (hooks used by app.js renderTab73) ---------- */
function matchContext(d){const data=D();if(!data)return null;const id=String(d.key||d.archive?.match_id||d.live?.id||'');const m=data.mById.get(id)||data.matches.find(x=>Math.abs(x.ts-(d.date||0))<60000&&x.og===n0(d.ourGoals)&&x.tg===n0(d.oppGoals));if(!m||!m.session)return null;const s=m.session,i=s.matches.indexOf(m);let streak=0;for(let k=i;k>=0&&s.matches[k].result==='W';k--)streak++;return {m,s,i,prev:s.matches[i-1],next:s.matches[i+1],streak}}
window.v81MatchTop=function(d){try{const ours=d.ours||[],opp=d.opp||[];const tags=[];if(ours.some(p=>n0(p.goals)>=3))tags.push(['gold','Hat-trick']);if(n0(d.oppGoals)===0)tags.push(['','Clean sheet']);if(n0(d.ourGoals)+n0(d.oppGoals)>=6)tags.push(['','Thriller']);if(n0(d.ourGoals)-n0(d.oppGoals)>=4)tags.push(['','Statement win']);if([...ours,...opp].some(p=>n0(p.reds)>0))tags.push(['red','Red card']);
  const ctx=matchContext(d);const bestO=ours.slice().sort((a,b)=>n0(b.rating)-n0(a.rating))[0],bestT=opp.slice().sort((a,b)=>n0(b.rating)-n0(a.rating))[0];
  const side=(p,isOurs)=>{if(!p)return '<div class="duelSide81 empty">No player data</div>';const base=isOurs?careerAvg(p.id):null;return `<div class="duelSide81 ${isOurs?'ours':'opp'}">${isOurs?avatarMarkup({id:p.id,name:p.name,position:p.pos},'bust'):`<span class="duelOppMark81">${icon('shield',30)}</span>`}<b>${esc(p.name)}</b><small>${esc(p.pos||'')}${isOurs?'':' · '+esc(d.opponent)}</small><strong>${fx(p.rating,1)}</strong>${base?`<em class="${p.rating-base>=0?'up':'down'}">${p.rating-base>=0?'+':''}${fx(p.rating-base,1)} vs avg</em>`:''}<p>${n0(p.goals)} G · ${n0(p.assists)} A · ${n0(p.shots)} shots${p.xg!=null?` · ${fx(p.xg,2)} xG`:''}</p></div>`};
  return `${tags.length||ctx?`<div class="mTags81">${tags.map(t=>`<span class="${t[0]}">${t[1]}</span>`).join('')}${ctx?`<span class="ctx">Match ${ctx.i+1} of ${ctx.s.matches.length} in session${ctx.streak>=2?` · ${ctx.streak} wins in a row`:''}</span>`:''}</div>`:''}
   ${bestO||bestT?`<section class="duel81"><span class="label">BEST ON THE PITCH</span><div class="duelRow81">${side(bestO,true)}<span class="duelVs81">VS</span>${side(bestT,false)}</div></section>`:''}`}catch(e){console.warn('[v81 match top]',e);return ''}};
window.v81MatchBottom=function(d){try{const gk=(rows,isOurs)=>{const g=(rows||[]).filter(p=>/goal|gk/i.test(String(p.pos||''))||n0(p.saves)>0).sort((a,b)=>n0(b.saves)-n0(a.saves))[0];if(!g)return `<div class="gk81 empty">No goalkeeper data</div>`;return `<div class="gk81"><span class="label">${isOurs?esc(S.club?.name||'Our GK'):esc(d.opponent)}</span><b>${esc(g.name)}</b><div><span><strong>${n0(g.saves)}</strong><small>saves</small></span><span><strong>${isOurs?n0(d.oppGoals):n0(d.ourGoals)}</strong><small>conceded</small></span><span><strong>${fx(g.rating,1)}</strong><small>rating</small></span><span><strong>${(isOurs?n0(d.oppGoals):n0(d.ourGoals))===0?'Yes':'No'}</strong><small>clean sheet</small></span></div></div>`};
  const ctx=matchContext(d);const nav=ctx?`<div class="mNav81">${ctx.prev?`<button type="button" class="v78Btn ghost" data-match-open73="${esc(ctx.prev.id)}">‹ Previous: ${ctx.prev.og}–${ctx.prev.tg} vs ${esc(ctx.prev.opponent)}</button>`:'<span></span>'}<button type="button" class="v78Btn ghost" data-open-session81="${ctx.s.start.getTime()}">Open session</button>${ctx.next?`<button type="button" class="v78Btn ghost" data-match-open73="${esc(ctx.next.id)}">Next: ${ctx.next.og}–${ctx.next.tg} vs ${esc(ctx.next.opponent)} ›</button>`:'<span></span>'}</div>`:'';
  const xgNote=[...(d.ours||[]),...(d.opp||[])].some(p=>p.xg!=null)?'':'<p class="v78Note">xG / xA are shown only when EA includes them in the match data. This match has none.</p>';
  return `<section class="gkRow81"><span class="label">GOALKEEPERS</span><div class="v78Two">${gk(d.ours,true)}${gk(d.opp,false)}</div></section><div class="mActions81"><button type="button" class="v78Btn" data-share-match81>${icon('share',14)} Share match</button></div>${nav}${xgNote}`}catch(e){console.warn('[v81 match bottom]',e);return ''}};

/* ---------- events ---------- */
function openSession(ts){selected=Number(ts);if(typeof openTab==='function')openTab('sessions',true);filterType='all';filterPeriod='all';renderSessions();document.getElementById('sessionDetail43')?.scrollIntoView({behavior:'smooth',block:'start'})}
document.addEventListener('click',e=>{
  const o=e.target.closest('[data-open-session81]');if(o){e.preventDefault();if(document.body.classList.contains('matchRoute73')){history.back();setTimeout(()=>openSession(o.dataset.openSession81),60)}else openSession(o.dataset.openSession81);return}
  const t=e.target.closest('[data-s81-type]');if(t){filterType=t.dataset.s81Type;LS.set('clubroom81:sType',filterType);document.querySelectorAll('[data-s81-type]').forEach(b=>b.classList.toggle('active',b===t));selected=null;renderSessions();return}
  const p=e.target.closest('[data-s81-period]');if(p){filterPeriod=p.dataset.s81Period;LS.set('clubroom81:sPeriod',filterPeriod);document.querySelectorAll('[data-s81-period]').forEach(b=>b.classList.toggle('active',b===p));selected=null;renderSessions();return}
  const mm=e.target.closest('[data-s81-metric]');if(mm){metric=mm.dataset.s81Metric;LS.set('clubroom81:sMetric',metric);renderSessions();return}
  const a=e.target.closest('[data-s81-award]');if(a){const k=a.dataset.s81Key,set=new Set(LS.get(k,[]));set.add(a.dataset.s81Award);LS.set(k,[...set]);renderSessions();return}
  if(e.target.closest('[data-share-session81]')){const el=document.getElementById('sessionCard81');if(el)V.sharePng(el,`clubroom-session-${selected}.png`,1200,Math.max(1400,Math.round(el.scrollHeight*1200/el.clientWidth)));return}
  if(e.target.closest('[data-share-match81]')){const el=document.getElementById('matchScoreboard73');if(el)V.sharePng(el,'clubroom-match.png',1200,630);return}
});

/* ---------- hooks ---------- */
window.v43RenderSessions=function(){renderSessions()};
window.ClubroomV81={render(){renderLiveCard();renderSessions();try{if(document.body.classList.contains('matchRoute73')&&window.matchState73?.current){/* re-render open match with fresh context */}}catch{}},CFG};
})();
