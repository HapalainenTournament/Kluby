(function(){
  // Identity is deterministic and shared by every avatar; legacy manual overrides are ignored.
  const registry={
    FWD:[
      {id:'fwd-1',name:'Forward 01',src:'/cards/characters/fwd-1.png'},
      {id:'fwd-2',name:'Forward 02',src:'/cards/characters/fwd-2.png'}
    ],
    MID:[
      {id:'mid-1',name:'Midfielder 01',src:'/cards/characters/mid-1.png'},
      {id:'mid-2',name:'Midfielder 02',src:'/cards/characters/mid-2.png'}
    ],
    DEF:[
      {id:'def-1',name:'Defender 01',src:'/cards/characters/def-1.png'},
      {id:'def-2',name:'Defender 02',src:'/cards/characters/def-2.png'}
    ],
    GK:[
      {id:'gk-1',name:'Goalkeeper 01',src:'/cards/characters/gk-1.png'},
      {id:'gk-2',name:'Goalkeeper 02',src:'/cards/characters/gk-2.png'}
    ]
  };
  const positionCategory=pos=>{
    const p=String(pos||'').trim().toUpperCase();
    if(/GK|GOALKEEPER|GOAL/.test(p))return'GK';
    if(/CB|LB|RB|LWB|RWB|DEFENDER|DEF/.test(p))return'DEF';
    if(/CM|CAM|CDM|LM|RM|MIDFIELDER|MID/.test(p))return'MID';
    return'FWD';
  };
  const hash=s=>{let h=2166136261;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
  const all=()=>Object.values(registry).flat();
  const byId=id=>all().find(c=>c.id===id)||null;
  function getCharactersForPosition(pos){return registry[positionCategory(pos)].slice()}
  const roster=new Map();
  const key=v=>String(v??'').trim().toLocaleLowerCase();
  function registerPlayers(players){for(const p of (players||[])){
    const candidate={id:String(p?.id??p?.player_id??''),name:String(p?.name??p?.pro_name??p?.player_name??''),position:p?.position??p?.pos??''};
    if(candidate.id)roster.set(key(candidate.id),candidate);
    if(candidate.name)roster.set(key(candidate.name),candidate);
  }}
  function resolvePlayer(player){
    const ref=typeof player==='string'?{id:player,name:player}:player||{};
    return roster.get(key(ref.id))||roster.get(key(ref.player_id))||roster.get(key(ref.name))||roster.get(key(ref.player_name))||ref;
  }
  function getCharacterForPlayer(player){
    const p=resolvePlayer(player),seed=String(p?.id||p?.player_id||p?.name||p?.player_name||'player').toLocaleLowerCase();
    const pool=getCharactersForPosition(p?.position||p?.pos);
    return pool[hash(seed)%pool.length]||null;
  }
  function getMaskForPlayer(player){const c=getCharacterForPlayer(player);return c?`/cards/characters/masks/${c.id}.png`:''}
  function setCharacterForPlayer(){return false} // Deprecated. No per-view mutations.
  function clearCharacterForPlayer(){return false}
  window.ClubroomCharacters={registry,positionCategory,registerPlayers,resolvePlayer,getCharactersForPosition,getCharacterForPlayer,getMaskForPlayer,setCharacterForPlayer,clearCharacterForPlayer};
})();
