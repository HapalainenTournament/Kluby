/* POSTGAME v96 · Session report PNG (server-rendered) + Discord webhook settings in the Pass tab. */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const club=()=>(typeof S!=='undefined'&&S?.club)||null;
const plat=()=>(typeof S!=='undefined'&&(S.platform||S.club?.platform))||'common-gen5';
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const toast=(t)=>{let el=document.getElementById('toast96');if(!el){el=document.createElement('div');el.id='toast96';el.setAttribute('role','status');document.body.appendChild(el)}el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),3200)};

/* ---------- 2) session report ---------- */
document.addEventListener('click',async e=>{const b=e.target.closest('[data-share-session96]');if(!b||!club())return;
  const start=b.dataset.shareSession96,id=club().id,url=`/api/session-card/${encodeURIComponent(id)}.png?start=${start}&platform=${encodeURIComponent(plat())}&name=${encodeURIComponent(club().name||'')}`;
  const label=b.innerHTML;b.disabled=true;b.textContent='Rendering…';
  try{const r=await fetch(url);if(!r.ok)throw new Error((await r.json().catch(()=>({}))).error||'Could not render the report.');const blob=await r.blob();
    const file=new File([blob],`clubroom-session-${String(club().name||id).replace(/[^\w-]+/g,'-')}.png`,{type:'image/png'});
    if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'Session report'});return}catch(err){if(err?.name==='AbortError')return}}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);toast('Session report saved – drop it in your Discord.')}
  catch(err){toast(err.message||'Could not render the report.')}finally{b.disabled=false;b.innerHTML=label}});

/* ---------- 3) Discord webhooks ---------- */
const KEYS='clubroom96:webhookKeys';
const discordIcon='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M19.3 5.4A16 16 0 0 0 15.4 4l-.5 1a15 15 0 0 0-5.8 0l-.5-1a16 16 0 0 0-3.9 1.4C2.2 9.1 1.5 12.7 1.8 16.2a16 16 0 0 0 4.8 2.5l1-1.6a10 10 0 0 1-1.6-.8l.4-.3a11 11 0 0 0 11.2 0l.4.3a10 10 0 0 1-1.6.8l1 1.6a16 16 0 0 0 4.8-2.5c.4-4-.6-7.6-2.9-10.8ZM8.7 14.1c-1 0-1.7-.9-1.7-2s.8-2 1.7-2 1.8.9 1.7 2c0 1.1-.8 2-1.7 2Zm6.6 0c-1 0-1.7-.9-1.7-2s.8-2 1.7-2 1.8.9 1.7 2c0 1.1-.8 2-1.7 2Z"/></svg>';
let state={id:null,premium:false,webhooks:[],busy:false,err:'',ok:''};
async function load(){const c=club();if(!c)return;state.id=String(c.id);try{const j=await fetch(`/api/discord/${encodeURIComponent(c.id)}`).then(r=>r.json());state.premium=!!j.premium;state.webhooks=j.webhooks||[]}catch{state.webhooks=[]}render()}
function render(){const host=document.getElementById('discord96');if(!host)return;const c=club();if(!c){host.innerHTML='';return}
  const keys=LS.get(KEYS,{});const when=d=>{try{return new Date(d).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}catch{return''}};
  const list=state.webhooks.length?`<ul class="dList96">${state.webhooks.map(w=>`<li><span class="dDot96 ${w.failing?'bad':''}"></span><div><b>Channel #${w.id}</b><small>Connected ${esc(when(w.createdAt))}${w.lastSentAt?` · last report ${esc(when(w.lastSentAt))}`:' · waiting for the next session'}</small></div>${keys[w.id]?`<button type="button" data-dremove96="${w.id}">Remove</button>`:'<small class="dMuted96">Added on another device</small>'}</li>`).join('')}</ul>`:'';
  host.innerHTML=`<div class="dHead96"><span class="dLogo96">${discordIcon}</span><div><span class="kicker">POSTGAME PASS</span><h3>Session reports in Discord</h3><p>When a session ends (no match for 45 minutes), Postgame posts the results, awards and the session image to your club's channel.</p></div></div>
   ${state.premium?`${list}${state.webhooks.length<3?`<form class="dForm96" data-dform96><label for="dUrl96">Discord webhook URL</label><div><input id="dUrl96" type="url" inputmode="url" placeholder="https://discord.com/api/webhooks/…" autocomplete="off" required><button type="submit" ${state.busy?'disabled':''}>${state.busy?'Connecting…':'Connect'}</button></div><small>Discord → Server settings → Integrations → Webhooks → New webhook → Copy webhook URL. We'll post a test message.</small></form>`:''}`
   :`<div class="dLocked96"><b>Available with Postgame Pass</b><a class="passCta78" href="/pass/checkout?club=${encodeURIComponent(c.id)}">Get Pass</a></div>`}
   ${state.err?`<p class="dMsg96 err">${esc(state.err)}</p>`:''}${state.ok?`<p class="dMsg96 ok">${esc(state.ok)}</p>`:''}`}
document.addEventListener('submit',async e=>{const f=e.target.closest('[data-dform96]');if(!f)return;e.preventDefault();const url=f.querySelector('input').value.trim();state.busy=true;state.err='';state.ok='';render();
  try{const r=await fetch(`/api/discord/${encodeURIComponent(state.id)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,platform:plat()})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Could not connect.');
    const keys=LS.get(KEYS,{});keys[j.id]=j.key;LS.set(KEYS,keys);state.ok='Connected – check your channel for the test message.'}
  catch(err){state.err=err.message}finally{state.busy=false;await load()}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-dremove96]');if(!b)return;const id=b.dataset.dremove96,keys=LS.get(KEYS,{});
  const r=await fetch(`/api/discord/${encodeURIComponent(state.id)}/${encodeURIComponent(id)}`,{method:'DELETE',headers:{'X-Webhook-Key':keys[id]||''}});const j=await r.json().catch(()=>({}));
  if(r.ok){delete keys[id];LS.set(KEYS,keys);state.ok='Channel removed.';state.err=''}else{state.err=j.error||'Could not remove.'}load()});
// load when the Pass tab opens or the club changes
document.addEventListener('click',e=>{if(e.target.closest('[data-tab="plus"],[data-bn84="plus"]'))setTimeout(load,0)});
let lastClub='';setInterval(()=>{const c=club();const id=c?String(c.id):'';if(id&&id!==lastClub){lastClub=id;state={id,premium:false,webhooks:[],busy:false,err:'',ok:''};load()}},1500);
})();
