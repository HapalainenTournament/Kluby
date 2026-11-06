(function(){
  const STORAGE_PREFIX='clubroom:character:';
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
  const storage={
    get(id){try{return localStorage.getItem(STORAGE_PREFIX+id)}catch{return null}},
    set(id,v){try{localStorage.setItem(STORAGE_PREFIX+id,v);return true}catch{return false}},
    remove(id){try{localStorage.removeItem(STORAGE_PREFIX+id);return true}catch{return false}}
  };
  const all=()=>Object.values(registry).flat();
  const byId=id=>all().find(c=>c.id===id)||null;
  function getCharactersForPosition(pos){return registry[positionCategory(pos)].slice()}
  function getCharacterForPlayer(player){
    const id=String(player?.id??player?.player_id??'');
    const override=id?storage.get(id):null;
    if(override){const c=byId(override);if(c)return c}
    const pool=getCharactersForPosition(player?.position);
    return pool[hash(id||player?.name||player?.player_name||'player')%pool.length]||null;
  }
  function setCharacterForPlayer(playerId,characterId){if(!byId(characterId))return false;return storage.set(String(playerId),characterId)}
  function clearCharacterForPlayer(playerId){return storage.remove(String(playerId))}
  window.ClubroomCharacters={registry,positionCategory,getCharactersForPosition,getCharacterForPlayer,setCharacterForPlayer,clearCharacterForPlayer};
})();
