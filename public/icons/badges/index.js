const ICONS = {
  topScorer: [
    '<circle cx="14" cy="12" r="4.2"/>',
    '<path d="M10.2 12H4.5M8.2 8.8H3.8M8.2 15.2H5.6"/>',
    '<path class="badge-duotone" d="M12.5 8.3l1.5 1.1 1.7-.6.2 1.8 1.5 1-1.2 1.4.4 1.7-1.8.1-1 1.5-1.1-1.4-1.8-.3.5-1.7-1.1-1.3 1.6-.9z"/>'
  ],
  clinical: [
    '<circle cx="12" cy="12" r="7"/>','<circle cx="12" cy="12" r="3"/>',
    '<path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>',
    '<circle class="badge-duotone" cx="12" cy="12" r="1.1"/>'
  ],
  creator: [
    '<circle cx="6.5" cy="16.5" r="2.3"/>',
    '<path d="M8.7 15.4c2.8-1.4 3.2-5.6 7.1-6.1 1.4-.2 2.6.1 3.8.8"/>',
    '<path d="M17.2 7.2l2.8 3-3.8 1"/>',
    '<path class="badge-duotone" d="M9.5 14c1.5-1.5 2-3.7 3.8-4.7" stroke-dasharray="1.5 2.2"/>'
  ],
  defensive: [
    '<path d="M12 3.2l6 2.3v5.6c0 4.2-2.1 7.1-6 9.7-3.9-2.6-6-5.5-6-9.7V5.5L12 3.2z"/>',
    '<path d="M8.2 15.3l7.9-7.1"/>',
    '<path class="badge-duotone" d="M7.4 12.8l7.3-6.5"/>'
  ],
  mvp: [
    '<path d="M5 16.8l1.2-8 3.4 3 2.4-5 2.4 5 3.4-3 1.2 8H5z"/>',
    '<path d="M7 19h10"/>',
    '<path class="badge-duotone" d="M12 8.6l.8 1.6 1.8.3-1.3 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.2 1.8-.3.8-1.6z"/>'
  ],
  ironMan: [
    '<circle cx="12" cy="13" r="7"/>','<path d="M9 3h6M12 6v2.5M17.3 7.7l1.4-1.4"/>',
    '<path d="M12 13l3.4-2"/>',
    '<path class="badge-duotone" d="M12 9.5v3.5l2.5 1.4"/>'
  ],
  goalkeeperWall: [
    '<path d="M6.3 17.8l-1.2-5.7c-.2-.9.5-1.7 1.4-1.6l1.7.2.2-4.2c0-.9.7-1.5 1.6-1.5.8 0 1.4.6 1.5 1.4l.3 3.1.8-4.1c.2-.8.9-1.3 1.7-1.2.8.1 1.3.8 1.2 1.6l-.4 3.5 1.1-2.7c.3-.8 1.2-1.1 1.9-.8.7.3 1.1 1.1.8 1.8l-2.6 7c-.8 2.1-2.1 3.7-4.3 4.4-2 .6-4.8.2-5.7-1.2z"/>',
    '<path class="badge-duotone" d="M8.2 12.4c2.2.6 4.7.4 7.2-.7"/>'
  ],
  miss: [
    '<circle cx="9" cy="13" r="3.5"/>','<path d="M13 9l6-4M16.2 5h3v3"/>',
    '<path class="badge-duotone" d="M13.2 14.2l5.1 2.3"/>'
  ],
  sentOff: [
    '<rect x="7.2" y="4.3" width="9.6" height="15.4" rx="1.5"/>',
    '<path d="M9.5 7.3h5M9.5 10.3h5"/>',
    '<path class="badge-duotone" d="M9.5 14.2l5 2.6M14.5 14.2l-5 2.6"/>'
  ],
  backpack: [
    '<path d="M8.2 7.2V5.8c0-1.3 1-2.3 2.3-2.3h3c1.3 0 2.3 1 2.3 2.3v1.4"/>',
    '<rect x="5.5" y="7" width="13" height="13.5" rx="3"/>','<path d="M8.3 11.2h7.4M9 15.5h6"/>',
    '<path class="badge-duotone" d="M8 8.2v10.5M16 8.2v10.5"/>'
  ],
  architect: [
    '<path d="M4.2 17.8c3.2-4.5 5.2-7.5 7.3-9.2 1.6-1.3 3.2-1.7 5.4-1.3"/>',
    '<circle cx="5.1" cy="18.2" r="1.8"/>','<circle cx="17.8" cy="7.3" r="1.8"/>',
    '<path d="M12.3 17.5h7M15.8 14v7"/>',
    '<path class="badge-duotone" d="M9.1 13.6c1.3-2 2.6-3.4 4-4.3" stroke-dasharray="1.5 2"/>'
  ],
  ghost: [
    '<path d="M6 19V9.5a6 6 0 0 1 12 0V19l-2.2-1.6L14 19l-2-1.6L10 19l-1.8-1.6L6 19z"/>',
    '<path d="M9.5 10h.01M14.5 10h.01"/>',
    '<path class="badge-duotone" d="M9.3 13.7c1.8 1.1 3.6 1.1 5.4 0"/>'
  ],
  lMerchant: [
    '<path d="M5 5v11.5h12"/>','<path d="M7.3 8.2l3.2 3.1 2.7-1.5 4 5"/>','<path d="M14.5 14.8h2.7v-2.7"/>',
    '<path class="badge-duotone" d="M7 18.8h11"/>'
  ],
  selfGlazer: [
    '<path d="M12 3.4l1.4 4.2 4.2 1.4-4.2 1.4-1.4 4.2-1.4-4.2L6.4 9l4.2-1.4L12 3.4z"/>',
    '<path d="M17.8 14.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>',
    '<path class="badge-duotone" d="M5.2 15.2l.6 1.6 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6.6-1.6z"/>'
  ],
  mainCharacter: [
    '<path d="M5 16.7l1.2-7.6 3.4 2.8 2.4-4.8 2.4 4.8 3.4-2.8 1.2 7.6H5z"/>','<path d="M7 19h10"/>',
    '<circle class="badge-duotone" cx="12" cy="5" r="1.4"/>'
  ],
  goalkeeper: [
    '<path d="M6.4 18l-1-5.5c-.2-1 .6-1.8 1.6-1.6l1.5.3.3-4.5c.1-.9.8-1.5 1.7-1.4.8.1 1.4.7 1.4 1.5v3.5l.9-4c.2-.8 1-1.3 1.8-1.1.8.2 1.3 1 1.1 1.8l-.7 3.6 1.3-2.6c.4-.7 1.2-1 1.9-.6.7.4 1 1.2.7 1.9l-2.7 6.2c-.9 2-2.4 3.5-4.6 3.9-2.1.4-4.5-.3-5.1-1.4z"/>',
    '<path class="badge-duotone" d="M8.1 13.4c2.6.6 5.1.2 7.2-1.1"/>'
  ],
  defender: [
    '<path d="M12 3.3l6 2.2v5.8c0 4.1-2.2 7-6 9.4-3.8-2.4-6-5.3-6-9.4V5.5L12 3.3z"/>',
    '<path d="M8.7 12.2l2.1 2.1 4.6-4.8"/>',
    '<path class="badge-duotone" d="M7.5 7.4l9 9"/>'
  ],
  midfielder: [
    '<circle cx="12" cy="12" r="3.2"/>','<path d="M8.3 12H3.5M15.7 12h4.8"/>','<path d="M5.8 9.7L3.5 12l2.3 2.3M18.2 9.7l2.3 2.3-2.3 2.3"/>',
    '<path class="badge-duotone" d="M10.4 9.2l1.6-1 1.6 1 .2 1.8 1.5 1-1.1 1.4.3 1.8-1.8.2-1 1.5-1.2-1.4-1.8-.2.5-1.7-1.1-1.3 1.5-.9z"/>'
  ],
  forward: [
    '<circle cx="14.2" cy="12" r="3.5"/>','<path d="M10.5 12H4M8.6 8.7H3.5M8.6 15.3H5.5"/>','<path d="M17.7 9.3l2.8 2.7-2.8 2.7"/>',
    '<path class="badge-duotone" d="M12.7 9.1l1.5 1 1.7-.5.3 1.7 1.4 1-1 1.4.4 1.7-1.8.2-1 1.5-1.2-1.4-1.8-.2.5-1.7-1.1-1.3 1.5-.9z"/>'
  ],
  featureClubStats: [
    '<path d="M4 18V9m5 9V5m5 13v-6m5 6V3"/>','<path d="M3 20h18"/>',
    '<path class="badge-duotone" d="M4 13l5-4 5 3 5-6"/>'
  ],
  featurePlayerAnalytics: [
    '<circle cx="8" cy="8" r="3"/>','<path d="M3.5 18c.7-3 2.3-4.6 4.5-4.6 1.2 0 2.2.4 3 1"/>','<path d="M14 18l2.1-2.6 1.8 1.5 2.6-3.4"/>',
    '<path class="badge-duotone" d="M14 8h6M14 11h4"/>'
  ],
  featureSessions: [
    '<path d="M6 5.5h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"/>','<path d="M8 3v5M16 3v5M4 9h16"/>',
    '<path class="badge-duotone" d="M8 13h3v3H8zM14 13h2"/>'
  ],
  creativity: [
    '<path d="M5 17.5c1.2-3.8 3.6-6.2 7-7.2 2.1-.7 4-.6 6 .1"/>','<circle cx="5" cy="17.5" r="2"/>','<path d="M16.2 6.2l1.1 2 2.2.4-1.6 1.6.4 2.2-2.1-1.1-2 1.1.4-2.2L13 8.6l2.2-.4 1-2z"/>',
    '<path class="badge-duotone" d="M8.2 15.2c1.4-2.1 3-3.5 5.3-4.3" stroke-dasharray="1.4 2"/>'
  ]
};

