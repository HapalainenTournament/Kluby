import { duoLayout } from './duoLayout.generated.js';
import { duoCardConfig } from './duoCardConfig.generated.js';
import {
  CARD_TYPOGRAPHY_CSS,
  displayCardValue,
  escapeCardText,
  cardNameClass,
  resolveCardTier,
  numericCardValue,
  formatCardMetric,
  cardUrlToDataUrl,
  rasterizeCardElement,
  downloadCardBlob
} from './cardShared.js';

const pct = v => `${v}%`;
const slotStyle = key => {
  const s = duoLayout.slots[key];
  return `left:${pct(s.left)};top:${pct(s.top)};width:${pct(s.width)};height:${pct(s.height)};`;
};

const getPathValue = (source, key, aliases=[]) => {
  if (!source || typeof source !== 'object') return undefined;
  for (const k of [key, ...aliases]) {
    if (source[k] !== undefined && source[k] !== null && source[k] !== '') return source[k];
  }
  return undefined;
};

class DuoCard extends HTMLElement {
  static get observedAttributes(){
    return [
      'tier','hero-label','hero-value','hero-hidden','highlight-better',
      'a-name','a-overall','a-position','a-crest-url','b-name','b-overall','b-position','b-crest-url',
      ...['a','b'].flatMap(side=>[1,2,3].flatMap(i=>[`${side}-stat-${i}-label`,`${side}-stat-${i}-value`])),
      ...[1,2,3,4].flatMap(i=>[`shared-${i}-icon`,`shared-${i}-label`,`shared-${i}-value`])
    ];
  }

  constructor(){
    super();
    this.attachShadow({mode:'open'});
    this._playerA=null;
    this._playerB=null;
    this._duoStats=null;
    this._config=null;
  }

  connectedCallback(){ this.render(); }
  attributeChangedCallback(){ if(this.isConnected) this.render(); }
  a(name){ const v=this.getAttribute(name); return v===null?'':v; }

  set playerA(value){ this._playerA=value||null; if(this.isConnected) this.render(); }
  get playerA(){ return this._playerA; }
  set playerB(value){ this._playerB=value||null; if(this.isConnected) this.render(); }
  get playerB(){ return this._playerB; }
  set duoStats(value){ this._duoStats=value||null; if(this.isConnected) this.render(); }
  get duoStats(){ return this._duoStats; }
  set config(value){ this._config=value||null; if(this.isConnected) this.render(); }
  get config(){ return this._config || duoCardConfig; }

  metric(source, spec){
    const aliases=this.config.aliases?.[spec.key] || [];
    return getPathValue(source,spec.key,aliases);
  }

  sideRaw(side){
    const player=side==='a'?this._playerA:this._playerB;
    const duoSide=this._duoStats?.[side] || this._duoStats?.[`player${side.toUpperCase()}`] || null;
    const pick=(prop,attr)=>player && player[prop]!==undefined ? player[prop] : this.a(attr);
    const legacyStats=player?.stats;
    const stats=this.config.sideStats.slice(0,3).map((spec,i)=>{
      const direct=this.metric(duoSide,spec);
      const playerMetric=this.metric(player,spec);
      const legacy=legacyStats?.[i];
      const attrValue=this.a(`${side}-stat-${i+1}-value`);
      const value=direct ?? playerMetric ?? legacy?.value ?? (attrValue!==''?attrValue:undefined);
      const attrLabel=this.a(`${side}-stat-${i+1}-label`);
      return {spec,label:attrLabel || legacy?.label || spec.label,value};
    });
    return {
      name: pick('name',`${side}-name`) || 'PLAYER',
      overall: pick('overall',`${side}-overall`),
      position: pick('position',`${side}-position`),
      crestUrl: pick('crestUrl',`${side}-crest-url`),
      stats
    };
  }

  highlightWinners(A,B){
    const enabledAttr=this.getAttribute('highlight-better');
    const globalEnabled=enabledAttr===null ? this.config.highlightBetter!==false : enabledAttr!=='false';
    if(!globalEnabled) return;
    for(let i=0;i<Math.min(A.stats.length,B.stats.length);i++){
      const spec=A.stats[i].spec;
      if(spec.highlightBetter===false) continue;
      const av=numericCardValue(A.stats[i].value), bv=numericCardValue(B.stats[i].value);
      if(av===null || bv===null || av===bv) continue;
      const higherIsBetter=spec.higherIsBetter!==false;
      A.stats[i].better=higherIsBetter ? av>bv : av<bv;
      B.stats[i].better=higherIsBetter ? bv>av : bv<av;
    }
  }

