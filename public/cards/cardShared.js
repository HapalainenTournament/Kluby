import { cardTiers } from './cardTiers.generated.js';

export const CARD_FONT_STACK = 'Inter,Manrope,system-ui,sans-serif';
export const CARD_TYPOGRAPHY_CSS = `font-family:${CARD_FONT_STACK};font-variant-numeric:tabular-nums;`;

export const hasCardValue = v => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && !Number.isFinite(v));
export const displayCardValue = (v, suffix='') => hasCardValue(v) ? `${v}${suffix}` : '--';
export const escapeCardText = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
export const cardNameClass = name => String(name ?? '').length > 18 ? 'long' : String(name ?? '').length > 12 ? 'medium' : '';

export const numericCardValue = v => {
  if (!hasCardValue(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function formatCardMetric(value, format='raw'){
  if (!hasCardValue(value)) return '--';
  const n = numericCardValue(value);
  if (format === 'integer') return n === null ? String(value) : String(Math.round(n));
  if (format === 'rating') return n === null ? String(value) : n.toFixed(2);
  if (format === 'decimal2') return n === null ? String(value) : n.toFixed(2);
  if (format === 'decimal1') return n === null ? String(value) : n.toFixed(1);
  if (format === 'percent0') return n === null ? String(value) : `${n.toFixed(0)}%`;
  if (format === 'percent1') return n === null ? String(value) : `${n.toFixed(1)}%`;
  return String(value);
}

export function resolveCardTier(overall, explicitTier=''){
  const raw = overall === '' || overall === null || overall === undefined ? null : Number(overall);
  const ovr = Number.isFinite(raw) ? raw : null;
  const tierNames = Object.keys(cardTiers.styles);
  const autoTier = ovr === null
    ? cardTiers.fallbackTier
    : cardTiers.thresholds.reduce((picked,row)=>ovr>=row.min?row.tier:picked,cardTiers.fallbackTier);
  const tier = tierNames.includes(explicitTier) ? explicitTier : autoTier;
  return { tier, tierStyle: cardTiers.styles[tier] || cardTiers.styles[cardTiers.fallbackTier], overall: ovr };
}


export async function cardUrlToDataUrl(url){
  if(!url) return '';
  if(String(url).startsWith('data:')) return String(url);
  try{
    const r=await fetch(url,{mode:'cors',credentials:'omit'});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const blob=await r.blob();
    return await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result||''));fr.onerror=reject;fr.readAsDataURL(blob)});
  }catch(e){ console.warn('[Card export] asset skipped',url,e?.message||e); return ''; }
}

export async function rasterizeCardElement({card,style,width=1200,height=1800,scale=1,assetReplacer}){
  if(!card||!style) throw new Error('Card export source is incomplete.');
  const clone=card.cloneNode(true);
  clone.querySelectorAll('[onerror]').forEach(el=>el.removeAttribute('onerror'));
  let css=style.textContent||'';
  css=css.replace(/:host/g,'.exportHost');
  if(assetReplacer){ const result=await assetReplacer(clone,css); if(result?.css!==undefined) css=result.css; }
  const html=`<div xmlns="http://www.w3.org/1999/xhtml" class="exportHost"><style>${css}</style>${clone.outerHTML}</div>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`;
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  try{
    const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Unable to rasterize card SVG.'));im.src=url});
    const canvas=document.createElement('canvas'); canvas.width=Math.round(width*scale); canvas.height=Math.round(height*scale);
    const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('Canvas is unavailable.');
    ctx.scale(scale,scale); ctx.drawImage(img,0,0,width,height);
    return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG export failed.')),'image/png'));
  }finally{URL.revokeObjectURL(url)}
}

export async function downloadCardBlob(blob,filename){
  const url=URL.createObjectURL(blob);
  try{const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove()}finally{setTimeout(()=>URL.revokeObjectURL(url),1500)}
}