function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
export const badgeIconNames = Object.freeze(Object.keys(ICONS));
export function BadgeIcon(name,{size=24,className='',title=''}={}){
  const body=ICONS[name]||ICONS.mvp;
  const titleMarkup=title?`<title>${esc(title)}</title>`:'';
  return `<svg class="${esc(className)}" width="${Number(size)||24}" height="${Number(size)||24}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="${title?'false':'true'}" role="img">${titleMarkup}${body.join('')}</svg>`;
}
export const TopScorerIcon=(o)=>BadgeIcon('topScorer',o);
export const ClinicalIcon=(o)=>BadgeIcon('clinical',o);
export const CreatorIcon=(o)=>BadgeIcon('creator',o);
export const DefensiveIcon=(o)=>BadgeIcon('defensive',o);
export const MvpIcon=(o)=>BadgeIcon('mvp',o);
export const IronManIcon=(o)=>BadgeIcon('ironMan',o);
export const GoalkeeperWallIcon=(o)=>BadgeIcon('goalkeeperWall',o);
export const MissIcon=(o)=>BadgeIcon('miss',o);
export const SentOffIcon=(o)=>BadgeIcon('sentOff',o);
export const BackpackIcon=(o)=>BadgeIcon('backpack',o);
export const ArchitectIcon=(o)=>BadgeIcon('architect',o);
export const GhostIcon=(o)=>BadgeIcon('ghost',o);
export const LMerchantIcon=(o)=>BadgeIcon('lMerchant',o);
export const SelfGlazerIcon=(o)=>BadgeIcon('selfGlazer',o);
export const MainCharacterIcon=(o)=>BadgeIcon('mainCharacter',o);
export const GoalkeeperIcon=(o)=>BadgeIcon('goalkeeper',o);
export const DefenderIcon=(o)=>BadgeIcon('defender',o);
export const MidfielderIcon=(o)=>BadgeIcon('midfielder',o);
export const ForwardIcon=(o)=>BadgeIcon('forward',o);
export const ClubStatsIcon=(o)=>BadgeIcon('featureClubStats',o);
export const PlayerAnalyticsIcon=(o)=>BadgeIcon('featurePlayerAnalytics',o);
export const SessionsMiscIcon=(o)=>BadgeIcon('featureSessions',o);
export const CreativityIcon=(o)=>BadgeIcon('creativity',o);
if(typeof window!=='undefined')window.ClubroomBadgeIcons={BadgeIcon,names:badgeIconNames};
