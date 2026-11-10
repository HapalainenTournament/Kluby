/* POSTGAME v101 · Compare: two clearly separated sources (EA career vs Postgame archive), 2 players free, up to 4 with Postgame Pass. */
(function(){
'use strict';
const N=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const chip=k=>typeof srcChip100==='function'?srcChip100(k):'';
const pass=()=>{try{return !!window.ClubroomPass?.active?.()}catch{return false}};
const club=()=>String((typeof S!=='undefined'&&S?.club?.id)||'');
const LSK=()=>`clubroom101:extra:${club()}`;
const getExtra=()=>{try{return JSON.parse(localStorage.getItem(LSK())||'[]').filter(Boolean).slice(0,2)}catch{return[]}};
const setExtra=a=>{try{localStorage.setItem(LSK(),JSON.stringify(a.slice(0,2)))}catch{}};
const COLORS=['#2dd4bf','#f8b84e','#a78bfa','#f472b6'];
const MAX=()=>pass()?4:2;

function dbRow(p){return (S.history?.players||[]).find(x=>String(x.player_id)===String(p.id)||[p.name,p.accountName].filter(Boolean).some(n=>[x.player_name,x.pro_name].filter(Boolean).some(z=>String(z).toLowerCase()===String(n).toLowerCase())))||null}
// Career = EA's own totals for this club. Archive = the matches Postgame stored.
function sources(p){const db=dbRow(p),am=N(db?.matches);
  const career={games:N(p.games),goals:N(p.goals),assists:N(p.assists),ga:N(p.goals)+N(p.assists),motm:N(p.motm),rating:N(p.rating)||null};
  const arch=db&&am?{games:am,goals:N(db.goals),assists:N(db.assists),second:N(db.second_assists),ga:N(db.goals)+N(db.assists),motm:N(db.motm),rating:N(db.rating)||null,shots:N(db.shots),passes:N(db.passes_made),passAtt:N(db.pass_attempts),tackles:N(db.tackles_made),tackleAtt:N(db.tackle_attempts),dribbles:N(db.dribbles),inter:N(db.interceptions),saves:N(db.saves)}:null;
  // EA career can lag behind the archive for a moment right after a match
  if(arch&&arch.games>career.games){career.games=arch.games;career.goals=Math.max(career.goals,arch.goals);career.assists=Math.max(career.assists,arch.assists);career.ga=career.goals+career.assists;career.motm=Math.max(career.motm,arch.motm)}
  return {p,career,arch,coverage:career.games?Math.min(100,Math.round((arch?.games||0)/career.games*100)):0}}

function players(){const a=S.players.find(x=>x.id===$('#cmpA')?.value),b=S.players.find(x=>x.id===$('#cmpB')?.value);const out=[a,b].filter(Boolean);
  if(pass())for(const id of getExtra()){const p=S.players.find(x=>String(x.id)===String(id));if(p&&!out.includes(p))out.push(p)}return out.slice(0,MAX())}

const per=(v,m)=>m?v/m:null,pc=(a,b)=>b?a/b*100:null;
const f1=v=>v==null?'—':Number(v).toFixed(2),fi=v=>v==null?'—':String(Math.round(v)),fp=v=>v==null?'—':Number(v).toFixed(1)+'%';
const CAREER_ROWS=[['Matches',x=>x.games,fi],['Goals',x=>x.goals,fi],['Assists',x=>x.assists,fi],['G+A',x=>x.ga,fi],['MOTM',x=>x.motm,fi],['Goals / match',x=>per(x.goals,x.games),f1],['G+A / match',x=>per(x.ga,x.games),f1],['MOTM rate',x=>pc(x.motm,x.games),fp]];
const ARCH_ROWS=[['Matches',x=>x.games,fi,'n'],['Avg rating',x=>x.rating,f1],['Goals / match',x=>per(x.goals,x.games),f1],['Assists / match',x=>per(x.assists,x.games),f1],['Second assists / match',x=>per(x.second,x.games),f1],['Shots / match',x=>per(x.shots,x.games),f1],['Shot conversion',x=>x.shots>=10?pc(x.goals,x.shots):null,fp],['Passes / match',x=>per(x.passes,x.games),f1],['Pass accuracy',x=>x.passAtt?pc(x.passes,x.passAtt):null,fp],['Tackles / match',x=>per(x.tackles,x.games),f1],['Tackle success',x=>x.tackleAtt?pc(x.tackles,x.tackleAtt):null,fp],['Dribbles / match',x=>per(x.dribbles,x.games),f1],['Interceptions / match',x=>per(x.inter,x.games),f1],['Saves / match',x=>per(x.saves,x.games),f1,'gk'],['MOTM rate',x=>pc(x.motm,x.games),fp]];

function table(list,key,rows){const cols=list.length;
  const body=rows.map(([label,fn,fmt,flag])=>{const vals=list.map(s=>{const src=s[key];return src?fn(src):null});if(flag==='gk'&&!vals.some(v=>v))return'';
    const fin=vals.filter(v=>v!=null&&Number.isFinite(v)),best=flag==='n'||fin.length<2?null:Math.max(...fin);const nb=vals.filter(v=>v===best).length;
    return `<tr><th scope="row">${esc(label)}</th>${vals.map((v,i)=>`<td class="${best!=null&&v===best&&nb<cols&&v>0?'best':''}" style="--c:${COLORS[i]}">${fmt(v)}</td>`).join('')}</tr>`}).join('');
  return `<div class="cmpWrap101"><table class="cmpTable101" style="--cols:${cols}"><thead><tr><th></th>${list.map((s,i)=>`<th style="--c:${COLORS[i]}"><span>${esc(s.p.name)}</span></th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`}

function card(s,i,removable){const pos=typeof cardPos==='function'?cardPos(s.p.position):s.p.position;
  return `<div class="cmpCard101" style="--c:${COLORS[i]}"><button type="button" class="cmpPick101" data-cmp101-pick="${i}" aria-label="Change player">${typeof avatarMarkup==='function'?avatarMarkup(s.p,'bust'):''}<span class="cmpMeta101"><small>PLAYER ${'ABCD'[i]}</small><strong>${esc(s.p.name)}</strong><em>${esc(pos||'--')}</em></span></button>
   ${removable?`<button type="button" class="cmpRemove101" data-cmp101-remove="${i}" aria-label="Remove player">×</button>`:''}
   <div class="cmpCov101"><div><span>${chip('ea')} ${s.career.games} career</span><span>${chip('ar')} ${s.arch?.games||0} archived</span></div><span class="bar101"><b style="width:${s.coverage}%"></b></span><small>${s.coverage}% of career matches are in the Postgame archive</small></div></div>`}

function render(){
  const list=players().map(sources);if(list.length<2)return;
  const head=$('#compareHeader62');if(head){const add=list.length<4?(pass()?`<button type="button" class="cmpAdd101" data-cmp101-add><b>+</b><span>Add player</span><small>${4-list.length} more with Pass</small></button>`:`<a class="cmpAdd101 locked" href="/pass/checkout?club=${encodeURIComponent(club())}"><b>4</b><span>Compare up to 4 players</span><small>with Postgame Pass</small></a>`):'';
    head.className='compareHeader62 cmpHead101';head.innerHTML=list.map((s,i)=>card(s,i,i>=2)).join('')+add+(list.length===2?`<button type="button" class="compareSwap62 cmpSwap101" data-compare-swap62 aria-label="Swap players">⇄</button>`:'')}
  const cov=$('#compareCoverage');if(cov){cov.className='cmpCovHost101';const diff=list.map(s=>s.arch?.games||0),uneven=Math.max(...diff)-Math.min(...diff)>2;
    cov.innerHTML=`<div class="cmpExplain101"><div><h4>${chip('ea')} EA career</h4><p>Totals EA keeps for every match each player has played for this club – including matches from before the club was opened in Postgame. EA only gives a few totals, so this section is short.</p></div><div><h4>${chip('ar')} Postgame archive</h4><p>Only matches Postgame has stored, but with full match detail. That's why matches and goals can be lower here than in the career – and why detailed stats exist only here.</p></div></div>${uneven?`<p class="cmpWarn101">These players have a different number of archived matches (${diff.join(' vs ')}), so compare the per-match values.</p>`:''}`}
  const body=$('#compareBody');if(body)body.innerHTML=`<section class="cmpSec101"><header><h3>${chip('ea')} Career</h3><small>EA totals for this club</small></header>${table(list,'career',CAREER_ROWS)}</section>
   <section class="cmpSec101"><header><h3>${chip('ar')} Postgame archive</h3><small>Per match, from stored matches – fair even when match counts differ</small></header>${list.some(s=>s.arch)?table(list,'arch',ARCH_ROWS):'<div class="msg">No archived matches for these players yet.</div>'}</section>`;
  try{registerAvatarRoster?.()}catch{}}

/* ---------- picking players (reuses the existing picker modal) ---------- */
let slot=0;
const prevOpen=window.openComparePicker62,prevChoose=window.chooseComparePlayer62;
window.openComparePicker62=function(side){slot=side==='b'?1:side==='a'?0:Number(side)||0;if(slot<2)return prevOpen(slot===1?'b':'a');comparePickerSide62='x';const modal=ensureComparePicker62();modal.hidden=false;modal.querySelector('#comparePickerTitle62').textContent=`Choose player ${'ABCD'[slot]}`;const input=modal.querySelector('.comparePickerSearch62');input.value='';renderComparePicker62();setTimeout(()=>input.focus(),0)};
const prevRenderPicker=window.renderComparePicker62;
window.renderComparePicker62=function(){if(comparePickerSide62!=='x')return prevRenderPicker();const modal=ensureComparePicker62(),grid=modal.querySelector('.comparePickerGrid62'),q=String(modal.querySelector('.comparePickerSearch62').value||'').trim().toLowerCase();const taken=new Set(players().map(p=>String(p.id)));
  const list=(S.players||[]).filter(p=>!q||String(p.name||'').toLowerCase().includes(q));grid.innerHTML=list.map(p=>{const id=String(p.id),used=taken.has(id);return `<button type="button" class="comparePickerItem62" data-compare-player62="${esc(id)}" ${used?'disabled':''}>${typeof avatarMarkup==='function'?avatarMarkup(p,'mini'):''}<span><strong>${esc(p.name)}</strong></span><em>${used?'Already compared':'Choose'}</em></button>`}).join('')||'<div class="msg">No players found.</div>'};
window.chooseComparePlayer62=function(id){if(comparePickerSide62!=='x')return prevChoose(id);const ex=getExtra();ex[slot-2]=String(id);setExtra(ex.filter(Boolean));closeComparePicker62();render()};
document.addEventListener('click',e=>{
  const pk=e.target.closest('[data-cmp101-pick]');if(pk){window.openComparePicker62(['a','b',2,3][+pk.dataset.cmp101Pick]);return}
  if(e.target.closest('[data-cmp101-add]')){const n=players().length;window.openComparePicker62(n);return}
  const rm=e.target.closest('[data-cmp101-remove]');if(rm){const ex=getExtra();ex.splice(+rm.dataset.cmp101Remove-2,1);setExtra(ex);render()}});

// The original compare() keeps the selects in sync; then we draw our layout on top.
const prevCompare=window.compare;
window.compare=function(...a){try{prevCompare?.apply(this,a)}catch{}render()};
window.v101CompareRender=render;
})();