  heroStat(){
    const cfg=this.config.hero || {};
    if(cfg.enabled===false || this.hasAttribute('hero-hidden')) return {hidden:true};
    const explicitValue=this._duoStats?.hero?.value ?? this.a('hero-value');
    const explicitLabel=this._duoStats?.hero?.label ?? this.a('hero-label');
    const value=explicitValue!=='' && explicitValue!==undefined && explicitValue!==null
      ? explicitValue
      : this.metric(this._duoStats?.shared || this._duoStats,cfg);
    return {hidden:value===undefined || value===null || value==='', value, label:explicitLabel || cfg.label || '', format:cfg.format || 'raw'};
  }

  sharedStats(){
    const source=this._duoStats?.shared;
    const legacy=Array.isArray(source)?source:null;
    const objectSource=legacy?this._duoStats:source || this._duoStats;
    return this.config.sharedStats.slice(0,4).map((spec,i)=>{
      const old=legacy?.[i];
      const attrValue=this.a(`shared-${i+1}-value`);
      return {
        icon:this.a(`shared-${i+1}-icon`) || old?.icon || spec.icon || '',
        label:this.a(`shared-${i+1}-label`) || old?.label || spec.label || '',
        value:this.metric(objectSource,spec) ?? old?.value ?? (attrValue!==''?attrValue:undefined),
        format:spec.format || 'raw'
      };
    });
  }

