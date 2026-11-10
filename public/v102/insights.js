/* POSTGAME v102 · Analytics: Impact, Development, Fatigue, When we win.
   Everything is computed from archived matches (ClubroomV78.data()) – no estimates, no goal timing. */
(function(){
'use strict';
const V=()=>window.ClubroomV78,D=()=>V()?.data?.();
const N=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const pct=(a,b)=>b?a/b*100:null;
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const cid=()=>String((typeof S!=='undefined'&&S?.club?.id)||'');
const pass=()=>{try{return !!window.ClubroomPass?.active?.()}catch{return false}};
const pl=p=>{try{return V().pLink(p)}catch{return esc(p.name)}};
const av=p=>{try{return V().av(p,'mini')}catch{return''}};
const ml=(m,t)=>{try{return V().mLink(m,t)}catch{return''}};
const dShort=d=>{try{return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}catch{return''}};
const RES={W:'#2dd4bf',D:'#fbbf24',L:'#fb7185'};
const PAL=['#2dd4bf','#f8b84e','#a78bfa','#f472b6','#60a5fa','#34d399','#fb923c','#e879f9'];
const head=(k,t,right='')=>`<div class="ins102Head"><div><span class="k94">${esc(k)}</span><h3>${esc(t)}</h3></div>${right}</div>`;
const empty=t=>`<div class="ins102Empty">${esc(t)}</div>`;
const f1=v=>v==null?'–':Number(v).toFixed(1),f2=v=>v==null?'–':Number(v).toFixed(2),fp=v=>v==null?'–':Math.round(v)+'%';
const pts=m=>m.result==='W'?3:m.result==='D'?1:0;
function team(ms){const n=ms.length;return {n,win:pct(ms.filter(m=>m.result==='W').length,n),gf:n?avg(ms.map(m=>m.og)):null,ga:n?avg(ms.map(m=>m.tg)):null,ppg:n?avg(ms.map(pts)):null}}
const players=d=>[...d.players.values()];

/* =============== IMPACT =============== */
function impactHtml(){const d=D();if(!d?.matches?.length)return empty('No archived matches yet.');
  const ms=d.matches,all=players(d);
  // decisive: a win the team would not have won without this player's goals
  const decisive=[];for(const p of all)for(const r of p.rows){const m=r.m;if(m.result==='W'&&N(r.goals)>0&&N(r.goals)>=m.og-m.tg)decisive.push({p,m,g:N(r.goals),a:N(r.assists)})}
  const decBy=new Map();for(const x of decisive)decBy.set(x.p.id,(decBy.get(x.p.id)||0)+1);
  const decRank=all.map(p=>({p,n:decBy.get(p.id)||0,games:p.rows.length})).filter(x=>x.n).sort((a,b)=>b.n-a.n||a.games-b.games);
  const top=decRank[0];
  const hero=top?`<div class="hero102"><div class="heroAv102">${av(top.p)}</div><div><span class="k94">MR. CLUTCH</span><strong>${esc(top.p.name)}</strong><p>Won <b>${top.n}</b> ${top.n===1?'match':'matches'} for the team – wins that would not have been wins without his goals.</p></div><div class="heroNum102"><b>${top.n}</b><small>decisive wins</small></div></div>`:'';
  const rankList=decRank.length?`<div class="decRank102">${decRank.slice(0,8).map((x,i)=>`<div><span class="pos102">${i+1}</span>${pl(x.p)}<span class="bar102"><i style="width:${x.n/decRank[0].n*100}%"></i></span><b>${x.n}</b></div>`).join('')}</div>`:empty('No decisive wins yet.');
  const moments=decisive.sort((a,b)=>b.m.ts-a.m.ts).slice(0,5).map(x=>`<li><span class="score102 W">${x.m.og}–${x.m.tg}</span><div><b>${esc(x.p.name)}</b> · ${x.g} ${x.g===1?'goal':'goals'}${x.a?` + ${x.a} ${x.a===1?'assist':'assists'}`:''}<small>vs ${esc(x.m.opponent)} · ${dShort(x.m.ts)}</small></div>${ml(x.m,'Match')}</li>`).join('');
  // with / without
  const tAll=team(ms);
  const ww=all.filter(p=>p.rows.length>=5).map(p=>{const ids=new Set(p.rows.map(r=>String(r.m.id)));const w=team(ms.filter(m=>ids.has(m.id))),wo=team(ms.filter(m=>!ids.has(m.id)));return {p,w,wo,d:wo.n>=3?w.ppg-wo.ppg:null}}).sort((a,b)=>(b.d??-9)-(a.d??-9));
  const wwRows=ww.map(x=>`<div class="ww102"><div class="wwName102">${pl(x.p)}<small>${x.w.n} with · ${x.wo.n} without</small></div>
    <div class="wwCell102"><small>Win % with / without</small><div class="wwPair102"><b>${fp(x.w.win)}</b><span>${x.wo.n>=3?fp(x.wo.win):'–'}</span></div></div>
    <div class="wwCell102"><small>Goals / match</small><div class="wwPair102"><b>${f2(x.w.gf)}</b><span>${x.wo.n>=3?f2(x.wo.gf):'–'}</span></div></div>
    <div class="wwDelta102 ${x.d==null?'na':x.d>=0?'up':'down'}">${x.d==null?'<small>too few<br>without</small>':`<b>${x.d>=0?'+':''}${x.d.toFixed(2)}</b><small>points / match</small>`}</div></div>`).join('');
  // goal share
  const totalG=ms.reduce((s,m)=>s+m.og,0);
  const share=(key,label,restLabel)=>{const parts=all.map(p=>({p,v:p.rows.reduce((s,r)=>s+N(r[key]),0)})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);const used=parts.reduce((s,x)=>s+x.v,0),rest=Math.max(0,totalG-used);
    const segs=parts.map((x,i)=>({name:x.p.name,v:x.v,c:PAL[i%PAL.length]}));if(rest)segs.push({name:restLabel,v:rest,c:'#24384f'});
    return `<div class="share102"><div class="shareLab102"><b>${label}</b><small>${totalG} team goals in ${ms.length} archived matches</small></div><div class="shareBar102">${segs.map(s=>`<i style="flex:${s.v};background:${s.c}" title="${esc(s.name)} · ${s.v}"></i>`).join('')}</div>
      <div class="shareLeg102">${segs.map(s=>`<span><i style="background:${s.c}"></i>${esc(s.name)} <b>${fp(pct(s.v,totalG))}</b></span>`).join('')}</div></div>`};
  // close games vs the rest
  const close=all.map(p=>{const c=p.rows.filter(r=>Math.abs(r.m.og-r.m.tg)<=1&&N(r.rating)),o=p.rows.filter(r=>Math.abs(r.m.og-r.m.tg)>1&&N(r.rating));return {p,c:avg(c.map(r=>N(r.rating))),o:avg(o.map(r=>N(r.rating))),nc:c.length,no:o.length}}).filter(x=>x.nc>=3&&x.no>=3).sort((a,b)=>(b.c-b.o)-(a.c-a.o));
  const lo=Math.min(...close.flatMap(x=>[x.c,x.o]),6),hi=Math.max(...close.flatMap(x=>[x.c,x.o]),8),X=v=>((v-lo)/(hi-lo||1)*100).toFixed(1);
  const dumb=close.map(x=>{const up=x.c>=x.o;return `<div class="db102"><div class="dbName102">${pl(x.p)}</div><div class="dbTrack102"><span class="dbLine102 ${up?'up':'down'}" style="left:${X(Math.min(x.c,x.o))}%;width:${Math.abs(X(x.c)-X(x.o))}%"></span><i class="dbO102" style="left:${X(x.o)}%" title="Other matches ${f1(x.o)}"></i><i class="dbC102 ${up?'up':'down'}" style="left:${X(x.c)}%" title="Close matches ${f1(x.c)}"></i></div><div class="dbVal102 ${up?'up':'down'}"><b>${f1(x.c)}</b><small>${up?'+':''}${(x.c-x.o).toFixed(2)}</small></div></div>`}).join('');
  return `${head('TEAM IMPACT','Who carries this team',`<small class="muted102">${ms.length} archived matches</small>`)}
   ${hero}
   <div class="grid102"><section class="box102"><h4>Decisive wins</h4><p class="sub102">Wins that would not have been wins without the player's goals (e.g. 3–2 and he scored, 2–0 and he scored both).</p>${rankList}</section>
   <section class="box102"><h4>Latest decisive moments</h4>${moments?`<ul class="mom102">${moments}</ul>`:empty('None yet.')}</section></div>
   <section class="box102"><h4>With him vs without him</h4><p class="sub102">Team results in archived matches he played vs matches he missed. Team overall: ${fp(tAll.win)} wins · ${f2(tAll.ppg)} points / match.</p>${wwRows||empty('Players need at least 5 archived matches.')}</section>
   <section class="box102"><h4>Share of team goals</h4>${totalG?share('goals','Scorers','Own goals / unknown')+share('assists','Assisters','Unassisted'):empty('No goals yet.')}</section>
   <section class="box102"><h4>Close matches vs the rest</h4><p class="sub102">Average rating in matches decided by one goal or drawn <i class="dbC102 up legend"></i> vs matches with a bigger margin <i class="dbO102 legend"></i>. Sorted by who steps up most.</p>${dumb||empty('Players need 3+ close and 3+ other matches.')}</section>`}

/* =============== DEVELOPMENT =============== */
const DEV=[
 ['rating','Rating',r=>N(r.rating)||null,1,true,'averageRating'],
 ['ga','Goals + assists',r=>N(r.goals)+N(r.assists),2,true,'goalContributionsPerMatch'],
 ['shots','Shots',r=>N(r.shots),1,true,'shotsPerMatch'],
 ['passPct','Pass accuracy',null,0,true,'passAccuracy','%',rs=>{const a=rs.reduce((s,r)=>s+N(r.pass_attempts),0);return a?rs.reduce((s,r)=>s+N(r.passes_made),0)/a*100:null},r=>N(r.pass_attempts)?N(r.passes_made)/N(r.pass_attempts)*100:null],
 ['passes','Passes completed',r=>N(r.passes_made),1,true,'passesCompletedPerMatch'],
 ['tackle','Tackle success',null,0,true,null,'%',rs=>{const a=rs.reduce((s,r)=>s+N(r.tackle_attempts),0);return a>=5?rs.reduce((s,r)=>s+N(r.tackles_made),0)/a*100:null},r=>N(r.tackle_attempts)?N(r.tackles_made)/N(r.tackle_attempts)*100:null],
 ['tackles','Tackles won',r=>N(r.tackles_made),1,true,'tacklesPerMatch'],
 ['inter','Interceptions',r=>N(r.interceptions),1,true,'interceptionsPerMatch'],
 ['dribbles','Dribbles',r=>N(r.dribbles),1,true,'dribblesPerMatch'],
 ['possLost','Possession lost',r=>{const raw=r?.m?.raw?.players?.[cid()]?.[r.player_id??r.pid];const e=raw&&window.CLUBROOM_EXT90?window.CLUBROOM_EXT90.ext(raw):null;return e?.hasEvents?e.possLost:null},1,false,null]];
const agg=(m,rs)=>{if(m[7])return m[7](rs);const v=rs.map(m[2]).filter(x=>x!=null);return v.length>=3?avg(v):null};
const perMatch=(m,r)=>m[8]?m[8](r):m[2](r);
let devSel=LS.get('postgame102:dev',null),BENCH=null,benchLoading=false;
function loadBench(){if(BENCH||benchLoading)return;benchLoading=true;fetch('/api/benchmarks').then(r=>r.ok?r.json():null).then(d=>{BENCH=d||{groups:{}};render('development')}).catch(()=>{BENCH={groups:{}}})}
function bPct(q,v,lowerBetter){if(!Array.isArray(q)||v==null)return null;const n=q.length-1;let i=-1;for(let k=0;k<=n;k++)if(q[k]!=null&&q[k]<=v)i=k;let p=i<0?0:i>=n?100:(i+(q[i+1]>q[i]?(v-q[i])/(q[i+1]-q[i]):0))/n*100;return lowerBetter?100-p:p}
const GROUPN={GK:'goalkeepers',DEF:'defenders',MID:'midfielders',FWD:'forwards',ALL:'players'};
function spark(vals,w=120,h=30){const v=vals.filter(x=>x!=null);if(v.length<2)return'';const mn=Math.min(...v),mx=Math.max(...v),r=mx-mn||1;let i=0;const p=vals.map((x,k)=>x==null?null:`${(k/(vals.length-1)*w).toFixed(1)},${(h-3-(x-mn)/r*(h-6)).toFixed(1)}`).filter(Boolean).join(' ');return `<svg class="spark102" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${p}"/></svg>`}
function developmentHtml(){const d=D();if(!d?.matches?.length)return empty('No archived matches yet.');
  const list=players(d).filter(p=>p.rows.length>=8).sort((a,b)=>b.rows.length-a.rows.length);if(!list.length)return empty('Players need at least 8 archived matches.');
  const p=list.find(x=>x.id===devSel)||list[0];const rs=p.rows,n=rs.length,k=Math.min(10,Math.floor(n/2));const last=rs.slice(-k),prev=rs.slice(-2*k,-k);
  const items=DEV.map(m=>{const a=agg(m,prev),b=agg(m,last);if(a==null||b==null)return null;const delta=b-a,good=m[4]?delta>=0:delta<=0,rel=delta/(Math.abs(a)||1)*(m[4]?1:-1);
    return {m,a,b,delta,good,rel,series:rs.slice(-20).map(r=>perMatch(m,r))}}).filter(Boolean);
  const fmt=(m,v)=>v==null?'–':Number(v).toFixed(m[3])+(m[6]||'');
  const sorted=[...items].sort((x,y)=>y.rel-x.rel),jump=sorted[0]?.rel>0.03?sorted[0]:null,drop=sorted.at(-1)?.rel<-0.03?sorted.at(-1):null;
  const big=(x,kind)=>x?`<div class="big102 ${kind}"><span class="k94">${kind==='up'?'BIGGEST JUMP':'BIGGEST DROP'}</span><strong>${esc(x.m[1])}</strong><div class="bigNums102"><span>${fmt(x.m,x.a)}</span><i>→</i><b>${fmt(x.m,x.b)}</b></div>${spark(x.series,220,40)}</div>`:`<div class="big102 flat"><span class="k94">${kind==='up'?'BIGGEST JUMP':'BIGGEST DROP'}</span><strong>Nothing major</strong><p class="sub102">All stats within ±3 %.</p></div>`;
  const cards=items.map(x=>`<div class="dev102 ${x.good?'up':'down'}${Math.abs(x.rel)<0.03?' flat':''}"><div class="devTop102"><span>${esc(x.m[1])}</span><em>${Math.abs(x.rel)<0.03?'→':x.delta>0?'▲':'▼'}</em></div><div class="devNums102"><small>${fmt(x.m,x.a)}</small><b>${fmt(x.m,x.b)}</b></div>${spark(x.series)}</div>`).join('');
  // percentiles vs same position across Postgame (Pass)
  let bench='';const grpOf=typeof posGroup==='function'?posGroup(p.position):'ALL';
  if(!pass())bench=`<a class="benchLock102" href="/pass/checkout?club=${encodeURIComponent(cid())}"><b>Where does ${esc(p.name)} stand among all ${GROUPN[grpOf]||'players'} on Postgame?</b><span>Percentiles vs every tracked player in the same position · Postgame Pass</span></a>`;
  else{loadBench();const g=BENCH?.groups?.[grpOf]?.n>=20?{key:grpOf,...BENCH.groups[grpOf]}:BENCH?.groups?.ALL?.n>=20?{key:'ALL',...BENCH.groups.ALL}:null;
    if(!BENCH)bench=`<div class="sub102">Loading benchmarks…</div>`;
    else if(!g)bench=`<div class="sub102">Not enough tracked players for position benchmarks yet.</div>`;
    else{const recent=rs.slice(-20);const rows=DEV.filter(m=>m[5]&&g.metrics?.[m[5]]).map(m=>{const v=agg(m,recent);const q=bPct(g.metrics[m[5]],v,!m[4]);return q==null?null:{m,v,q:Math.round(q)}}).filter(Boolean).sort((a,b)=>a.q-b.q);
      const weak=rows[0];bench=`<div class="bench102">${weak?`<p class="weak102">Weakest spot: <b>${esc(weak.m[1])}</b> – better than only ${weak.q}% of ${GROUPN[g.key]} on Postgame.</p>`:''}${rows.map(x=>`<div class="pRow102"><span>${esc(x.m[1])}</span><span class="pBar102"><i style="width:${x.q}%;background:${x.q>=66?'#2dd4bf':x.q>=33?'#fbbf24':'#fb7185'}"></i></span><b>${x.q}<small>th</small></b></div>`).join('')}<small class="muted102">Last ${recent.length} matches vs ${g.n} ${GROUPN[g.key]} with 5+ matches on Postgame.</small></div>`}}
  const chips=list.map(x=>`<button type="button" class="chip102${x===p?' on':''}" data-dev102="${esc(x.id)}">${av(x)}<span>${esc(x.name)}</span></button>`).join('');
  return `${head('PLAYER DEVELOPMENT','Last '+k+' vs previous '+k+' matches',`<small class="muted102">${n} archived matches</small>`)}
   <div class="chips102">${chips}</div>
   <div class="bigs102">${big(jump,'up')}${big(drop,'down')}</div>
   <div class="devGrid102">${cards||empty('Not enough data.')}</div>
   <section class="box102"><h4>Vs same position on Postgame <span class="passTag102">PASS</span></h4>${bench}</section>`}

/* =============== FATIGUE =============== */
const BUCKETS=[1,2,3,4,5,6],bLab=b=>b===6?'6+':'#'+b,bOf=i=>Math.min(6,i||1);
function fatigueHtml(){const d=D();if(!d?.matches?.length)return empty('No archived matches yet.');
  const ms=d.matches.filter(m=>m.sessionIndex);const by=BUCKETS.map(b=>({b,...team(ms.filter(m=>bOf(m.sessionIndex)===b))})).filter(x=>x.n);
  const valid=by.filter(x=>x.n>=3);const best=valid.length?valid.reduce((a,b)=>b.win>a.win?b:a):null,worst=valid.length?valid.reduce((a,b)=>b.win<a.win?b:a):null;
  const mx=Math.max(...by.map(x=>x.win||0),1);
  const cols=by.map(x=>`<div class="fCol102${x.n<3?' thin':''}${best&&x.b===best.b?' best':''}"><span class="fWin102">${fp(x.win)}</span><div class="fBarWrap102"><i style="height:${(x.win||0)/Math.max(mx,1)*100}%"></i></div><b>${bLab(x.b)}</b><small>${x.n} ${x.n===1?'match':'matches'}</small><small class="fG102"><span class="gf">${f1(x.gf)}</span> : <span class="ga">${f1(x.ga)}</span></small></div>`).join('');
  const sess=d.sessions.filter(s=>s.matches.length>=2),avgLen=avg(sess.map(s=>s.matches.length));
  const verdict=best&&worst&&best.b!==worst.b?`Best: match <b>${bLab(best.b)}</b> of the night (${fp(best.win)} wins). Worst: <b>${bLab(worst.b)}</b> (${fp(worst.win)}).${worst.b>best.b&&worst.b>=4?` <span class="hint102">Time for bed after match ${worst.b-1}? 😴</span>`:''}`:'Play a few more sessions to see a pattern.';
  const pls=players(d).filter(p=>p.rows.length>=10).map(p=>({p,v:BUCKETS.map(b=>{const r=p.rows.filter(r=>bOf(r.m.sessionIndex)===b&&N(r.rating));return r.length>=2?avg(r.map(x=>N(x.rating))):null})})).filter(x=>x.v.filter(v=>v!=null).length>=2);
  const heat=v=>v==null?'':`background:${v>=7.5?'rgba(45,212,191,.45)':v>=7?'rgba(45,212,191,.22)':v>=6.5?'rgba(251,191,36,.2)':'rgba(251,113,133,.25)'}`;
  const table=pls.length?`<div class="fTable102"><table><thead><tr><th></th>${BUCKETS.map(b=>`<th>${bLab(b)}</th>`).join('')}</tr></thead><tbody>${pls.map(x=>`<tr><th>${pl(x.p)}</th>${x.v.map(v=>`<td style="${heat(v)}">${v==null?'–':v.toFixed(1)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:empty('Players need 10+ archived matches.');
  return `${head('SESSION FATIGUE','Which match of the night do we play best?',`<small class="muted102">${sess.length} sessions · ${f1(avgLen)} matches on average</small>`)}
   <p class="verdict102">${verdict}</p>
   <section class="box102"><h4>Win % by match number in the session</h4><div class="fCols102">${cols}</div><p class="sub102">Under each column: goals scored : conceded per match. A session = matches less than 90 minutes apart.</p></section>
   <section class="box102"><h4>Player rating by match number</h4>${table}</section>`}

/* =============== WHEN WE WIN =============== */
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],BANDS=[['Before 16:00',h=>h>=6&&h<16],['16–19',h=>h>=16&&h<19],['19–22',h=>h>=19&&h<22],['22–01',h=>h>=22||h<1],['After 01:00',h=>h>=1&&h<6]];
function whenHtml(){const d=D();if(!d?.matches?.length)return empty('No archived matches yet.');const ms=d.matches;
  const cell=list=>{const t=team(list);if(!t.n)return `<td class="none"></td>`;const c=t.win>=60?'rgba(45,212,191,.5)':t.win>=45?'rgba(45,212,191,.22)':t.win>=30?'rgba(251,191,36,.22)':'rgba(251,113,133,.3)';return `<td style="background:${t.n>=3?c:'transparent'}" class="${t.n<3?'thin':''}" title="${t.n} matches"><b>${fp(t.win)}</b><small>${t.n}</small></td>`};
  const dayOf=m=>(m.ts.getDay()+6)%7;
  const heat=`<div class="fTable102 heat102"><table><thead><tr><th></th>${BANDS.map(b=>`<th>${b[0]}</th>`).join('')}<th>All</th></tr></thead><tbody>${DAYS.map((dn,i)=>{const day=ms.filter(m=>dayOf(m)===i);return `<tr><th>${dn}</th>${BANDS.map(b=>cell(day.filter(m=>b[1](m.ts.getHours())))).join('')}${cell(day)}</tr>`}).join('')}</tbody></table></div>`;
  const bar=(label,list,sub)=>{const t=team(list);return t.n?`<div class="wBar102"><div><b>${esc(label)}</b><small>${t.n} matches${sub?' · '+sub:''}</small></div><span class="wTrack102">${['W','D','L'].map(r=>{const c=list.filter(m=>m.result===r).length;return c?`<i style="flex:${c};background:${RES[r]}" title="${r} ${c}"></i>`:''}).join('')}</span><em>${fp(t.win)}</em><small class="wG102">${f2(t.gf)} : ${f2(t.ga)}</small></div>`:''};
  const tl=t=>{const x=String(t).replace(/match$/i,'');return x.charAt(0).toUpperCase()+x.slice(1)};const types=[...new Set(ms.map(m=>m.type||'other'))].map(t=>bar(tl(t),ms.filter(m=>(m.type||'other')===t))).join('');
  const sizeOf=m=>(d.byMatch.get(m.id)||[]).length;const sizes=[...new Set(ms.map(sizeOf))].filter(Boolean).sort((a,b)=>a-b);
  const sz=sizes.map(s=>bar(`${s} players`,ms.filter(m=>sizeOf(m)===s))).join('');
  const all=team(ms),hours=BANDS.map(b=>({b,t:team(ms.filter(m=>b[1](m.ts.getHours())))})).filter(x=>x.t.n>=5),bestH=hours.length?hours.reduce((a,b)=>b.t.win>a.t.win?b:a):null;
  return `${head('WHEN WE WIN','Days, times, modes and squad size',`<small class="muted102">${ms.length} archived matches · ${fp(all.win)} wins overall</small>`)}
   ${bestH?`<p class="verdict102">Best time to play: <b>${esc(bestH.b[0])}</b> – ${fp(bestH.t.win)} wins in ${bestH.t.n} matches.</p>`:''}
   <section class="box102"><h4>Win % by day and time</h4>${heat}<p class="sub102">Your local time. Small number = matches; cells with fewer than 3 matches stay uncoloured.</p></section>
   <div class="grid102"><section class="box102"><h4>By match type</h4>${types}</section><section class="box102"><h4>By squad size</h4>${sz||empty('No lineup data.')}<p class="sub102">Number of our players with stats in the match.</p></section></div>`}

/* =============== mount =============== */
const PANES={impact:['ins102Impact',impactHtml],development:['ins102Dev',developmentHtml],fatigue:['ins102Fatigue',fatigueHtml],when:['ins102When',whenHtml]};
function render(only){for(const [k,[id,fn]] of Object.entries(PANES)){if(only&&only!==k)continue;const el=document.getElementById(id);if(!el)continue;try{el.innerHTML=fn()}catch(e){console.warn('v102',k,e);el.innerHTML=empty('Could not compute this view.')}}try{registerAvatarRoster?.()}catch{}}
window.v102RenderInsights=render;
document.addEventListener('click',e=>{const c=e.target.closest('[data-dev102]');if(c){devSel=c.dataset.dev102;LS.set('postgame102:dev',devSel);render('development');return}
  const t=e.target.closest('[data-analytics-tab]');if(t&&PANES[t.dataset.analyticsTab])setTimeout(()=>render(t.dataset.analyticsTab),0)});
if(typeof loadHistory==='function'){const prev=loadHistory;loadHistory=async function(...a){const r=await prev.apply(this,a);try{render()}catch{}return r}}
})();
