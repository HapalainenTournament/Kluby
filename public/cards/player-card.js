import { cardLayout } from './cardLayout.generated.js';
import { cardTiers } from './cardTiers.generated.js';
import { CARD_TYPOGRAPHY_CSS, escapeCardText, cardNameClass, resolveCardTier, cardUrlToDataUrl, rasterizeCardElement, downloadCardBlob } from './cardShared.js';

const pct = v => `${v}%`;
const portraitPolygon = (points=cardLayout.portraitWindow||[]) => points.map(([x,y])=>`${x}% ${y}%`).join(',');


const slotStyle = key => {
  const s = cardLayout.slots[key];
  return `left:${pct(s.left)};top:${pct(s.top)};width:${pct(s.width)};height:${pct(s.height)};`;
};

class PlayerCard extends HTMLElement {
  static get observedAttributes(){
    return ['player-name','player-id','position','overall','tier','crest-url','jersey-color','stat-1-label','stat-1-value','stat-2-label','stat-2-value','stat-3-label','stat-3-value','stat-4-label','stat-4-value','stat-5-label','stat-5-value','stat-6-label','stat-6-value','matches','goals','assists','motm'];
  }
  constructor(){ super(); this.attachShadow({mode:'open'}); }
  connectedCallback(){ this.render(); }
  attributeChangedCallback(){ if(this.isConnected) this.render(); }
  a(name){ const v=this.getAttribute(name); return v===null?'':v; }
  async exportBlob({width=1200,height=1800,scale=1}={}){
    const root=this.shadowRoot;
    const card=root?.querySelector('.card'), style=root?.querySelector('style');
    return rasterizeCardElement({card,style,width,height,scale,assetReplacer:async(clone,css)=>{
      const frameData=await cardUrlToDataUrl('/cards/frames/frame.png');
      const crestEl=root.querySelector('.crest img');
      const crestData=crestEl ? await cardUrlToDataUrl(crestEl.currentSrc||crestEl.getAttribute('src')||'') : '';
      const cf=clone.querySelector('.frame'); if(cf) cf.setAttribute('src',frameData||'');
      const cc=clone.querySelector('.crest img'); if(cc){ if(crestData) cc.setAttribute('src',crestData); else cc.replaceWith(Object.assign(document.createElement('div'),{className:'crestFallback'})); }
      if(frameData) css=css.replaceAll("url('/cards/frames/frame.png')",`url('${frameData}')`);
      return {css};
    }});
  }
  async exportPng({filename,width=1200,height=1800,scale=1}={}){
    const blob=await this.exportBlob({width,height,scale});
    const safe=(this.a('player-name')||'player-card').trim().replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase()||'player-card';
    await downloadCardBlob(blob,filename||`${safe}-clubroom-card.png`);
    return blob;
  }
  render(){
    const name=this.a('player-name')||'PLAYER NAME';
    const id=this.a('player-id');
    const crest=this.a('crest-url');
    const jersey=this.a('jersey-color')||window.ClubroomAvatars?.getClubColor?.()||'#2f679e';
    const { tier, tierStyle }=resolveCardTier(this.a('overall'),this.a('tier'));
    const stats=[1,2,3,4,5,6].map(i=>({label:this.a(`stat-${i}-label`)||'—',value:this.a(`stat-${i}-value`)}));
    const statKeys=['statLeft1','statLeft2','statLeft3','statRight1','statRight2','statRight3'];
    const nameClass=cardNameClass(name);
    this.shadowRoot.innerHTML=`
      <style>
        :host{display:block;position:relative;container-type:inline-size;aspect-ratio:${cardLayout.aspectRatio};min-width:0;user-select:none}
        *{box-sizing:border-box}.card{position:relative;width:100%;height:100%;overflow:hidden;border-radius:7cqw;background:#07101b;isolation:isolate;${CARD_TYPOGRAPHY_CSS}color:white}
        .layer{position:absolute;inset:0;width:100%;height:100%}.frame{z-index:1;width:100%;height:100%;object-fit:fill;filter:${tierStyle.frameFilter};pointer-events:none}
        .tierWash{z-index:2;background:${tierStyle.bg};mix-blend-mode:color;opacity:.22;pointer-events:none}
        .portraitClip{position:absolute;inset:0;z-index:3;clip-path:polygon(${portraitPolygon()});overflow:hidden;-webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 84%,rgba(0,0,0,.88) 90%,rgba(0,0,0,.35) 97%,transparent 100%);mask-image:linear-gradient(to bottom,#000 0%,#000 84%,rgba(0,0,0,.88) 90%,rgba(0,0,0,.35) 97%,transparent 100%)}
        ${window.CLUBROOM_AVATAR_CSS||''}
        .portraitClip player-avatar{position:absolute;left:${pct(cardLayout.slots.player.left-2)};top:${pct(cardLayout.slots.player.top)};width:${pct(cardLayout.slots.player.width+4)};height:${pct(cardLayout.slots.player.height+3)}}
        .ui{z-index:5;position:absolute;inset:0}.slot{position:absolute;display:flex;align-items:center;justify-content:center;min-width:0}
        .overall{${slotStyle('overall')}flex-direction:column;align-items:flex-start;justify-content:center;text-shadow:0 .35cqw 1.1cqw #000}.overall small{font-size:3.45cqw;line-height:1;font-weight:900;letter-spacing:.08em;white-space:nowrap}.overall b{font-size:10.3cqw;line-height:.9;font-weight:950;white-space:nowrap}
        .position{${slotStyle('position')}font-size:4.35cqw;font-weight:900;border:.35cqw solid ${tierStyle.accent};border-radius:1cqw;background:rgba(2,8,16,.66);text-shadow:0 .3cqw .7cqw #000}
        .crest{${slotStyle('crest')}}.crest img{max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 .5cqw 1cqw rgba(0,0,0,.45))}.crestFallback{width:100%;height:100%;border:.45cqw solid ${tierStyle.accent};clip-path:polygon(50% 0,100% 17%,100% 70%,50% 100%,0 70%,0 17%);background:rgba(3,10,17,.8)}
        .name{${slotStyle('name')}font-size:5.65cqw;color:${tierStyle.text};font-weight:950;line-height:.95;text-align:center;padding:0 3cqw;text-transform:none;text-shadow:0 .35cqw .8cqw rgba(0,0,0,.85);white-space:nowrap;overflow:hidden}.name.medium{font-size:4.85cqw}.name.long{font-size:4.05cqw}
        .stat{justify-content:space-between;gap:1cqw;padding:0 .7cqw;border-bottom:.12cqw solid rgba(255,255,255,.22);font-size:3.15cqw;overflow:hidden}.stat span{font-weight:800;letter-spacing:.025em;color:${tierStyle.muted};white-space:nowrap;min-width:0}.stat b{font-size:3.75cqw;font-weight:950;color:${tierStyle.text};white-space:nowrap;min-width:0;max-width:48%;text-align:right}
        .totals{${slotStyle('totals')}display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.4cqw;border-top:.12cqw solid rgba(255,255,255,.22);padding-top:.55cqw;align-items:center}.total{display:flex;gap:.42cqw;align-items:center;justify-content:center;white-space:nowrap;min-width:0}.total i{font-style:normal;display:inline-flex;width:2.6cqw;height:2.6cqw;opacity:.9;line-height:1}.total i svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.statsPanel{position:absolute;z-index:4;left:12.6%;top:60.8%;width:74.8%;height:25.4%;border-radius:2.6cqw;background:linear-gradient(180deg,rgba(6,13,24,.94),rgba(3,8,15,.97));box-shadow:inset 0 0 0 .18cqw rgba(255,255,255,.10),0 .6cqw 2cqw rgba(0,0,0,.45);pointer-events:none}.statsPanel:after{content:'';position:absolute;left:50%;top:7%;height:66%;width:.14cqw;background:rgba(255,255,255,.16)}.total b{font-size:2.65cqw;line-height:1}.total small{font-size:1.55cqw;color:${tierStyle.muted};letter-spacing:.02em;line-height:1}
        .debugSlot{outline:.18cqw solid rgba(45,212,191,.95)!important;background:rgba(45,212,191,.12)!important;cursor:move!important}.debugSlot:before{content:attr(data-slot);position:absolute;left:.3cqw;top:.2cqw;padding:.18cqw .45cqw;background:rgba(2,8,16,.82);color:#fff;font-size:1.35cqw;font-weight:900;line-height:1.2;z-index:30;pointer-events:none}.debugSlot:after{content:"";position:absolute;right:0;bottom:0;width:2.2cqw;height:2.2cqw;background:#2dd4bf;clip-path:polygon(100% 0,100% 100%,0 100%);cursor:nwse-resize}.debugToolbar{position:absolute;z-index:40;left:2cqw;right:2cqw;bottom:1.5cqw;display:flex;justify-content:flex-end;pointer-events:none}.debugToolbar button{pointer-events:auto;border:.16cqw solid rgba(255,255,255,.28);border-radius:1.2cqw;background:#08111f;color:#fff;padding:1.1cqw 1.6cqw;font:900 2cqw/1 ${CARD_TYPOGRAPHY_CSS.includes('font-family')?'inherit':'sans-serif'};cursor:pointer}      </style>
      <div class="card tier-${tier}" part="card" data-tier="${tier}">
        <img class="layer frame" src="/cards/frames/frame.png" alt="">
        <div class="layer tierWash"></div>
        <div class="portraitClip" data-portrait-window>
          <player-avatar player-id="${escapeCardText(id)}" player-name="${escapeCardText(name)}" position="${escapeCardText(this.a('position'))}" jersey-color="${escapeCardText(jersey)}" variant="card"></player-avatar>
        </div>
        <div class="statsPanel" data-stats-panel aria-hidden="true"></div>
        <div class="ui">
          <div class="slot overall" data-slot="overall"><small>OVR</small><b>${this.a('overall')||'--'}</b></div>
          <div class="slot position" data-slot="position">${this.a('position')||'--'}</div>
          <div class="slot crest" data-slot="crest">${crest?`<img src="${crest}" alt="">`:'<div class="crestFallback"></div>'}</div>
          <div class="slot name ${nameClass}" data-slot="name" data-fit-cqw="5.65">${escapeCardText(name)}</div>
          ${stats.map((s,i)=>`<div class="slot stat" data-slot="${statKeys[i]}" style="${slotStyle(statKeys[i])}"><span>${s.label}</span><b data-fit-cqw="3.75">${s.value||'--'}</b></div>`).join('')}
          <div class="slot totals" data-slot="totals">
            <div class="total"><i><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/></svg></i><div><b>${this.a('matches')||'--'}</b><small> MATCHES</small></div></div>
            <div class="total"><i><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.6l3.4 2.5-1.3 4h-4.2l-1.3-4z"/><path d="M12 3.5v4.1M15.4 10.1l4-1.3M14.1 14.1l2.4 3.5M9.9 14.1l-2.4 3.5M8.6 10.1l-4-1.3"/></svg></i><div><b>${this.a('goals')||'--'}</b><small> G</small></div></div>
            <div class="total"><i><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.5" cy="16.5" r="2.4"/><path d="M8.8 15.3c3-1.6 3.6-6 8.4-6.4"/><path d="M15.6 6.4l3 2.6-3.6 1.3"/></svg></i><div><b>${this.a('assists')||'--'}</b><small> A</small></div></div>
            <div class="total"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.8l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z"/></svg></i><div><b>${this.a('motm')||'--'}</b><small> MOTM</small></div></div>
          </div>
          ${new URLSearchParams(location.search).get('debug')==='card'?'<div class="debugToolbar"><button type="button" data-copy-layout>Copy layout</button></div>':''}
        </div>
      </div>`;
    requestAnimationFrame(()=>{ this.fitText(); this.enableDebug(); });
  }
  fitText(){
    const els=this.shadowRoot?.querySelectorAll('[data-fit-cqw]')||[];
    els.forEach(el=>{
      let size=Number(el.dataset.fitCqw||0);
      if(!size)return;
      el.style.fontSize=`${size}cqw`;
      let guard=0;
      while(el.scrollWidth>el.clientWidth && size>1.5 && guard++<40){ size-=.12; el.style.fontSize=`${size.toFixed(2)}cqw`; }
    });
  }
  enableDebug(){
    if(new URLSearchParams(location.search).get('debug')!=='card')return;
    const card=this.shadowRoot?.querySelector('.card'); if(!card)return;
    const slots=[...this.shadowRoot.querySelectorAll('[data-slot]')];
    slots.forEach(el=>el.classList.add('debugSlot'));
    const rectPct=el=>{const c=card.getBoundingClientRect(),r=el.getBoundingClientRect();return {left:+(((r.left-c.left)/c.width)*100).toFixed(2),top:+(((r.top-c.top)/c.height)*100).toFixed(2),width:+((r.width/c.width)*100).toFixed(2),height:+((r.height/c.height)*100).toFixed(2)}};
    const apply=(el,v)=>{el.style.left=`${v.left}%`;el.style.top=`${v.top}%`;el.style.width=`${v.width}%`;el.style.height=`${v.height}%`};
    slots.forEach(el=>{
      el.addEventListener('pointerdown',ev=>{
        ev.preventDefault(); ev.stopPropagation();
        const c=card.getBoundingClientRect(),r=el.getBoundingClientRect();
        const edge=Math.max(10,Math.min(r.width,r.height)*.24);
        const resize=(r.right-ev.clientX)<edge && (r.bottom-ev.clientY)<edge;
        const start={x:ev.clientX,y:ev.clientY,...rectPct(el)};
        el.setPointerCapture?.(ev.pointerId);
        const move=e=>{
          const dx=(e.clientX-start.x)/c.width*100,dy=(e.clientY-start.y)/c.height*100;
          const v=resize?{left:start.left,top:start.top,width:Math.max(1,start.width+dx),height:Math.max(1,start.height+dy)}:{left:start.left+dx,top:start.top+dy,width:start.width,height:start.height};
          apply(el,v);
        };
        const up=e=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.releasePointerCapture?.(e.pointerId)};
        el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);
      });
    });
    this.shadowRoot.querySelector('[data-copy-layout]')?.addEventListener('click',async()=>{
      const out={aspectRatio:cardLayout.aspectRatio,slots:{}}; slots.forEach(el=>out.slots[el.dataset.slot]=rectPct(el));
      const txt=JSON.stringify(out,null,2);
      try{await navigator.clipboard.writeText(txt);}catch{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}
      const b=this.shadowRoot.querySelector('[data-copy-layout]'); if(b){const old=b.textContent;b.textContent='Copied';setTimeout(()=>b.textContent=old,1000);}
    });
  }
}

if(!customElements.get('player-card')) customElements.define('player-card',PlayerCard);
export { PlayerCard };