  async exportBlob({width=1200,height=1800,scale=1}={}){
    const root=this.shadowRoot;
    const card=root?.querySelector('.card'), style=root?.querySelector('style');
    return rasterizeCardElement({card,style,width,height,scale,assetReplacer:async(clone,css)=>{
      const frameData=await cardUrlToDataUrl('/cards/frames/frame-duo.png');
      const frame=clone.querySelector('.frame'); if(frame) frame.setAttribute('src',frameData||'');
      const srcCrests=[...root.querySelectorAll('.crest img')];
      const cloneCrests=[...clone.querySelectorAll('.crest img')];
      for(let i=0;i<cloneCrests.length;i++){
        const data=await cardUrlToDataUrl(srcCrests[i]?.currentSrc||srcCrests[i]?.getAttribute('src')||'');
        if(data) cloneCrests[i].setAttribute('src',data); else cloneCrests[i].replaceWith(Object.assign(document.createElement('div'),{className:'crestFallback'}));
      }
      return {css};
    }});
  }
  async exportPng({filename,width=1200,height=1800,scale=1}={}){
    const blob=await this.exportBlob({width,height,scale});
    const A=this.sideRaw('a'), B=this.sideRaw('b');
    const safe=`${A.name||'player-a'}-${B.name||'player-b'}`.trim().replace(/[^a-z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase()||'duo-card';
    await downloadCardBlob(blob,filename||`${safe}-clubroom-duo-card.png`);
    return blob;
  }

  render(){
    const A=this.sideRaw('a');
    const B=this.sideRaw('b');
    this.highlightWinners(A,B);
    const hero=this.heroStat();
    const shared=this.sharedStats();
    const overallForTier=Math.max(
      Number.isFinite(Number(A.overall))?Number(A.overall):-Infinity,
      Number.isFinite(Number(B.overall))?Number(B.overall):-Infinity
    );
    const {tier,tierStyle}=resolveCardTier(overallForTier===-Infinity?'':overallForTier,this.a('tier'));
    const sideMarkup=(side,p)=>{
      const prefix=side==='a'?'a':'b';
      return `
        <div class="slot overall ${prefix}Overall" style="${slotStyle(`${prefix}Overall`)}"><small>OVR</small><b>${displayCardValue(p.overall)}</b></div>
        <div class="slot position" style="${slotStyle(`${prefix}Position`)}">${escapeCardText(p.position||'--')}</div>
        <div class="slot crest" style="${slotStyle(`${prefix}Crest`)}">${p.crestUrl?`<img src="${escapeCardText(p.crestUrl)}" alt="">`:'<div class="crestFallback"></div>'}</div>
        <div class="slot name ${cardNameClass(p.name)}" style="${slotStyle(`${prefix}Name`)}">${escapeCardText(p.name)}</div>
        ${p.stats.map((s,i)=>`<div class="slot stat${s.better?' better':''}" style="${slotStyle(`${prefix}Stat${i+1}`)}"><span>${escapeCardText(s.label||'--')}</span><b>${escapeCardText(formatCardMetric(s.value,s.spec.format))}</b></div>`).join('')}
      `;
    };

    this.shadowRoot.innerHTML=`
      <style>
        :host{display:block;container-type:inline-size;aspect-ratio:2/3;min-width:0;user-select:none}
        *{box-sizing:border-box}
        .card{position:relative;width:100%;height:100%;overflow:hidden;border-radius:6.5cqw;background:#07101b;isolation:isolate;${CARD_TYPOGRAPHY_CSS}color:${tierStyle.text}}
        .frame{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;z-index:1;pointer-events:none;filter:${tierStyle.frameFilter}}
        .tierWash{position:absolute;inset:0;z-index:0;background:linear-gradient(135deg,${tierStyle.accentSoft},transparent 44%);mix-blend-mode:screen}
        .ui{position:absolute;inset:0;z-index:2}.slot{position:absolute;display:flex;align-items:center;justify-content:center;min-width:0}
        .overall{flex-direction:column;justify-content:center;text-shadow:0 .28cqw .85cqw rgba(0,0,0,.9)}
        .overall small{font-size:2.6cqw;line-height:1;font-weight:900;letter-spacing:.08em;color:${tierStyle.muted}}
        .overall b{font-size:6.1cqw;line-height:.95;font-weight:950;color:${tierStyle.text}}
        .position{font-size:3.3cqw;font-weight:950;color:${tierStyle.text};text-shadow:0 .25cqw .65cqw #000}
        .crest img{max-width:88%;max-height:88%;object-fit:contain;filter:drop-shadow(0 .45cqw .9cqw rgba(0,0,0,.48))}
        .crestFallback{width:78%;height:86%;border:.32cqw solid ${tierStyle.accent};clip-path:polygon(50% 0,100% 17%,100% 70%,50% 100%,0 70%,0 17%);background:rgba(3,10,17,.56)}
        .name{font-size:4.25cqw;font-weight:950;line-height:1;text-align:center;padding:0 2.3cqw;color:${tierStyle.text};text-shadow:0 .3cqw .7cqw rgba(0,0,0,.92);white-space:nowrap;overflow:hidden}
        .name.medium{font-size:3.7cqw}.name.long{font-size:3.1cqw}
        .stat{justify-content:space-between;padding:0 1.4cqw;border-bottom:.1cqw solid rgba(255,255,255,.2);font-size:2.65cqw}
        .stat span{font-weight:850;letter-spacing:.035em;color:${tierStyle.muted};overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .stat b{font-size:3.25cqw;font-weight:950;color:${tierStyle.text};transition:color .15s ease,text-shadow .15s ease}
        .stat.better b{color:${tierStyle.accent};text-shadow:0 0 1.1cqw ${tierStyle.accentSoft}}
        .hero{${slotStyle('hero')}flex-direction:column;text-align:center;pointer-events:none}
        .hero[hidden]{display:none}.hero b{font-size:8.4cqw;line-height:.86;font-weight:950;color:${tierStyle.text};text-shadow:0 .4cqw 1.1cqw rgba(0,0,0,.95)}
        .hero small{margin-top:1cqw;font-size:2.15cqw;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:${tierStyle.muted}}
        .shared{${slotStyle('shared')}display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.5cqw;border-top:.1cqw solid rgba(251,191,36,.5);padding-top:.8cqw}
        .sharedItem{display:flex;align-items:center;justify-content:center;gap:.6cqw;min-width:0;white-space:nowrap}
        .sharedItem i{font-style:normal;font-size:2.4cqw;color:${tierStyle.muted}}
        .sharedItem b{font-size:2.65cqw;font-weight:950;color:${tierStyle.text}}
        .sharedItem small{font-size:1.55cqw;font-weight:800;letter-spacing:.035em;color:${tierStyle.muted};overflow:hidden;text-overflow:ellipsis}
      </style>
      <div class="card tier-${tier}" part="card" data-tier="${tier}">
        <div class="tierWash"></div>
        <img class="frame" src="/cards/frames/frame-duo.png" alt="">
        <div class="ui">
          ${sideMarkup('a',A)}
          ${sideMarkup('b',B)}
          <div class="slot hero" ${hero.hidden?'hidden':''}>
            <b>${escapeCardText(formatCardMetric(hero.value,hero.format))}</b><small>${escapeCardText(hero.label||'')}</small>
          </div>
          <div class="slot shared">
            ${shared.map(s=>`<div class="sharedItem"><i>${escapeCardText(s.icon||'')}</i><b>${escapeCardText(formatCardMetric(s.value,s.format))}</b><small>${escapeCardText(s.label||'')}</small></div>`).join('')}
          </div>
        </div>
      </div>`;
  }
}

if(!customElements.get('duo-card')) customElements.define('duo-card',DuoCard);
export { DuoCard };
