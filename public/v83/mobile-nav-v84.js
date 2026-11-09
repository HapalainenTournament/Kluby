/* CLUBROOM v84 · bottom navigation on phones: 4 main tabs + "More" sheet. Mirrors the existing top tabs. */
(function(){
'use strict';
const I={stats:'<path d="M4 11.5L12 4l8 7.5V20h-5.5v-5h-5v5H4z"/>',players:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9.5" r="2.4"/><path d="M3.5 19.5c.6-3.3 2.7-5 5.5-5s4.9 1.7 5.5 5M14.5 15.2c2.6-.4 4.8 1 5.5 4.3"/>',matches:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.6l3.4 2.5-1.3 4h-4.2l-1.3-4z"/>',sessions:'<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4M8 13.5h3M8 16.5h6"/>',more:'<circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/>',compare:'<path d="M7 4v16M17 4v16M7 8h4M13 16h4"/><circle cx="7" cy="12" r="2"/><circle cx="17" cy="12" r="2"/>',analytics:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',misc:'<path d="M12 3.8l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z"/>',plus:'<path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2a2.5 2.5 0 0 0 0-5z"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${I[k]||I.more}</svg>`;
const MAIN=[['stats','Overview'],['players','Players'],['matches','Matches'],['sessions','Sessions']];
const MORE=[['compare','Compare'],['analytics','Analytics'],['misc','Misc'],['plus','Clubroom Pass']];
const nav=document.createElement('nav');nav.className='bottomNav84';nav.setAttribute('aria-label','Club sections');
nav.innerHTML=MAIN.map(([k,l])=>`<button type="button" data-bn84="${k}">${svg(k)}<span>${l}</span></button>`).join('')+`<button type="button" data-bn84-more aria-haspopup="dialog" aria-expanded="false">${svg('more')}<span>More</span></button>`;
const sheet=document.createElement('div');sheet.className='moreSheet84';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','More sections');
sheet.innerHTML=`<div>${MORE.map(([k,l])=>`<button type="button" data-bn84="${k}" class="${k==='plus'?'pass':''}">${svg(k)}<span>${l}</span></button>`).join('')}</div>`;
document.body.append(nav,sheet);
const current=()=>document.body.classList.contains('playerRoute69')?'players':document.body.classList.contains('matchRoute73')?'matches':(document.querySelector('.topNav44 [data-tab].active')?.dataset.tab||'stats');
function sync(){const has=!document.getElementById('dash')?.hidden||document.body.classList.contains('matchRoute73')||document.body.classList.contains('playerRoute69');const hc=!!has&&!!(typeof S!=='undefined'&&S&&S.club);if(document.body.classList.contains('hasClub84')!==hc)document.body.classList.toggle('hasClub84',hc);const c=current();if(!document.body.classList.contains('tab84-'+c)){[...document.body.classList].filter(x=>x.startsWith('tab84-')).forEach(x=>document.body.classList.remove(x));document.body.classList.add('tab84-'+c)}
  nav.querySelectorAll('[data-bn84]').forEach(b=>b.classList.toggle('active',b.dataset.bn84===c));const inMore=MORE.some(([k])=>k===c);nav.querySelector('[data-bn84-more]').classList.toggle('active',inMore);sheet.querySelectorAll('[data-bn84]').forEach(b=>b.classList.toggle('active',b.dataset.bn84===c))}
function close(){sheet.classList.remove('open');nav.querySelector('[data-bn84-more]').setAttribute('aria-expanded','false')}
document.addEventListener('click',e=>{const m=e.target.closest('[data-bn84-more]');if(m){const open=!sheet.classList.contains('open');sheet.classList.toggle('open',open);m.setAttribute('aria-expanded',String(open));return}
  const b=e.target.closest('[data-bn84]');if(b){close();if(typeof openTab==='function')openTab(b.dataset.bn84,true);window.scrollTo({top:0,behavior:'smooth'});setTimeout(sync,30);return}
  if(e.target===sheet)close();setTimeout(sync,30)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
window.addEventListener('popstate',()=>setTimeout(sync,50));
let q=0;new MutationObserver(()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;sync()})}).observe(document.body,{attributes:true,subtree:true,attributeFilter:['class','hidden']});
sync();
})();
