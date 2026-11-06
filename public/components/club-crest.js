const CREST_BASE='https://eafc24.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l';
function initials(name){return (String(name||'C').match(/[A-Z0-9]/ig)||['C']).slice(0,2).join('').toUpperCase()}
// v78: neutral template crest instead of initials when EA has no crest image.
const TEMPLATE='<svg viewBox="0 0 64 72" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="ctg78" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a425c"/><stop offset="1" stop-color="#101c2b"/></linearGradient></defs><path d="M32 3l25 9v19c0 18-10 30-25 38C17 61 7 49 7 31V12z" fill="url(#ctg78)" stroke="rgba(160,190,220,.45)" stroke-width="2"/><path d="M32 13l16 6v13c0 11-6 19-16 25-10-6-16-14-16-25V19z" fill="none" stroke="rgba(160,190,220,.28)" stroke-width="2"/><path d="M24 31h16M32 23v16" stroke="rgba(160,190,220,.4)" stroke-width="2.5" stroke-linecap="round"/></svg>';
window.CLUBROOM_CREST_TEMPLATE=TEMPLATE;
class ClubCrest extends HTMLElement{
 static get observedAttributes(){return ['crest-id','club-name']}
 connectedCallback(){this.render()}
 attributeChangedCallback(){if(this.isConnected)this.render()}
 render(){const id=String(this.getAttribute('crest-id')||'').trim(),name=this.getAttribute('club-name')||'Club';this.innerHTML='';this.classList.add('clubCrestComponent');const fallback=document.createElement('span');fallback.className='clubCrestFallback';fallback.innerHTML=TEMPLATE;fallback.title=name;fallback.classList.add('clubCrestTemplate78');fallback.hidden=!!id;this.appendChild(fallback);if(!id)return;const img=document.createElement('img');img.alt=`${name} crest`;img.decoding='async';img.loading='eager';img.addEventListener('load',()=>{fallback.hidden=true;img.hidden=false},{once:true});img.addEventListener('error',()=>{img.remove();fallback.hidden=false},{once:true});img.hidden=true;img.src=`${CREST_BASE}${encodeURIComponent(id)}.png`;this.appendChild(img)}
}
if(!customElements.get('club-crest'))customElements.define('club-crest',ClubCrest);
export {ClubCrest};
