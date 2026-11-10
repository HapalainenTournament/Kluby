/* CLUBROOM v94 · Analytics: player form (rating columns) + match-by-match small multiples.
   Data: archive rows (ClubroomV78.data()), event stats via CLUBROOM_EXT90. Own design – columns coloured by result, squad grid. */
(function(){
'use strict';
const V=()=>window.ClubroomV78,D=()=>V()?.data?.();
const N=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const RES={W:'#2dd4bf',D:'#fbbf24',L:'#fb7185'};
const WINDOWS=[5,10,20,30];
let win=LS.get('clubroom94:win',10),sel=LS.get('clubroom94:player',null),metric=LS.get('clubroom94:metric','rating'),tip=null;
const cid=()=>String((typeof S!=='undefined'&&S?.club?.id)||'');
const dShort=ts=>{try{return new Date(ts).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}catch{return''}};
const avatar=p=>{try{return V().av(p,'mini')}catch{return''}};
const ext=r=>{const raw=r?.m?.raw?.players?.[cid()]?.[r.player_id??r.pid];return raw&&window.CLUBROOM_EXT90?window.CLUBROOM_EXT90.ext(raw):null};

const METRICS=[
 ['rating','Rating',r=>N(r.rating)||null,1,true],
 ['ga','Goals + assists',r=>N(r.goals)+N(r.assists),0,true],
 ['goals','Goals',r=>N(r.goals),0,true],
 ['assists','Assists',r=>N(r.assists),0,true],
 ['shots','Shots',r=>N(r.shots),0,true],
 ['passes','Passes completed',r=>N(r.passes_made),0,true],
 ['passPct','Pass accuracy',r=>N(r.pass_attempts)?N(r.passes_made)/N(r.pass_attempts)*100:null,0,true,'%'],
 ['tackles','Tackles won',r=>N(r.tackles_made),0,true],
 ['interceptions','Interceptions',r=>N(r.interceptions),0,true],
 ['dribbles','Dribbles',r=>N(r.dribbles),0,true],
 ['beaten','Opponents beaten',r=>{const e=ext(r);return e?.hasEvents?e.beaten:null},0,true],
 ['possLost','Possession lost',r=>{const e=ext(r);return e?.hasEvents?e.possLost:null},0,false],
 ['saves','Saves',r=>N(r.saves),0,true,'',p=>p.rows.some(r=>N(r.saves)>0)]];
const M=k=>METRICS.find(m=>m[0]===k)||METRICS[0];
const fmt=(m,v)=>v==null?'–':(m[3]?Number(v).toFixed(m[3]):Math.round(v))+(m[5]||'');

/* ---------- data for the window ---------- */
function windowData(){const d=D();if(!d?.matches?.length)return null;const ms=d.matches.slice(-win),ids=new Set(ms.map(m=>String(m.id)));
  const players=[...d.players.values()].map(p=>{const byM=new Map(p.rows.filter(r=>ids.has(String(r.match_id))).map(r=>[String(r.match_id),r]));return {p,byM,all:p.rows}}).filter(x=>x.byM.size).sort((a,b)=>b.byM.size-a.byM.size||String(a.p.name).localeCompare(String(b.p.name)));
  return {ms,players}}
function slope(ys){const n=ys.length;if(n<3)return 0;const mx=(n-1)/2,my=ys.reduce((a,b)=>a+b,0)/n;let num=0,den=0;ys.forEach((y,i)=>{num+=(i-mx)*(y-my);den+=(i-mx)**2});return den?num/den:0}
function trendOf(ys){const s=slope(ys);return s>0.06?{k:'up',t:'On the rise',i:'↗'}:s<-0.06?{k:'down',t:'Cooling off',i:'↘'}:{k:'flat',t:'Holding steady',i:'→'}}
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;

/* ---------- shared bits ---------- */
const winSeg=()=>`<div class="win94" role="group" aria-label="Matches shown">${WINDOWS.map(w=>`<button type="button" data-win94="${w}" class="${w===win?'active':''}">${w}</button>`).join('')}</div>`;
function spark(vals,{w=120,h=34,lo,hi}={}){const pts=vals.map((v,i)=>v==null?null:[i,v]).filter(Boolean);if(pts.length<2)return `<svg viewBox="0 0 ${w} ${h}" class="spark94"></svg>`;
  const ys=pts.map(p=>p[1]);lo=lo??Math.min(...ys);hi=hi??Math.max(...ys);if(hi-lo<1e-6){hi+=1;lo-=1}const X=i=>2+i/(Math.max(1,vals.length-1))*(w-4),Y=v=>h-3-(v-lo)/(hi-lo)*(h-6);
  const d=pts.map((p,k)=>`${k?'L':'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');const last=pts.at(-1);
  return `<svg viewBox="0 0 ${w} ${h}" class="spark94" preserveAspectRatio="none"><path d="${d}"/></svg>`}

/* ---------- FORM: rating columns for one player ---------- */
function formHtml(){const wd=windowData();if(!wd)return '<div class="msg">Player form needs archived matches.</div>';
  const {ms,players}=wd;if(!players.length)return '<div class="msg">No player ratings in this window.</div>';
  let cur=players.find(x=>String(x.p.id)===String(sel))||players[0];sel=cur.p.id;
  const vals=ms.map(m=>{const r=cur.byM.get(String(m.id));return r&&N(r.rating)?{m,r,v:N(r.rating)}:{m,r:null,v:null}});
  const played=vals.filter(x=>x.v!=null),ys=played.map(x=>x.v),a=avg(ys),career=avg(cur.all.map(r=>N(r.rating)).filter(Boolean)),tr=trendOf(ys);
  const best=played.reduce((b,x)=>!b||x.v>b.v?x:b,null),worst=played.reduce((b,x)=>!b||x.v<b.v?x:b,null),delta=a!=null&&career!=null?a-career:0;
  // columns: 5..10 scale
  const H=180,lo=5,hi=10,colW=100/Math.max(1,ms.length);
  const cols=vals.map((x,i)=>{const res=x.m.result||'D',h=x.v==null?0:Math.max(4,(Math.min(hi,Math.max(lo,x.v))-lo)/(hi-lo)*100);
    return `<button type="button" class="col94 ${x.v==null?'dnp':''}" style="--h:${h}%;--c:${RES[res]||RES.D};--i:${i}" data-col94="${i}" aria-label="${esc(dShort(x.m.ts))} ${esc(x.m.opponent||'')} ${res} ${x.m.og}:${x.m.tg}${x.v!=null?' rating '+x.v.toFixed(1):' did not play'}">
      ${x.v!=null?`<em>${x.v.toFixed(1)}</em>`:'<em>–</em>'}<span></span><small>${esc(res)}</small></button>`}).join('');
  const avgLine=a!=null?`<i class="avg94" style="bottom:${(Math.min(hi,Math.max(lo,a))-lo)/(hi-lo)*100}%"><b>avg ${a.toFixed(2)}</b></i>`:'';
  const rail=players.map(x=>{const r=x.byM.size?avg([...x.byM.values()].map(r=>N(r.rating)).filter(Boolean)):null,t=trendOf(ms.map(m=>x.byM.get(String(m.id))).filter(Boolean).map(r=>N(r.rating)).filter(Boolean));
    return `<button type="button" class="pChip94 ${x===cur?'active':''}" data-p94="${esc(x.p.id)}">${avatar(x.p)}<span>${esc(x.p.name)}</span><i class="tr94 ${t.k}">${t.i}</i></button>`}).join('');
  const pulse=players.map(x=>{const rs=ms.map(m=>{const r=x.byM.get(String(m.id));return r&&N(r.rating)?N(r.rating):null}),aa=avg(rs.filter(v=>v!=null)),cc=avg(x.all.map(r=>N(r.rating)).filter(Boolean)),dd=aa!=null&&cc!=null?aa-cc:0;
    return `<button type="button" class="pulse94 ${x===cur?'active':''}" data-p94="${esc(x.p.id)}"><span>${esc(x.p.name)}</span><b>${aa!=null?aa.toFixed(1):'–'}</b><i class="${dd>0.05?'up':dd<-0.05?'down':''}">${Math.abs(dd)<0.05?'±0.0':(dd>0?'+':'')+dd.toFixed(1)}</i>${spark(rs,{lo:5,hi:10})}</button>`}).join('');
  return `<div class="trendHead94"><div><span class="k94">PLAYER FORM</span><h3>Rating run</h3></div>${winSeg()}</div>
   <div class="rail94">${rail}</div>
   <div class="formBody94">
    <div class="colsWrap94"><div class="cols94 ${ms.length>12?'dense':''}" style="--n:${ms.length}">${[10,8,6].map(g=>`<i class="grid94" style="bottom:${(g-lo)/(hi-lo)*100}%"><b>${g}</b></i>`).join('')}${avgLine}${cols}</div><p class="colInfo94" data-colinfo94>Tap a column for the match.</p></div>
    <aside class="formSide94">
     <div class="big94"><span>Last ${played.length} played</span><b>${a!=null?a.toFixed(2):'–'}</b><i class="${delta>0.05?'up':delta<-0.05?'down':''}">${Math.abs(delta)<0.005?'±0.00':(delta>0?'+':'')+delta.toFixed(2)} vs career ${career!=null?career.toFixed(2):'–'}</i></div>
     <div class="trend94 ${tr.k}"><b>${tr.i}</b><span>${tr.t}</span></div>
     <div class="bw94"><div><span>Best</span><b>${best?best.v.toFixed(1):'–'}</b><small>${best?esc(best.m.opponent||'')+' · '+dShort(best.m.ts):''}</small></div><div><span>Worst</span><b>${worst?worst.v.toFixed(1):'–'}</b><small>${worst?esc(worst.m.opponent||'')+' · '+dShort(worst.m.ts):''}</small></div></div>
    </aside>
   </div>
   <div class="legend94"><span><i style="background:${RES.W}"></i>Win</span><span><i style="background:${RES.D}"></i>Draw</span><span><i style="background:${RES.L}"></i>Loss</span><span class="muted94">Column = match rating · oldest → newest</span></div>
   <div class="pulseGrid94">${pulse}</div>`}

/* ---------- MATCH-BY-MATCH: whole squad for one metric ---------- */
function mbmHtml(){const wd=windowData();if(!wd)return '<div class="msg">Match-by-match needs archived matches.</div>';const {ms,players}=wd,m=M(metric);
  const list=players.filter(x=>!m[6]||m[6](x.p));
  const series=list.map(x=>{const vals=ms.map(mm=>{const r=x.byM.get(String(mm.id));const v=r?m[2](r):null;return v==null||!Number.isFinite(v)?null:v});const got=vals.map((v,i)=>v==null?null:{v,i}).filter(Boolean);
    return {x,vals,got,a:avg(got.map(g=>g.v)),best:got.reduce((b,g)=>!b||(m[4]?g.v>b.v:g.v<b.v)?g:b,null),worst:got.reduce((b,g)=>!b||(m[4]?g.v<b.v:g.v>b.v)?g:b,null)}}).filter(s=>s.got.length);
  const allV=series.flatMap(s=>s.got.map(g=>g.v));const lo=metric==='rating'?5:Math.min(0,...allV),hi=metric==='rating'?10:Math.max(1,...allV);
  const leader=series.slice().sort((a,b)=>m[4]?b.a-a.a:a.a-b.a)[0];
  const card=s=>{const w=260,h=96,X=i=>8+i/(Math.max(1,ms.length-1))*(w-16),Y=v=>h-10-(v-lo)/((hi-lo)||1)*(h-22);
    const line=s.got.map((g,k)=>`${k?'L':'M'}${X(g.i).toFixed(1)},${Y(g.v).toFixed(1)}`).join('');const area=s.got.length>1?`${line}L${X(s.got.at(-1).i).toFixed(1)},${h-6}L${X(s.got[0].i).toFixed(1)},${h-6}Z`:'';
    const dots=s.got.map(g=>{const res=ms[g.i].result||'D';return `<circle cx="${X(g.i).toFixed(1)}" cy="${Y(g.v).toFixed(1)}" r="3.2" fill="${RES[res]}"><title>${esc(dShort(ms[g.i].ts))} · ${res} ${ms[g.i].og}:${ms[g.i].tg} vs ${esc(ms[g.i].opponent||'')} · ${fmt(m,g.v)}</title></circle>`}).join('');
    const avgY=s.a!=null?Y(s.a):null;
    return `<article class="mbmCard94 ${s===leader?'lead':''}"><header>${avatar(s.x.p)}<b>${esc(s.x.p.name)}</b>${s===leader?'<span class="leadTag94">Top</span>':''}<strong>${fmt(m,s.a)}</strong></header>
     <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="mbmSvg94"><defs><linearGradient id="g94-${esc(s.x.p.id)}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2dd4bf" stop-opacity=".28"/><stop offset="1" stop-color="#2dd4bf" stop-opacity="0"/></linearGradient></defs>
      ${avgY!=null?`<line x1="4" x2="${w-4}" y1="${avgY}" y2="${avgY}" class="avgL94"/>`:''}${area?`<path d="${area}" fill="url(#g94-${esc(s.x.p.id)})"/>`:''}<path d="${line}" class="line94"/>${dots}</svg>
     <footer><span>Best <b>${s.best?fmt(m,s.best.v):'–'}</b></span><span>Worst <b>${s.worst?fmt(m,s.worst.v):'–'}</b></span><span>${s.got.length} played</span></footer></article>`};
  const metSel=`<div class="met94" role="tablist" aria-label="Stat">${METRICS.map(q=>`<button type="button" data-met94="${q[0]}" class="${q[0]===metric?'active':''}">${esc(q[1])}</button>`).join('')}</div>`;
  return `<div class="trendHead94"><div><span class="k94">SQUAD TRENDS</span><h3>${esc(m[1])} · match by match</h3></div>${winSeg()}</div>${metSel}
   ${series.length?`<div class="mbmGrid94">${series.map(card).join('')}</div>`:'<div class="msg">No data for this stat in the selected matches.</div>'}
   <div class="legend94"><span><i style="background:${RES.W}"></i>Win</span><span><i style="background:${RES.D}"></i>Draw</span><span><i style="background:${RES.L}"></i>Loss</span><span class="muted94">Dashed line = player's average in these matches${m[4]?'':' · lower is better'}</span></div>`}

/* ---------- mount ---------- */
function render(){const f=document.getElementById('formTrend94');if(f)f.innerHTML=formHtml();const b=document.getElementById('mbm94');if(b)b.innerHTML=mbmHtml();try{registerAvatarRoster?.()}catch{}}
window.v94RenderTrends=render;
document.addEventListener('click',e=>{
  const w=e.target.closest('[data-win94]');if(w){win=+w.dataset.win94;LS.set('clubroom94:win',win);render();return}
  const p=e.target.closest('[data-p94]');if(p){sel=p.dataset.p94;LS.set('clubroom94:player',sel);const f=document.getElementById('formTrend94');if(f){f.innerHTML=formHtml();try{registerAvatarRoster?.()}catch{}}return}
  const m=e.target.closest('[data-met94]');if(m){metric=m.dataset.met94;LS.set('clubroom94:metric',metric);const b=document.getElementById('mbm94');if(b){const sc=b.querySelector('.met94')?.scrollLeft||0;b.innerHTML=mbmHtml();const n=b.querySelector('.met94');if(n)n.scrollLeft=sc;try{registerAvatarRoster?.()}catch{}}return}
  const c=e.target.closest('[data-col94]');if(c){const host=c.closest('#formTrend94'),info=host?.querySelector('[data-colinfo94]');host?.querySelectorAll('.col94.on').forEach(x=>x.classList.remove('on'));c.classList.add('on');if(info)info.textContent=c.getAttribute('aria-label');return}
  if(e.target.closest('[data-analytics-tab="form"],[data-analytics-tab="match"]'))setTimeout(render,0)});
if(typeof loadHistory==='function'){const prev=loadHistory;loadHistory=async function(...a){const r=await prev.apply(this,a);try{render()}catch{}return r}}
})();
