/* CLUBROOM PlayerAvatar: the only renderer of character artwork. Light DOM works inside PlayerCard shadow DOM and PNG export. */
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const valid=v=>/^#[0-9a-f]{6}$/i.test(String(v||''));
  const normalizeColor=v=>valid(v)?v:'#64748b';
  const attrs=['player-id','player-name','position','variant','jersey-color'];
  const styles=`
  player-avatar{display:block;position:relative;min-width:0;min-height:0;overflow:hidden;isolation:isolate;--avatar-color:#64748b}
  player-avatar .avatarLayer{position:absolute;inset:0;width:100%;height:100%;transform-origin:center center;pointer-events:none}
  player-avatar .avatarArt{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom}
  player-avatar .avatarTint{position:absolute;inset:0;background:var(--avatar-color);mix-blend-mode:multiply;opacity:.94;mask-image:var(--avatar-mask);-webkit-mask-image:var(--avatar-mask);mask-position:center bottom;-webkit-mask-position:center bottom;mask-size:contain;-webkit-mask-size:contain;mask-repeat:no-repeat;-webkit-mask-repeat:no-repeat}
  player-avatar[variant=mini] .avatarLayer{transform:scale(1.1) translateY(3%)}
  player-avatar[variant=bust] .avatarLayer{transform:scale(1.02) translateY(1%)}
  player-avatar[variant=card] .avatarLayer{transform:scale(1.04) translateY(2%)}
  `;
  // CharacterLayer owns the matched image/mask geometry. PlayerAvatar is the sole public renderer.
  class CharacterLayer {
    static markup(src){return `<span class="avatarLayer"><img class="avatarArt" src="${esc(src)}" alt="" decoding="async" loading="eager"><span class="avatarTint"></span></span>`}
  }
  class PlayerAvatar extends HTMLElement{
    static get observedAttributes(){return attrs}
    connectedCallback(){this.render()}
    attributeChangedCallback(){if(this.isConnected)this.render()}
    render(){
      const db=window.ClubroomCharacters;
      const player=db?.resolvePlayer?.({id:this.getAttribute('player-id'),name:this.getAttribute('player-name'),position:this.getAttribute('position')})||{};
      const data=db?.getCharacterForPlayer?.(player), mask=db?.getMaskForPlayer?.(player);
      const color=normalizeColor(this.getAttribute('jersey-color')||window.ClubroomAvatars?.getClubColor?.());
      this.dataset.characterId=data?.id||'missing';this.dataset.avatarPlayerId=String(player.id||'');
      this.style.setProperty('--avatar-color',color);
      this.style.setProperty('--avatar-mask',`url("${mask||''}")`);
      // Artwork and per-character mask are drawn inside the same transformed wrapper.
      this.innerHTML=CharacterLayer.markup(data?.src||'/cards/players/default.png');
    }
  }
  if(!customElements.get('player-avatar'))customElements.define('player-avatar',PlayerAvatar);
  const registry={clubColor:'#64748b',getClubColor(){return this.clubColor},setClubColor(color){this.clubColor=normalizeColor(color);document.querySelectorAll('player-avatar').forEach(el=>el.setAttribute('jersey-color',this.clubColor))},registerPlayers(players){window.ClubroomCharacters?.registerPlayers?.(players);document.querySelectorAll('player-avatar').forEach(el=>el.render())}};
  window.ClubroomAvatars=registry;
  const style=document.createElement('style');style.id='clubroom-player-avatar-style';style.textContent=styles;
  document.head.appendChild(style);
  window.CLUBROOM_AVATAR_CSS=styles;
})();
