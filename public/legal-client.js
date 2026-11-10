/* POSTGAME v95: "Privacy choices" opens Google's certified consent message once ads are on; removal form on /legal. */
(function(){'use strict';
const adsOn=!!document.querySelector('meta[name="clubroom-ads"][content="on"]');
// Google Funding Choices (AdSense "Privacy & messaging") queue
window.googlefc=window.googlefc||{};window.googlefc.callbackQueue=window.googlefc.callbackQueue||[];
function settings(){if(window.googlefc?.showRevocationMessage){window.googlefc.callbackQueue.push(window.googlefc.showRevocationMessage);return}
  if(typeof window.__tcfapi==='function'){window.__tcfapi('displayConsentUi',2,function(){});return}
  let t=document.getElementById('privacyToast95');if(!t){t=document.createElement('div');t.id='privacyToast95';t.setAttribute('role','status');t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:200;max-width:92vw;padding:12px 16px;border-radius:12px;background:#0d1826;border:1px solid #1f3247;color:#eaf2fa;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 18px 40px -18px #000';document.body.appendChild(t)}
  t.textContent='Postgame uses no tracking cookies right now – there is nothing to change.';clearTimeout(t._h);t._h=setTimeout(()=>t.remove(),3500)}
document.querySelectorAll('#cookieSettingsLink,.cookieSettingsLink,#cookieManagePage').forEach(el=>{if(adsOn)el.hidden=false;el.addEventListener('click',settings)});
const form=document.getElementById('removalForm');if(form){form.addEventListener('submit',async e=>{e.preventDefault();const feedback=document.getElementById('removalFeedback');const button=form.querySelector('[type=submit]');button.disabled=true;feedback.textContent='Submitting…';try{const data=Object.fromEntries(new FormData(form));const response=await fetch('/api/privacy/removal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw Error(result.error||'Submission failed.');feedback.textContent='Request received. Reference: '+result.reference;form.reset()}catch(error){feedback.textContent='Request could not be submitted: '+error.message}finally{button.disabled=false}})}
})();
