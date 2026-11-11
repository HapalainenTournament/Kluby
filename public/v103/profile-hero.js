/* POSTGAME v103 · Player profile hero: one screen with card, highlights, precision and totals – made to be screenshotted and shared.
   Big numbers = EA career for this club (same numbers EA shows in game). Archive numbers are labelled ARCHIVE. Nothing is estimated. */
(function(){
'use strict';
const N=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const chip=k=>typeof srcChip100==='function'?srcChip100(k):'';
const f2=v=>v==null?'–':Number(v).toFixed(2),f1=v=>v==null?'–':Number(v).toFixed(1);
const pctTxt=v=>v==null?'–':Math.round(v)+'%';
const POS={goalkeeper:'GK',defender:'DEF',midfielder:'MID',forward:'FWD'};
const ICON={
 goal:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z"/></svg>',
 assist:'<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></svg>',
 ga:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
 star:'<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
 target:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
 pass:'<svg viewBox="0 0 24 24"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
 shield:'<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/></svg>',
 eye:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/></svg>',
 share:'<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>'};

function currentPlayer(){const m=location.pathname.match(/\/club\/[^/]+\/player\/([^/?#]+)/);if(!m||typeof S==='undefined')return null;const id=decodeURIComponent(m[1]);return (S.players||[]).find(p=>String(p.id)===id)||null}
function archive(p){const D=window.ClubroomV78?.data?.();if(!D)return null;const lc=s=>String(s||'').toLowerCase();
  const pl=[...D.players.values()].find(x=>String(x.liveId)===String(p.id)||lc(x.name)===lc(p.name)||lc(x.name)===lc(p.accountName));if(!pl)return null;
  const rows=pl.rows,sum=k=>rows.reduce((s,r)=>s+N(r[k]),0);
  const ev=rows.map(r=>{try{return window.CLUBROOM_EXT90?.ext(r.m?.raw?.players?.[String(S.club.id)]?.[r.player_id]||null)}catch{return null}}).filter(x=>x?.hasEvents);
  return {n:rows.length,goals:sum('goals'),assists:sum('assists'),second:sum('second_assists'),shots:sum('shots'),passes:sum('passes_made'),passAtt:sum('pass_attempts'),tackles:sum('tackles_made'),tackleAtt:sum('tackle_attempts'),
   on:ev.reduce((s,x)=>s+x.shotsOn,0),off:ev.reduce((s,x)=>s+x.shotsOff,0),evN:ev.length,
   form:rows.slice(-10).map(r=>({rating:N(r.rating),res:r.m?.result,score:`${r.m?.og}–${r.m?.tg}`,opp:r.m?.opponent}))}}
function model(p){const g=N(p.games),ar=archive(p);
  return {p,name:p.name,account:p.accountName&&p.accountName!==p.name?p.accountName:'',pos:POS[String(p.position).toLowerCase()]||String(p.position||'').slice(0,3).toUpperCase(),ovr:N(p.overall)||null,
   games:g,goals:N(p.goals),assists:N(p.assists),motm:N(p.motm),rating:N(p.rating)||null,win:p.winRate?N(p.winRate):null,reds:N(p.reds),
   gpm:g?N(p.goals)/g:null,apm:g?N(p.assists)/g:null,gapm:g?(N(p.goals)+N(p.assists))/g:null,
   conv:p.shotRate?N(p.shotRate):null,passRate:p.passRate?N(p.passRate):null,passes:N(p.passes),tackleRate:p.tackleRate?N(p.tackleRate):null,tackles:N(p.tackles),ar,
   club:S.club?.name||'',clubId:S.club?.id||''}}
const barCol=(v,good,ok)=>v==null?'#24384f':v>=good?'#2dd4bf':v>=ok?'#fbbf24':'#fb7185';
function heroHtml(m){const ar=m.ar;
  const hl=[['goal','Goals / match',f2(m.gpm)],['assist','Assists / match',f2(m.apm)],['ga','G+A / match',f2(m.gapm)],['star','Avg rating',f1(m.rating)]];
  const prec=[
   // EA % when EA sends it, otherwise the exact archive ratio (labelled ARCHIVE)
   ...[['target','Conversion',m.conv,`${m.goals} goals`,ar&&ar.shots?[ar.goals,ar.shots]:null,[25,15]],
       ['pass','Pass accuracy',m.passRate,`${m.passes.toLocaleString('en')} completed`,ar&&ar.passAtt?[ar.passes,ar.passAtt]:null,[80,70]],
       ['shield','Tackle success',m.tackleRate,`${m.tackles} won`,ar&&ar.tackleAtt?[ar.tackles,ar.tackleAtt]:null,[25,15]]].map(([i,l,ea,sub,arr,th])=>{
     if(ea!=null)return [i,l,pctTxt(ea),ea,sub,arr?`${arr[0]}/${arr[1]} archived`:'',th,'ea'];
     const v=arr?arr[0]/arr[1]*100:null;return [i,l,pctTxt(v),v,arr?`${arr[0]}/${arr[1]}`:'–',ar?`${ar.n} archived matches`:'',th,'ar']})];
  if(ar&&ar.on+ar.off>=5)prec.push(['eye','Shots on target',pctTxt(ar.on/(ar.on+ar.off)*100),ar.on/(ar.on+ar.off)*100,`${ar.on}/${ar.on+ar.off} shots`,`${ar.evN} archived matches`,[55,40],'ar']);
  const tot=[['Matches',m.games,'ea'],['Goals',m.goals,'ea'],['Assists',m.assists,'ea'],['MOTM',m.motm,'ea'],['Win rate',pctTxt(m.win),'ea'],['Red cards',m.reds,'ea']];
  if(ar){tot.push(['Shots',ar.shots,'ar']);tot.push(['Second assists',ar.second,'ar'])}
  const form=ar?.form?.length?`<div class="pgForm103" aria-label="Last ${ar.form.length} ratings">${ar.form.map(f=>`<i class="${f.res||''}" style="--h:${Math.max(38,Math.min(100,(f.rating-4)/6*100))}%" title="${esc(f.score)} vs ${esc(f.opp||'')} · ${f.rating.toFixed(1)}"><b>${f.rating.toFixed(1)}</b></i>`).join('')}</div>`:'';
  return `<div class="pgHero103" id="pgHeroCard103">
   <header class="pgTop103"><div class="pgId103"><span class="k94">PLAYER PROFILE</span><h1>${esc(m.name)}</h1><p>${m.account?`${esc(m.account)} · `:''}${esc(m.pos)}${m.ovr?` · OVR ${m.ovr}`:''}${m.club?` · ${esc(m.club)}`:''}</p></div>
    <button type="button" class="pgShare103" data-pg-share103 aria-label="Share as image">${ICON.share}<span>Share</span></button></header>
   <div class="pgMain103">
    <div class="pgCardCol103"><div class="pgCardSlot103" id="pgCardSlot103"></div></div>
    <div class="pgStats103">
     <section class="pgBox103 pgHl103"><h3>${ICON.star}Highlights <span>${chip('ea')} ${m.games} career matches</span></h3><div class="pgHlGrid103">${hl.map(([i,l,v])=>`<div><span>${ICON[i]}${l}</span><b>${v}</b></div>`).join('')}</div>${form?`<div class="pgFormWrap103"><small>Last ${ar.form.length} matches · rating ${chip('ar')}</small>${form}</div>`:''}</section>
     <section class="pgBox103"><h3>${ICON.target}Precision <span>Conversion &amp; accuracy</span></h3><div class="pgPrec103 n${prec.length}">${prec.map(([i,l,v,raw,sub,sub2,[g,o],src])=>`<div><span>${ICON[i]}${l} ${chip(src||'ea')}</span><b>${v}</b><em class="pgBar103"><i style="width:${raw==null?0:Math.min(100,raw)}%;background:${barCol(raw,g,o)}"></i></em><small>${esc(sub)}</small>${sub2?`<small class="ar">${esc(sub2)}</small>`:''}</div>`).join('')}</div></section>
    </div>
   </div>
   <section class="pgBox103 pgTotals103"><h3>Σ Totals</h3><div class="pgTotGrid103">${tot.map(([l,v,s])=>`<div><span>${l} ${chip(s)}</span><b>${esc(typeof v==='number'?v.toLocaleString('en'):v)}</b></div>`).join('')}</div></section>
   <footer class="pgFoot103"><img src="/assets/postgame-mark.png" alt=""><b>POSTGAME</b><span>postgame.gg${m.clubId?`/club/${esc(m.clubId)}`:''}</span></footer>
  </div>`}

let last='';
function mount(){const page=$('#playerPage69');if(!page||page.hidden)return;const p=currentPlayer();if(!p)return;
  let host=$('#pgHero103');if(!host){host=document.createElement('section');host.id='pgHero103';const old=page.querySelector('.playerHero69');old.parentNode.insertBefore(host,old);old.classList.add('pgLegacy103')}
  const m=model(p);const sig=JSON.stringify([p.id,m.games,m.ar?.n,S.club?.id]);if(sig===last&&host.firstChild)return;last=sig;
  host.innerHTML=heroHtml(m);const cm=$('#playerHeroCardMount69');if(cm)$('#pgCardSlot103').appendChild(cm);try{registerAvatarRoster?.()}catch{}}
let q=0;const schedule=()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;try{mount()}catch(e){console.warn('v103 hero',e)}})};
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
addEventListener('popstate',()=>{last='';schedule()});

/* ---------- share as image (canvas, 1080×1350) ---------- */
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function fit(c,t,max){let s=String(t);while(c.measureText(s).width>max&&s.length>1)s=s.slice(0,-1);return s===String(t)?s:s.slice(0,-1)+'…'}
const loadImg=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});
async function shareImage(){const p=currentPlayer();if(!p)return;const m=model(p),ar=m.ar;
  const W=1080,H=1350,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');const F='Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
  const g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#0d1b2e');g.addColorStop(1,'#060c16');c.fillStyle=g;c.fillRect(0,0,W,H);
  const glow=c.createRadialGradient(W*.8,160,10,W*.8,160,620);glow.addColorStop(0,'rgba(45,212,191,.18)');glow.addColorStop(1,'rgba(45,212,191,0)');c.fillStyle=glow;c.fillRect(0,0,W,H);
  // card image
  let cardImg=null;try{const el=$('#playerHeroCardMount69 player-card');if(el?.exportBlob){const b=await el.exportBlob({width:600,height:900});cardImg=await loadImg(URL.createObjectURL(b))}}catch{}
  if(cardImg){c.save();c.translate(690,96);c.rotate(.05);c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=40;c.drawImage(cardImg,0,0,330,495);c.restore()}
  else{rr(c,700,120,320,420,36);const cg=c.createLinearGradient(700,120,1020,540);cg.addColorStop(0,'#134e4a');cg.addColorStop(1,'#0b1626');c.fillStyle=cg;c.fill();c.strokeStyle='rgba(45,212,191,.5)';c.lineWidth=3;c.stroke();
    c.textAlign='center';c.fillStyle='#fff';c.font=`900 150px ${F}`;c.fillText(m.ovr?String(m.ovr):'–',860,330);c.fillStyle='#5eead4';c.font=`900 44px ${F}`;c.fillText(m.pos||'',860,400);c.fillStyle='#9fb2c8';c.font=`800 22px ${F}`;c.fillText('OVERALL',860,450);c.textAlign='left'}
  // name block
  c.fillStyle='#5eead4';c.font=`900 22px ${F}`;c.fillText('PLAYER PROFILE',64,104);
  c.fillStyle='#fff';c.font=`900 72px ${F}`;c.fillText(fit(c,m.name,600),60,180);
  c.fillStyle='#9fb2c8';c.font=`700 26px ${F}`;c.fillText(fit(c,[m.account,m.pos,m.ovr?`OVR ${m.ovr}`:'',m.club].filter(Boolean).join(' · '),600),64,224);
  // highlights 2×2
  const hl=[['GOALS / MATCH',f2(m.gpm)],['ASSISTS / MATCH',f2(m.apm)],['G+A / MATCH',f2(m.gapm)],['AVG RATING',f1(m.rating)]];
  hl.forEach(([l,v],i)=>{const x=48+(i%2)*306,y=262+Math.floor(i/2)*150;rr(c,x,y,294,136,24);c.fillStyle='rgba(13,24,38,.92)';c.fill();c.strokeStyle='#1f3247';c.lineWidth=2;c.stroke();
    c.fillStyle='#8ea3bd';c.font=`800 19px ${F}`;c.fillText(l,x+22,y+40);c.fillStyle=i===2?'#2dd4bf':'#fff';c.font=`900 58px ${F}`;c.fillText(v,x+22,y+108)});
  c.fillStyle='#5d7390';c.font=`700 19px ${F}`;c.fillText(`EA career · ${m.games} matches for this club`,52,588);
  // form
  if(ar?.form?.length){const fx=48,fy=626,bw=(W-96-9*10)/10;c.fillStyle='#8ea3bd';c.font=`800 19px ${F}`;c.fillText(`LAST ${ar.form.length} MATCHES · RATING`,fx+4,fy);
    ar.form.forEach((f,i)=>{const x=fx+i*(bw+10),h=Math.max(30,Math.min(110,(f.rating-4)/6*110));c.fillStyle=f.res==='W'?'#2dd4bf':f.res==='D'?'#fbbf24':'#fb7185';rr(c,x,fy+130-h,bw,h,12);c.fill();c.fillStyle='#06131a';c.font=`900 22px ${F}`;c.textAlign='center';c.fillText(f.rating.toFixed(1),x+bw/2,fy+122);c.textAlign='left'})}
  // precision (same rule as the page: EA % when EA sends it, else exact archive ratio)
  const py=800;rr(c,48,py,W-96,190,28);c.fillStyle='rgba(13,24,38,.92)';c.fill();c.strokeStyle='#1f3247';c.lineWidth=2;c.stroke();
  const pick=(ea,sub,arr)=>ea!=null?[ea,sub]:arr?[arr[0]/arr[1]*100,`${arr[0]}/${arr[1]} archived`]:[null,sub];
  const prec=[['CONVERSION',...pick(m.conv,`${m.goals} goals`,ar&&ar.shots?[ar.goals,ar.shots]:null)],['PASS ACCURACY',...pick(m.passRate,`${m.passes.toLocaleString('en')} completed`,ar&&ar.passAtt?[ar.passes,ar.passAtt]:null)],['TACKLE SUCCESS',...pick(m.tackleRate,`${m.tackles} won`,ar&&ar.tackleAtt?[ar.tackles,ar.tackleAtt]:null)]];
  prec.forEach(([l,v,s],i)=>{const x=80+i*330;c.fillStyle='#8ea3bd';c.font=`800 20px ${F}`;c.fillText(l,x,py+48);c.fillStyle='#fff';c.font=`900 60px ${F}`;c.fillText(pctTxt(v),x,py+116);
    rr(c,x,py+134,270,8,4);c.fillStyle='#13243a';c.fill();if(v!=null){rr(c,x,py+134,Math.max(8,270*Math.min(100,v)/100),8,4);c.fillStyle='#2dd4bf';c.fill()}c.fillStyle='#9fb2c8';c.font=`700 19px ${F}`;c.fillText(s,x,py+170)});
  // totals
  const ty=1012,tot=[['MATCHES',m.games],['GOALS',m.goals],['ASSISTS',m.assists],['MOTM',m.motm]];
  tot.forEach(([l,v],i)=>{const x=48+i*((W-96-36)/4+12),w=(W-96-36)/4;rr(c,x,ty,w,130,24);c.fillStyle='rgba(13,24,38,.92)';c.fill();c.strokeStyle='#1f3247';c.stroke();c.fillStyle='#8ea3bd';c.font=`800 18px ${F}`;c.fillText(l,x+22,ty+40);c.fillStyle='#fff';c.font=`900 50px ${F}`;c.fillText(String(v),x+22,ty+100)});
  // footer
  const logo=await loadImg('/assets/postgame-mark.png');if(logo)c.drawImage(logo,48,1252,40,44);c.fillStyle='#fff';c.font=`900 30px ${F}`;c.fillText('POSTGAME',100,1286);
  c.fillStyle='#5d7390';c.font=`700 22px ${F}`;c.textAlign='right';c.fillText(`postgame.gg/club/${m.clubId}`,W-48,1286);c.textAlign='left';
  const blob=await new Promise(r=>cv.toBlob(r,'image/png'));const name=`${String(m.name).replace(/[^a-z0-9_-]+/gi,'-').toLowerCase()}-postgame.png`;
  const file=new File([blob],name,{type:'image/png'});
  if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:`${m.name} · Postgame`});return}catch(e){if(e?.name==='AbortError')return}}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-pg-share103]');if(!b)return;b.disabled=true;shareImage().finally(()=>{b.disabled=false})});
window.v103ShareProfile=shareImage;
})();
