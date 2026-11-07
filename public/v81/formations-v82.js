/* CLUBROOM v82 · Match formations: real lines from EA positions, attack always upwards, play-style icons.
   EA only sends the broad position (GK/DEF/MID/FWD) for human players, so players are placed on their line
   and spread evenly – no invented exact coordinates. */
(function(){
'use strict';
const V=window.ClubroomV78;if(!V)return;
const esc=v=>escapeHtml(String(v??''));const n0=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const LINE=pos=>{const p=String(pos||'').toUpperCase();if(/GK|GOAL/.test(p))return 'GK';if(/CB|LB|RB|WB|DEF/.test(p))return 'DEF';if(/CM|CAM|CDM|LM|RM|MID/.test(p))return 'MID';return 'FWD'};
// line height on a pitch where the opponent goal is at the TOP (0 %) and our goal at the BOTTOM (100 %)
const Y={FWD:22,MID:46,DEF:70,GK:88};
/* Play styles – decided from per-match numbers (opponents) or the archive career (our players, if enough matches). */
const STYLES={
 keeper:{label:'Keeper',icon:'glove',color:'#7cc8ff'},
 finisher:{label:'Finisher',icon:'target',color:'#f472b6'},
 playmaker:{label:'Playmaker',icon:'compass',color:'#5eead4'},
 dribbler:{label:'Dribbler',icon:'spark',color:'#a78bfa'},
 engine:{label:'Engine',icon:'bolt',color:'#f8d778'},
 wall:{label:'Wall',icon:'shield',color:'#60a5fa'},
 support:{label:'Support',icon:'wave',color:'#94a3b8'}};
window.CLUBROOM_PLAY_STYLES=STYLES;
// Style = the component where a player is furthest above the baseline (team career average, or this match's players).
const COMP={finisher:x=>x.goals+0.3*x.shots,playmaker:x=>x.assists+0.5*x.second+0.2*x.through,dribbler:x=>x.dribbles,engine:x=>x.passes+3*x.tackles,wall:x=>x.tackles+x.inter};
const LINE_DEFAULT={DEF:'wall',MID:'engine',FWD:'finisher'};
function baseline(list){const b={};for(const k in COMP){const v=list.map(COMP[k]);b[k]=v.length?v.reduce((a,c)=>a+c,0)/v.length:0}return b}
function styleFrom(x,line,base){if(line==='GK')return 'keeper';let best=null,score=0;for(const k in COMP){const b=base[k];if(!b)continue;const r=COMP[k](x)/b;if(r>score){score=r;best=k}}return score>=1.15?best:(LINE_DEFAULT[line]||'support')}
function matchNums(p){return {goals:n0(p.goals),shots:n0(p.shots),assists:n0(p.assists),second:n0(p.secondAssists??p.second_assists),through:n0(p.throughBalls??p.through_balls),dribbles:n0(p.dribbles),tackles:n0(p.tackles??p.tackles_made),inter:n0(p.interceptions),passes:n0(p.passes??p.passes_made)}}
function careerNums(id){const pl=V.data()?.players.get(String(id));if(!pl||pl.rows.length<5)return null;const R=pl.rows,n=R.length,s=k=>R.reduce((a,r)=>a+n0(r[k]),0)/n;return {goals:s('goals'),shots:s('shots'),assists:s('assists'),second:s('second_assists'),through:s('through_balls'),dribbles:s('dribbles'),tackles:s('tackles_made'),inter:s('interceptions'),passes:s('passes_made')}}
function careerBaseline(){const ps=[...(V.data()?.players.values()||[])].filter(p=>p.rows.length>=5&&!/goal|gk/i.test(p.position||''));return ps.length>=2?baseline(ps.map(p=>careerNums(p.id))):null}
let matchBase=null;
function playStyle(p,ours){const line=LINE(p.pos||p.position);const c=ours?careerNums(p.id):null,cb=c?careerBaseline():null;if(c&&cb)return {key:styleFrom(c,line,cb),fromCareer:true};return {key:styleFrom(matchNums(p),line,matchBase||baseline([matchNums(p)])),fromCareer:false}}
window.clubroomPlayStyle82=playStyle;
const tone=r=>r>=8.5?'elite':r>=7.5?'good':r>=6.5?'ok':r>0?'poor':'none';
function pitchHtml(rows,ours){if(!rows?.length)return '<div class="matchEmpty73">Player positions not provided by EA.</div>';
  const lines={GK:[],DEF:[],MID:[],FWD:[]};for(const p of rows)lines[LINE(p.pos||p.position)].push(p);
  const nodes=[];for(const [ln,list] of Object.entries(lines)){list.sort((a,b)=>String(a.name).localeCompare(String(b.name)));list.forEach((p,i)=>{const x=(i+1)/(list.length+1)*100;nodes.push({p,ln,x,y:Y[ln]})})}
  return `<div class="pitch82" role="img" aria-label="Formation, attacking upwards">
   <svg class="pitchLines82" viewBox="0 0 68 105" preserveAspectRatio="none" aria-hidden="true"><rect x="1" y="1" width="66" height="103" rx="2"/><line x1="1" y1="52.5" x2="67" y2="52.5"/><circle cx="34" cy="52.5" r="9.15"/><circle cx="34" cy="52.5" r=".6" class="dot"/><rect x="13.85" y="1" width="40.3" height="16.5"/><rect x="24.85" y="1" width="18.3" height="5.5"/><rect x="13.85" y="87.5" width="40.3" height="16.5"/><rect x="24.85" y="98.5" width="18.3" height="5.5"/><circle cx="34" cy="12" r=".6" class="dot"/><circle cx="34" cy="93" r=".6" class="dot"/></svg>
   <span class="attackArrow82">${V.icon('up',14)} ATTACK</span>
   ${nodes.map(({p,x,y})=>{const st=playStyle(p,ours),S2=STYLES[st.key],r=n0(p.rating);
     return `<button type="button" class="pNode82" style="left:${x}%;top:${y}%;--sc:${S2.color}" ${ours&&p.id?`data-player-open73="${esc(p.id)}"`:''} title="${esc(p.name)} · ${S2.label}${st.fromCareer?' (career style)':' (this match)'}">
      <span class="pName82">${esc(p.name)}</span>
      <span class="pBadges82">${n0(p.goals)?`<i class="g">${V.icon('ball',11)}${n0(p.goals)}</i>`:''}${n0(p.assists)?`<i class="a"><em>A</em>${n0(p.assists)}</i>`:''}${n0(p.motm)?`<i class="m">${V.icon('star',11)}</i>`:''}</span>
      <span class="pRating82 ${tone(r)}">${r>0?r.toFixed(1):'--'}</span>
      <span class="pIcon82">${V.icon(S2.icon,22)}${n0(p.reds??p.red_cards)?'<i class="rc"></i>':''}</span>
      <span class="pStyle82">${S2.label}</span></button>`}).join('')}
  </div>`}
let side='ours';
window.v82Formations=function(d){matchBase=baseline([...(d.ours||[]),...(d.opp||[])].filter(p=>LINE(p.pos||p.position)!=='GK').map(matchNums));const hasO=d.ours?.length,hasT=d.opp?.length;if(!hasO&&!hasT)return '<div class="matchEmpty73">Formation not provided by EA.</div>';
  const cur=side==='opp'&&hasT?'opp':'ours',rows=cur==='ours'?d.ours:d.opp,name=cur==='ours'?(S.club?.name||'Our club'):d.opponent,shape=cur==='ours'?d.formationO:d.formationT;
  const counts=['DEF','MID','FWD'].map(l=>(rows||[]).filter(p=>LINE(p.pos||p.position)===l).length).filter(Boolean).join('-');
  const used=[...new Set((rows||[]).map(p=>playStyle(p,cur==='ours').key))];
  return `<div class="formation82"><div class="v78Segment formSide82"><button type="button" data-form-side82="ours" class="${cur==='ours'?'active':''}">${esc(S.club?.name||'Our club')}</button><button type="button" data-form-side82="opp" class="${cur==='opp'?'active':''}" ${hasT?'':'disabled'}>${esc(d.opponent)}</button></div>
   <div class="formHead82"><div><b>${esc(name)}</b><small>${shape?`EA formation ${esc(shape)} · `:''}${(rows||[]).length} human players${counts?` · lines ${counts}`:''}</small></div><span class="formNote82">${V.icon('up',13)} attacking up</span></div>
   ${pitchHtml(rows,cur==='ours')}
   <div class="styleLegend82">${used.map(k=>`<span style="--sc:${STYLES[k].color}">${V.icon(STYLES[k].icon,14)}${STYLES[k].label}</span>`).join('')}</div>
   <p class="v78Note">EA sends only each human player's line (GK, DEF, MID, FWD), so players are spread evenly on their line. AI teammates are not included in EA data. Our players' style comes from their archive career (5+ matches), otherwise from this match.</p></div>`};
document.addEventListener('click',e=>{const b=e.target.closest('[data-form-side82]');if(!b||b.disabled)return;side=b.dataset.formSide82;const d=window.matchState73?.current;const host=document.querySelector('#matchTabContent73 .matchFormations73');if(d&&host)host.innerHTML=`<div class="matchSectionHead73"><span class="label">FORMATIONS</span><h3>Team shapes</h3></div>${window.v82Formations(d)}`;registerAvatarRoster?.()});
})();
