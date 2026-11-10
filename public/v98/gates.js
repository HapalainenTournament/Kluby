/* POSTGAME v98 · Free / reward ad (12 h) / Pass-only gating + display ad slots.
   One rewarded ad unlocks ALL reward features for that club in this browser for 12 hours. Pass clubs: everything open, no ads.
   Gates are only active when ads are configured (window.CLUBROOM_ADS.on) – or for testing with ?gates=1.
   Pass-only features (player radar) are always gated for non-Pass clubs. */
(function(){
'use strict';
const ADS=window.CLUBROOM_ADS||{on:false};
const qs=new URLSearchParams(location.search);
const TEST=qs.get('gates')==='1';
const HOURS=12;
const REWARD_ON=()=>ADS.on||TEST;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const club=()=>(typeof S!=='undefined'&&S?.club)||null;
const cid=()=>String(club()?.id||'');
const pass=()=>{try{return !!window.ClubroomPass?.active?.()}catch{return false}};
const key=()=>`clubroom98:unlock:${cid()}`;
const unlockedAt=()=>{try{return Number(localStorage.getItem(key()))||0}catch{return 0}};
const rewardOpen=()=>!REWARD_ON()||pass()||Date.now()-unlockedAt()<HOURS*3600e3;
const leftLabel=()=>{const ms=HOURS*3600e3-(Date.now()-unlockedAt());if(ms<=0)return'';const h=Math.floor(ms/3600e3),m=Math.floor(ms%3600e3/60000);return h?`${h} h ${m} min`:`${m} min`};
window.CR_GATES={open:t=>t==='pass'?pass():rewardOpen(),prompt:()=>openModal(),hours:HOURS,passActive:pass};

/* ---------- what is gated where ---------- */
// [selector, tier, label]. tier: 'reward' (ad or Pass) | 'pass' (Pass only)
const TARGETS=[
 ['.miscPane78:not([data-misc-pane="records"])','reward','Misc insights'],
 ['[data-analytics-pane="impact"]','reward','Impact'],
 ['[data-analytics-pane="development"]','reward','Development'],
 ['[data-analytics-pane="fatigue"]','reward','Session fatigue'],
 ['[data-analytics-pane="when"]','reward','When we win'],
 ['[data-analytics-pane="detailed"]','reward','Detailed stats'],
 ['#playerDetail90','reward','Detailed stats'],
 ['.sDetail81 .ext90card','reward','Session detailed stats'],
 ['.sAwards81','reward','Session awards'],
 ['.playerRadarSection69','pass','Player radar']];
const SQUAD_X=new Set(['shooting','dribbling','discipline']);

function overlay(tier,label){const lockSvg='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>';
  const c=cid();return tier==='pass'
  ?`<div class="gateCard98 pass">${lockSvg}<span class="gateTag98">POSTGAME PASS</span><h4>${esc(label)}</h4><p>See how this player compares with every player Postgame tracks in the same position.</p><a class="passCta78" href="/pass/checkout${c?`?club=${encodeURIComponent(c)}`:''}">Get Pass · 4 €/month</a></div>`
  :`<div class="gateCard98">${lockSvg}<h4>Unlock ${esc(label)}</h4><p>Watch one short ad and <b>everything</b> locked opens for this club for ${HOURS} hours.</p><div class="gateBtns98"><button type="button" class="gateAd98" data-gate98>▶ Watch a short ad</button><a class="gatePass98" href="/pass/checkout${c?`?club=${encodeURIComponent(c)}`:''}">No ads with Pass</a></div>${TEST&&!ADS.on?'<small>Test mode: the ad is a 5-second placeholder.</small>':''}</div>`}
function setGate(el,locked,tier,label){if(!el)return;el.classList.toggle('gated98',locked);let ov=[...el.children].find(x=>x.classList?.contains('gate98'));
  if(locked&&!ov){ov=document.createElement('div');ov.className='gate98';ov.innerHTML=overlay(tier,label);el.appendChild(ov)}else if(!locked&&ov)ov.remove()}
function apply(){if(!cid())return;const rOpen=rewardOpen(),pOpen=pass();
  for(const [sel,tier,label] of TARGETS)document.querySelectorAll(sel).forEach(el=>setGate(el,tier==='pass'?!pOpen:!rOpen,tier,label));
  // Squad Board: only the detailed event groups
  const board=document.querySelector('.squadBoardScroller70');if(board){const g=document.querySelector('[data-squad-group70].active')?.dataset.squadGroup70;setGate(board.parentElement,!rOpen&&SQUAD_X.has(g),'reward',`${g?g[0].toUpperCase()+g.slice(1):'Detailed'} stats`)}
  // Match detail: detailed groups
  const mp=document.querySelector('.matchPlayers73');if(mp){const g=mp.querySelector('[data-ext90].active')?.dataset.ext90||'general';const host=mp.querySelector('.ext90')?.closest('.matchPlayers73');setGate(host,!rOpen&&g!=='general','reward',`${g[0].toUpperCase()+g.slice(1)} stats`)}
  const st=document.getElementById('unlockState98');if(st){const l=leftLabel();st.hidden=!(REWARD_ON()&&!pass()&&l);st.textContent=l?`Unlocked · ${l} left`:''}
  fillSlots()}
let q=0;const schedule=()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;try{apply()}catch(e){console.warn('gates',e)}})};
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
setInterval(schedule,60000);

