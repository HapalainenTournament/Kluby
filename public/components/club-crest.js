const CREST_BASE='https://eafc24.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l';
function initials(name){return (String(name||'C').match(/[A-Z0-9]/ig)||['C']).slice(0,2).join('').toUpperCase()}
class ClubCrest extends HTMLElement{
 static get observedAttributes(){return ['crest-id','club-name']}
 connectedCallback(){this.render()}
 attributeChangedCallback(){if(this.isConnected)this.render()}
 render(){const id=String(this.getAttribute('crest-id')||'').trim(),name=this.getAttribute('club-name')||'Club';this.innerHTML='';this.classList.add('clubCrestComponent');const fallback=document.createElement('span');fallback.className='clubCrestFallback';fallback.textContent=initials(name);fallback.hidden=!!id;this.appendChild(fallback);if(!id)return;const img=document.createElement('img');img.alt=`${name} crest`;img.decoding='async';img.loading='eager';img.addEventListener('load',()=>{fallback.hidden=true;img.hidden=false},{once:true});img.addEventListener('error',()=>{img.remove();fallback.hidden=false},{once:true});img.hidden=true;img.src=`${CREST_BASE}${encodeURIComponent(id)}.png`;this.appendChild(img)}
}
if(!customElements.get('club-crest'))customElements.define('club-crest',ClubCrest);
export {ClubCrest};
