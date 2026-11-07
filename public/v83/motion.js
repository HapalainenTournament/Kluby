/* CLUBROOM v83 · minimal motion helpers: count-up numbers, staggered entrance, growing bars, drawn chart lines.
   Runs on newly rendered nodes only; does nothing with prefers-reduced-motion. */
(function(){
'use strict';
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const RISE='.pulse78,.recCard78,.sMatch81,.trophy78,.sCard81,.threatCard44,.v78Panel,.liveCard81,.clubStreaks78>div,.sMetrics81>div,.award78,.wrapSlot78,.creRow78,.sLb81,.luckRow78,.msRow78,.overviewSection44,.duel81,.gk81,.pNode82';
const GROW='.luckTrack78 i,.msTrack78 i,.achTrack78 i,.creTrack78 i,.sLbTrack81 i,.butterflyBar73 i';
const GROWY='.habitTrack78 span,.fatigueBars81 i';
const POP='.pulseForm78 i,.liveForm81 i,.sCardForm81 i,.formPills .formPill,.pBadges82 i';
const COUNT='.pulse78 strong,.clubStreaks78 strong,.sMetrics81 b,.heroMetrics44 b,.liveStat81 b,.scoreFacts78 strong,.awardVal78 b,.wrapBig78,.duelSide81 strong';
const done=new WeakSet();
function stagger(list,cls){const groups=new Map();for(const el of list){if(done.has(el))continue;done.add(el);const p=el.parentElement;const i=groups.get(p)||0;groups.set(p,i+1);el.style.setProperty('--i',Math.min(i,12));el.classList.add(cls)}}
function countUp(el){if(done.has(el))return;done.add(el);const node=[...el.childNodes].find(n=>n.nodeType===3&&/\d/.test(n.textContent));if(!node)return;const txt=node.textContent.trim(),m=txt.match(/^([+\-]?)(\d+(?:\.\d+)?)(%?)$/);if(!m)return;
  const sign=m[1],target=parseFloat(m[2]),dec=(m[2].split('.')[1]||'').length,suf=m[3];if(target===0)return;const t0=performance.now(),dur=Math.min(1100,500+target*8);
  const step=t=>{const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);node.textContent=sign+(target*e).toFixed(dec)+suf;if(k<1)requestAnimationFrame(step);else node.textContent=txt};requestAnimationFrame(step)}
function drawLines(root){root.querySelectorAll('.sChart81 polyline:not(.team)').forEach(pl=>{if(done.has(pl))return;done.add(pl);try{const len=Math.ceil(pl.getTotalLength())||1200;pl.style.setProperty('--len',len);pl.classList.add('draw83')}catch{}})}
function scan(root){if(!(root instanceof Element))return;const q=s=>[...(root.matches(s)?[root]:[]),...root.querySelectorAll(s)];
  stagger(q(RISE),'rise83');stagger(q(GROW),'grow83');stagger(q(GROWY),'growY83');stagger(q(POP),'pop83');q(COUNT).forEach(countUp);drawLines(root)}
let queued=new Set(),raf=0;
const mo=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)queued.add(n);if(!raf)raf=requestAnimationFrame(()=>{raf=0;const list=[...queued];queued=new Set();for(const n of list)if(n.isConnected)scan(n)})});
mo.observe(document.body,{childList:true,subtree:true});
scan(document.body);
// re-run entrance when a tab becomes visible (tabs are toggled, not re-rendered)
document.addEventListener('click',e=>{const b=e.target.closest('[data-tab],[data-misc-tab],[data-analytics-tab]');if(!b)return;requestAnimationFrame(()=>{document.querySelectorAll('.tabPane.active .rise83, [data-misc-pane]:not([hidden]) .rise83, .analyticsPane37.active .rise83').forEach(el=>{el.classList.remove('rise83');void el.offsetWidth;el.classList.add('rise83')})})});
})();
