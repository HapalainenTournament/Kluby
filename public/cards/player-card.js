import { cardLayout } from './cardLayout.generated.js';
import { cardTiers } from './cardTiers.generated.js';

const pct = v => `${v}%`;
const has = v => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && !Number.isFinite(v));
const shown = (v, suffix='') => has(v) ? `${v}${suffix}` : '--';


async function urlToDataUrl(url){
  if(!url) return '';
  if(url.startsWith('data:')) return url;
  try{
    const r=await fetch(url,{mode:'cors',credentials:'omit'});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const blob=await r.blob();
    return await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result||''));fr.onerror=reject;fr.readAsDataURL(blob)});
  }catch(e){
    console.warn('[PlayerCard export] asset skipped',url,e?.message||e);
    return '';
  }
}
function escXml(v){return String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

const slotStyle = key => {
  const s = cardLayout.slots[key];
  return `left:${pct(s.left)};top:${pct(s.top)};width:${pct(s.width)};height:${pct(s.height)};`;
};

class PlayerCard extends HTMLElement {
  static get observedAttributes(){
    return ['player-name','player-id','position','overall','tier','crest-url','jersey-color','stat-1-label','stat-1-value','stat-2-label','stat-2-value','stat-3-label','stat-3-value','stat-4-label','stat-4-value','stat-5-label','stat-5-value','stat-6-label','stat-6-value','matches','goals','assists','motm','player-image'];
  }
  constructor(){ super(); this.attachShadow({mode:'open'}); }
  connectedCallback(){ this.render(); }
  attributeChangedCallback(){ if(this.isConnected) this.render(); }
  a(name){ const v=this.getAttribute(name); return v===null?'':v; }
  async exportBlob({width=1200,height=1800,scale=1}={}){
    const root=this.shadowRoot;
    if(!root) throw new Error('PlayerCard is not rendered.');
    const card=root.querySelector('.card');
    const style=root.querySelector('style');
    if(!card||!style) throw new Error('PlayerCard export source is incomplete.');

    const frameData=await urlToDataUrl('/cards/frames/frame.png');
    const maskData=await urlToDataUrl('/cards/masks/jersey-mask.png');
    const playerEl=root.querySelector('.player');
    const crestEl=root.querySelector('.crest img');
    const playerData=await urlToDataUrl(playerEl?.currentSrc||playerEl?.getAttribute('src')||'/cards/players/default.png') || await urlToDataUrl('/cards/players/default.png');
    const crestData=crestEl ? await urlToDataUrl(crestEl.currentSrc||crestEl.getAttribute('src')||'') : '';

    const clone=card.cloneNode(true);
    clone.querySelectorAll('[onerror]').forEach(el=>el.removeAttribute('onerror'));
    const clonePlayer=clone.querySelector('.player');
    if(clonePlayer) clonePlayer.setAttribute('src',playerData||'');
    const cloneFrame=clone.querySelector('.frame');
    if(cloneFrame) cloneFrame.setAttribute('src',frameData||'');
    const cloneCrest=clone.querySelector('.crest img');
    if(cloneCrest){
      if(crestData) cloneCrest.setAttribute('src',crestData);
      else cloneCrest.replaceWith(Object.assign(document.createElement('div'),{className:'crestFallback'}));
    }

    let css=style.textContent||'';
    css=css.replace(/:host/g,'.exportHost');
    if(frameData) css=css.replaceAll("url('/cards/frames/frame.png')",`url('${frameData}')`);
    if(maskData){
      css=css.replaceAll("url('/cards/masks/jersey-mask.png')",`url('${maskData}')`);
    }
    const html=`<div xmlns="http://www.w3.org/1999/xhtml" class="exportHost"><style>${css}</style>${clone.outerHTML}</div>`;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`;
    const svgBlob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
    const svgUrl=URL.createObjectURL(svgBlob);
    try{
      const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Unable to rasterize PlayerCard SVG.'));im.src=svgUrl});
      const canvas=document.createElement('canvas');
      canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
      const ctx=canvas.getContext('2d');
      if(!ctx) throw new Error('Canvas is unavailable.');
      ctx.scale(scale,scale);ctx.drawImage(img,0,0,width,height);
      return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG export failed.')),'image/png'));
    }finally{URL.revokeObjectURL(svgUrl)}
  }
  async exportPng({filename,width=1200,height=1800,scale=1}={}){
    const blob=await this.exportBlob({width,height,scale});
    const safe=(this.a('player-name')||'player-card').trim().replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase()||'player-card';
    const name=filename||`${safe}-clubroom-card.png`;
    const url=URL.createObjectURL(blob);
    try{const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove()}finally{setTimeout(()=>URL.revokeObjectURL(url),1500)}
    return blob;
  }
  render(){
    const name=this.a('player-name')||'PLAYER NAME';
    const id=this.a('player-id');
    const playerImage=this.a('player-image') || (id?`/cards/players/${encodeURIComponent(id)}/base.png`:'/cards/players/default.png');
    const crest=this.a('crest-url');
    const jersey=this.a('jersey-color')||'#d9dde3';
    const rawOverall=this.a('overall');
    const ovr=rawOverall!=='' && Number.isFinite(Number(rawOverall)) ? Number(rawOverall) : null;
    const explicitTier=this.a('tier');
    const tierNames=Object.keys(cardTiers.styles);
    const autoTier=ovr===null ? cardTiers.fallbackTier : cardTiers.thresholds.reduce((picked,row)=>ovr>=row.min?row.tier:picked,cardTiers.fallbackTier);
    const tier=tierNames.includes(explicitTier)?explicitTier:autoTier;
    const tierStyle=cardTiers.styles[tier]||cardTiers.styles[cardTiers.fallbackTier];
    const stats=[1,2,3,4,5,6].map(i=>({label:this.a(`stat-${i}-label`)||'—',value:this.a(`stat-${i}-value`)}));
    const statKeys=['statLeft1','statLeft2','statLeft3','statRight1','statRight2','statRight3'];
    const nameClass=name.length>18?'long':name.length>12?'medium':'';
    this.shadowRoot.innerHTML=`
      <style>
        :host{display:block;container-type:inline-size;aspect-ratio:2/3;min-width:0;user-select:none}
        *{box-sizing:border-box}.card{position:relative;width:100%;height:100%;overflow:hidden;border-radius:7cqw;background:#07101b;isolation:isolate;font-family:Inter,Manrope,system-ui,sans-serif;color:white;font-variant-numeric:tabular-nums}
        .layer{position:absolute;inset:0}.frameBg{z-index:1;background:${tierStyle.bg}}
        .frameBg:after{content:"";position:absolute;inset:0;background:url('/cards/frames/frame.png') center/100% 100% no-repeat;opacity:.16;mix-blend-mode:screen}
        .player{z-index:2;object-fit:contain;object-position:center bottom;filter:contrast(1.03) saturate(.88) drop-shadow(0 2cqw 3cqw rgba(0,0,0,.45))}
        .jerseyTint{z-index:3;background:${jersey};-webkit-mask:url('/cards/masks/jersey-mask.png') center/100% 100% no-repeat;mask:url('/cards/masks/jersey-mask.png') center/100% 100% no-repeat;mix-blend-mode:multiply;opacity:.86}
        .frame{z-index:4;width:100%;height:100%;object-fit:fill;mix-blend-mode:screen;filter:${tierStyle.frameFilter};pointer-events:none}
        .ui{z-index:5;position:absolute;inset:0}.slot{position:absolute;display:flex;align-items:center;justify-content:center;min-width:0}
        .overall{${slotStyle('overall')}flex-direction:column;align-items:flex-start;justify-content:center;text-shadow:0 .35cqw 1.1cqw #000}.overall small{font-size:4.2cqw;font-weight:900;letter-spacing:.08em}.overall b{font-size:12cqw;line-height:.88;font-weight:950}
        .position{${slotStyle('position')}font-size:5cqw;font-weight:900;border:.35cqw solid ${tierStyle.accent};border-radius:1cqw;background:rgba(2,8,16,.66);text-shadow:0 .3cqw .7cqw #000}
        .crest{${slotStyle('crest')}}.crest img{max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 .5cqw 1cqw rgba(0,0,0,.45))}.crestFallback{width:100%;height:100%;border:.45cqw solid ${tierStyle.accent};clip-path:polygon(50% 0,100% 17%,100% 70%,50% 100%,0 70%,0 17%);background:rgba(3,10,17,.8)}
        .name{${slotStyle('name')}font-size:6.3cqw;color:${tierStyle.text};font-weight:950;line-height:.95;text-align:center;padding:0 3cqw;text-transform:none;text-shadow:0 .35cqw .8cqw rgba(0,0,0,.85);white-space:nowrap;overflow:hidden}.name.medium{font-size:5.3cqw}.name.long{font-size:4.3cqw}
        .stat{justify-content:space-between;padding:0 1.4cqw;border-bottom:.12cqw solid rgba(255,255,255,.22);font-size:3.7cqw}.stat span{font-weight:800;letter-spacing:.04em;color:${tierStyle.muted}}.stat b{font-size:4.7cqw;font-weight:950;color:${tierStyle.text}}
        .totals{${slotStyle('totals')}display:grid;grid-template-columns:repeat(4,1fr);gap:.5cqw;border-top:.14cqw solid rgba(255,255,255,.2);padding-top:1cqw}.total{display:flex;gap:.65cqw;align-items:center;justify-content:center;white-space:nowrap}.total i{font-style:normal;font-size:2.6cqw;opacity:.85}.total b{font-size:3cqw}.total small{font-size:1.85cqw;color:${tierStyle.muted};letter-spacing:.03em}
      </style>
      <div class="card tier-${tier}" part="card" data-tier="${tier}">
        <div class="tierGlow layer" style="z-index:1;background:linear-gradient(135deg,${tierStyle.accentSoft},transparent 46%);mix-blend-mode:screen;pointer-events:none"></div>
        <div class="layer frameBg"></div>
        <img class="player slot" style="${slotStyle('player')}" src="${playerImage}" alt="" onerror="this.onerror=null;this.src='/cards/players/default.png'">
        <div class="layer jerseyTint"></div>
        <img class="layer frame" src="/cards/frames/frame.png" alt="">
        <div class="ui">
          <div class="slot overall"><small>OVR</small><b>${this.a('overall')||'--'}</b></div>
          <div class="slot position">${this.a('position')||'--'}</div>
          <div class="slot crest">${crest?`<img src="${crest}" alt="">`:'<div class="crestFallback"></div>'}</div>
          <div class="slot name ${nameClass}">${name.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}</div>
          ${stats.map((s,i)=>`<div class="slot stat" style="${slotStyle(statKeys[i])}"><span>${s.label}</span><b>${s.value||'--'}</b></div>`).join('')}
          <div class="slot totals">
            <div class="total"><i>◉</i><div><b>${this.a('matches')||'--'}</b><small> MATCHES</small></div></div>
            <div class="total"><i>⚽</i><div><b>${this.a('goals')||'--'}</b><small> G</small></div></div>
            <div class="total"><i>↗</i><div><b>${this.a('assists')||'--'}</b><small> A</small></div></div>
            <div class="total"><i>★</i><div><b>${this.a('motm')||'--'}</b><small> MOTM</small></div></div>
          </div>
        </div>
      </div>`;
  }
}

if(!customElements.get('player-card')) customElements.define('player-card',PlayerCard);
export { PlayerCard };
