/* CLUBROOM v85 · Clubroom Pass checkout via Paddle.js overlay. Pass is activated by the server webhook, not here. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const form=$('coForm85'),btn=$('coBtn85'),msg=$('coMsg85'),clubIn=$('coClubId85'),clubBox=$('coClub85'),emailIn=$('coEmail85'),consent=$('coConsent85');
const qs=new URLSearchParams(location.search);
let cfg={enabled:false},paddleReady=false,busy=false;
const say=(t,cls='')=>{msg.textContent=t;msg.className='coMsg85 '+cls};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cleanId=v=>String(v||'').replace(/[^0-9]/g,'');

// Pre-fill the club from ?club=ID (links from the club page) and show its name.
const pre=cleanId(qs.get('club'));if(pre)clubIn.value=pre;
let clubTimer=0;
async function showClub(){const id=cleanId(clubIn.value);clubBox.hidden=!id;if(!id)return;clubBox.innerHTML='<small>Checking club…</small>';
  try{const st=await fetch(`/api/pass/status?ids=${id}`).then(r=>r.json());const active=st.clubs?.[id]?.active;
    let name='';try{const recent=JSON.parse(localStorage.getItem('clubroomRecentClubs49')||'[]');name=(recent.find(c=>String(c.id)===id)||{}).name||''}catch{}
    clubBox.innerHTML=`<b>${esc(name||'Club '+id)}</b><small>ID ${id}${active?' · Pass already active':''}</small>`;
    if(active){say('This club already has Clubroom Pass.','ok')}}catch{clubBox.innerHTML=`<b>Club ${id}</b>`}
  update()}
clubIn.addEventListener('input',()=>{clearTimeout(clubTimer);clubTimer=setTimeout(showClub,350)});
[emailIn,consent].forEach(el=>el.addEventListener('input',update));consent.addEventListener('change',update);
function valid(){return cfg.enabled&&paddleReady&&!busy&&cleanId(clubIn.value)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailIn.value.trim())&&consent.checked}
function update(){btn.disabled=!valid();if(cfg.enabled&&paddleReady)btn.textContent=busy?'Opening checkout…':'Continue to payment'}

async function waitForPass(id){say('Payment received. Activating Pass…','ok');
  for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,3000));
    try{const st=await fetch(`/api/pass/status?ids=${id}`).then(r=>r.json());if(st.clubs?.[id]?.active){say('Clubroom Pass is active. Taking you to your club…','ok');setTimeout(()=>location.href=`/club/${id}/plus`,1500);return}}catch{}}
  say('Payment went through, activation is taking longer than usual. Refresh your club page in a few minutes – the receipt from Paddle is in your inbox.','ok')}

function loadPaddle(){return new Promise((ok,fail)=>{if(window.Paddle)return ok();const s=document.createElement('script');s.src='https://cdn.paddle.com/paddle/v2/paddle.js';s.onload=ok;s.onerror=()=>fail(new Error('Paddle could not load'));document.head.appendChild(s)})}
let pendingClub='';
async function init(){
  try{cfg=await fetch('/api/pass/config').then(r=>r.json())}catch{cfg={enabled:false}}
  if(!cfg.enabled){btn.textContent='Checkout is not open yet';say('Clubroom Pass purchases open soon.');if(pre)showClub();return}
  if(cfg.consentText)$('coConsentText85').innerHTML=esc(cfg.consentText).replace('Terms of Service','<a href="/terms" target="_blank">Terms of Service</a>');
  $('coEnv85').hidden=cfg.env!=='sandbox';
  try{await loadPaddle();if(cfg.env==='sandbox')Paddle.Environment.set('sandbox');
    Paddle.Initialize({token:cfg.clientToken,eventCallback(e){
      if(e.name==='checkout.completed'){const id=pendingClub;try{Paddle.Checkout.close()}catch{}busy=false;update();if(id)waitForPass(id)}
      if(e.name==='checkout.closed'&&busy){busy=false;update()}
      if(e.name==='checkout.error'){busy=false;update();say('Checkout error. Please try again.','err')}}});
    paddleReady=true}catch(e){say('Payment window could not load. Disable blockers for this page and refresh.','err')}
  update();if(pre)showClub()}

form.addEventListener('submit',async e=>{e.preventDefault();if(!valid())return;busy=true;update();say('');
  const clubId=cleanId(clubIn.value),email=emailIn.value.trim();
  try{const r=await fetch('/api/pass/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clubId,email,consent:true,consentVersion:cfg.consentVersion})});
    const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Could not start checkout.');
    pendingClub=clubId;
    Paddle.Checkout.open({items:[{priceId:j.priceId,quantity:1}],customer:{email},customData:{club_id:clubId,consent_id:j.consentId},
      settings:{displayMode:'overlay',theme:'dark',locale:'en',allowLogout:false}});
  }catch(err){busy=false;update();say(err.message,'err')}});
init();
})();