/* ---------- reward ad ---------- */
function grant(){try{localStorage.setItem(key(),String(Date.now()))}catch{}closeModal();schedule();toast(`Unlocked for ${HOURS} hours – enjoy!`)}
let busy=false;
function playPlaceholder(btn){let s=5;btn.disabled=true;btn.textContent=`Ad… ${s}`;const t=setInterval(()=>{s--;if(s>0)btn.textContent=`Ad… ${s}`;else{clearInterval(t);busy=false;grant()}},1000)}
function playRewarded(btn){
  if(!ADS.on||!ADS.rewarded||!window.googletag){playPlaceholder(btn);return}
  btn.disabled=true;btn.textContent='Loading ad…';let done=false;const fail=()=>{if(done)return;done=true;busy=false;grant()}; // no fill → don't punish the user
  const gt=window.googletag;gt.cmd.push(()=>{const slot=gt.defineOutOfPageSlot(ADS.rewarded,gt.enums.OutOfPageFormat.REWARDED);if(!slot){fail();return}
    slot.addService(gt.pubads());
    const ready=e=>{if(e.slot===slot){btn.textContent='Playing…';e.makeRewardedVisible()}},granted=e=>{if(e.slot===slot){done=true;busy=false;grant()}},
      closed=e=>{if(e.slot!==slot)return;gt.destroySlots([slot]);gt.pubads().removeEventListener('rewardedSlotReady',ready);gt.pubads().removeEventListener('rewardedSlotGranted',granted);gt.pubads().removeEventListener('rewardedSlotClosed',closed);if(!done){busy=false;btn.disabled=false;btn.textContent='▶ Watch a short ad';toast('Watch the whole ad to unlock.')}},
      empty=e=>{if(e.slot===slot&&e.isEmpty)fail()};
    gt.pubads().addEventListener('rewardedSlotReady',ready);gt.pubads().addEventListener('rewardedSlotGranted',granted);gt.pubads().addEventListener('rewardedSlotClosed',closed);gt.pubads().addEventListener('slotRenderEnded',empty);
    gt.enableServices();gt.display(slot);setTimeout(()=>{if(!done&&btn.textContent==='Loading ad…')fail()},12000)})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-gate98]');if(!b||busy)return;busy=true;playRewarded(b)});

/* ---------- modal (used for Form 20/30 etc.) ---------- */
function openModal(){let m=document.getElementById('gateModal98');if(!m){m=document.createElement('div');m.id='gateModal98';m.className='gateModal98';m.addEventListener('click',e=>{if(e.target===m)closeModal()});document.body.appendChild(m)}
  m.innerHTML=`<div role="dialog" aria-modal="true" aria-label="Unlock">${overlay('reward','more stats')}<button type="button" class="gateClose98" aria-label="Close">×</button></div>`;m.classList.add('open');m.querySelector('.gateClose98').onclick=closeModal}
function closeModal(){document.getElementById('gateModal98')?.classList.remove('open')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
function toast(t){let el=document.getElementById('toast96');if(!el){el=document.createElement('div');el.id='toast96';document.body.appendChild(el)}el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),3000)}

/* ---------- display ads (AdSense units), never for Pass clubs ---------- */
const SLOTS=[['[data-pane="stats"]','overview'],['[data-pane="matches"]','matches'],['[data-pane="analytics"]','analytics']];
function fillSlots(){const show=ADS.on&&ADS.client&&ADS.banner&&!pass();
  for(const [sel,name] of SLOTS){const pane=document.querySelector(sel);if(!pane)continue;let s=pane.querySelector(`:scope > .adSlot98[data-ad98="${name}"]`);
    if(!show){if(s)s.remove();continue}
    if(!s){s=document.createElement('div');s.className='adSlot98';s.dataset.ad98=name;s.innerHTML=`<span>Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(ADS.client)}" data-ad-slot="${esc(ADS.banner)}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;pane.appendChild(s);try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch{}}}}
schedule();
})();
