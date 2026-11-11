/* POSTGAME v90 · Extended stats from EA match_event_aggregate events (no xG – EA doesn't send it).
   Event meanings: community research github.com/Interactive-63/eafc-pro-clubs-api-research (confirmed IDs only).
   Used in: match detail (Player Stats groups + team comparison), session detail, player profile, Analytics → Detailed. */
(function(){
'use strict';
const N=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function events(raw){const m=new Map();for(const [k,v] of Object.entries(raw||{})){if(!k.startsWith('match_event_aggregate_')||typeof v!=='string')continue;
  for(const t of v.split(/[;,| ]+/)){const x=t.match(/^(\d+):(-?\d+(?:\.\d+)?)$/);if(x)m.set(+x[1],(m.get(+x[1])||0)+(+x[2]||0))}}return m}
// One player's match, raw EA object -> extended numbers. hasEvents=false for old data without the event fields.
function ext(raw){if(!raw)return null;const m=events(raw),e=id=>m.get(id)||0,has=m.size>0;
  const passMade=N(raw.passesmade??raw.passesMade),passAtt=N(raw.passattempts??raw.passAttempts);
  const passC=e(215)||passMade,passF=m.has(216)?e(216):Math.max(0,passAtt-passMade);
  const on=e(217)||e(13)+e(18),off=e(218)||e(14)+e(19);
  return {hasEvents:has,matches:1,
   goals:N(raw.goals),shots:N(raw.shots),shotsOn:on,shotsOff:off,inBox:e(13)+e(14),outBox:e(18)+e(19),shotsSaved:e(202),
   gFirstTime:e(128),gWeakFoot:e(131),gChip:e(123),
   passC,passF,fwdC:e(30),fwdF:e(31),backC:e(32),backF:e(33),sideC:e(34),sideF:e(35),
   shortC:e(24),shortF:e(25),medC:e(26),medF:e(27),longC:e(28),longF:e(29),crossC:e(36),crossF:e(37),
   throughBalls:e(152),tbAssists:e(118),switches:e(144),firstTimePass:e(143),flair:e(147),
   dribbles:e(174),carries:e(97),beaten:e(112),skillBeats:e(38),dispossessed:e(158),
   tackles:N(raw.tacklesmade??raw.tacklesMade),tackleAtt:N(raw.tackleattempts??raw.tackleAttempts),tacklesLost:e(1),interceptions:e(6),
   possWonAtt:e(110),possLost:e(105)+e(106)+e(107),
   fouls:e(2)+e(3),foulsWon:e(4),yellows:e(95)+e(213),reds:N(raw.redcards??raw.redCards),offsides:e(104)}}
const SUM_KEYS=['matches','goals','shots','shotsOn','shotsOff','inBox','outBox','shotsSaved','gFirstTime','gWeakFoot','gChip','passC','passF','fwdC','fwdF','backC','backF','sideC','sideF','shortC','shortF','medC','medF','longC','longF','crossC','crossF','throughBalls','tbAssists','switches','firstTimePass','flair','dribbles','carries','beaten','skillBeats','dispossessed','tackles','tackleAtt','tacklesLost','interceptions','possWonAtt','possLost','fouls','foulsWon','yellows','reds','offsides'];
function sum(list){const t={hasEvents:false};for(const k of SUM_KEYS)t[k]=0;for(const x of list){if(!x)continue;if(x.hasEvents)t.hasEvents=true;for(const k of SUM_KEYS)t[k]+=N(x[k])}return t}
const pct=(a,b)=>b>0?Math.round(a/b*100):null;
const fmtPct=v=>v==null?'–':v+'%';
const ca=(c,f)=>`${c}/${c+f}`;
// Derived values shown in tables
function view(x){if(!x)return null;const passA=x.passC+x.passF;return {...x,passA,passPct:pct(x.passC,passA),shotAcc:pct(x.shotsOn,x.shotsOn+x.shotsOff),conv:pct(x.goals,x.shots),
  tklPct:pct(x.tackles,x.tackleAtt),crossPct:pct(x.crossC,x.crossC+x.crossF)}}

/* ---------- groups (label, cell, per-match number for averages) ---------- */
const G={
 shooting:{label:'Shooting',cols:[['Shots',v=>v.shots],['On target',v=>v.shotsOn],['Off target',v=>v.shotsOff],['In box',v=>v.inBox],['Outside',v=>v.outBox],['Accuracy',v=>fmtPct(v.shotAcc)],['Goals',v=>v.goals],['Conversion',v=>fmtPct(v.conv)]]},
 passing:{label:'Passing',cols:[['Passes',v=>ca(v.passC,v.passF)],['Pass %',v=>fmtPct(v.passPct)],['Forward',v=>ca(v.fwdC,v.fwdF)],['Short',v=>ca(v.shortC,v.shortF)],['Medium',v=>ca(v.medC,v.medF)],['Long',v=>ca(v.longC,v.longF)],['Crosses',v=>ca(v.crossC,v.crossF)],['Through',v=>v.throughBalls],['Switches',v=>v.switches]]},
 dribbling:{label:'Dribbling',cols:[['Dribbles',v=>v.dribbles],['Beaten',v=>v.beaten,'Opponents beaten on the dribble'],['Skill beats',v=>v.skillBeats],['Carries',v=>v.carries],['Dispossessed',v=>v.dispossessed]]},
 defending:{label:'Defending',cols:[['Tackles',v=>`${v.tackles}/${v.tackleAtt}`],['Tackle %',v=>fmtPct(v.tklPct)],['Tackles lost',v=>v.tacklesLost],['Interceptions',v=>v.interceptions],['Won high',v=>v.possWonAtt,'Possession won in the attacking third'],['Poss. lost',v=>v.possLost]]},
 discipline:{label:'Discipline',cols:[['Fouls',v=>v.fouls],['Fouls won',v=>v.foulsWon],['Yellow',v=>v.yellows],['Red',v=>v.reds],['Offside',v=>v.offsides,'EA sometimes under-counts offsides']]}};
const ORDER=['shooting','passing','dribbling','defending','discipline'];

/* ---------- raw lookup for a match detail object ---------- */
function rawPools(d){const pools=[];const add=(x,side)=>{if(!x)return;if(Array.isArray(x))x.forEach(y=>y&&pools.push({...y,_side:side}));else if(typeof x==='object')for(const [k,v] of Object.entries(x))if(v&&typeof v==='object')pools.push({...v,_pid:k,_side:side})};
  add(d.oursRaw,'ours');add(d.oppRaw,'opp');const raw=d.archive?.raw_json||d.archive?.raw||d.live||d.raw;const pl=raw?.players,cid=String(window.S?.club?.id||(typeof S!=='undefined'&&S?.club?.id)||'');
  if(pl&&typeof pl==='object')for(const [club,ps] of Object.entries(pl))add(ps,String(club)===cid?'ours':'opp');return pools}
function rawFor(pools,p){const id=String(p.id??p.player_id??''),name=p.name||p.player_name;return pools.find(r=>String(r._pid??r.playerId??r.id??'')===id)||pools.find(r=>name&&r.playername===name)||null}

/* ---------- match detail ---------- */
let group='general';
// v102.0.4: basic numbers EA always sends (shots, passes, tackles…) are shown even when the detailed event data is missing.
const BASE=new Set(['Shots','Goals','Conversion','Passes','Pass %','Tackles','Tackle %','Red']);
const cell=(c,v)=>!v?'–':(!v.hasEvents&&!BASE.has(c[0]))?'–':c[1](v);
function baseRaw(p){if(!p)return null;const g=(...ks)=>{for(const k of ks)if(p[k]!=null)return p[k];return null};if(g('shots','goals','passes','passes_made')==null)return null;
  return {goals:g('goals'),shots:g('shots'),passesmade:g('passes','passes_made','passesmade'),passattempts:g('passAttempts','pass_attempts','passattempts'),tacklesmade:g('tackles','tackles_made','tacklesmade'),tackleattempts:g('tackleAttempts','tackle_attempts','tackleattempts'),redcards:g('reds','red_cards','redcards')}}
function table(rows,key){const g=G[key];return `<div class="matchPlayerTableWrap73"><table class="matchPlayerTable73 ext90"><thead><tr><th>Player</th>${g.cols.map(c=>`<th${c[2]?` title="${esc(c[2])}"`:''}>${esc(c[0])}</th>`).join('')}</tr></thead><tbody>${rows.map(({p,v})=>`<tr><td><b>${esc(p.name||p.player_name||'Player')}</b></td>${g.cols.map(c=>`<td>${esc(cell(c,v))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function seg(){return `<div class="extSeg90" role="tablist">${[['general','General'],...ORDER.map(k=>[k,G[k].label])].map(([k,l])=>`<button type="button" data-ext90="${k}" class="${group===k?'active':''}">${l}</button>`).join('')}</div>`}
window.v90PlayerStats=function(d,generalHtml){
  const pools=rawPools(d);const mk=list=>(list||[]).map(p=>({p,v:view(ext(rawFor(pools,p)||baseRaw(p)))})).sort((a,b)=>N(b.p.rating)-N(a.p.rating));
  const ours=mk(d.ours),opp=mk(d.opp),any=[...ours,...opp].some(x=>x.v?.hasEvents);
  if(group==='general')return seg()+generalHtml;
  const note=any?'':'<p class="v78Note">EA sent only basic stats for this match (shots, goals, passes, tackles). The detailed breakdown (on target, in box, pass types, dribbles…) is missing – shown as –.</p>';
  return `${seg()}${note}<div class="matchSectionHead73"><span class="label">${esc(G[group].label.toUpperCase())}</span><h3>${esc(window.S?.club?.name||(typeof S!=='undefined'&&S?.club?.name)||'Our club')}</h3></div>${table(ours,group)}<div class="matchSectionHead73 opponent"><h3>${esc(d.opponent||'Opponent')}</h3></div>${table(opp,group)}`};
document.addEventListener('click',e=>{const b=e.target.closest('[data-ext90]');if(!b)return;group=b.dataset.ext90;try{window.v90Rerender?.()}catch{}});

// Team comparison bars for the match overview.
const CMP=[['Passes completed',v=>v.passC],['Pass accuracy',v=>v.passPct,'%'],['Shots on target',v=>v.shotsOn],['Shots inside box',v=>v.inBox],['Dribbles',v=>v.dribbles],['Opponents beaten',v=>v.beaten],['Possession lost',v=>v.possLost,'',true],['Fouls',v=>v.fouls,'',true],['Yellow cards',v=>v.yellows,'',true]];
function bars(a,b,rows){return rows.map(([l,f,u,low])=>{const x=f(a),y=f(b);if(x==null&&y==null)return'';const X=N(x),Y=N(y),t=X+Y||1,better=X===Y?0:(low?X<Y:X>Y)?1:-1;
  return `<div class="cmp90"><b class="${better>0?'win':''}">${x==null?'–':X+(u||'')}</b><div class="cmpBar90"><span style="width:${X/t*100}%"></span><i style="width:${Y/t*100}%"></i></div><b class="${better<0?'win':''}">${y==null?'–':Y+(u||'')}</b><small>${esc(l)}</small></div>`}).join('')}
window.v90MatchTeam=function(d){const pools=rawPools(d);const side=list=>view(sum((list||[]).map(p=>ext(rawFor(pools,p)))));const a=side(d.ours),b=side(d.opp);
  if(!a?.hasEvents&&!b?.hasEvents)return'';return `<section class="ext90card"><div class="extHead90"><span class="label">DETAILED</span><h3>Team comparison</h3></div>${bars(a,b,CMP)}</section>`};

/* ---------- aggregates from the archive (sessions, player profile, club) ---------- */
const D=()=>window.ClubroomV78?.data?.();
const cid=()=>String((typeof S!=='undefined'&&S?.club?.id)||'');
function clubSide(m,ours){const pl=m.raw?.players||{},id=cid();return Object.entries(pl).filter(([c])=>ours?String(c)===id:String(c)!==id).flatMap(([,ps])=>Object.entries(ps||{}).map(([pid,r])=>({pid,r})))}
function statBlock(title,v,n,perMatch){if(!v?.hasEvents)return'';const pm=k=>n?(v[k]/n).toFixed(1):'–';
  const tiles=[['Passes',`${v.passC}/${v.passA}`,`${fmtPct(v.passPct)} · ${pm('passC')} per match`],['Shots on target',`${v.shotsOn}/${v.shotsOn+v.shotsOff}`,`${fmtPct(v.shotAcc)} accuracy · ${v.inBox} in box`],['Dribbles',v.dribbles,`${v.beaten} opponents beaten · ${v.skillBeats} with skill moves`],['Tackles',`${v.tackles}/${v.tackleAtt}`,`${fmtPct(v.tklPct)} · ${v.interceptions} interceptions`],['Possession lost',v.possLost,`${pm('possLost')} per match · ${v.dispossessed} dispossessed`],['Discipline',`${v.fouls} fouls`,`${v.yellows} yellow · ${v.reds} red`]];
  return `<section class="ext90card"><div class="extHead90"><span class="label">${esc(title)}</span><h3>${perMatch||'Detailed stats'}</h3><small>${n} match${n===1?'':'es'} with EA event data</small></div><div class="extTiles90">${tiles.map(([k,a,b])=>`<div><span>${esc(k)}</span><b>${esc(a)}</b><small>${esc(b)}</small></div>`).join('')}</div>${breakdown(v,n)}</section>`}
function breakdown(v,n){return `<details class="extMore90"><summary>All detailed stats</summary>${ORDER.map(k=>`<div class="extGroup90"><b>${G[k].label}</b>${G[k].cols.map(c=>`<div><span${c[2]?` title="${esc(c[2])}"`:''}>${esc(c[0])}</span><em>${esc(c[1](v))}</em></div>`).join('')}</div>`).join('')}<p class="v78Note">Totals over ${n} matches. EA doesn't send xG, key passes or chances created.</p></details>`}
function matchesSum(ms,ours,pid){const xs=[];let n=0;for(const m of ms){const side=clubSide(m,ours).filter(x=>pid==null||String(x.pid)===String(pid));const e=side.map(x=>ext(x.r)).filter(Boolean);if(e.some(x=>x.hasEvents)){n++;xs.push(...e)}}const t=sum(xs);t.matches=n;return {v:view(t),n}}
window.v90SessionCard=function(s){if(!s?.matches?.length)return'';const {v,n}=matchesSum(s.matches,true);return statBlock('SESSION DETAIL',v,n,'Team detailed stats')};
window.v90PlayerCard=function(pid,altId){const d=D();if(!d)return'';let r=matchesSum(d.matches,true,pid);if(!r.n&&altId!=null)r=matchesSum(d.matches,true,altId);return statBlock('DETAILED',r.v,r.n,'Detailed stats')};
window.v90ClubHtml=function(){const d=D();if(!d?.matches?.length)return'<div class="msg">No archived matches yet.</div>';const us=matchesSum(d.matches,true),them=matchesSum(d.matches,false);
  if(!us.n)return'<div class="msg">EA has not sent detailed event data for the archived matches yet.</div>';
  const per=(v,n)=>{const o={...v};for(const k of SUM_KEYS)if(k!=='matches')o[k]=+(v[k]/Math.max(1,n)).toFixed(1);return o};
  return `${statBlock('CLUB · ALL ARCHIVED MATCHES',us.v,us.n,'Detailed stats')}<section class="ext90card"><div class="extHead90"><span class="label">PER MATCH</span><h3>Us vs opponents</h3><small>Average per match</small></div>${bars(per(us.v,us.n),per(them.v,them.n),CMP.map(([l,f,u,low])=>[l,u==='%'?f:(v=>f(v)),u,low]))}</section>`};
window.CLUBROOM_EXT90={events,ext,sum,view,G};
// Squad Board: merge per-player event sums into the board's data object (cached per archive size).
let sqCache={key:'',map:new Map()};
function squadExt(p){const d=D();if(!d?.matches?.length)return null;const key=cid()+':'+d.matches.length;if(sqCache.key!==key)sqCache={key,map:new Map()};const id=String(p.id);if(sqCache.map.has(id))return sqCache.map.get(id);
  let alt=null;for(const q of d.players?.values?.()||[])if(String(q.liveId)===id||String(q.id)===id){alt=q.id;break}
  let r=matchesSum(d.matches,true,id);if(!r.n&&alt!=null&&String(alt)!==id)r=matchesSum(d.matches,true,alt);const v=r.n?r.v:null;const out=v?{eventMatches:r.n,xShotsOn:v.shotsOn,xShotAcc:v.shotAcc,xInBox:v.inBox,xOutBox:v.outBox,xConv:v.conv,xFwd:v.fwdC,xLong:v.longC,xCross:v.crossC,xSwitch:v.switches,xDribbles:v.dribbles,xBeaten:v.beaten,xSkill:v.skillBeats,xCarries:v.carries,xDisp:v.dispossessed,xPossLost:v.possLost,xTklLost:v.tacklesLost,xWonHigh:v.possWonAtt,xFouls:v.fouls,xFoulsWon:v.foulsWon,xYellow:v.yellows,xRed:v.reds,xOffside:v.offsides}:{eventMatches:0};
  sqCache.map.set(id,out);return out}
if(typeof squadBoardData70==='function'){const base=squadBoardData70;squadBoardData70=function(p){const d=base(p);try{Object.assign(d,squadExt(p)||{eventMatches:0})}catch{}return d}}

/* ---------- mounting ---------- */
// Player profile: card under the radar, re-rendered whenever the profile changes.
let lastPid='';function mountProfile(){const m=location.pathname.match(/\/club\/[^/]+\/player\/([^/]+)/);const host0=document.getElementById('playerStrengths69');if(!m||!host0)return;
  const pid=decodeURIComponent(m[1]);let host=document.getElementById('playerDetail90');if(!host){host=document.createElement('div');host.id='playerDetail90';(host0.closest('section.playerRadarSection69')||host0.parentElement).after(host)}
  const key=pid+':'+(D()?.matches?.length||0);if(key===lastPid&&host.innerHTML)return;lastPid=key;const p=D()?.players?.get?.(pid);host.innerHTML=window.v90PlayerCard(pid,p?.liveId)}
new MutationObserver(()=>mountProfile()).observe(document.body,{childList:true,subtree:true,characterData:true});
// Analytics → Detailed
function renderClub(){const host=document.getElementById('analyticsDetailed90');if(host)host.innerHTML=window.v90ClubHtml()}
document.addEventListener('click',e=>{if(e.target.closest('[data-analytics-tab="detailed"]'))setTimeout(renderClub,0)});
if(typeof loadHistory==='function'){const prev=loadHistory;loadHistory=async function(...a){const r=await prev.apply(this,a);lastPid='';sqCache={key:'',map:new Map()};try{renderClub();mountProfile();if(typeof renderSquadBoard70==='function')renderSquadBoard70()}catch{}return r}}
})();
