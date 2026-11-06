const $=s=>document.querySelector(s),N=v=>Number(v??0),A=x=>Array.isArray(x)?x:(x&&typeof x==="object"?Object.values(x).filter(v=>v&&typeof v==="object"):[]);
const P=(o,ks,d=0)=>{for(const k of ks)if(o&&o[k]!=null)return o[k];return d};
const pct=v=>{let n=Number(v);return !Number.isFinite(n)||n<0?"—":(n>0&&n<=1?n*100:n).toFixed(1)+"%"};
let S={raw:null,club:null,players:[],matches:[],searchClub:null};

async function fetchJSON(url,timeoutMs=10000){
 const c=new AbortController();const t=setTimeout(()=>c.abort(),timeoutMs);
 try{const r=await fetch(url,{signal:c.signal,cache:"no-store"});let d;try{d=await r.json()}catch{d={error:"Server vrátil neplatnou odpověď."}};if(!r.ok)throw Error(d.detail||d.error||`HTTP ${r.status}`);return d}
 catch(e){if(e.name==="AbortError")throw Error(`Server neodpověděl do ${Math.round(timeoutMs/1000)} s.`);throw e}
 finally{clearTimeout(t)}
}
let playerSortState={key:"rating",dir:-1,position:"all",minGames:0};

const RECENT_CLUBS_KEY49="clubroomRecentClubs49",FAVORITE_CLUBS_KEY49="clubroomFavoriteClubs49";
let currentClubBookmark49=null;
function localRead49(key){try{const v=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(v)?v:[]}catch{return[]}}
function localWrite49(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function normalizeSavedClub49(c){if(!c)return null;const id=String(c.clubId||c.clubid||c.id||"").trim();if(!id)return null;return {id,name:String(c.clubName||c.name||`Club ${id}`),platform:String(c.platform||$("#platform")?.value||"common-gen5"),crestAssetId:c.crestAssetId??P(c?.customKit,["crestAssetId"],null)}}
function platformLabel49(p){return p==="common-gen4"?"PS4 / Xbox One":"PS5 / Xbox Series / PC"}
function readableRegion61(v){const s=String(v??"").trim();return s&&/[A-Za-zÀ-ž]/.test(s)&&!/^\d+$/.test(s)?s:""}
function safeClubColor61(v){if(v==null||v==="")return null;const c=eaKitColor(v,"");return /^#[0-9a-f]{6}$/i.test(c)?c.toUpperCase():null}
function uniqueColors61(colors){const out=[];for(const c of colors.filter(Boolean)){if(!out.some(x=>x.toLowerCase()===c.toLowerCase()))out.push(c)}return out.slice(0,3)}
function crestColorCacheKey61(crestId){return `clubroomCrestColors61:${crestId||"none"}`}
function readCrestColors61(crestId){try{const v=JSON.parse(localStorage.getItem(crestColorCacheKey61(crestId))||"null");return Array.isArray(v)?v.filter(x=>/^#[0-9a-f]{6}$/i.test(x)).slice(0,3):[]}catch{return[]}}
function writeCrestColors61(crestId,colors){try{localStorage.setItem(crestColorCacheKey61(crestId),JSON.stringify(colors.slice(0,3)))}catch{}}
function rgbHex61(r,g,b){return `#${[r,g,b].map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,"0")).join("")}`.toUpperCase()}
function extractCrestColors61(img,crestId){return new Promise(resolve=>{try{const c=document.createElement("canvas"),ctx=c.getContext("2d",{willReadFrequently:true});c.width=64;c.height=64;ctx.drawImage(img,0,0,64,64);const d=ctx.getImageData(0,0,64,64).data,bins=new Map();for(let i=0;i<d.length;i+=16){const a=d[i+3];if(a<150)continue;const r=d[i],g=d[i+1],b=d[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx<28||mn>235||mx-mn<18)continue;const q=[r,g,b].map(v=>Math.round(v/32)*32);const k=q.join(",");bins.set(k,(bins.get(k)||0)+1)}const colors=[...bins.entries()].sort((a,b)=>b[1]-a[1]).map(([k])=>rgbHex61(...k.split(",").map(Number)));const picked=[];for(const c of colors){const [r,g,b]=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));if(!picked.some(p=>{const [pr,pg,pb]=[1,3,5].map(i=>parseInt(p.slice(i,i+2),16));return Math.hypot(r-pr,g-pg,b-pb)<70}))picked.push(c);if(picked.length===3)break}if(picked.length)writeCrestColors61(crestId,picked);resolve(picked)}catch{resolve([])}})}
function setClubColors61(colors){const host=$("#clubColors61"),hero=$(".overviewHero44");const clean=uniqueColors61(colors);if(host){host.innerHTML=clean.map(c=>`<button class="clubColorSwatch61" type="button" style="--swatch:${c}" aria-label="Club color ${c}" data-hex="${c}"><span>${c}</span></button>`).join("");host.hidden=!clean.length}if(hero){if(clean[0])hero.style.setProperty("--club-primary",clean[0]);else hero.style.removeProperty("--club-primary")}}
function divisionTone61(v){const n=Number(v);if(!Number.isFinite(n))return"neutral";if(n<=2)return"gold";if(n<=5)return"cyan";if(n<=8)return"green";return"neutral"}
function clubMetaIcon61(type){const icons={stadium:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18M5 10l2-5h10l2 5M5 10v8m14-8v8M8 14h8M9 18h6"/></svg>',region:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9z"/></svg>',platform:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M8 10v4m-2-2h4m5-1h.01M18 13h.01"/></svg>'};return icons[type]||""}
function renderClubMeta61(stadium,region,platform){const meta=$("#clubMeta44");if(!meta)return;const bits=[{type:"stadium",text:stadium||"Tier 1 Stadium"},{type:"region",text:readableRegion61(region)},{type:"platform",text:platform}].filter(x=>x.text);meta.innerHTML=bits.map(x=>`<span>${clubMetaIcon61(x.type)}<em>${escapeHtml(String(x.text))}</em></span>`).join('<i aria-hidden="true"></i>');meta.hidden=!bits.length}
function setPlatform49(value){const v=value==="common-gen4"?"common-gen4":"common-gen5";const sel=$("#platform");if(sel)sel.value=v;document.querySelectorAll("#platformSegment44 [data-platform]").forEach(x=>{const active=x.dataset.platform===v;x.classList.toggle("active",active);x.setAttribute("aria-pressed",active?"true":"false")})}
function addRecent49(c){const n=normalizeSavedClub49(c);if(!n)return;const next=[n,...localRead49(RECENT_CLUBS_KEY49).filter(x=>String(x.id)!==n.id)].slice(0,5);localWrite49(RECENT_CLUBS_KEY49,next);renderSavedClubs49()}
function isFavorite49(id){return localRead49(FAVORITE_CLUBS_KEY49).some(x=>String(x.id)===String(id))}
function updateFavoriteButton49(){const b=$("#favoriteClub44");if(!b||!currentClubBookmark49)return;const active=isFavorite49(currentClubBookmark49.id);b.textContent=active?"★":"☆";b.classList.toggle("active",active);b.setAttribute("aria-label",active?"Remove club from favorites":"Add club to favorites");b.title=active?"Remove from favorites":"Add to favorites"}
function toggleFavorite49(){if(!currentClubBookmark49)return;const n=normalizeSavedClub49(currentClubBookmark49);let list=localRead49(FAVORITE_CLUBS_KEY49);if(list.some(x=>String(x.id)===n.id))list=list.filter(x=>String(x.id)!==n.id);else list=[n,...list.filter(x=>String(x.id)!==n.id)];localWrite49(FAVORITE_CLUBS_KEY49,list);updateFavoriteButton49();renderSavedClubs49()}
function savedClubRow49(c){const logo=crestUrl(c.crestAssetId),fallback=(String(c.name||"C").match(/[A-Z0-9]/ig)||["C"]).slice(0,2).join("").toUpperCase();return `<button class="homeSavedRow49" type="button" data-saved-club49="${escapeHtml(String(c.id))}" data-saved-platform49="${escapeHtml(String(c.platform||"common-gen5"))}"><span class="homeSavedCrest49"><span>${fallback}</span>${logo?`<img src="${logo}" alt="" onload="this.previousElementSibling.hidden=true" onerror="this.remove()">`:""}</span><span class="homeSavedCopy49"><b>${escapeHtml(c.name||`Club ${c.id}`)}</b><small>${platformLabel49(c.platform)}</small></span><span class="homeSavedArrow49" aria-hidden="true">→</span></button>`}
function renderSavedClubs49(){const recent=localRead49(RECENT_CLUBS_KEY49),fav=localRead49(FAVORITE_CLUBS_KEY49);const r=$("#recentSearches49"),f=$("#favoriteClubs49");if(r)r.innerHTML=recent.length?recent.map(savedClubRow49).join(""):'<div class="homeSavedEmpty49">Your recent clubs will show up here</div>';if(f)f.innerHTML=fav.length?fav.map(savedClubRow49).join(""):'<div class="homeSavedEmpty49">Star a club to pin it here</div>';document.querySelectorAll("[data-saved-club49]").forEach(el=>el.onclick=()=>{setPlatform49(el.dataset.savedPlatform49);const source=[...recent,...fav].find(x=>String(x.id)===String(el.dataset.savedClub49));load(el.dataset.savedClub49,source||null)})}

function crestUrl(crestId){return crestId?`https://eafc24.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l${crestId}.png`:""}
function searchCard(c){
 const id=c.clubId||c.clubid||c.id,name=c.clubName||c.name||"Club";
 const div=P(c,["currentDivision","division","divisionNumber","div"],null);
 const sr=P(c,["skillRating","skill","clubSkillRating","sr"],null);
 const crestId=P(c?.customKit,["crestAssetId"],P(c,["crestAssetId"],null)),logo=crestUrl(crestId),fallback=(String(name).match(/[A-Z0-9]/ig)||["C"]).slice(0,2).join("").toUpperCase();
 const platform=platformLabel49($("#platform")?.value||"common-gen5");
 const divText=div!=null&&String(div).trim()!==""?`Division ${escapeHtml(String(div))}`:"Division --";
 const srText=sr!=null&&String(sr).trim()!==""?`SR ${escapeHtml(String(sr))}`:"SR --";
 return `<button class="searchClubCard50" type="button" data-id="${escapeHtml(String(id))}"><span class="searchClubCrest50"><span>${fallback}</span>${logo?`<img src="${logo}" alt="" onload="this.previousElementSibling.hidden=true" onerror="this.remove()">`:""}</span><span class="searchClubMain50"><strong>${escapeHtml(name)}</strong><span class="searchClubMeta50"><em>${divText}</em><i aria-hidden="true">•</i><em>${srText}</em></span></span><span class="searchClubPlatform50">${escapeHtml(platform)}</span><span class="searchClubArrow50" aria-hidden="true">→</span></button>`
}
async function enrichSearchCards(cards){for(const c of cards.slice(0,6)){const id=c.clubId||c.clubid||c.id;try{const x=await fetchJSON(`/api/club-card/${id}?platform=${$("#platform").value}`,4500);Object.assign(c,x||{});const el=document.querySelector(`.searchClubCard50[data-id="${CSS.escape(String(id))}"]`);if(el){const wrap=document.createElement("div");wrap.innerHTML=searchCard(c);el.replaceWith(wrap.firstElementChild)}}catch{}} bindSearchCards(cards)}
function bindSearchCards(cards){document.querySelectorAll(".searchClubCard50").forEach(x=>x.onclick=()=>{const c=cards.find(z=>String(z.clubId||z.clubid||z.id)===String(x.dataset.id));load(x.dataset.id,c||null)})}
const homeSearchSubmit44=$("#homeSearchSubmit44"),homeSearchButtonText44=document.querySelector(".homeSearchButtonText44"),homeSearchInput44=$("#q"),platformSelect44=$("#platform");
function syncHomeSearchButton44(){if(homeSearchSubmit44)homeSearchSubmit44.classList.toggle("is-empty",!String(homeSearchInput44?.value||"").trim())}
function setHomeSearchLoading44(on){if(!homeSearchSubmit44)return;homeSearchSubmit44.classList.toggle("is-loading",!!on);homeSearchSubmit44.disabled=!!on;if(homeSearchButtonText44)homeSearchButtonText44.textContent=on?"Searching…":"Search"}
document.querySelectorAll("#platformSegment44 [data-platform]").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll("#platformSegment44 [data-platform]").forEach(x=>{const active=x===btn;x.classList.toggle("active",active);x.setAttribute("aria-pressed",active?"true":"false")});if(platformSelect44)platformSelect44.value=btn.dataset.platform||"common-gen5"}));
homeSearchInput44?.addEventListener("input",syncHomeSearchButton44);syncHomeSearchButton44();
$("#clearRecent49")?.addEventListener("click",()=>{localWrite49(RECENT_CLUBS_KEY49,[]);renderSavedClubs49()});
$("#favoriteClub44")?.addEventListener("click",toggleFavorite49);
renderSavedClubs49();
let lastSearch50={q:"",platform:"common-gen5"};
function searchLoadingState50(){return `<div class="searchState50 loading"><span class="searchStateSpinner50" aria-hidden="true"></span><div><b>Searching clubs…</b><small>Checking EA Pro Clubs for matching clubs.</small></div></div>`}
function searchEmptyState50(){return `<div class="searchState50 empty"><span class="searchStateIcon50" aria-hidden="true">⌕</span><div><b>No clubs found</b><small>Check the club name and make sure the correct platform generation is selected.</small></div></div>`}
function searchErrorState50(message){return `<div class="searchState50 error"><span class="searchStateIcon50" aria-hidden="true">!</span><div class="searchStateCopy50"><b>Search unavailable</b><small>${escapeHtml(message||"EA search could not be completed.")}</small></div><button id="retrySearch50" type="button">Try again</button></div>`}
async function runSearch50(){
 const q=String($("#q")?.value||"").trim();
 const platform=$("#platform")?.value||"common-gen5";
 lastSearch50={q,platform};
 setHomeSearchLoading44(true);$("#results").innerHTML=searchLoadingState50();
 try{
  let d=await fetchJSON(`/api/search?q=${encodeURIComponent(q)}&platform=${platform}`,9000);
  let a=A(d).flatMap(x=>Array.isArray(x)?x:[x]).filter(x=>x.clubId||x.clubid||x.id);
  const shown=a.slice(0,15);
  if(!shown.length){$("#results").innerHTML=searchEmptyState50();return}
  $("#results").innerHTML=`<section class="searchResultsPanel50"><div class="searchResultsHead50"><div><span class="kicker">SEARCH RESULTS</span><h2>${shown.length} ${shown.length===1?"club":"clubs"} found</h2></div><small>${escapeHtml(platformLabel49(platform))}</small></div><div class="searchResultsList50">${shown.map(searchCard).join("")}</div></section>`;
  bindSearchCards(shown);enrichSearchCards(shown)
 }catch(e){
  $("#results").innerHTML=searchErrorState50(e.message);
  $("#retrySearch50")?.addEventListener("click",()=>{setPlatform49(lastSearch50.platform);if($("#q"))$("#q").value=lastSearch50.q;runSearch50()})
 }finally{setHomeSearchLoading44(false);syncHomeSearchButton44()}
}
$("#search").onsubmit=e=>{e.preventDefault();runSearch50()};
async function load(id,searchClub=null){$("#results").innerHTML='<div class="msg">Načítám klub…</div>';try{const d=await fetchJSON(`/api/club/${id}?platform=${$("#platform").value}`,12000);render(id,d,searchClub);$("#results").innerHTML="";history.replaceState(null,"",`/club/${id}`)}catch(e){$("#results").innerHTML=`<div class="msg errorMsg"><b>Klub se nepodařilo načíst.</b><br>${escapeHtml(e.message)}<br><small>Zkus hledání znovu. Stránka už nebude viset donekonečna.</small></div>`}}

function first(...vals){for(const v of vals)if(v!=null&&v!=="")return v;return 0}
function playerArray(d){let candidates=[d?.members?.members,d?.members?.players,d?.members,d?.career?.members,d?.career?.players,d?.career];for(const c of candidates){let a=A(c);if(a.length&&a.some(x=>P(x,["name","playerName","personaName","proName"],null)))return a}return[]}
function normalizePlayer(x){
 const games=N(P(x,["gamesPlayed","games","appearances"],0)),goals=N(P(x,["goals","goalsScored"],0)),assists=N(P(x,["assists"],0));
 return {raw:x,id:String(P(x,["personaId","playerId","id","name","personaName"],Math.random())),name:P(x,["proName","virtualProName","virtualproname","vpName","name","playerName","personaName"],"Neznámý"),
 accountName:P(x,["personaName","playername","gamertag","displayName","name","playerName"],""),
 games,goals,assists,ga:goals+assists,rating:Number(P(x,["ratingAve","averageRating","rating"],0)),motm:N(P(x,["manOfTheMatch","motm","mom"],0)),
 shots:N(P(x,["shots","shotsTaken","totalShots"],0)),shotRate:Number(P(x,["shotSuccessRate","shootingSuccessRate"],0)),
 passes:N(P(x,["passesMade","passes","totalPasses"],0)),passAttempts:N(P(x,["passAttempts","passesAttempted"],0)),passRate:Number(P(x,["passSuccessRate","passingSuccessRate"],0)),
 tackles:N(P(x,["tacklesMade","tackles","totalTackles"],0)),tackleAttempts:N(P(x,["tackleAttempts","tacklesAttempted"],0)),tackleRate:Number(P(x,["tackleSuccessRate"],0)),
 saves:N(P(x,["saves"],0)),clean:N(P(x,["cleanSheets","cleanSheet"],0)),cleanDef:N(P(x,["cleanSheetsDef","cleanSheetsDEF"],0)),cleanGk:N(P(x,["cleanSheetsGK","cleanSheetsGk"],0)),reds:N(P(x,["redCards","redCard"],0)),position:P(x,["favoritePosition","position","pos"],"—"),overall:N(P(x,["proOverall","overall"],0)),winRate:Number(P(x,["winRate"],0))}
}
function flattenPlayers(p){
 if(Array.isArray(p))return p;
 let out=[];
 if(p&&typeof p==="object")for(const [clubId,val] of Object.entries(p)){
  if(Array.isArray(val)){
   out.push(...val.map((x,i)=>({...x,_clubId:String(clubId),_playerId:String(P(x,["personaId","playerId","id"],i))})));
  } else if(val&&typeof val==="object"){
   if(P(val,["playername","name","playerName","personaName"],null)){
    out.push({...val,_clubId:String(clubId),_playerId:String(P(val,["personaId","playerId","id"],""))});
   } else {
    for(const [playerId,x] of Object.entries(val)){
     if(x&&typeof x==="object")out.push({...x,_clubId:String(clubId),_playerId:String(playerId)});
    }
   }
  }
 }
 return out
}
function normalizeMatch(m,clubName,clubId){
 let cs=A(m.clubs||m.clubInfo||m.teams);
 let clubNameOf=x=>P(x?.details,["name","clubName"],P(x,["name","clubName"],""));
 let clubIdOf=x=>P(x?.details,["clubId","id"],P(x,["clubId","id"],""));
 let ours=cs.find(x=>String(clubIdOf(x))===String(clubId)||String(clubNameOf(x)).toLowerCase()===clubName.toLowerCase())||cs[0]||{};
 let opp=cs.find(x=>x!==ours)||cs[1]||{};
 let og=N(first(P(ours,["goals","score","goalsFor"],null),P(m,["homeGoals","homeScore"],0)));
 let tg=N(first(P(opp,["goals","score","goalsFor"],null),P(m,["awayGoals","awayScore"],0)));
 let ts=P(m,["timestamp","matchTimestamp","date"],0);
 let allPlayers=flattenPlayers(m.players||m.playerStats||m.members||[]);
 let ourPlayers=allPlayers.filter(x=>String(x._clubId)===String(clubId));
 return {raw:m,ours:clubNameOf(ours)||clubName,opp:clubNameOf(opp)||"Soupeř",og,tg,
  result:og>tg?"W":og<tg?"L":"D",type:m._matchType||"match",
  date:ts?new Date(String(ts).length<13?N(ts)*1000:ts):null,
  players:ourPlayers.length?ourPlayers:allPlayers,oursRaw:ours,oppRaw:opp}
}

function eventCount(x,eventId){
 let total=0;
 for(const [k,v] of Object.entries(x||{})){
  if(!k.startsWith("match_event_aggregate_")||typeof v!=="string")continue;
  for(const token of v.split(/[;,| ]+/)){
   const m=token.match(/^(\d+):(-?\d+(?:\.\d+)?)$/);
   if(m&&Number(m[1])===Number(eventId)) total+=Number(m[2])||0;
  }
 }
 return total
}
function matchPlayer(x){
 const passAttempts=N(P(x,["passattempts","passAttempts","passesAttempted"],0));
 const passes=N(P(x,["passesmade","passesMade","passes"],0));
 const tackleAttempts=N(P(x,["tackleattempts","tackleAttempts","tacklesAttempted"],0));
 const tackles=N(P(x,["tacklesmade","tacklesMade","tackles"],0));
 return {
  raw:x,
  name:P(x,["playername","name","playerName","personaName","proName"],"Hráč"),
  id:String(P(x,["_playerId","personaId","playerId","id"],"")),
  clubId:String(P(x,["_clubId"],"")),
  pos:P(x,["pos","position"],"—"),
  rating:Number(P(x,["rating","ratingAve","averageRating"],0)),
  goals:N(P(x,["goals","goalsScored"],0)),
  assists:N(P(x,["assists"],0)),
  shots:N(P(x,["shots","shotsTaken","totalShots"],0)) || eventCount(x,217)+eventCount(x,218),
  passes:passes || eventCount(x,215),passAttempts:passAttempts || eventCount(x,215)+eventCount(x,216),passRate:(passAttempts || eventCount(x,215)+eventCount(x,216))?((passes || eventCount(x,215))/(passAttempts || eventCount(x,215)+eventCount(x,216))*100):0,
  tackles:tackles || eventCount(x,0),tackleAttempts:tackleAttempts || eventCount(x,0)+eventCount(x,1),tackleRate:(tackleAttempts || eventCount(x,0)+eventCount(x,1))?((tackles || eventCount(x,0))/(tackleAttempts || eventCount(x,0)+eventCount(x,1))*100):0,
  saves:N(P(x,["saves"],0)),
  motm:N(P(x,["mom","manOfTheMatch","motm"],0)),
  reds:N(P(x,["redcards","redCards","redCard"],0)),
  seconds:N(P(x,["secondsPlayed","gameTime","seconds"],0)),secondAssists:eventCount(x,115),dribbles:eventCount(x,174),interceptions:eventCount(x,6),standingWon:eventCount(x,229),slidingWon:eventCount(x,230),throughBalls:eventCount(x,152),firstTouchPasses:eventCount(x,143),flairPasses:eventCount(x,147),
  conceded:N(P(x,["goalsconceded","goalsConceded"],0)),
  cleanAny:N(P(x,["cleansheetsany"],0)),
  cleanDef:N(P(x,["cleansheetsdef"],0)),
  cleanGk:N(P(x,["cleansheetsgk"],0))
 }
}

function metric(k,v,cls=""){return `<div class="metric ${cls}"><small>${k}</small><b>${v}</b></div>`}
function render(id,d,searchClub=null){
 let info=(d.info&&(d.info[id]||A(d.info)[0]))||{},o=(d.overall&&(d.overall[id]||A(d.overall)[0]))||d.overall||{},name=info.name||o.clubName||`Club ${id}`;
 let w=N(P(o,["wins","gamesWon"])),dr=N(P(o,["ties","draws","gamesDrawn"])),l=N(P(o,["losses","gamesLost"])),g=N(P(o,["gamesPlayed"],0))||(w+dr+l),gf=N(P(o,["goals","goalsFor","goalsScored"])),ga=N(P(o,["goalsAgainst","goalsConceded"]));
 let ps=playerArray(d).map(normalizePlayer).sort((a,b)=>b.ga-a.ga),ms=(d.matches||[]).map(m=>normalizeMatch(m,name,id));
 S={raw:d,club:{id,name},players:ps,matches:ms,searchClub};
 let skill=P(o,["skillRating","skill","clubSkillRating"],P(searchClub,["skillRating"],"—"));
 let division=P(searchClub,["currentDivision","division","divisionNumber","div"],P(o,["currentDivision","division","divisionNumber","div"],P(info,["division","currentDivision"],"—")));
 let bestDivision=P(searchClub,["bestDivision"],P(o,["bestDivision"],"—"));
 let crestId=P(info?.customKit,["crestAssetId"],P(info,["crestAssetId"],null));
 currentClubBookmark49={id:String(id),name,platform:$("#platform")?.value||"common-gen5",crestAssetId:crestId};
 if(searchClub)addRecent49({...searchClub,id:String(id),name,platform:currentClubBookmark49.platform,crestAssetId:crestId??searchClub?.crestAssetId});
 updateFavoriteButton49();
 const stadium=P(info?.customKit,["stadName"],P(info,["stadName","stadiumName"],""));
 const regionText=P(info,["regionName","region","regionText"],P(o,["regionName","region","regionText"],""));
 const platformText61=platformLabel49($("#platform")?.value||"common-gen5");
 const kit61=info?.customKit||{};
 const eaColors61=uniqueColors61([safeClubColor61(P(kit61,["kitColor1"],null)),safeClubColor61(P(kit61,["kitColor2"],null)),safeClubColor61(P(kit61,["kitColor3"],null)),safeClubColor61(P(kit61,["crestColor"],null))]);
 $("#clubName").textContent=name;
 const fallback=(name.match(/[A-Z0-9]/ig)||["C"]).slice(0,2).join("").toUpperCase();$("#clubFallback").textContent=fallback;
 const crest=$("#clubCrest"); crest.hidden=true; $("#clubFallback").hidden=false;
 setClubColors61(eaColors61.length?eaColors61:readCrestColors61(crestId));
 if(crestId){ crest.crossOrigin="anonymous";crest.src=crestUrl(crestId);crest.onload=async()=>{crest.hidden=false;$("#clubFallback").hidden=true;if(!eaColors61.length){const cached=readCrestColors61(crestId);if(cached.length)setClubColors61(cached);else setClubColors61(await extractCrestColors61(crest,crestId))}}; crest.onerror=()=>{crest.hidden=true;$("#clubFallback").hidden=false}; }
 const divEl=$("#divisionBadge");if(divEl){divEl.textContent=division!=="—"?String(division):"--";divEl.dataset.tone=divisionTone61(division)}
 const skillEl=$("#skillBadge");if(skillEl)skillEl.textContent=skill!=="—"?String(skill):"--";
 const idValue61=$("#clubIdValue61");if(idValue61)idValue61.textContent=String(id);
 const idBadge=$("#clubIdBadge"); if(idBadge){idBadge.onclick=async()=>{try{await navigator.clipboard.writeText(String(id));idBadge.classList.add("copied");const oldTitle=idBadge.title;idBadge.title="Copied";const toast=document.createElement("span");toast.className="clubCopyToast61";toast.textContent="Copied";idBadge.appendChild(toast);setTimeout(()=>{toast.remove();idBadge.classList.remove("copied");idBadge.title=oldTitle},900)}catch{}}}
 renderClubMeta61(stadium,regionText,platformText61);
 $("#recW").textContent=`${w}W`;$("#recD").textContent=`${dr}D`;$("#recL").textContent=`${l}L`;
 let form=ms.slice(0,10).map(m=>m.result);$("#formPills").innerHTML=form.map(x=>`<span class="formPill ${x.toLowerCase()}">${x}</span>`).join("");let fw=form.filter(x=>x==="W").length,fd=form.filter(x=>x==="D").length,fl=form.filter(x=>x==="L").length;$("#formSummary").textContent=form.length?`${fw}W · ${fd}D · ${fl}L`:"—";
 let wr=g?(w/g*100):0,gd=gf-ga,winStreak=N(P(o,["wstreak","winStreak"],0)),unbeaten=N(P(o,["unbeatenstreak","unbeatenStreak"],0)),promotions=N(P(o,["promotions"],0)),relegations=N(P(o,["relegations"],0)),cleanSheets=N(P(searchClub||{},["cleanSheets"],P(o,["cleanSheets"],0)));
 const goalsPerGame=g?gf/g:null, concededPerGame=g?ga/g:null, pointsPerGame=g?((w*3+dr)/g):null;
 const hG=$("#heroGoalsPerGame44"),hC=$("#heroConcededPerGame44"),hP=$("#heroPointsPerGame44"),hW=$("#heroWinRate44");
 if(hG)hG.textContent=goalsPerGame!=null?goalsPerGame.toFixed(2):"—";
 if(hC)hC.textContent=concededPerGame!=null?concededPerGame.toFixed(2):"—";
 if(hP)hP.textContent=pointsPerGame!=null?pointsPerGame.toFixed(2):"—";
 if(hW)hW.textContent=g?wr.toFixed(1)+"%":"—";
 const topNav44=$("#clubTabs"); if(topNav44)topNav44.hidden=false;
 $("#clubStats").innerHTML=`
 <div class="clubStatHighlights">
  <div class="heroStat"><small>DIVIZE</small><b>${division!=="—"?division:"—"}</b><span>best ${bestDivision!=="—"?bestDivision:"—"}</span></div>
  <div class="heroStat"><small>SKILL RATING</small><b>${skill}</b><span>${g||0} league matches</span></div>
  <div class="heroStat"><small>WIN RATE</small><b>${g?wr.toFixed(1)+"%":"—"}</b><span>${w}W · ${dr}D · ${l}L</span></div>
  <div class="heroStat accent"><small>GOAL DIFFERENCE</small><b>${(gf||ga)?`${gd>=0?"+":""}${gd}`:"—"}</b><span>${gf} : ${ga}</span></div>
 </div>
 <div class="statGroups">
  <div class="statGroup"><h4>Výsledky</h4><div class="statLine"><span>Výhry</span><b>${w}</b></div><div class="statLine"><span>Remízy</span><b>${dr}</b></div><div class="statLine"><span>Prohry</span><b>${l}</b></div><div class="statLine"><span>Clean sheets</span><b>${cleanSheets||"—"}</b></div></div>
  <div class="statGroup"><h4>Góly</h4><div class="statLine"><span>Vstřelené</span><b>${gf||"—"}</b></div><div class="statLine"><span>Obdržené</span><b>${ga||"—"}</b></div><div class="statLine"><span>Góly / zápas</span><b>${g?(gf/g).toFixed(2):"—"}</b></div><div class="statLine"><span>Obdržené / zápas</span><b>${g?(ga/g).toFixed(2):"—"}</b></div></div>
  <div class="statGroup"><h4>Postup</h4><div class="statLine"><span>Win streak</span><b>${winStreak}</b></div><div class="statLine"><span>Unbeaten</span><b>${unbeaten}</b></div><div class="statLine"><span>Promotions</span><b>${promotions}</b></div><div class="statLine"><span>Relegations</span><b>${relegations}</b></div></div>
 </div>`;
 $("#performanceStats").innerHTML=metric("Recent W",fw)+metric("Recent D",fd)+metric("Recent L",fl)+metric("Recent Goals",ms.slice(0,10).reduce((a,m)=>a+m.og,0))+metric("Recent Conceded",ms.slice(0,10).reduce((a,m)=>a+m.tg,0))+metric("Recent GD",ms.slice(0,10).reduce((a,m)=>a+m.og-m.tg,0))+metric("Squad",ps.length)+metric("League matches loaded",ms.filter(m=>m.type==="league").length)+metric("Playoff loaded",ms.filter(m=>m.type==="playoff").length)+metric("Friendly loaded",ms.filter(m=>m.type==="friendly").length);
 $("#playerCount").textContent=`${ps.length} hráčů`; setupPlayerFilters(); renderPlayerTable();
 let scorer=[...ps].sort((a,b)=>b.goals-a.goals)[0],assist=[...ps].sort((a,b)=>b.assists-a.assists)[0],rating=[...ps].sort((a,b)=>b.rating-a.rating)[0];
 const legacyLeaders=$("#leaders"); if(legacyLeaders) legacyLeaders.innerHTML=ps.length?[[scorer,"TOP SCORER",`${scorer.goals} G`],[assist,"PLAYMAKER",`${assist.assists} A`],[rating,"RATING KING",rating.rating?rating.rating.toFixed(2):"—"]].map(([p,t,z])=>`<div class="leader"><small>${t}</small><b>${p.name}</b><span>${z}</span></div>`).join(""):"";
 renderFunLive();
 $("#analyticsCards").innerHTML=metric("Win Rate",g?wr.toFixed(1)+"%":"—")+metric("Goals/Game",g?(gf/g).toFixed(2):"—")+metric("Goal Diff",(gf||ga)?`${gd>=0?"+":""}${gd}`:"—")+metric("Top G+A",ps[0]?`${ps[0].name} · ${ps[0].ga}`:"—");
 $("#matchList").innerHTML=ms.length?ms.map((m,i)=>`<div class="match" data-m="${i}"><span>${m.date?m.date.toLocaleDateString("cs-CZ"):"—"}</span><span>${m.type}</span><span class="home">${m.ours}</span><span class="score">${m.og}:${m.tg}</span><b>${m.opp}</b><b class="${m.result.toLowerCase()}">${m.result}</b></div>`).join(""):'<div class="msg" style="padding:20px">EA neposlalo historii zápasů.</div>';
 const om=$("#overviewMatches"); if(om)om.innerHTML=ms.length?ms.slice(0,5).map(m=>`<div class="overviewMatch"><span class="resultBadge ${m.result.toLowerCase()}">${m.result}</span><div><strong>${escapeHtml(m.opp||"Soupeř")}</strong><small>${m.type} · ${m.date?m.date.toLocaleDateString("cs-CZ"):"—"}</small></div><b>${m.og}:${m.tg}</b></div>`).join(""):'<div class="msg">Zatím bez zápasů.</div>';
 const ol=$("#overviewLeaders"); if(ol)ol.innerHTML=ps.slice().sort((a,b)=>b.ga-a.ga).slice(0,4).map((p,i)=>`<div class="overviewLeader"><span class="leaderRank">${i+1}</span><div><strong>${escapeHtml(p.name)}</strong><small>${p.games} zápasů · ${p.goals}G + ${p.assists}A</small></div><b>${p.rating?p.rating.toFixed(1):"—"}</b></div>`).join("");
 renderOverviewThreats44();
 document.querySelectorAll("[data-m]").forEach(x=>x.onclick=()=>showMatch(+x.dataset.m));
 let er=d.errors||{}; const statusEl=$("#status"); if(statusEl) statusEl.innerHTML=["info","overall","career","members","achievements","league","playoff","friendly"].map(k=>`<div class="endpoint"><span>${k}</span><b>${er[k]?"ERROR":"OK"}</b></div>`).join("");
 fillCompare();$("#home").hidden=true;$("#dash").hidden=false;window.scrollTo({top:0,behavior:"smooth"});loadHistory(id)
}
function playerSortValue(p,key){
 const per=(v)=>p.games?N(v)/p.games:0;
 const map={rating:p.rating,goals:p.goals,assists:p.assists,ga:p.ga,games:p.games,goalsGame:per(p.goals),assistsGame:per(p.assists),gaGame:per(p.ga),motm:p.motm,shotRate:p.shotRate,passRate:p.passRate,tackleRate:p.tackleRate,shots:p.shots,passes:p.passes,tackles:p.tackles,reds:p.reds};
 return key==="name"?String(p.name).toLocaleLowerCase("cs"):N(map[key]);
}
function renderPlayerTable(){
 const body=$("#players"); if(!body)return;
 let list=S.players.filter(p=>p.games>=playerSortState.minGames&&(playerSortState.position==="all"||String(p.position).toUpperCase()===playerSortState.position));
 list.sort((a,b)=>{let av=playerSortValue(a,playerSortState.key),bv=playerSortValue(b,playerSortState.key);if(typeof av==="string")return av.localeCompare(bv,"cs")*playerSortState.dir;return (av-bv)*playerSortState.dir});
 body.innerHTML=list.length?list.map((p,i)=>`<tr><td>${i+1}</td><td data-p="${p.id}"><b>${p.name}</b>${p.accountName&&p.accountName!==p.name?`<small class="subname">${p.accountName}</small>`:""}</td><td>${p.games}</td><td>${p.goals}</td><td>${p.games?(p.goals/p.games).toFixed(2):"—"}</td><td>${p.assists}</td><td>${p.games?(p.assists/p.games).toFixed(2):"—"}</td><td><b>${p.ga}</b></td><td>${p.games?(p.ga/p.games).toFixed(2):"—"}</td><td>${p.rating?p.rating.toFixed(1):"—"}</td><td>${p.motm}</td><td>${p.shotRate?pct(p.shotRate):"—"}</td><td>${p.passes||"—"}</td><td>${p.passRate?pct(p.passRate):"—"}</td><td>${p.tackles||"—"}</td><td>${p.tackleRate?pct(p.tackleRate):"—"}</td><td>${p.cleanDef||"—"}</td><td>${p.cleanGk||"—"}</td><td>${p.reds||0}</td></tr>`).join(""):'<tr><td colspan="19">Žádný hráč neodpovídá filtru.</td></tr>';
 document.querySelectorAll("[data-p]").forEach(x=>x.onclick=()=>showPlayer(x.dataset.p));
 $("#playerCount").textContent=`${list.length} / ${S.players.length} hráčů`; updateSortHeaders();
}
function updateSortHeaders(){
 document.querySelectorAll("th.sortable").forEach(th=>{
  const active=th.dataset.sort===playerSortState.key;
  th.classList.toggle("sorted",active);
  th.dataset.dir=active?(playerSortState.dir<0?"desc":"asc"):"";
  th.setAttribute("aria-sort",active?(playerSortState.dir<0?"descending":"ascending"):"none");
 });
}
function setupPlayerFilters(){
 document.querySelectorAll("th.sortable").forEach(th=>th.onclick=()=>{
  const key=th.dataset.sort;
  if(playerSortState.key===key)playerSortState.dir*=-1;else{playerSortState.key=key;playerSortState.dir=key==="name"?1:-1}
  renderPlayerTable();
 });
 updateSortHeaders();
}
function stat(k,v){return`<div class="stat"><small>${k}</small><b>${v}</b></div>`}
function showPlayerLegacy(id){
 let p=S.players.find(x=>x.id===id);if(!p)return;
 let recent=S.matches.map(m=>{let s=m.players.map(matchPlayer).find(x=>x.id===id||String(x.name).toLowerCase()===String(p.name).toLowerCase());return s?{m,s}:null}).filter(Boolean);
 let ms=recent.map(x=>x.s),sum=k=>ms.reduce((a,x)=>a+N(x[k]),0);
 let passAttempts=sum("passAttempts"),passes=sum("passes"),tackleAttempts=sum("tackleAttempts"),tackles=sum("tackles");
 let derived={
  shots:sum("shots"),passes,passAttempts,passRate:passAttempts?passes/passAttempts*100:0,
  tackles,tackleAttempts,tackleRate:tackleAttempts?tackles/tackleAttempts*100:0,
  saves:sum("saves"),reds:sum("reds"),secondAssists:sum("secondAssists"),dribbles:sum("dribbles"),interceptions:sum("interceptions"),standingWon:sum("standingWon"),slidingWon:sum("slidingWon"),throughBalls:sum("throughBalls"),
  pos:ms.find(x=>x.pos&&x.pos!=="—")?.pos||"—"
 };
 let ratings=recent.slice(0,10).map(x=>x.s.rating).filter(Boolean).reverse(),max=Math.max(10,...ratings);
 $("#playerContent").innerHTML=`<div class="profile"><small>PLAYER PROFILE · ${S.club.name}</small><h2>${p.name}</h2><p class="identity">EA / PSN ID · ${p.name}${derived.pos!=="—"?` · POS ${derived.pos}`:""}</p><div class="stats">${stat("MATCHES",p.games)}${stat("GOALS",p.goals)}${stat("ASSISTS",p.assists)}${stat("2ND ASSISTS*",derived.secondAssists)}${stat("G+A",p.ga)}${stat("AVG RATING",p.rating?p.rating.toFixed(2):"—")}${stat("MOTM",p.motm)}${stat("SHOTS*",derived.shots||"—")}${stat("PASSES*",derived.passes||"—")}${stat("PASS %*",derived.passAttempts?pct(derived.passRate):"—")}${stat("TACKLES*",derived.tackles||"—")}${stat("TACKLE %*",derived.tackleAttempts?pct(derived.tackleRate):"—")}${stat("SAVES*",derived.saves||"—")}${stat("DRIBBLES*",derived.dribbles||"—")}${stat("INTERCEPTIONS*",derived.interceptions||"—")}${stat("TACKLES WON*",derived.standingWon+derived.slidingWon||"—")}${stat("THROUGH BALLS*",derived.throughBalls||"—")}${stat("RED CARDS*",derived.reds||"—")}${stat("POSITION",derived.pos)}</div><p class="note">* RECENT WINDOW: pouze ${recent.length} aktuálně dostupných zápasů z EA. Není to season total. 2nd assists jsou event 115 jen v tomto okně.</p><h3 class="sectionTitle">RATING TREND · LAST ${ratings.length}</h3>${ratings.length?`<div class="chart">${ratings.map(r=>`<div class="bar" style="height:${Math.max(5,r/max*100)}%"><span>${r.toFixed(1)}</span></div>`).join("")}</div>`:'<div class="msg">Pro graf zatím nejsou match ratings.</div>'}<h3 class="sectionTitle">RECENT MATCHES</h3>${recent.length?matchStatsTable(recent.slice(0,10).map(x=>x.s),recent.slice(0,10).map(x=>x.m.opp)):'<div class="msg">EA u načtených zápasů nespárovalo hráče.</div>'}</div>`;
 $("#playerView").hidden=false
}
function matchStatsTable(ps,opps=[]){return`<div class="table"><table><thead><tr><th>Hráč</th><th>Pos</th><th>Rating</th><th>G</th><th>A</th><th>2A</th><th>Shots</th><th>Passes</th><th>Pass Att.</th><th>Pass%</th><th>Tackles</th><th>Tackle Att.</th><th>Tackle%</th><th>Int.</th><th>Tkl Won</th><th>Dribbles</th><th>Through</th><th>Saves</th><th>MOTM</th><th>RC</th></tr></thead><tbody>${ps.map((p,i)=>`<tr><td>${opps[i]||p.name}</td><td>${p.pos||"—"}</td><td>${p.rating?p.rating.toFixed(1):"—"}</td><td>${p.goals}</td><td>${p.assists}</td><td>${p.secondAssists||0}</td><td>${p.shots}</td><td>${p.passes}</td><td>${p.passAttempts}</td><td>${p.passAttempts?pct(p.passRate):"—"}</td><td>${p.tackles}</td><td>${p.tackleAttempts}</td><td>${p.tackleAttempts?pct(p.tackleRate):"—"}</td><td>${p.interceptions||0}</td><td>${(p.standingWon||0)+(p.slidingWon||0)}</td><td>${p.dribbles||0}</td><td>${p.throughBalls||0}</td><td>${p.saves}</td><td>${p.motm}</td><td>${p.reds}</td></tr>`).join("")}</tbody></table></div>`}
function showMatchLegacy(i){
 let m=S.matches[i],ps=m.players.map(matchPlayer);
 $("#matchContent").innerHTML=`<div class="profile"><small>${m.type.toUpperCase()} · ${m.date?m.date.toLocaleDateString("cs-CZ"):""}</small><h2>${m.ours} ${m.og}:${m.tg} ${m.opp}</h2><div class="stats">${stat("RESULT",m.result)}${stat("OUR GOALS",m.og)}${stat("OPP GOALS",m.tg)}${stat("PLAYERS",ps.length)}</div><h3 class="sectionTitle">PLAYER MATCH STATS</h3>${ps.length?matchStatsTable(ps):'<div class="msg">EA v tomto zápase neposlalo hráčské statistiky.</div>'}</div>`;$("#matchView").hidden=false
}
function fillCompare(){
 const aSel=$("#cmpA"),bSel=$("#cmpB");if(!(aSel&&bSel))return;
 let opts=S.players.map(p=>`<option value="${escapeHtml(String(p.id))}">${escapeHtml(String(p.name))}</option>`).join("");
 aSel.innerHTML=opts;bSel.innerHTML=opts;
 if(S.players[1])bSel.value=S.players[1].id;
 enforceDistinctCompare54('a');compare();
}
function samePlayer(x,p){
 const vals=[p.id,p.name,p.accountName].filter(Boolean).map(v=>String(v).trim().toLowerCase());
 const xvals=[x.id,x.name,x.raw?.personaName,x.raw?.playername,x.raw?.gamertag,x.raw?.displayName].filter(Boolean).map(v=>String(v).trim().toLowerCase());
 return vals.some(v=>xvals.includes(v));
}
function liveAdvanced(p){
 const ms=S.matches.map(m=>m.players.map(matchPlayer).find(x=>samePlayer(x,p))).filter(Boolean);
 const sum=k=>ms.reduce((a,x)=>a+N(x[k]),0),pa=sum("passAttempts"),pm=sum("passes"),ta=sum("tackleAttempts"),tm=sum("tackles"),shots=sum("shots");
 return {matches:ms.length,shots,passes:pm,passAttempts:pa,passRate:pa?pm/pa*100:null,tackles:tm,tackleAttempts:ta,tackleRate:ta?tm/ta*100:null,saves:sum("saves"),secondAssists:sum("secondAssists"),dribbles:sum("dribbles"),interceptions:sum("interceptions")};
}
function advancedFor(p){
 const live=liveAdvanced(p);
 const db=(S.history?.players||[]).find(x=>String(x.player_id)===String(p.id)||[p.name,p.accountName].filter(Boolean).some(n=>[x.player_name,x.pro_name].filter(Boolean).some(z=>String(z).toLowerCase()===String(n).toLowerCase())));
 const choose=(dbv,livev,known)=>known?N(dbv):(livev||null);
 if(db){
  const pa=N(db.pass_attempts),pm=N(db.passes_made),ta=N(db.tackle_attempts),tm=N(db.tackles_made),matches=N(db.matches);
  return {...p,games:Math.max(N(p.games),matches),goals:Math.max(N(p.goals),N(db.goals)),assists:Math.max(N(p.assists),N(db.assists)),ga:Math.max(N(p.ga),N(db.goals)+N(db.assists)),rating:N(db.rating)||N(p.rating),motm:Math.max(N(p.motm),N(db.motm)),
   secondAssists:Math.max(N(db.second_assists),live.secondAssists),shots:choose(db.shots,live.shots,N(db.shots)>0),passes:choose(pm,live.passes,pa>0),passAttempts:choose(pa,live.passAttempts,pa>0),passRate:pa?pm/pa*100:live.passRate,
   tackles:choose(tm,live.tackles,ta>0),tackleAttempts:choose(ta,live.tackleAttempts,ta>0),tackleRate:ta?tm/ta*100:live.tackleRate,dribbles:choose(db.dribbles,live.dribbles,N(db.dribbles)>0),saves:choose(db.saves,live.saves,N(db.saves)>0),interceptions:choose(db.interceptions,live.interceptions,N(db.interceptions)>0),trackedMatches:Math.max(matches,live.matches)};
 }
 return {...p,secondAssists:live.secondAssists||null,shots:live.shots||null,passes:live.passAttempts?live.passes:null,passAttempts:live.passAttempts||null,passRate:live.passRate,tackles:live.tackleAttempts?live.tackles:null,tackleAttempts:live.tackleAttempts||null,tackleRate:live.tackleRate,saves:live.saves||null,dribbles:live.dribbles||null,interceptions:live.interceptions||null,trackedMatches:live.matches};
}
function samePlayer54(x,p){
 if(!x||!p)return false;
 const ids=[x.id,x.player_id,x.personaId,x.playerId].filter(v=>v!==undefined&&v!==null&&v!=='').map(v=>String(v));
 if(ids.includes(String(p.id)))return true;
 const names=[x.name,x.player_name,x.playername,x.proName].filter(Boolean).map(v=>String(v).trim().toLowerCase());
 return [p.name,p.accountName].filter(Boolean).some(v=>names.includes(String(v).trim().toLowerCase()));
}
function compareCapturedRows54(p){
 const hist=Array.isArray(S.history?.playerMatches)?S.history.playerMatches.filter(x=>samePlayer54(x,p)):[];
 if(hist.length)return hist.map(x=>({matchId:String(x.match_id),rating:N(x.rating),goals:N(x.goals),assists:N(x.assists),motm:N(x.motm)}));
 return (S.matches||[]).map(m=>{const q=(m.players||[]).map(matchPlayer).find(x=>samePlayer54(x,p));return q?{matchId:String(m.id||m.matchId||m.raw?.matchId||''),rating:N(q.rating),goals:N(q.goals),assists:N(q.assists),motm:N(q.motm)}:null}).filter(x=>x&&x.matchId);
}
function duoData54(a,b){
 const ar=compareCapturedRows54(a),br=compareCapturedRows54(b),bm=new Map(br.map(x=>[x.matchId,x])),pairs=ar.map(x=>[x,bm.get(x.matchId)]).filter(x=>x[1]);
 const side=i=>{const rows=pairs.map(x=>x[i]),matches=rows.length,ratings=rows.map(x=>N(x.rating)).filter(v=>v>0);return {avgRating:ratings.length?ratings.reduce((s,v)=>s+v,0)/ratings.length:undefined,goalsPerGame:matches?rows.reduce((s,x)=>s+N(x.goals),0)/matches:undefined,assistsPerGame:matches?rows.reduce((s,x)=>s+N(x.assists),0)/matches:undefined}};
 const goals=pairs.reduce((s,[x,y])=>s+N(x.goals)+N(y.goals),0),motm=pairs.reduce((s,[x,y])=>s+N(x.motm)+N(y.motm),0);
 return {a:side(0),b:side(1),shared:{matches:pairs.length,goals,motm,linkUps:undefined}};
}
function updateCompareOptions54(){
 const aSel=$("#cmpA"),bSel=$("#cmpB");if(!(aSel&&bSel))return;
 [...aSel.options].forEach(o=>o.disabled=o.value===bSel.value);
 [...bSel.options].forEach(o=>o.disabled=o.value===aSel.value);
}
function enforceDistinctCompare54(changed){
 const aSel=$("#cmpA"),bSel=$("#cmpB");if(!(aSel&&bSel))return;
 if(aSel.value&&aSel.value===bSel.value){
  const target=changed==='a'?bSel:aSel,blocked=changed==='a'?aSel.value:bSel.value;
  const alt=[...target.options].find(o=>o.value!==blocked&&!o.disabled);
  if(alt)target.value=alt.value;
 }
 updateCompareOptions54();
}
function renderCompareDuo54(aa,bb){
 const card=$("#compareDuoCard54"),coverage=$("#duoCoverage54");if(!card||!aa||!bb)return;
 const duo=duoData54(aa,bb),crest=cardCrestUrl();
 card.playerA={name:aa.name,overall:P(aa.raw,["proOverall","overall"],aa.overall),position:cardPos(aa.position),crestUrl:crest};
 card.playerB={name:bb.name,overall:P(bb.raw,["proOverall","overall"],bb.overall),position:cardPos(bb.position),crestUrl:crest};
 card.duoStats=duo;
 if(coverage)coverage.textContent=duo.shared.matches?`${duo.shared.matches} shared captured match${duo.shared.matches===1?'':'es'}`:'No shared captured matches';
}

let comparePickerSide62='a';
function comparePortrait62(p){return p?.id?`/cards/players/${encodeURIComponent(String(p.id))}/base.png`:'/cards/players/default.png'}
function comparePlayerMeta62(p){const a=advancedFor(p);return {position:cardPos(p.position)||'--',matches:N(a.trackedMatches)||N(a.games)||N(p.games)||0}}
function comparePlayerCard62(p,side){
 const m=comparePlayerMeta62(p),accent=side==='a'?'left':'right';
 return `<button type="button" class="comparePick62 ${accent}" data-compare-pick62="${side}" aria-label="Choose ${side==='a'?'left':'right'} player"><span class="comparePickGlow62"></span><span class="comparePickHint62">Choose player</span><span class="comparePickInner62"><img class="comparePortrait62" src="${cardAttr(comparePortrait62(p))}" alt="" onerror="this.onerror=null;this.src='/cards/players/default.png'"><span class="comparePickMeta62"><small>${side==='a'?'PLAYER A':'PLAYER B'}</small><strong>${escapeHtml(String(p.name||'--'))}</strong><span><b>${escapeHtml(String(m.position))}</b><i>·</i>${m.matches} matches</span></span></span></button>`;
}
function renderCompareHeader62(a,b){
 const host=$('#compareHeader62');if(!host||!a||!b)return;
 host.innerHTML=`${comparePlayerCard62(a,'a')}<div class="compareCenter62"><div class="compareVsBadge62">VS</div><button type="button" class="compareSwap62" data-compare-swap62 aria-label="Swap players">⇄</button></div>${comparePlayerCard62(b,'b')}`;
}
function ensureComparePicker62(){
 let modal=$('#comparePicker62');if(modal)return modal;
 modal=document.createElement('div');modal.id='comparePicker62';modal.className='comparePickerBackdrop62';modal.hidden=true;
 modal.innerHTML=`<section class="comparePickerModal62" role="dialog" aria-modal="true" aria-labelledby="comparePickerTitle62"><div class="comparePickerHead62"><div><small>PLAYER COMPARE</small><h4 id="comparePickerTitle62">Choose player</h4></div><button type="button" class="comparePickerClose62" aria-label="Close">×</button></div><input class="comparePickerSearch62" type="search" placeholder="Search players…" autocomplete="off" aria-label="Search players"><div class="comparePickerGrid62"></div></section>`;
 document.body.appendChild(modal);
 modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.comparePickerClose62'))closeComparePicker62();const item=e.target.closest('[data-compare-player62]');if(item&&!item.disabled){chooseComparePlayer62(item.dataset.comparePlayer62)}});
 modal.querySelector('.comparePickerSearch62').addEventListener('input',()=>renderComparePicker62());
 return modal;
}
function renderComparePicker62(){
 const modal=ensureComparePicker62(),grid=modal.querySelector('.comparePickerGrid62'),q=String(modal.querySelector('.comparePickerSearch62').value||'').trim().toLowerCase();
 const current=$(`#cmp${comparePickerSide62==='a'?'A':'B'}`)?.value||'',other=$(`#cmp${comparePickerSide62==='a'?'B':'A'}`)?.value||'';
 const list=(S.players||[]).filter(p=>!q||String(p.name||'').toLowerCase().includes(q)||String(p.accountName||'').toLowerCase().includes(q));
 grid.innerHTML=list.length?list.map(p=>{const m=comparePlayerMeta62(p),id=String(p.id),blocked=id===String(other),active=id===String(current);return `<button type="button" class="comparePickerItem62${active?' active':''}" data-compare-player62="${cardAttr(id)}" ${blocked?'disabled':''}><img src="${cardAttr(comparePortrait62(p))}" alt="" onerror="this.onerror=null;this.src='/cards/players/default.png'"><span><strong>${escapeHtml(String(p.name||'--'))}</strong><span>${escapeHtml(String(m.position))} · ${m.matches} matches</span></span><em>${blocked?'Selected on other side':active?'Selected':'Choose'}</em></button>`}).join(''):'<div class="msg">No players found.</div>';
}
function openComparePicker62(side){comparePickerSide62=side==='b'?'b':'a';const modal=ensureComparePicker62();modal.hidden=false;const input=modal.querySelector('.comparePickerSearch62');input.value='';modal.querySelector('#comparePickerTitle62').textContent=`Choose ${comparePickerSide62==='a'?'left':'right'} player`;renderComparePicker62();setTimeout(()=>input.focus(),0)}
function closeComparePicker62(){const modal=$('#comparePicker62');if(modal)modal.hidden=true}
function chooseComparePlayer62(id){const sel=$(`#cmp${comparePickerSide62==='a'?'A':'B'}`);if(!sel)return;sel.value=id;enforceDistinctCompare54(comparePickerSide62);closeComparePicker62();compare()}
function swapComparePlayers62(){const a=$('#cmpA'),b=$('#cmpB');if(!(a&&b))return;const av=a.value;a.value=b.value;b.value=av;updateCompareOptions54();compare()}
if(!window.__compareHeaderBound62){window.__compareHeaderBound62=true;document.addEventListener('click',e=>{const pick=e.target.closest('[data-compare-pick62]');if(pick)openComparePicker62(pick.dataset.comparePick62);if(e.target.closest('[data-compare-swap62]'))swapComparePlayers62()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeComparePicker62()})}
function compare(){
 let aa=S.players.find(x=>x.id===$("#cmpA").value),bb=S.players.find(x=>x.id===$("#cmpB").value);if(!aa||!bb)return;renderCompareHeader62(aa,bb);let a=advancedFor(aa),b=advancedFor(bb);
 const rows=[["Matches","games"],["Goals","goals"],["Assists","assists"],["Second assists","secondAssists"],["G+A","ga"],["Avg rating","rating"],["MOTM","motm"],["Shots","shots"],["Passes completed","passes"],["Pass accuracy","passRate"],["Tackles","tackles"],["Tackle success","tackleRate"],["Dribbles","dribbles"],["Interceptions","interceptions"],["Saves","saves"]];
 const fmt=(k,v)=>v==null?"—":k.includes("Rate")?pct(v):k==="rating"&&v?Number(v).toFixed(2):v;
 const score=(x,y)=>x==null||y==null?"":Number(x)>Number(y)?"winner":"";
 $("#compareCoverage").innerHTML=`<div class="comparePlayerHead"><strong>${escapeHtml(a.name)}</strong><span>${a.trackedMatches||0} match-level zápasů</span></div><div class="compareVs">VS</div><div class="comparePlayerHead right"><strong>${escapeHtml(b.name)}</strong><span>${b.trackedMatches||0} match-level zápasů</span></div>`;
 $("#compareBody").innerHTML=`<div class="compareCards">${rows.map(([label,k])=>`<div class="compareRow"><div class="compareValue ${score(a[k],b[k])}">${fmt(k,a[k])}</div><div class="compareLabel">${label}</div><div class="compareValue ${score(b[k],a[k])}">${fmt(k,b[k])}</div></div>`).join("")}</div><div class="compareFoot">Career totals používají EA career data. Detailní metriky se automaticky skládají z uložené historie a aktuálně dostupných zápasů. Jakmile databáze zachytí další zápasy, rozsah se sám rozšiřuje.</div>`;
 renderCompareDuo54(aa,bb);
}
$("#cmpA").onchange=()=>{enforceDistinctCompare54('a');compare()};$("#cmpB").onchange=()=>{enforceDistinctCompare54('b');compare()};document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$("#"+b.dataset.close).hidden=true);
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

async function loadHistory(id){
 try{
  const [hr,ar]=await Promise.all([fetch(`/api/history/${id}`),fetch(`/api/analytics/${id}`)]),h=await hr.json(),a=await ar.json();
  S.history=h;S.analytics=a;$("#dbState").textContent=h.enabled?"DATABASE ON":"LIVE ONLY";
  if(!h.enabled){$("#historyStats").innerHTML=metric("DATABASE","OFF")+metric("HISTORY","LIVE ONLY");$("#chemistry").innerHTML='<div class="msg">Nastav DATABASE_URL na Renderu. Potom se každý zachycený zápas trvale uloží.</div>';return}
  const byId=new Map((h.players||[]).map(p=>[String(p.player_id),p]));
  for(const p of S.players){const q=byId.get(String(p.id));if(q?.pro_name&&p.name!==q.pro_name){p.accountName=p.accountName||p.name;p.name=q.pro_name}}
  const games=h.matches.length,w=h.matches.filter(x=>x.result==="W").length,d=h.matches.filter(x=>x.result==="D").length,l=games-w-d,goals=h.matches.reduce((s,x)=>s+N(x.goals),0),conceded=h.matches.reduce((s,x)=>s+N(x.opponent_goals),0),sa=h.players.reduce((s,x)=>s+N(x.second_assists),0);
  $("#historyStats").innerHTML=metric("STORED MATCHES",games)+metric("DB WIN RATE",games?(w/games*100).toFixed(1)+"%":"—")+metric("W-D-L",`${w}-${d}-${l}`)+metric("STORED GOALS",goals)+metric("GOAL DIFF",`${goals-conceded>=0?"+":""}${goals-conceded}`)+metric("2ND ASSISTS",sa);
  const snaps=[...h.snapshots].reverse().filter(x=>x.skill_rating!=null);$("#skillHistory").innerHTML=snaps.length>1?`<div class="panelHead"><h3>Skill Rating History</h3><span>${snaps.length} snapshots</span></div><div class="chart">${snaps.slice(-80).map(x=>{let vals=snaps.slice(-80).map(y=>N(y.skill_rating)),mn=Math.min(...vals),mx=Math.max(...vals),height=mx===mn?50:10+(N(x.skill_rating)-mn)/(mx-mn)*90;return `<div class="bar" title="${Math.round(N(x.skill_rating))}" style="height:${height}%"></div>`}).join("")}</div>`:"";
  renderArchiveMatches(h.matches||[]);renderAnalytics(h,a);renderFun(h,a);renderDbPlayers(h);renderOverviewThreats44(h);renderOverviewSessions44(a);renderOverviewPerformance44(h);compare();
 }catch(e){$("#dbState").textContent="DB ERROR";$("#chemistry").innerHTML=`<div class="msg">${escapeHtml(e.message)}</div>`}
}
function renderDbPlayers(h){
 const db=new Map((h.players||[]).map(x=>[String(x.player_id),x]));
 document.querySelectorAll("[data-p]").forEach(el=>{const p=S.players.find(q=>String(q.id)===String(el.dataset.p)),q=db.get(String(el.dataset.p));if(!(p&&q?.pro_name))return;const card=el.querySelector?.('player-card');if(card){p.accountName=p.accountName||p.name;p.name=q.pro_name;card.setAttribute('player-name',q.pro_name);const meta=el.querySelector('.playerCollectibleMeta b');if(meta)meta.textContent=q.pro_name;return}el.innerHTML=`<b>${escapeHtml(q.pro_name)}</b>${p.accountName&&p.accountName!==q.pro_name?`<small class="subname">${escapeHtml(p.accountName)}</small>`:""}`})
}
function renderArchiveMatches(matches){
 if(!matches.length)return;
 const liveIds=new Set(S.matches.map(m=>String(P(m.raw,["matchId","matchid","id"],""))));
 const archive=matches.filter(x=>!liveIds.has(String(x.match_id))).slice(0,200);
 if(!archive.length)return;
 $("#matchList").insertAdjacentHTML("beforeend",`<div class="archiveLabel">CLUBROOM ARCHIVE · ${archive.length} starších zápasů</div>${archive.map(m=>`<div class="match archive"><span>${m.played_at?new Date(m.played_at).toLocaleDateString("cs-CZ"):"—"}</span><span>${m.match_type||"match"}</span><span class="home">${escapeHtml(S.club.name)}</span><span class="score">${N(m.goals)}:${N(m.opponent_goals)}</span><b>${escapeHtml(m.opponent||"Soupeř")}</b><b class="${String(m.result).toLowerCase()}">${m.result}</b></div>`).join("")}`)
}
function renderAnalytics(h,a){
 const ms=h.matches||[],last10=ms.slice(0,10),last5=ms.slice(0,5),wr=x=>x.length?Math.round(x.filter(m=>m.result==="W").length/x.length*100):0;
 const best=(a.players||[]).slice().sort((x,y)=>N(y.rating)-N(x.rating))[0],pass=(a.players||[]).slice().sort((x,y)=>(N(y.pass_attempts)?N(y.passes_made)/N(y.pass_attempts):0)-(N(x.pass_attempts)?N(x.passes_made)/N(x.pass_attempts):0))[0],fin=(a.players||[]).slice().sort((x,y)=>(N(y.shots)?N(y.goals)/N(y.shots):0)-(N(x.shots)?N(x.goals)/N(x.shots):0))[0];
 $("#analyticsCards").innerHTML=metric("FORM · LAST 5",last5.map(x=>x.result).join(" ")||"—")+metric("WR · LAST 10",last10.length?wr(last10)+"%":"—")+metric("AVG GOALS · L10",last10.length?(last10.reduce((s,x)=>s+N(x.goals),0)/last10.length).toFixed(2):"—")+metric("AVG CONC. · L10",last10.length?(last10.reduce((s,x)=>s+N(x.opponent_goals),0)/last10.length).toFixed(2):"—")+metric("BEST RATING",best?`${best.player_name} · ${N(best.rating).toFixed(2)}`:"—")+metric("PASS LEADER",pass&&N(pass.pass_attempts)?`${pass.player_name} · ${(N(pass.passes_made)/N(pass.pass_attempts)*100).toFixed(1)}%`:"—")+metric("FINISHING",fin&&N(fin.shots)?`${fin.player_name} · ${(N(fin.goals)/N(fin.shots)*100).toFixed(1)}%`:"—")+metric("SESSIONS",(a.sessions||[]).length);
 const chem=a.chemistry||[];$("#chemistry").innerHTML=chem.length?`<div class="table"><table><thead><tr><th>#</th><th>Partnership</th><th>Matches</th><th>Wins</th><th>WR</th><th>G+A combined</th></tr></thead><tbody>${chem.map((x,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(x.a_name)} + ${escapeHtml(x.b_name)}</td><td>${x.matches}</td><td>${x.wins}</td><td>${Math.round(N(x.wins)/N(x.matches)*100)}%</td><td>${x.contributions}</td></tr>`).join("")}</tbody></table></div>`:'<div class="msg">Chemistry potřebuje aspoň dva společné uložené zápasy.</div>';
}
function funName(p){return escapeHtml(p?.pro_name||p?.player_name||p?.name||"—")}
function renderFunLive(){
 const ps=S.players||[]; if(!ps.length)return;
 const top=fn=>ps.slice().sort((x,y)=>fn(y)-fn(x))[0],sc=top(x=>N(x.goals)),as=top(x=>N(x.assists)),rat=top(x=>N(x.rating)),iron=top(x=>N(x.games)),motm=top(x=>N(x.motm));
 $("#funAwards").innerHTML=[["GOLDEN BOOT",sc,`${sc.goals} gólů`],["ASSIST KING",as,`${as.assists} asistencí`],["MR. CONSISTENT",rat,`${N(rat.rating).toFixed(2)} rating`],["MAIN CHARACTER",motm,`${motm.motm}× MOTM`],["IRON MAN",iron,`${iron.games} zápasů`]].map(([t,p,z])=>`<article class="award"><span>${t}</span><b>${escapeHtml(p.name)}</b><p>${z}</p></article>`).join("");
 const form=S.matches.slice(0,10).reverse(); $("#funForm").innerHTML=form.length?`<div class="formTimeline">${form.map(m=>`<div class="formNode ${m.result.toLowerCase()}"><b>${m.result}</b><i style="height:${18+Math.min(70,(m.og+m.tg)*8)}px"></i><small>${m.og}:${m.tg}</small></div>`).join("")}</div>`:'<div class="msg">Bez zápasů.</div>';
 $("#viralRankings").innerHTML='<div class="msg">Detailní žebříčky se rozšíří automaticky, jakmile se uloží match-level historie.</div>';
 $("#milestones").innerHTML=ps.slice().sort((x,y)=>y.ga-x.ga).slice(0,6).map(p=>`<article class="milestone"><small>CAREER CONTRIBUTIONS</small><b>${escapeHtml(p.name)}</b><p>${p.goals} G · ${p.assists} A · ${p.ga} G+A</p></article>`).join("");
 $("#goalPartners").innerHTML='<div class="msg">Partnerships potřebují společné uložené zápasy.</div>';
 $("#improvementTips").innerHTML='<div class="msg">Tipy se objeví po nasbírání detailních zápasových dat.</div>';
 const amb=$("#analyticsMatchByMatch"); if(amb) amb.innerHTML=$("#funForm").innerHTML;
}
function renderFun(h,a){
 const ps=h.players||[]; if(!ps.length){renderFunLive();return}
 const top=fn=>ps.slice().sort((x,y)=>fn(y)-fn(x))[0];
 const sc=top(x=>N(x.goals)),as=top(x=>N(x.assists)),sa=top(x=>N(x.second_assists)),motm=top(x=>N(x.motm)),iron=top(x=>N(x.matches)),red=top(x=>N(x.red_cards)),drib=top(x=>N(x.dribbles)),def=top(x=>N(x.interceptions)+N(x.tackles_won)),rating=top(x=>N(x.rating));
 const pass=ps.filter(x=>N(x.pass_attempts)>=20).sort((x,y)=>(N(y.passes_made)/N(y.pass_attempts))-(N(x.passes_made)/N(x.pass_attempts)))[0];
 const fin=ps.filter(x=>N(x.shots)>=5).sort((x,y)=>(N(y.goals)/N(y.shots))-(N(x.goals)/N(x.shots)))[0];
 const awards=[["GOLDEN BOOT",sc,`${sc.goals} gólů`],["ASSIST KING",as,`${as.assists} asistencí`],["THE CONNECTOR",sa,`${sa.second_assists} druhých asistencí`],["MAIN CHARACTER",motm,`${motm.motm}× MOTM`],["IRON MAN",iron,`${iron.matches} zápasů`],["BALL MAGNET",drib,`${drib.dribbles} úspěšných driblinků`],["THE WALL",def,`${N(def.interceptions)+N(def.tackles_won)} defenzivních akcí`],["MR. CONSISTENT",rating,`${N(rating.rating).toFixed(2)} průměrný rating`],["CARD COLLECTOR",red,`${red.red_cards} červených`]];
 $("#funAwards").innerHTML=awards.map(([t,p,z])=>`<article class="award"><span>${t}</span><b>${funName(p)}</b><p>${z}</p></article>`).join("");

 const rank=[
  ["THE FINISHER",fin,fin?`${(N(fin.goals)/N(fin.shots)*100).toFixed(1)}% conversion`:"—","good","Góly / střely"],
  ["PASS MERCHANT",pass,pass?`${(N(pass.passes_made)/N(pass.pass_attempts)*100).toFixed(1)}%`:"—","good","Min. 20 pokusů o přihrávku"],
  ["STAT PADDER",top(x=>N(x.goals)+N(x.assists)),`${N(top(x=>N(x.goals)+N(x.assists)).goals)+N(top(x=>N(x.goals)+N(x.assists)).assists)} G+A`,"warn","Nejvíc přímých příspěvků"],
  ["RED FLAG",red,`${red.red_cards} RC`,"bad","Disciplína si vzala dovolenou"],
  ["DRIBBLE MERCHANT",drib,`${drib.dribbles} dribbles`,"","Nejvíc úspěšných driblinků"],
  ["DEFENSIVE MENACE",def,`${N(def.interceptions)+N(def.tackles_won)}`,"good","Interceptions + won tackles"]
 ];
 $("#viralRankings").innerHTML=rank.map(([t,p,v,c,d])=>`<article class="funRank ${c}"><small>${t}</small><b>${funName(p)}</b><strong>${v}</strong><p>${d}</p></article>`).join("");

 const milestones=[];
 for(const p of ps){
  for(const [label,val,step] of [["Goals",N(p.goals),25],["Assists",N(p.assists),25],["Matches",N(p.matches),50],["G+A",N(p.goals)+N(p.assists),50]]){
   const next=Math.max(step,Math.ceil((val+1)/step)*step),left=next-val;
   if(val>0)milestones.push({p,label,val,next,left});
  }
 }
 milestones.sort((x,y)=>x.left-y.left);
 $("#milestones").innerHTML=milestones.slice(0,9).map(x=>`<article class="milestone"><small>${x.label.toUpperCase()} MILESTONE</small><b>${funName(x.p)}</b><p>${x.val} / ${x.next} · zbývá ${x.left}</p></article>`).join("")||'<div class="msg">Zatím bez milestone dat.</div>';

 const matches=h.matches||[],form=matches.slice(0,20).reverse();
 $("#funForm").innerHTML=form.length?`<div class="formTimeline">${form.map(m=>`<div class="formNode ${String(m.result).toLowerCase()}"><b>${m.result}</b><i style="height:${18+Math.min(80,(N(m.goals)+N(m.opponent_goals))*8)}px"></i><small>${N(m.goals)}:${N(m.opponent_goals)}</small></div>`).join("")}</div>`:'<div class="msg">Zatím bez historie.</div>';

 const chem=(a.chemistry||[]).slice(0,8);
 $("#goalPartners").innerHTML=chem.length?`<table class="funTable"><thead><tr><th>Duo</th><th>Spolu</th><th>Výhry</th><th>Win rate</th><th>G+A</th></tr></thead><tbody>${chem.map(x=>`<tr><td><b>${escapeHtml(x.a_name)} + ${escapeHtml(x.b_name)}</b></td><td>${x.matches}</td><td>${x.wins}</td><td>${N(x.matches)?Math.round(N(x.wins)/N(x.matches)*100):0}%</td><td>${x.contributions}</td></tr>`).join("")}</tbody></table>`:'<div class="msg">Potřebujeme aspoň dva společné uložené zápasy.</div>';

 const tips=[];
 const teamPass=ps.reduce((s,x)=>s+N(x.pass_attempts),0)?ps.reduce((s,x)=>s+N(x.passes_made),0)/ps.reduce((s,x)=>s+N(x.pass_attempts),0)*100:null;
 const teamShots=ps.reduce((s,x)=>s+N(x.shots),0),teamGoals=ps.reduce((s,x)=>s+N(x.goals),0),conv=teamShots?teamGoals/teamShots*100:null;
 const recent=matches.slice(0,10),conc=recent.length?recent.reduce((s,x)=>s+N(x.opponent_goals),0)/recent.length:null;
 if(teamPass!=null)tips.push(["Passing",`${teamPass.toFixed(1)}%`,teamPass<75?"Největší prostor je v držení míče a bezpečnější rozehrávce.":"Přihrávková úspěšnost je solidní; hledejte progresivnější řešení."]);
 if(conv!=null)tips.push(["Finishing",`${conv.toFixed(1)}%`,conv<20?"Vytváříte střely, ale konverze zaostává.":"Konverze střel v uloženém vzorku vypadá zdravě."]);
 if(conc!=null)tips.push(["Defence",`${conc.toFixed(2)} GA/match`,conc>2?"Soupeři dávají přes dva góly na zápas; největší rezerva je bez míče.":"Defenzivní trend posledních zápasů je relativně stabilní."]);
 $("#improvementTips").innerHTML=tips.length?tips.map(([t,v,d])=>`<article class="tipCard"><small>${t}</small><div class="tipMetric">${v}</div><b>${d}</b></article>`).join(""):'<div class="msg">Zatím není dost dat.</div>';

 const pms=h.playerMatches||[],byMatch=new Map();
 for(const x of pms){if(!byMatch.has(x.match_id))byMatch.set(x.match_id,[]);byMatch.get(x.match_id).push(x)}
 const rows=matches.slice(0,15).map(m=>{const pp=byMatch.get(m.match_id)||[],best=pp.slice().sort((x,y)=>N(y.rating)-N(x.rating))[0];return `<tr><td>${m.played_at?new Date(m.played_at).toLocaleDateString("cs-CZ"):"—"}</td><td class="${String(m.result).toLowerCase()}"><b>${m.result}</b></td><td>${N(m.goals)}:${N(m.opponent_goals)}</td><td>${escapeHtml(m.opponent||"Soupeř")}</td><td>${best?`${escapeHtml(best.player_name)} · ${N(best.rating).toFixed(1)}`:"—"}</td></tr>`}).join("");
 $("#analyticsMatchByMatch").innerHTML=rows?`<table class="funTable"><thead><tr><th>Date</th><th>Result</th><th>Score</th><th>Opponent</th><th>Best player</th></tr></thead><tbody>${rows}</tbody></table>`:'<div class="msg">Bez historie zápasů.</div>';
}
function showPlayer(id){
 let p=S.players.find(x=>x.id===id);if(!p)return;
 const keys=[p.id,p.name,p.accountName].filter(Boolean).map(v=>String(v).trim().toLowerCase());
 const hist=(S.history?.playerMatches||[]).filter(x=>{const vals=[x.player_id,x.player_name].filter(Boolean).map(v=>String(v).trim().toLowerCase());return keys.some(k=>vals.includes(k))});
 if(hist.length){const agg=(k)=>hist.reduce((s,x)=>s+N(x[k]),0),pa=agg("pass_attempts"),pm=agg("passes_made"),ta=agg("tackle_attempts"),tm=agg("tackles_made"),ratings=hist.slice(0,20).map(x=>N(x.rating)).filter(Boolean).reverse();$("#playerContent").innerHTML=`<div class="profile"><small>PLAYER PROFILE · CLUBROOM CAREER</small><h2>${escapeHtml(p.name)}</h2><p class="identity">${escapeHtml(p.accountName||p.name)} · ${hist[0]?.position||p.position||"—"}</p><div class="careerCoverage"><b>${hist.length}</b> archivovaných zápasů s player stats · databáze se průběžně rozšiřuje</div><div class="profileTabs"><b>Overview</b><span>Attacking</span><span>Passing</span><span>Defending</span><span>Trends</span><span>Match Log</span></div><div class="stats">${stat("MATCHES",hist.length)}${stat("GOALS",agg("goals"))}${stat("ASSISTS",agg("assists"))}${stat("2ND ASSISTS",agg("second_assists"))}${stat("G+A",agg("goals")+agg("assists"))}${stat("AVG RATING",(()=>{const rr=hist.map(x=>N(x.rating)).filter(Boolean);return rr.length?(rr.reduce((a,b)=>a+b,0)/rr.length).toFixed(2):"—"})())}${stat("MOTM",agg("motm"))}${stat("SHOTS",agg("shots"))}${stat("PASS %",pa?(pm/pa*100).toFixed(1)+"%":"—")}${stat("TACKLE %",ta?(tm/ta*100).toFixed(1)+"%":"—")}${stat("INTERCEPTIONS",agg("interceptions"))}${stat("TACKLES WON",agg("standing_tackles_won")+agg("sliding_tackles_won"))}${stat("DRIBBLES",agg("dribbles"))}${stat("THROUGH BALLS",agg("through_balls"))}${stat("SAVES",agg("saves"))}${stat("RED CARDS",agg("red_cards"))}</div><h3 class="sectionTitle">RATING TREND</h3>${ratings.length?`<div class="chart">${ratings.map(r=>`<div class="bar" title="${r.toFixed(1)}" style="height:${Math.max(5,r/10*100)}%"></div>`).join("")}</div>`:""}<h3 class="sectionTitle">MATCH LOG</h3><div class="table"><table><thead><tr><th>Date</th><th>Opponent</th><th>Result</th><th>Rating</th><th>G</th><th>A</th><th>2A</th><th>Shots</th><th>Pass%</th><th>Tackles</th><th>Int.</th></tr></thead><tbody>${hist.slice(0,100).map(x=>`<tr><td>${x.played_at?new Date(x.played_at).toLocaleDateString("cs-CZ"):"—"}</td><td>${escapeHtml(x.opponent||"Soupeř")}</td><td class="${String(x.result).toLowerCase()}">${x.team_goals}:${x.opponent_goals} ${x.result}</td><td>${N(x.rating)?N(x.rating).toFixed(1):"—"}</td><td>${x.goals}</td><td>${x.assists}</td><td>${x.second_assists}</td><td>${x.shots}</td><td>${N(x.pass_attempts)?(N(x.passes_made)/N(x.pass_attempts)*100).toFixed(1)+"%":"—"}</td><td>${x.tackles_made}</td><td>${x.interceptions}</td></tr>`).join("")}</tbody></table></div><p class="note">Key passes nejsou dopočítávány bez spolehlivého EA eventu. Žádné statistické věštění z kávové sedliny.</p></div>`;$("#playerView").hidden=false;return}
 showPlayerLive(id)
}
function showPlayerLive(id){
 let p=S.players.find(x=>x.id===id);if(!p)return;let recent=S.matches.map(m=>{let s=m.players.map(matchPlayer).find(x=>x.id===id||String(x.name).toLowerCase()===String(p.name).toLowerCase());return s?{m,s}:null}).filter(Boolean),ms=recent.map(x=>x.s),sum=k=>ms.reduce((a,x)=>a+N(x[k]),0),pa=sum("passAttempts"),pm=sum("passes"),ta=sum("tackleAttempts"),tm=sum("tackles");
 $("#playerContent").innerHTML=`<div class="profile"><small>PLAYER PROFILE · LIVE WINDOW</small><h2>${escapeHtml(p.name)}</h2><div class="stats">${stat("MATCHES",p.games)}${stat("GOALS",p.goals)}${stat("ASSISTS",p.assists)}${stat("2ND ASSISTS*",sum("secondAssists"))}${stat("AVG RATING",p.rating?p.rating.toFixed(2):"—")}${stat("SHOTS*",sum("shots"))}${stat("PASS %*",pa?(pm/pa*100).toFixed(1)+"%":"—")}${stat("TACKLE %*",ta?(tm/ta*100).toFixed(1)+"%":"—")}</div><p class="note">* Pouze aktuální EA match window. Po zapnutí databáze se profil automaticky přepne na dlouhodobou historii.</p></div>`;$("#playerView").hidden=false
}
function openTab(tab,push=true){document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));document.querySelectorAll("[data-pane]").forEach(p=>p.classList.toggle("active",p.dataset.pane===tab));if(push&&S.club)history.replaceState(null,"",`/club/${S.club.id}/${tab==="stats"?"":tab}`.replace(/\/$/,""))}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>openTab(b.dataset.tab));
$("#openSearch").onclick=()=>{history.replaceState(null,"","/");$("#dash").hidden=true;$("#home").hidden=false;const nav=$("#clubTabs");if(nav)nav.hidden=true;$("#q").focus()};
// v13 match detail: three explicit views. Formation is shown only when EA actually provides it.
function showMatchV20(i){
 const m=S.matches[i],ps=m.players.map(matchPlayer),r=m.oursRaw||{},o=m.oppRaw||{};
 const teamRows=[["Goals",m.og,m.tg],["Possession",P(r,["possession","possessionPct"],"—"),P(o,["possession","possessionPct"],"—")],["Shots",P(r,["shots","shotsTaken"],"—"),P(o,["shots","shotsTaken"],"—")],["Passes",P(r,["passes","passesMade"],"—"),P(o,["passes","passesMade"],"—")],["Tackles",P(r,["tackles","tacklesMade"],"—"),P(o,["tackles","tacklesMade"],"—")]];
 const formO=P(r,["formation","formationId"],null),formT=P(o,["formation","formationId"],null);
 $("#matchContent").innerHTML=`<div class="profile"><small>${m.type.toUpperCase()} · ${m.date?m.date.toLocaleString("cs-CZ"):""}</small><h2>${escapeHtml(m.ours)} ${m.og}:${m.tg} ${escapeHtml(m.opp)}</h2><div class="profileTabs"><b>Match Stats</b><span>Player Stats</span><span>Formations</span></div><h3 class="sectionTitle">MATCH STATS</h3><div class="compareGrid">${teamRows.map(([k,a,b])=>`<div class="cmpCell">${a}</div><div class="cmpCell">${k}</div><div class="cmpCell">${b}</div>`).join("")}</div><h3 class="sectionTitle">PLAYER STATS</h3>${ps.length?matchStatsTable(ps):'<div class="msg">EA v tomto zápase neposlalo hráčské statistiky.</div>'}<h3 class="sectionTitle">FORMATIONS</h3><div class="stats">${stat(m.ours,formO||"EA neposlalo")}${stat(m.opp,formT||"EA neposlalo")}</div></div>`;$("#matchView").hidden=false
}

// v19 quick navigation from overview cards
document.addEventListener("click",e=>{const b=e.target.closest("[data-goto]");if(!b)return;const t=document.querySelector(`#clubTabs [data-tab="${b.dataset.goto}"]`);if(t)t.click()});

// v21: inline match accordion + Fun blocks matching the requested reference structure.
function findGoalTimeline(raw){
 const out=[]; const seen=new Set();
 function walk(v,depth=0){
  if(depth>7||v==null)return;
  if(Array.isArray(v)){v.forEach(x=>walk(x,depth+1));return}
  if(typeof v!=="object")return;
  const type=String(P(v,["type","eventType","eventName","name","event"],"")).toLowerCase();
  const minute=first(P(v,["minute","gameMinute","time","matchTime"],null),null);
  const player=P(v,["playerName","player","scorerName","name"],null);
  const isGoal=type.includes("goal")||N(P(v,["isGoal","goal"],0))===1;
  if(isGoal&&(player||minute!=null)){
   const key=`${player||"?"}-${minute||"?"}`; if(!seen.has(key)){seen.add(key);out.push({player:typeof player==="object"?P(player,["name","playerName"],"Hráč"):player||"Hráč",minute})}
  }
  Object.values(v).forEach(x=>walk(x,depth+1));
 }
 walk(raw); return out.sort((a,b)=>N(a.minute)-N(b.minute));
}
function goalRowsForLive(m,ps){
 const timed=findGoalTimeline(m.raw);
 if(timed.length)return timed.map(g=>`<div class="goalEvent"><span>⚽</span><b>${escapeHtml(String(g.player))}</b><em>${g.minute!=null?escapeHtml(String(g.minute))+"′":"čas EA neposlalo"}</em></div>`).join("");
 const scorers=ps.filter(p=>p.goals>0);
 if(scorers.length)return scorers.map(p=>`<div class="goalEvent"><span>⚽</span><b>${escapeHtml(p.name)}</b><em>${p.goals>1?p.goals+" góly":"1 gól"} · minuta v EA payloadu není</em></div>`).join("");
 return '<div class="inlineEmpty">EA neposlalo střelce ani časovou osu gólů.</div>';
}
function teamVal(raw,names,players,key){const direct=P(raw,names,null);if(direct!=null&&direct!=="")return direct;return players.reduce((s,p)=>s+N(p[key]),0)||"—"}
liveMatchDetail = function(i){
 const m=S.matches[i],ps=m.players.map(matchPlayer),r=m.oursRaw||{},o=m.oppRaw||{};
 const all=m.raw?flattenPlayers(m.raw.players||m.raw.playerStats||m.raw.members||[]).map(matchPlayer):[];
 const oppPs=all.filter(p=>!ps.some(x=>x.id&&x.id===p.id));
 const rows=[
  ["Goals",m.og,m.tg],
  ["Shots",teamVal(r,["shots","shotsTaken"],ps,"shots"),teamVal(o,["shots","shotsTaken"],oppPs,"shots")],
  ["Passes",teamVal(r,["passes","passesMade"],ps,"passes"),teamVal(o,["passes","passesMade"],oppPs,"passes")],
  ["Pass %",P(r,["passAccuracy","passPct","passPercentage"],ps.reduce((s,p)=>s+p.passAttempts,0)?pct(ps.reduce((s,p)=>s+p.passes,0)/ps.reduce((s,p)=>s+p.passAttempts,0)*100):"—"),P(o,["passAccuracy","passPct","passPercentage"],"—")],
  ["Tackles",teamVal(r,["tackles","tacklesMade"],ps,"tackles"),teamVal(o,["tackles","tacklesMade"],oppPs,"tackles")],
  ["Saves",teamVal(r,["saves"],ps,"saves"),teamVal(o,["saves"],oppPs,"saves")]
 ];
 return `<div class="inlineMatchInner"><div class="inlineTabs"><b>Match Stats</b><span>Player Stats</span><span>Goals</span><span>Formation</span></div><div class="matchDetailGrid"><div><h4>TEAM STATS</h4>${rows.map(([k,a,b])=>`<div class="teamStat"><strong>${a}</strong><span>${k}</span><strong>${b}</strong></div>`).join("")}</div><div><h4>GOALS</h4><div class="goalTimeline">${goalRowsForLive(m,ps)}</div><h4>FORMATION</h4><div class="formationLine"><span>${escapeHtml(m.ours)}</span><b>${P(r,["formation","formationId"],"—")}</b><span>${escapeHtml(m.opp)}</span><b>${P(o,["formation","formationId"],"—")}</b></div></div></div><h4>PLAYER STATS</h4>${ps.length?matchStatsTable(ps):'<div class="inlineEmpty">EA neposlalo hráčské statistiky.</div>'}</div>`;
}
function showMatch(i){
 const row=document.querySelector(`.match[data-m="${i}"]`); if(!row)return;
 const old=row.nextElementSibling;if(old&&old.classList.contains("matchInlineDetail")){old.remove();row.classList.remove("open");return}
 document.querySelectorAll(".matchInlineDetail").forEach(x=>x.remove());document.querySelectorAll(".match.open").forEach(x=>x.classList.remove("open"));
 row.classList.add("open");row.insertAdjacentHTML("afterend",`<div class="matchInlineDetail">${liveMatchDetail(i)}</div>`);
}
archiveDetail = function(matchId){
 const m=(S.history?.matches||[]).find(x=>String(x.match_id)===String(matchId)); if(!m)return '<div class="inlineEmpty">Archivní zápas nenalezen.</div>';
 const ps=(S.history?.playerMatches||[]).filter(x=>String(x.match_id)===String(matchId));
 const goals=ps.filter(x=>N(x.goals)>0).map(x=>`<div class="goalEvent"><span>⚽</span><b>${escapeHtml(x.player_name)}</b><em>${N(x.goals)>1?N(x.goals)+" góly":"1 gól"} · archiv nemá minutu</em></div>`).join("")||'<div class="inlineEmpty">Bez uložené časové osy gólů.</div>';
 return `<div class="inlineMatchInner"><div class="matchDetailGrid"><div><h4>MATCH</h4><div class="teamStat"><strong>${N(m.goals)}</strong><span>Goals</span><strong>${N(m.opponent_goals)}</strong></div><div class="teamStat"><strong>${escapeHtml(S.club.name)}</strong><span>vs</span><strong>${escapeHtml(m.opponent||"Soupeř")}</strong></div></div><div><h4>GOALS</h4>${goals}</div></div><h4>PLAYER STATS</h4>${ps.length?`<div class="table"><table><thead><tr><th>Player</th><th>Rating</th><th>G</th><th>A</th><th>2A</th><th>Shots</th><th>Passes</th><th>Pass%</th><th>Tackles</th><th>Int.</th></tr></thead><tbody>${ps.map(x=>`<tr><td>${escapeHtml(x.player_name)}</td><td>${N(x.rating)?N(x.rating).toFixed(1):"—"}</td><td>${N(x.goals)}</td><td>${N(x.assists)}</td><td>${N(x.second_assists)}</td><td>${N(x.shots)}</td><td>${N(x.passes_made)}</td><td>${N(x.pass_attempts)?(N(x.passes_made)/N(x.pass_attempts)*100).toFixed(0)+"%":"—"}</td><td>${N(x.tackles_made)}</td><td>${N(x.interceptions)}</td></tr>`).join("")}</tbody></table></div>`:'<div class="inlineEmpty">Pro tento archivní zápas nejsou player stats.</div>'}</div>`;
}
document.addEventListener("click",e=>{const r=e.target.closest(".match.archive[data-am]");if(!r)return;const old=r.nextElementSibling;if(old&&old.classList.contains("matchInlineDetail")){old.remove();r.classList.remove("open");return}document.querySelectorAll(".matchInlineDetail").forEach(x=>x.remove());r.classList.add("open");r.insertAdjacentHTML("afterend",`<div class="matchInlineDetail">${archiveDetail(r.dataset.am)}</div>`)});

const _renderArchiveMatchesV21=renderArchiveMatches;
renderArchiveMatches=function(matches){
 _renderArchiveMatchesV21(matches);
 document.querySelectorAll(".match.archive").forEach((el,idx)=>{const archive=(matches||[]).filter(x=>!new Set(S.matches.map(m=>String(P(m.raw,["matchId","matchid","id"],"")))).has(String(x.match_id))).slice(0,200);if(archive[idx])el.dataset.am=archive[idx].match_id});
};

const _renderFunV21=renderFun;
renderFun=function(h,a){
 _renderFunV21(h,a); const ps=h.players||[], ms=h.matches||[];
 const n=x=>escapeHtml(x?.pro_name||x?.player_name||x?.name||"—"), by=k=>ps.slice().sort((x,y)=>N(y[k])-N(x[k]))[0];
 const pool=ps.slice(); const picked=[]; for(const key of ["goals","assists","rating","motm"]){const cand=pool.slice().sort((x,y)=>N(y[key])-N(x[key])).find(p=>!picked.some(q=>String(q.player_id||q.id||q.player_name||q.name)===String(p.player_id||p.id||p.player_name||p.name))); if(cand)picked.push(cand)}
 const front=document.querySelector("#bestFront");if(front)front.innerHTML=picked.length?`<div class="pitch"><div class="pitchLine"></div>${picked.map((p,i)=>`<article class="pitchPlayer p${i}"><small>${i===0?"ST":i===1?"CAM":i===2?"RAM":"LAM"}</small><strong>${N(p.rating).toFixed(1)}</strong><b>${n(p)}</b><span>${N(p.goals)} G · ${N(p.assists)} A</span></article>`).join("")}</div>`:'<div class="msg">Potřebujeme hráčská data.</div>';
 const pass=document.querySelector("#passingInsights");if(pass){const ranked=ps.filter(x=>N(x.pass_attempts)>0).sort((x,y)=>N(y.passes_made)/N(y.pass_attempts)-N(x.passes_made)/N(x.pass_attempts));pass.innerHTML=ranked.length?`<div class="insightList"><h4>PASS ACCURACY RANKINGS</h4>${ranked.map((p,i)=>{const pc=N(p.passes_made)/N(p.pass_attempts)*100;return `<div class="insightRow"><i>${i+1}</i><b>${n(p)}</b><div><span style="width:${Math.min(100,pc)}%"></span></div><strong>${pc.toFixed(1)}%</strong></div>`}).join("")}<h4>VOLUME PASSERS / MATCH</h4>${ranked.slice().sort((x,y)=>N(y.passes_made)/Math.max(1,N(y.matches))-N(x.passes_made)/Math.max(1,N(x.matches))).map((p,i)=>`<div class="volumeRow"><b>${n(p)}</b><span>${(N(p.passes_made)/Math.max(1,N(p.matches))).toFixed(1)} / match</span></div>`).join("")}</div>`:'<div class="msg">Passing insights se objeví po uložení pass eventů.</div>'}
 const clutch=document.querySelector("#clutchStats");if(clutch){const c=ps.slice().sort((x,y)=>(N(y.goals)+N(y.assists)+N(y.motm)*2)-(N(x.goals)+N(x.assists)+N(x.motm)*2)).slice(0,4);clutch.innerHTML=c.length?`<div class="clutchBoard">${c.map((p,i)=>`<article><small>#${i+1}</small><b>${n(p)}</b><strong>${N(p.goals)+N(p.assists)+N(p.motm)*2}</strong><span>clutch index · G+A + 2×MOTM</span></article>`).join("")}</div>`:'<div class="msg">Bez dat.</div>'}
 const pad=document.querySelector("#statPadder");if(pad){const r=ps.map(p=>({p,score:(N(p.goals)+N(p.assists))*10-(N(p.rating)||0)*3})).sort((x,y)=>y.score-x.score);pad.innerHTML=r.length?`<div class="padderBoard">${r.slice(0,5).map((x,i)=>`<div><span>#${i+1}</span><b>${n(x.p)}</b><em>${N(x.p.goals)+N(x.p.assists)} G+A</em><strong>${N(x.p.rating).toFixed(1)} avg</strong></div>`).join("")}<p>Fun index, ne skutečný úsudek o hráči. Počítá produkci proti ratingu.</p></div>`:'<div class="msg">Bez dat.</div>'}
};

// v22: reference-matched Players cards and three-tab inline match details.
function posGroup(pos){const p=String(pos||'').toUpperCase();if(/GK|GOAL/.test(p))return'GK';if(/CB|LB|RB|LWB|RWB|DEF/.test(p))return'DEF';if(/CM|CAM|CDM|LM|RM|MID/.test(p))return'MID';return'FWD'}
function playerAdvancedForCard(p){return advancedFor(p)}
function creativityScore(p){const a=playerAdvancedForCard(p),m=Math.max(1,N(a.trackedMatches));return ((N(a.dribbles)+N(a.secondAssists)*2)/m)*90/90}
function cardClubInfo(){return (S.raw?.info&&(S.raw.info[S.club?.id]||A(S.raw.info)[0]))||{}}
function cardCrestUrl(){const info=cardClubInfo(),crestId=P(info?.customKit,['crestAssetId'],P(info,['crestAssetId'],null));return crestId?crestUrl(crestId):''}
function eaKitColor(value,fallback='#d9dde3'){const n=Number(value);if(!Number.isFinite(n)||n<0)return fallback;return `#${(n&0xffffff).toString(16).padStart(6,'0')}`}
function cardJerseyColor(){const info=cardClubInfo();return eaKitColor(P(info?.customKit,['kitColor1'],null))}
function cardPos(pos){const raw=String(pos||'').trim().toUpperCase();if(raw&&raw.length<=4&&!['FORWARD','MIDFIELDER','DEFENDER','GOALKEEPER'].includes(raw))return raw;return posGroup(pos)}
function cardAttr(v){return escapeHtml(String(v??'')).replace(/`/g,'&#096;')}
function playerCardMarkup(p){
 const a=playerAdvancedForCard(p),games=N(a.games||p.games),hasGames=games>0;
 const rating=N(a.rating||p.rating),ga=N(a.goals||p.goals)+N(a.assists||p.assists);
 const shots=a.shots!=null?N(a.shots):(p.shots?N(p.shots):null);
 const passRate=a.passRate!=null?Number(a.passRate):(p.passRate?Number(p.passRate):null);
 const shotRate=shots&&shots>0?(N(a.goals||p.goals)/shots*100):(p.shotRate?Number(p.shotRate):null);
 const value=(v,fmt)=>v==null||!Number.isFinite(Number(v))?'--':fmt(Number(v));
 const overall=N(p.overall)>0?String(N(p.overall)):'--';
 const crest=cardCrestUrl(),jersey=cardJerseyColor();
 const playerImg=`/cards/players/${encodeURIComponent(String(p.id))}/base.png`;
 const stats=[
  ['RAT', rating>0?rating:null, v=>v.toFixed(1)],
  ['G+A/G', hasGames?ga/games:null, v=>v.toFixed(2)],
  ['G/G', hasGames?N(a.goals||p.goals)/games:null, v=>v.toFixed(2)],
  ['A/G', hasGames?N(a.assists||p.assists)/games:null, v=>v.toFixed(2)],
  ['PASS', passRate, v=>`${v.toFixed(1)}%`],
  ['SHOT', shotRate, v=>`${v.toFixed(1)}%`]
 ];
 const attrs=stats.map((x,i)=>`stat-${i+1}-label="${cardAttr(x[0])}" stat-${i+1}-value="${cardAttr(value(x[1],x[2]))}"`).join(' ');
 return `<article class="playerCollectibleWrap" data-p="${cardAttr(p.id)}"><player-card player-id="${cardAttr(p.id)}" player-name="${cardAttr(p.name)}" position="${cardAttr(cardPos(p.position))}" overall="${cardAttr(overall)}" crest-url="${cardAttr(crest)}" jersey-color="${cardAttr(jersey)}" player-image="${cardAttr(playerImg)}" ${attrs} matches="${cardAttr(hasGames?games:'--')}" goals="${cardAttr(hasGames?N(a.goals||p.goals):'--')}" assists="${cardAttr(hasGames?N(a.assists||p.assists):'--')}" motm="${cardAttr(hasGames?N(a.motm||p.motm):'--')}"></player-card><div class="playerCollectibleMeta"><b>${escapeHtml(p.name)}</b><span>Open profile →</span></div></article>`
}
function renderPlayerCards(){
 const host=$('#playerCards');if(!host)return;let list=S.players.slice();const rank=$('#playerRank')?.value||'squad';
 if(rank!=='squad')list.sort((a,b)=>{if(rank==='creativity')return creativityScore(b)-creativityScore(a);return N(playerSortValue(b,rank))-N(playerSortValue(a,rank))});
 const counts={GK:0,DEF:0,MID:0,FWD:0};list.forEach(p=>counts[posGroup(p.position)]++);
 $('#positionSummary').innerHTML=`<span class="posPill gk">🧤 Goalkeepers: ${counts.GK}</span><span class="posPill def">🛡 Defenders: ${counts.DEF}</span><span class="posPill mid">🎯 Midfielders: ${counts.MID}</span><span class="posPill fwd">⚡ Forwards: ${counts.FWD}</span>`;
 const creative=list.map(p=>({p,s:creativityScore(p),a:playerAdvancedForCard(p)})).filter(x=>x.a.trackedMatches).sort((a,b)=>b.s-a.s).slice(0,5);
 $('#creativityRanking').innerHTML=creative.length?creative.map((x,i)=>`<span><b>#${i+1} ${escapeHtml(x.p.name)}</b><em>${x.s.toFixed(2)}</em></span>`).join(''):'<small>Čekám na match-level dribbles / second assists.</small>';
 host.innerHTML=list.map(playerCardMarkup).join('');
 host.querySelectorAll('[data-p]').forEach(x=>x.onclick=()=>showPlayer(x.dataset.p));$('#playerCount').textContent=`${list.length} hráčů`;
}
document.addEventListener('change',e=>{if(e.target.id==='playerRank')renderPlayerCards()});
const _renderPlayerTableV22=renderPlayerTable;renderPlayerTable=function(){_renderPlayerTableV22();renderPlayerCards()};

function deepEvents(raw){
 const events=[];const seen=new Set();
 function valName(v,keys){const z=P(v,keys,null);if(z&&typeof z==='object')return P(z,['proName','playerName','personaName','name','displayName'],'');return z||''}
 function walk(v,depth=0,path=''){
  if(depth>9||v==null)return;if(Array.isArray(v)){v.forEach((x,i)=>walk(x,depth+1,`${path}.${i}`));return}if(typeof v!=='object')return;
  const type=String(P(v,['eventName','eventType','type','name','event','action'],'')).toLowerCase();
  const goalFlag=type.includes('goal')||N(P(v,['isGoal','goalScored','scoredGoal'],0))===1;
  let minute=P(v,['minute','gameMinute','matchMinute','timeMinute','eventMinute'],null);const clock=P(v,['matchTime','gameTime','time'],null);if(minute==null&&typeof clock==='string'){const m=clock.match(/(\d{1,3})(?::\d{2})?/);if(m)minute=N(m[1])}
  const scorer=valName(v,['scorerName','goalScorer','playerName','proName','personaName','player','scorer']);
  const assist=valName(v,['assistName','assisterName','assistPlayerName','assister','assistPlayer','assist']);
  if(goalFlag&&(scorer||minute!=null)){const key=`${scorer}|${assist}|${minute}|${path}`;if(!seen.has(key)){seen.add(key);events.push({scorer:scorer||'Hráč',assist,minute})}}
  Object.entries(v).forEach(([k,x])=>walk(x,depth+1,`${path}.${k}`));
 }
 walk(raw);return events.sort((a,b)=>(a.minute??999)-(b.minute??999));
}
function allMatchPlayers(m){const all=flattenPlayers(m.raw?.players||m.raw?.playerStats||m.raw?.members||[]).map(matchPlayer);const ours=m.players.map(matchPlayer);const ownIds=new Set(ours.map(x=>x.id));let opp=all.filter(x=>!ownIds.has(x.id));return {ours,opp}}
function matchTeamPct(players,made,att){const a=players.reduce((s,p)=>s+N(p[att]),0),b=players.reduce((s,p)=>s+N(p[made]),0);return a?b/a*100:null}
function statBar(label,a,b,kind='num'){let an=N(a),bn=N(b),total=Math.max(1,an+bn),aw=an/total*100,bw=bn/total*100;const f=v=>kind==='pct'?(v==null?'—':`${N(v).toFixed(0)}%`):v;return `<div class="matchStatRow"><b>${f(a)}</b><div class="barTrack"><i style="width:${aw}%"></i><i style="width:${bw}%"></i></div><b>${f(b)}</b><span>${label}</span></div>`}
function goalPanel(m,ours,opp){const ev=deepEvents(m.raw);if(ev.length)return ev.map(g=>`<div class="goalLine"><span>⚽</span><div><b>${escapeHtml(String(g.scorer))}</b>${g.assist?`<small>Assist: ${escapeHtml(String(g.assist))}</small>`:''}</div><em>${g.minute!=null?g.minute+'′':'—'}</em></div>`).join('');const all=[...ours,...opp].filter(p=>p.goals);return all.length?all.map(p=>`<div class="goalLine"><span>⚽</span><div><b>${escapeHtml(p.name)}</b><small>${p.goals}× goal · EA neposlalo minutu/asistenci eventu</small></div><em>—</em></div>`).join(''):'<div class="inlineEmpty">Bez goal-event timeline v EA payloadu.</div>'}
function matchPlayersPane(m,ours,opp){const all=[...ours,...opp],motm=all.slice().sort((a,b)=>N(b.rating)-N(a.rating))[0];const scorers=all.filter(p=>p.goals),assists=all.filter(p=>p.assists);const table=(arr,title)=>`<h5>${title}</h5><div class="miniPlayerTable">${arr.map(p=>`<div><b>${escapeHtml(p.name)}</b><span>${escapeHtml(p.pos||'—')}</span><strong>${p.rating?p.rating.toFixed(1):'—'}</strong><em>⚽ ${p.goals} · 🅰 ${p.assists} · 🎯 ${p.shots} · 👟 ${p.passes} · 🦵 ${p.tackles}</em></div>`).join('')||'<small>EA neposlalo hráče.</small>'}</div>`;return `${motm?`<div class="motmBox"><small>⭐ MAN OF THE MATCH</small><b>${escapeHtml(motm.name)}</b><strong>${motm.rating.toFixed(1)}</strong><span>${motm.pos||'—'} · ${motm.goals}G ${motm.assists}A</span></div>`:''}<div class="eventSummary"><h5>⚽ GOAL SCORERS</h5>${scorers.map(p=>`<span>${escapeHtml(p.name)} <b>${p.goals}</b></span>`).join('')||'—'}<h5>🅰 ASSISTS</h5>${assists.map(p=>`<span>${escapeHtml(p.name)} <b>${p.assists}</b></span>`).join('')||'—'}</div>${table(ours,`ALL PLAYERS · ${escapeHtml(m.ours)}`)}${table(opp,`ALL PLAYERS · ${escapeHtml(m.opp)}`)}`}
function pitch(players,title){const slots=['st','cam','lm','rm','cm','lb','rb','cb','gk'];return `<div class="miniFormation"><h5>${escapeHtml(title)}</h5><div class="miniPitch">${players.slice(0,11).map((p,i)=>`<span class="fp fp${i%slots.length}"><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.pos||'—')}</small></span>`).join('')}</div><div class="lineupText">${players.map(p=>`<span>${escapeHtml(p.pos||'—')}: ${escapeHtml(p.name)}</span>`).join('')}</div></div>`}
function matchStatsPane(m,ours,opp){const r=m.oursRaw||{},o=m.oppRaw||{};const shotsA=teamVal(r,['shots','shotsTaken'],ours,'shots'),shotsB=teamVal(o,['shots','shotsTaken'],opp,'shots'),passA=teamVal(r,['passes','passesMade'],ours,'passes'),passB=teamVal(o,['passes','passesMade'],opp,'passes'),tackA=teamVal(r,['tackles','tacklesMade'],ours,'tackles'),tackB=teamVal(o,['tackles','tacklesMade'],opp,'tackles'),saveA=teamVal(r,['saves'],ours,'saves'),saveB=teamVal(o,['saves'],opp,'saves'),pa=matchTeamPct(ours,'passes','passAttempts'),pb=matchTeamPct(opp,'passes','passAttempts'),ta=matchTeamPct(ours,'tackles','tackleAttempts'),tb=matchTeamPct(opp,'tackles','tackleAttempts'),ra=ours.filter(p=>p.rating).reduce((s,p)=>s+p.rating,0)/Math.max(1,ours.filter(p=>p.rating).length),rb=opp.filter(p=>p.rating).reduce((s,p)=>s+p.rating,0)/Math.max(1,opp.filter(p=>p.rating).length);return `<div class="matchStatsGroups"><h5>SCORING</h5>${statBar('Goals',m.og,m.tg)}${statBar('Shots',shotsA,shotsB)}${statBar('Shot Accuracy',N(shotsA)?m.og/N(shotsA)*100:0,N(shotsB)?m.tg/N(shotsB)*100:0,'pct')}<h5>PASSING</h5>${statBar('Passes',passA,passB)}${statBar('Pass %',pa,pb,'pct')}${statBar('Assists',ours.reduce((s,p)=>s+p.assists,0),opp.reduce((s,p)=>s+p.assists,0))}<h5>DEFENDING</h5>${statBar('Tackles',tackA,tackB)}${statBar('Tackle %',ta,tb,'pct')}${statBar('Saves',saveA,saveB)}<h5>DISCIPLINE</h5>${statBar('Red Cards',ours.reduce((s,p)=>s+p.reds,0),opp.reduce((s,p)=>s+p.reds,0))}${statBar('Avg Rating',ra.toFixed(1),rb.toFixed(1))}</div><div class="goalTimelineV22"><h5>GOALS</h5>${goalPanel(m,ours,opp)}</div>`}
function liveMatchDetailV22(i){const m=S.matches[i],{ours,opp}=allMatchPlayers(m);return `<div class="inlineMatchInner v22"><div class="inlineTabs v22tabs"><button class="active" data-mtab="stats">📊 Match Stats</button><button data-mtab="players">👥 Player Stats</button><button data-mtab="formations">⚽ Formations</button></div><div class="matchPane active" data-mpane="stats">${matchStatsPane(m,ours,opp)}</div><div class="matchPane" data-mpane="players">${matchPlayersPane(m,ours,opp)}</div><div class="matchPane" data-mpane="formations"><div class="formationPair">${pitch(ours,m.ours)}${pitch(opp,m.opp)}</div></div></div>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-mtab]');if(!b)return;const box=b.closest('.inlineMatchInner');box.querySelectorAll('[data-mtab]').forEach(x=>x.classList.toggle('active',x===b));box.querySelectorAll('[data-mpane]').forEach(x=>x.classList.toggle('active',x.dataset.mpane===b.dataset.mtab))});

function archiveDetailV22(matchId){const m=(S.history?.matches||[]).find(x=>String(x.match_id)===String(matchId));if(!m)return'<div class="inlineEmpty">Archivní zápas nenalezen.</div>';const raw=m.raw_json||{},live=normalizeMatch({...raw,_matchType:m.match_type},S.club.name,S.club.id);live.og=N(m.goals);live.tg=N(m.opponent_goals);live.opp=m.opponent||live.opp;const ps=(S.history?.playerMatches||[]).filter(x=>String(x.match_id)===String(matchId)).map(x=>({name:x.player_name,id:x.player_id,pos:x.position||'—',rating:N(x.rating),goals:N(x.goals),assists:N(x.assists),secondAssists:N(x.second_assists),shots:N(x.shots),passes:N(x.passes_made),passAttempts:N(x.pass_attempts),passRate:N(x.pass_attempts)?N(x.passes_made)/N(x.pass_attempts)*100:0,tackles:N(x.tackles_made),tackleAttempts:N(x.tackle_attempts),tackleRate:N(x.tackle_attempts)?N(x.tackles_made)/N(x.tackle_attempts)*100:0,interceptions:N(x.interceptions),dribbles:N(x.dribbles),saves:N(x.saves),motm:N(x.motm),reds:N(x.red_cards)}));live.players=ps.map(p=>p.raw||p);const ours=ps;const all=flattenPlayers(raw.players||raw.playerStats||raw.members||[]).map(matchPlayer),ids=new Set(ours.map(x=>String(x.id))),opp=all.filter(x=>!ids.has(String(x.id)));return `<div class="inlineMatchInner v22"><div class="inlineTabs v22tabs"><button class="active" data-mtab="stats">📊 Match Stats</button><button data-mtab="players">👥 Player Stats</button><button data-mtab="formations">⚽ Formations</button></div><div class="matchPane active" data-mpane="stats">${matchStatsPane(live,ours,opp)}</div><div class="matchPane" data-mpane="players">${matchPlayersPane(live,ours,opp)}</div><div class="matchPane" data-mpane="formations"><div class="formationPair">${pitch(ours,S.club.name)}${pitch(opp,m.opponent||'Soupeř')}</div></div></div>`}

showMatch=function(i){const row=document.querySelector(`.match[data-m="${i}"]`);if(!row)return;const old=row.nextElementSibling;if(old&&old.classList.contains("matchInlineDetail")){old.remove();row.classList.remove("open");return}document.querySelectorAll(".matchInlineDetail").forEach(x=>x.remove());document.querySelectorAll(".match.open").forEach(x=>x.classList.remove("open"));row.classList.add("open");row.insertAdjacentHTML("afterend",`<div class="matchInlineDetail">${liveMatchDetailV22(i)}</div>`)};
document.addEventListener("click",e=>{const r=e.target.closest(".match.archive[data-am]");if(!r)return;setTimeout(()=>{const d=r.nextElementSibling;if(d&&d.classList.contains("matchInlineDetail"))d.innerHTML=archiveDetailV22(r.dataset.am)},0)},true);

// v27 — clearer tabs, reveal-based Fun, richer Analytics and per-player improvement cards.
function v27UniquePlayers(list){const seen=new Set();return (list||[]).filter(p=>{const k=String(p.player_id||p.id||p.pro_name||p.player_name||p.name||'').trim().toLowerCase();if(!k||seen.has(k))return false;seen.add(k);return true})}
function v27Name(p){return escapeHtml(p?.pro_name||p?.player_name||p?.name||'—')}
function v27PlayerTips(p){const games=Math.max(1,N(p.matches||p.games)), goals=N(p.goals), assists=N(p.assists), shots=N(p.shots), pa=N(p.pass_attempts), pm=N(p.passes_made), rating=N(p.rating);const gpg=goals/games,apg=assists/games,shot=shots?goals/shots*100:null,pass=pa?pm/pa*100:null;let cards=[];if(shot!=null)cards.push(['🎯','Shot Accuracy',shot.toFixed(1)+'%',shot<25?'Improve':'Strength',shot<25?'Zkus omezit střely z horších pozic a víc hledat zakončení z prostoru před bránou.':'Konverze je silná. Udržuj výběr střel a pohyb do zakončení.']);if(pass!=null)cards.push(['↗','Pass Accuracy',pass.toFixed(1)+'%',pass<72?'Improve':'Strength',pass<72?'Zjednoduš rozehrávku pod tlakem a zbytečně neriskuj první přihrávku.':'Přihrávková jistota patří mezi silné stránky v uloženém vzorku.']);cards.push(['⚽','Goals / Game',gpg.toFixed(2),gpg>=.7?'Strength':'Fine',gpg>=.7?'Pravidelně se dostáváš do produkce.':'Produkce je stabilní, ale prostor ke zvýšení počtu zakončení zůstává.']);cards.push(['🅰','Assists / Game',apg.toFixed(2),apg>=.5?'Strength':'Fine',apg>=.5?'Silná tvorba gólových situací.':'Hledej častěji finální přihrávku po přitažení obránce.']);return `<div class="playerTipHead"><div><h4>${v27Name(p)}</h4><span>${escapeHtml(p.position||p.pos||'Player')} · ${games} matches</span></div><strong>${rating?rating.toFixed(1):'—'}<small>AVG</small></strong></div><div class="playerTipCards">${cards.map(x=>`<article class="playerTip ${x[3].toLowerCase()}"><div><b>${x[0]} ${x[1]}</b><strong>${x[2]}</strong><em>${x[3]}</em></div><p>${x[4]}</p></article>`).join('')}</div>`}
function v27RevealCard(icon,title,p,value,desc){return `<button class="revealCard" type="button"><span class="revealIcon">${icon}</span><b>${title}</b><small>Tap to reveal</small><div class="revealAnswer"><strong>${v27Name(p)}</strong><em>${escapeHtml(String(value||''))}</em><p>${escapeHtml(desc)}</p></div></button>`}
function v27EnhanceFun(h,a){const ps=v27UniquePlayers((h?.players?.length?h.players:S.players)||[]);if(!ps.length)return;const top=fn=>ps.slice().sort((x,y)=>fn(y)-fn(x))[0], bottom=fn=>ps.slice().sort((x,y)=>fn(x)-fn(y))[0];const score=top(x=>N(x.goals)),miss=top(x=>Math.max(0,N(x.shots)-N(x.goals))),red=top(x=>N(x.red_cards||x.reds)),backpack=top(x=>N(x.rating)+N(x.goals)*.2+N(x.assists)*.15),architect=top(x=>N(x.assists)+N(x.second_assists)*.75),og=top(x=>N(x.matches||x.games)),main=top(x=>N(x.motm));$('#funAwards').innerHTML=[v27RevealCard('⚽','Most Likely to Score',score,`${N(score.goals)} goals`,'Nejvíc gólů v dostupných datech.'),v27RevealCard('🎯','Most Likely to Miss',miss,`${Math.max(0,N(miss.shots)-N(miss.goals))} misses`,'Střely bez gólu v uloženém vzorku.'),v27RevealCard('🟥','Most Likely to Get Sent Off',red,`${N(red.red_cards||red.reds)} reds`,'Karty. Civilizace byla chyba.'),v27RevealCard('🎒','The Backpack',backpack,`${N(backpack.rating).toFixed(1)} avg`,'Kombinace ratingu a produkce.'),v27RevealCard('🎨','The Architect',architect,`${N(architect.assists)} assists`,'Tvorba šancí přes asistence a druhé asistence.'),v27RevealCard('👴','The OG',og,`${N(og.matches||og.games)} matches`,'Největší zápasová stopa v archivu.'),v27RevealCard('🌟','Main Character',main,`${N(main.motm)} MOTM`,'Nejvíc ocenění hráče zápasu.')].join('');document.querySelectorAll('.revealCard').forEach(b=>b.onclick=()=>b.classList.toggle('revealed'));
 const tipsHost=$('#improvementTips');if(tipsHost){tipsHost.className='playerTips';tipsHost.innerHTML=`<div class="playerTipTabs">${ps.map((p,i)=>`<button class="${i?'':'active'}" data-tip-player="${i}">${v27Name(p)}</button>`).join('')}</div><div id="playerTipBody">${v27PlayerTips(ps[0])}</div>`;tipsHost.querySelectorAll('[data-tip-player]').forEach(b=>b.onclick=()=>{tipsHost.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#playerTipBody').innerHTML=v27PlayerTips(ps[N(b.dataset.tipPlayer)])})}
}
function v27Analytics(h,a){const ps=v27UniquePlayers(h?.players||[]), pms=h?.playerMatches||[];const formHost=$('#analyticsForm'),mbm=$('#analyticsMatchByMatch');if(formHost){const top=ps.slice().sort((x,y)=>N(y.rating)-N(x.rating)).slice(0,4);formHost.innerHTML=top.length?`<div class="analyticsPlayerTabs">${top.map((p,i)=>`<button class="${i?'':'active'}" data-anp="${i}">${v27Name(p)} <b>${N(p.rating).toFixed(1)}</b></button>`).join('')}</div><div id="analyticsChart"></div>`:'<div class="msg">Analytics se naplní s archivem.</div>';const draw=i=>{const p=top[i];let rows=pms.filter(x=>String(x.player_id)===String(p.player_id)).slice(0,20).reverse();if(!rows.length)return $('#analyticsChart').innerHTML='<div class="msg">Zatím bez match-level ratingů.</div>';const vals=rows.map(x=>N(x.rating));const lo=5,hi=10,w=760,hg=220,pts=vals.map((v,j)=>`${40+j*(680/Math.max(1,vals.length-1))},${185-(v-lo)/(hi-lo)*145}`).join(' ');$('#analyticsChart').innerHTML=`<div class="chartTitle"><b>${v27Name(p)} — Match Rating</b><span>Avg ${(vals.reduce((s,x)=>s+x,0)/vals.length).toFixed(2)}</span></div><svg class="ratingChart" viewBox="0 0 ${w} ${hg}" preserveAspectRatio="none"><line x1="40" y1="185" x2="720" y2="185"/><line x1="40" y1="40" x2="40" y2="185"/><polyline points="${pts}"/></svg>`};formHost.querySelectorAll('[data-anp]').forEach(b=>b.onclick=()=>{formHost.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');draw(N(b.dataset.anp))});if(top.length)draw(0)}
 if(mbm){const leaders=ps.slice().sort((x,y)=>N(y.rating)-N(x.rating)).slice(0,5);mbm.innerHTML=`<div class="analyticsModes"><button class="active">⭐ Match Rating</button><button>🎯 Pass Accuracy</button><button>🦵 Tackles</button><button>⚽ Goal Contributions</button></div><div class="analyticsLeaderboard">${leaders.map((p,i)=>`<div><i>${i+1}</i><b>${v27Name(p)}</b><span style="--v:${Math.min(100,N(p.rating)*10)}%"></span><strong>${N(p.rating).toFixed(1)}</strong></div>`).join('')}</div>`}
}
const _v27RenderFun=renderFun;renderFun=function(h,a){_v27RenderFun(h,a);v27EnhanceFun(h,a)};
const _v27RenderAnalytics=renderAnalytics;renderAnalytics=function(h,a){_v27RenderAnalytics(h,a);v27Analytics(h,a)};

// v29: Fun = reveal/share-style cards; Analytics = match-by-match + player development.
function playerKey29(p){return String(p?.player_id||p?.id||p?.player_name||p?.pro_name||p?.name||'').toLowerCase()}
function renderViral29(h){
 const ps=h.players||[], host=document.querySelector('#viralRankings'); if(!host)return;
 if(!ps.length){host.innerHTML='<div class="msg">Viral rankings se objeví po uložení hráčské historie.</div>';return}
 const sort=fn=>ps.slice().sort((a,b)=>fn(b)-fn(a));
 const games=p=>Math.max(1,N(p.matches)), wr=p=>N(p.wins)/games(p)*100, ga=p=>N(p.goals)+N(p.assists), rate=p=>N(p.rating);
 const cards=[
  {title:'Ghost Rankings',sub:'Who disappears when it matters most?',icon:'👻',score:p=>Math.max(0,100-Math.min(100,(ga(p)/games(p))*45+rate(p)*5)),tag:'BIGGEST GHOST'},
  {title:'L Merchant Index',sub:"Who collects Ls like trading cards?",icon:'📉',score:p=>100-wr(p),tag:'TOP L MERCHANT'},
  {title:'Self-Glazer Rankings',sub:'Kdo má rating větší než produkci?',icon:'✨',score:p=>Math.max(0,Math.min(100,rate(p)*12-(ga(p)/games(p))*10)),tag:'CHIEF GLAZER'},
  {title:'Main Character',sub:'Who takes the most spotlight?',icon:'🎬',score:p=>Math.min(100,N(p.motm)*12+ga(p)*2),tag:'MAIN CHARACTER'}
 ];
 host.className='viralDeck';host.innerHTML=cards.map(c=>{const ranked=sort(c.score).slice(0,3),top=ranked[0];return `<article class="viralCard"><div class="viralVisual"><span>${c.icon}</span><b>${c.title}</b><small>${c.sub}</small></div><div class="viralWinner"><i>${c.icon}</i><div><small>${c.tag}</small><b>${funName(top)}</b><span>${games(top)} matches · ${wr(top).toFixed(0)}% win rate</span></div><strong>${Math.round(c.score(top))}</strong></div><div class="viralList">${ranked.slice(1).map((p,i)=>`<div><em>${i+2}</em><b>${funName(p)}</b><span><i style="width:${Math.max(4,c.score(p))}%"></i></span><strong>${Math.round(c.score(p))}</strong></div>`).join('')}</div></article>`}).join('');
}
function renderAnalyticsMatch29(h){
 const host=document.querySelector('#analyticsMatchByMatch'); if(!host)return; const pm=h.playerMatches||[], matches=h.matches||[];
 const names=[...new Set(pm.map(x=>x.player_name).filter(Boolean))]; if(!names.length){host.innerHTML='<div class="msg">Match-by-match graf potřebuje uložené player match stats.</div>';return}
 const player=names[0], rows=pm.filter(x=>x.player_name===player).slice(0,10).reverse(), vals=rows.map(x=>N(x.rating));
 const pts=vals.map((v,i)=>`${i*(100/Math.max(1,vals.length-1))},${100-Math.max(0,Math.min(100,(v-5)*20))}`).join(' ');
 host.innerHTML=`<div class="mbmControls"><div><button class="active">⭐ Match Rating</button><button>🦵 Tackles Made</button><button>🎯 Pass Accuracy</button><button>⚽ Goal Contributions</button></div><div>${names.slice(0,8).map((x,i)=>`<button class="${i?'':'active'}">${escapeHtml(x)}</button>`).join('')}</div></div><div class="mbmChart"><div><h4>⭐ ${escapeHtml(player)} — Match Rating</h4><small>Average: <b>${vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):'—'}</b></small></div><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><div class="mbmSummary"><b>${vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):'—'}<small>Average</small></b><b>${vals.length?Math.max(...vals).toFixed(1):'—'}<small>Best</small></b><b>${vals.length?Math.min(...vals).toFixed(1):'—'}<small>Worst</small></b></div></div>`;
}
const _renderFunV29=renderFun; renderFun=function(h,a){_renderFunV29(h,a);renderViral29(h);renderAnalyticsMatch29(h)};
document.addEventListener('click',e=>{const a=e.target.closest('#funAwards .award');if(a)a.classList.toggle('revealed')});

// v30: Fun sub-navigation, Duo Cards, and compact editorial rankings.
function v30PlayerRecords(h){
 const map=new Map();
 for(const x of (h?.playerMatches||[])){
  const k=String(x.player_id||x.player_name||'').toLowerCase();
  if(!k)continue;
  if(!map.has(k))map.set(k,{matches:0,wins:0,draws:0,losses:0});
  const r=map.get(k);r.matches++;if(x.result==='W')r.wins++;else if(x.result==='D')r.draws++;else if(x.result==='L')r.losses++;
 }
 return map;
}
function v30Rankings(h){
 const ps=v27UniquePlayers((h?.players?.length?h.players:S.players)||[]), rec=v30PlayerRecords(h);
 const key=p=>String(p.player_id||p.id||p.player_name||p.name||'').toLowerCase();
 const record=p=>rec.get(key(p))||{matches:N(p.matches||p.games),wins:0,draws:0,losses:0};
 const games=p=>Math.max(1,N(record(p).matches||p.matches||p.games));
 const ga=p=>N(p.goals)+N(p.assists), rate=p=>N(p.rating), motm=p=>N(p.motm);
 const wr=p=>{const r=record(p);return r.matches?N(r.wins)/N(r.matches)*100:0};
 const defs=[
  {id:'ghost',title:'Ghost Rankings',sub:'Who disappears when it matters most?',icon:'👻',tag:'BIGGEST GHOST',tone:'#2e8bc0',score:p=>Math.max(0,Math.min(100,100-((ga(p)/games(p))*38+motm(p)/games(p)*120+Math.max(0,rate(p)-7)*10))),detail:p=>`${games(p)} zápasů · ${(ga(p)/games(p)).toFixed(2)} G+A/zápas`},
  {id:'lmerchant',title:'L Merchant Index',sub:"Who collects Ls like trading cards?",icon:'📉',tag:'TOP L MERCHANT',tone:'#ef5b63',score:p=>{const r=record(p);return r.matches?N(r.losses)/N(r.matches)*100:Math.max(0,100-wr(p))},detail:p=>{const r=record(p);return `${r.matches||games(p)} zápasů · ${r.losses||0} proher`}},
  {id:'selfglazer',title:'Self-Glazer Rankings',sub:'High rating, lower output. Purely a fun index.',icon:'✨',tag:'CHIEF GLAZER',tone:'#d9a72f',score:p=>Math.max(0,Math.min(100,rate(p)*12-(ga(p)/games(p))*12)),detail:p=>`${rate(p).toFixed(1)} avg · ${(ga(p)/games(p)).toFixed(2)} G+A/zápas`},
  {id:'maincharacter',title:'Main Character',sub:'Who takes the most spotlight?',icon:'♛',tag:'MAIN CHARACTER',tone:'#4b7bec',score:p=>Math.min(100,motm(p)*14+(ga(p)/games(p))*20+rate(p)*3),detail:p=>`${motm(p)} MOTM · ${ga(p)} G+A`}
 ];
 return defs.map(d=>({...d,ranked:ps.map(p=>({p,score:d.score(p)})).sort((a,b)=>b.score-a.score)}));
}
v30RankingCard = function(def,compact=false){
 const top=def.ranked[0];if(!top)return '<div class="msg">Zatím bez dat.</div>';
 if(compact)return `<article class="featuredRankCard rankArt-${def.id}" style="--tone:${def.tone}"><div class="frBody"><small>FUN RANKING</small><h4>${def.icon} ${def.title}</h4><p>${def.sub}</p></div><div class="frWinner"><i>${def.icon}</i><div><b>${funName(top.p)}</b><span>${escapeHtml(def.detail(top.p))}</span></div><strong>${Math.round(top.score)}</strong></div></article>`;
 return `<article class="rankingHero30" style="--rank:${def.tone}"><div class="rankingHeroHead"><span>${def.icon}</span><h3>${def.title}</h3><p>${def.sub}</p></div><div class="rankingWinner30"><i>${def.icon}</i><div><small>${def.tag}</small><b>${funName(top.p)}</b><span>${escapeHtml(def.detail(top.p))}</span></div><strong>${Math.round(top.score)}</strong></div><div class="rankingList30">${def.ranked.slice(1,6).map((x,i)=>`<div><em>${i+2}</em><b>${funName(x.p)}</b><span><i style="width:${Math.max(3,Math.min(100,x.score))}%"></i></span><strong>${Math.round(x.score)}</strong></div>`).join('')}</div><div class="rankingDisclaimer">Fun index odvozený jen z dostupných statistik Clubroomu. Není to objektivní hodnocení člověka, což je dobře, protože software už lidem hodnotí dost věcí.</div></article>`;
}
function v30DuoLabel(x){
 const ag=N(x.a_goals),aa=N(x.a_assists)+N(x.a_second_assists)*.5,bg=N(x.b_goals),ba=N(x.b_assists)+N(x.b_second_assists)*.5,wr=N(x.matches)?N(x.wins)/N(x.matches)*100:0;
 if((aa>ag&&bg>ba)||(ba>bg&&ag>aa))return ['CREATOR × FINISHER','#17b890'];
 if(wr>=65)return ['CARRY PAIR','#3987d7'];
 if(wr<45)return ['CHAOS DUO','#8d4ac7'];
 return ['BALANCED DUO','#4b6f91'];
}
function v30DuoScore(x){const m=Math.max(1,N(x.matches)),wr=N(x.wins)/m*100,cpm=N(x.contributions)/m;return Math.max(0,Math.min(99,Math.round(wr*.55+Math.min(25,m*1.2)+Math.min(20,cpm*5))))}
v30RenderDuos = function(a){
 const chem=(a?.chemistry||[]).slice().sort((x,y)=>v30DuoScore(y)-v30DuoScore(x));
 const html=chem.length?chem.map(x=>{const [label,tone]=v30DuoLabel(x),m=Math.max(1,N(x.matches)),wr=N(x.wins)/m*100,score=v30DuoScore(x);return `<article class="duoCard" style="--duo:${tone}"><div class="duoTop"><span class="duoLabel">${label}</span><div class="duoNames"><b>${escapeHtml(x.a_name)}</b><i>×</i><b>${escapeHtml(x.b_name)}</b></div></div><div class="duoStats"><div><b>${score}</b><span>Duo Score</span></div><div><b>${x.matches}</b><span>Matches</span></div><div><b>${wr.toFixed(0)}%</b><span>Win Rate</span></div><div><b>${x.contributions}</b><span>Combined G+A</span></div></div><div class="duoMeta">${N(x.a_goals)}G + ${N(x.a_assists)}A · ${escapeHtml(x.a_name)} &nbsp; | &nbsp; ${N(x.b_goals)}G + ${N(x.b_assists)}A · ${escapeHtml(x.b_name)}</div></article>`}).join(''):'<div class="msg">Duo Cards potřebují aspoň dva společné archivované zápasy.</div>';
 const all=$('#goalPartners');if(all)all.innerHTML=html;
 const feat=$('#featuredDuos');if(feat)feat.innerHTML=html;
}
function v30FeaturedSuperlatives(){
 const src=[...document.querySelectorAll('#funAwards .revealCard')].slice(0,5);const host=$('#featuredSuperlatives');if(!host)return;
 host.innerHTML=src.length?src.map(x=>`<button class="miniReveal" type="button"><span>${x.querySelector('.revealIcon')?.textContent||'★'}</span><b>${escapeHtml(x.querySelector('b')?.textContent||'Award')}</b><small>Click to reveal in Superlatives</small></button>`).join(''):'<div class="msg">Superlativy se naplní z hráčských dat.</div>';
 host.querySelectorAll('.miniReveal').forEach(b=>b.onclick=()=>v30OpenFun('superlatives'));
}
function v30OpenFun(tab){
 document.querySelectorAll('[data-fun-tab]').forEach(b=>b.classList.toggle('active',b.dataset.funTab===tab));
 document.querySelectorAll('[data-fun-pane]').forEach(p=>p.classList.toggle('active',p.dataset.funPane===tab));
 const nav=$('#funSubnav');if(nav){const active=nav.querySelector(`[data-fun-tab="${tab}"]`);active?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-fun-tab]');if(b)v30OpenFun(b.dataset.funTab);const o=e.target.closest('[data-open-fun]');if(o)v30OpenFun(o.dataset.openFun);if(e.target.closest('#revealAll30'))document.querySelectorAll('#funAwards .revealCard').forEach(x=>x.classList.add('revealed'))});
function v30RenderFun(h,a){
 const defs=v30Rankings(h), byId=id=>defs.find(x=>x.id===id);
 const featured=$('#viralRankings');if(featured)featured.innerHTML=defs.slice(0,3).map(d=>v30RankingCard(d,true)).join('');
 for(const [id,host] of [['ghost','#viralGhost'],['lmerchant','#viralLmerchant'],['selfglazer','#viralSelfglazer'],['maincharacter','#viralMaincharacter']]){const el=$(host),d=byId(id);if(el&&d)el.innerHTML=v30RankingCard(d,false)}
 v30RenderDuos(a);v30FeaturedSuperlatives();
}
const _renderFunV30=renderFun;renderFun=function(h,a){_renderFunV30(h,a);v30RenderFun(h,a)};


/* v31 overrides: English UI + cleaner Fun cards + redesigned Matches */
function v31CrestByName(name){const initials=(String(name||'').match(/[A-Z0-9]/ig)||['?']).slice(0,2).join('').toUpperCase();return `<span>${initials}</span>`}
function v31OppCrestHtml(name){const n=String(name||'').toLowerCase();let src='';if(n.includes('paris')||n.includes('psg'))src='https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg';else if(n.includes('werder')||n.includes('schöndorf')||n.includes('schondorf'))src='https://upload.wikimedia.org/wikipedia/en/b/be/SV-Werder-Bremen-Logo.svg';return src?`<img src="${src}" alt="">`:v31CrestByName(name)}
function v31LiveContributors(m){
  const ps=(m.players||[]).map(matchPlayer).filter(Boolean); const out=[];
  ps.filter(p=>N(p.goals)>0).forEach(p=>out.push({label:`${escapeHtml(p.name)} ${N(p.goals)>1?`· ${N(p.goals)}G`:'· scorer'}`,score:N(p.goals)*3+N(p.assists)}));
  ps.filter(p=>N(p.assists)>0).forEach(p=>out.push({label:`${escapeHtml(p.name)} ${N(p.assists)>1?`· ${N(p.assists)}A`:'· assist'}`,score:N(p.assists)*2}));
  if(!out.length){const best=ps.slice().sort((a,b)=>N(b.rating)-N(a.rating))[0];if(best&&N(best.rating))out.push({label:`${escapeHtml(best.name)} · ${N(best.rating).toFixed(1)} rating`,score:N(best.rating)});}
  return out.slice(0,3);
}
function v31ArchiveContributors(matchId){
  const rows=(S.history?.playerMatches||[]).filter(x=>String(x.match_id)===String(matchId));
  const out=[]; rows.filter(x=>N(x.goals)>0).sort((a,b)=>N(b.goals)-N(a.goals)).slice(0,2).forEach(x=>out.push(`${escapeHtml(x.player_name)} · ${N(x.goals)}G`));
  if(!out.length){const best=rows.slice().sort((a,b)=>N(b.rating)-N(a.rating))[0]; if(best&&N(best.rating)) out.push(`${escapeHtml(best.player_name)} · ${N(best.rating).toFixed(1)} rating`)}
  return out;
}
function v31MatchCardHtml(m,i,opts={}){
  const isArchive=!!opts.archive; const crestMine=v31CrestByName(S.club?.name||m.ours||'CL'); const crestOpp=isArchive?v31OppCrestHtml(opts.opponent||m.opp):v31OppCrestHtml(m.opp);
  const dateTxt=isArchive?(opts.played_at?new Date(opts.played_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}):'—'):(m.date?m.date.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}):'—');
  const rel=isArchive?'Archive':(m.type||'Match');
  const badgeClass=(isArchive?opts.result:m.result||'D').toLowerCase();
  const scoreLeft=isArchive?N(opts.goals):m.og, scoreRight=isArchive?N(opts.opponent_goals):m.tg;
  const opponent=isArchive?(opts.opponent||'Opponent'):(m.opp||'Opponent');
  const ourContrib=isArchive?v31ArchiveContributors(opts.match_id):v31LiveContributors(m);
  return `<article class="match matchCard31 ${isArchive?'archive':''}" ${isArchive?`data-am="${opts.match_id}"`:`data-m="${i}"`}>
    <div class="matchHead31">
      <div class="meta31"><span>${dateTxt}</span><span class="tag31">${escapeHtml(String(rel).replace(/^./,s=>s.toUpperCase()))}</span></div>
      <span class="status31 ${badgeClass}">${isArchive?opts.result:m.result}</span>
    </div>
    <div class="teams31">
      <div class="team31">
        <div class="clubLine31"><div class="crest31">${crestMine}</div><div class="clubText31"><b>${escapeHtml(S.club?.name||m.ours||'Our Club')}</b><small>${isArchive?'Clubroom archive':'EA live window'}</small></div></div>
      </div>
      <div class="scoreBox31"><div class="score31">${scoreLeft} <span style="opacity:.45">–</span> ${scoreRight}</div><small>Tap for details</small></div>
      <div class="team31 right">
        <div class="clubLine31"><div class="clubText31"><b>${escapeHtml(opponent)}</b><small>${isArchive?'archived opponent':'opponent'}</small></div><div class="crest31">${crestOpp}</div></div>
      </div>
    </div>
    <div class="contributors31">${ourContrib.length?ourContrib.map(x=>`<span><b>★</b>${typeof x==='string'?x:x.label}</span>`).join(''):'<span><b>★</b>No scorer / rating data available</span>'}</div>
    <div class="expandHint31">Open match details, team stats and player stats</div>
  </article>`
}
function v31RenderMatchesPanel(){
  const host=document.querySelector('#matchList'); if(!host) return;
  const live=S.matches||[]; const archive=S.history?.matches||[];
  const liveIds=new Set(live.map(m=>String(P(m.raw,['matchId','matchid','id'],''))));
  const archOnly=archive.filter(x=>!liveIds.has(String(x.match_id))).slice(0,200);
  host.innerHTML=`<section class="panel matchesPanel31"><div class="panelHead"><h3>Matches</h3><span>EA live + Clubroom archive</span></div>
    <div class="matchesToolbar31"><div class="matchesMeta31">Readable match cards with quick drill-down instead of one flat table.</div><div class="matchesFilters31"><button class="active" data-match-filter="all">All</button><button data-match-filter="live">Live</button><button data-match-filter="archive">Archive</button></div></div>
    <div data-match-section="live" class="archiveShell31"><div class="matchesSectionLabel31">EA live window · ${live.length} matches</div><div class="matchesGrid31">${live.length?live.map((m,i)=>v31MatchCardHtml(m,i)).join(''):'<div class="msg">No live matches available from EA.</div>'}</div></div>
    <div data-match-section="archive" class="archiveShell31"><div class="matchesSectionLabel31">Clubroom archive · ${archOnly.length} older matches</div><div class="matchesGrid31">${archOnly.length?archOnly.map((m)=>v31MatchCardHtml(null,null,{archive:true,...m})).join(''):'<div class="msg">No older archived matches yet.</div>'}</div></div>
  </section>`;
  document.querySelectorAll('[data-match-filter]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-match-filter]').forEach(x=>x.classList.toggle('active',x===btn)); const f=btn.dataset.matchFilter; document.querySelectorAll('[data-match-section]').forEach(sec=>sec.style.display=(f==='all'||sec.dataset.matchSection===f)?'block':'none');});
}
const __renderV31=render; render=function(id,d,searchClub=null){ __renderV31(id,d,searchClub); v31RenderMatchesPanel(); v31TranslateUI(); }
renderArchiveMatches=function(matches){ v31RenderMatchesPanel(); };
liveMatchDetail = function(i){
 const m=S.matches[i],ps=(m.players||[]).map(matchPlayer),r=m.oursRaw||{},o=m.oppRaw||{};
 const all=m.raw?flattenPlayers(m.raw.players||m.raw.playerStats||m.raw.members||[]).map(matchPlayer):[];
 const oppPs=all.filter(p=>!ps.some(x=>x.id&&x.id===p.id));
 const rows=[['Goals',m.og,m.tg],['Shots',teamVal(r,['shots','shotsTaken'],ps,'shots'),teamVal(o,['shots','shotsTaken'],oppPs,'shots')],['Passes',teamVal(r,['passes','passesMade'],ps,'passes'),teamVal(o,['passes','passesMade'],oppPs,'passes')],['Pass %',P(r,['passAccuracy','passPct','passPercentage'],ps.reduce((s,p)=>s+p.passAttempts,0)?pct(ps.reduce((s,p)=>s+p.passes,0)/ps.reduce((s,p)=>s+p.passAttempts,0)*100):'—'),P(o,['passAccuracy','passPct','passPercentage'],'—')],['Tackles',teamVal(r,['tackles','tacklesMade'],ps,'tackles'),teamVal(o,['tackles','tacklesMade'],oppPs,'tackles')],['Saves',teamVal(r,['saves'],ps,'saves'),teamVal(o,['saves'],oppPs,'saves')]];
 return `<div class="inlineMatchInner"><div class="inlineTabs"><b>Match stats</b><span>Player stats</span><span>Goals</span><span>Formations</span></div><div class="matchDetailGrid"><div><h4>Team stats</h4>${rows.map(([k,a,b])=>`<div class="teamStat"><strong>${a}</strong><span>${k}</span><strong>${b}</strong></div>`).join('')}</div><div><h4>Goal events</h4><div class="goalTimeline">${goalRowsForLive(m,ps)}</div><h4 style="margin-top:16px">Formations</h4><div class="formationLine"><span>${escapeHtml(m.ours)}</span><b>${P(r,['formation','formationId'],'—')}</b><span>${escapeHtml(m.opp)}</span><b>${P(o,['formation','formationId'],'—')}</b></div></div></div><h4>Player stats</h4>${ps.length?matchStatsTable(ps):'<div class="inlineEmpty">EA did not return player stats for this match.</div>'}</div>`
}
archiveDetail = function(matchId){
 const m=(S.history?.matches||[]).find(x=>String(x.match_id)===String(matchId)); if(!m) return '<div class="inlineEmpty">Archived match not found.</div>';
 const ps=(S.history?.playerMatches||[]).filter(x=>String(x.match_id)===String(matchId));
 const goals=ps.filter(x=>N(x.goals)>0).map(x=>`<div class="goalEvent"><span>⚽</span><b>${escapeHtml(x.player_name)}</b><em>${N(x.goals)>1?N(x.goals)+' goals':'1 goal'} · no minute stored</em></div>`).join('')||'<div class="inlineEmpty">No goal timeline stored for this archived match.</div>';
 return `<div class="inlineMatchInner"><div class="inlineTabs"><b>Archive match</b><span>Player stats</span><span>Goals</span></div><div class="matchDetailGrid"><div><h4>Match</h4><div class="teamStat"><strong>${N(m.goals)}</strong><span>Goals</span><strong>${N(m.opponent_goals)}</strong></div><div class="teamStat"><strong>${escapeHtml(S.club.name)}</strong><span>vs</span><strong>${escapeHtml(m.opponent||'Opponent')}</strong></div><div class="teamStat"><strong>${escapeHtml(String(m.result||'—'))}</strong><span>Result</span><strong>${m.played_at?new Date(m.played_at).toLocaleString('en-GB'):'—'}</strong></div></div><div><h4>Goals</h4><div class="goalTimeline">${goals}</div></div></div><h4>Player stats</h4>${ps.length?`<div class="table"><table><thead><tr><th>Player</th><th>Rating</th><th>G</th><th>A</th><th>2A</th><th>Shots</th><th>Passes</th><th>Pass%</th><th>Tackles</th><th>Int.</th></tr></thead><tbody>${ps.map(x=>`<tr><td>${escapeHtml(x.player_name)}</td><td>${N(x.rating)?N(x.rating).toFixed(1):'—'}</td><td>${N(x.goals)}</td><td>${N(x.assists)}</td><td>${N(x.second_assists)}</td><td>${N(x.shots)}</td><td>${N(x.passes_made)}</td><td>${N(x.pass_attempts)?(N(x.passes_made)/N(x.pass_attempts)*100).toFixed(0)+'%':'—'}</td><td>${N(x.tackles_made)}</td><td>${N(x.interceptions)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="inlineEmpty">No player stats stored for this archived match.</div>'}</div>`
}
v30RankingCard = function(def,compact=false){
 const top=def.ranked[0]; if(!top) return '<div class="msg">No data yet.</div>';
 if(compact)return `<article class="featuredRankCard rankArt-${def.id}" style="--tone:${def.tone}"><div class="frBody"><small>FUN RANKING</small><h4>${def.icon} ${def.title}</h4><p>${def.sub}</p></div><div class="frWinner"><i>${def.icon}</i><div><b>${funName(top.p)}</b><span>${escapeHtml(def.detail(top.p))}</span></div><strong>${Math.round(top.score)}</strong></div></article>`;
 return `<article class="rankingHero30" style="--rank:${def.tone}"><div class="rankingHeroHead"><span>${def.icon}</span><h3>${def.title}</h3><p>${def.sub}</p></div><div class="rankingWinner30"><i>${def.icon}</i><div><small>${def.tag}</small><b>${funName(top.p)}</b><span>${escapeHtml(def.detail(top.p))}</span></div><strong>${Math.round(top.score)}</strong></div><div class="rankingList30">${def.ranked.slice(1,6).map((x,i)=>`<div><em>${i+2}</em><b>${funName(x.p)}</b><span><i style="width:${Math.max(3,Math.min(100,x.score))}%"></i></span><strong>${Math.round(x.score)}</strong></div>`).join('')}</div><div class="rankingDisclaimer">Fun rating only — built from available Clubroom stats, not an objective judgement of a human being.</div></article>`
}
v30RenderDuos = function(a){
 const chem=(a?.chemistry||[]).slice().sort((x,y)=>v30DuoScore(y)-v30DuoScore(x));
 const html=chem.length?chem.map(x=>{const [label,tone]=v30DuoLabel(x),m=Math.max(1,N(x.matches)),wr=N(x.wins)/m*100,score=v30DuoScore(x);return `<article class="duoCard" style="--duo:${tone}"><div class="duoTop"><span class="duoLabel">${label}</span><div class="duoNames"><b>${escapeHtml(x.a_name)}</b><i>×</i><b>${escapeHtml(x.b_name)}</b></div></div><div class="duoStats"><div><b>${score}</b><span>Duo Score</span></div><div><b>${x.matches}</b><span>Matches</span></div><div><b>${wr.toFixed(0)}%</b><span>Win Rate</span></div><div><b>${x.contributions}</b><span>Combined G+A</span></div></div><div class="duoMeta"><strong>${escapeHtml(x.a_name)}</strong> · ${N(x.a_goals)}G + ${N(x.a_assists)}A &nbsp; | &nbsp; <strong>${escapeHtml(x.b_name)}</strong> · ${N(x.b_goals)}G + ${N(x.b_assists)}A</div></article>`}).join(''):'<div class="msg">Duo Cards need at least two shared archived matches.</div>';
 const all=$('#goalPartners');if(all)all.innerHTML=html; const feat=$('#featuredDuos');if(feat)feat.innerHTML=html;
}
function v31TranslateUI(){
 const p=document.querySelector('.analyticsHero p'); if(p) p.textContent='Form, match-by-match trends, player development and passing insights from the Clubroom archive.';
 document.querySelectorAll('.funSectionHeader small').forEach(el=>{ if(el.textContent.includes('výpočty')) el.textContent='calculated from the Clubroom archive'; if(el.textContent.includes('společné')) el.textContent='shared matches in the archive'; });
 const searchFound=document.querySelector('.searchFound'); if(searchFound){ searchFound.textContent=searchFound.textContent.replace('Nalezeno','Found').replace('pro','for').replace('klubů','clubs').replace('klub','club'); }
 const db=document.querySelector('#dbState'); if(db){ if(db.textContent==='DATABASE ON') db.textContent='DATABASE ON'; if(db.textContent==='LIVE ONLY') db.textContent='LIVE ONLY'; }
}

/* v33 — English Fun copy and tighter, data-first cards */
v30Rankings = function(h){
 const ps=v27UniquePlayers((h?.players?.length?h.players:S.players)||[]), rec=v30PlayerRecords(h);
 const key=p=>String(p.player_id||p.id||p.player_name||p.name||'').toLowerCase();
 const record=p=>rec.get(key(p))||{matches:N(p.matches||p.games),wins:0,draws:0,losses:0};
 const games=p=>Math.max(1,N(record(p).matches||p.matches||p.games));
 const ga=p=>N(p.goals)+N(p.assists), rate=p=>N(p.rating), motm=p=>N(p.motm);
 const wr=p=>{const r=record(p);return r.matches?N(r.wins)/N(r.matches)*100:0};
 const defs=[
  {id:'ghost',title:'Ghost Rankings',sub:'Who disappears when the output dries up?',icon:'◌',tag:'BIGGEST GHOST',tone:'#4f7fb3',score:p=>Math.max(0,Math.min(100,100-((ga(p)/games(p))*38+motm(p)/games(p)*120+Math.max(0,rate(p)-7)*10))),detail:p=>`${games(p)} matches · ${(ga(p)/games(p)).toFixed(2)} G+A / match`},
  {id:'lmerchant',title:'L Merchant Index',sub:'Who has collected the most losses?',icon:'↘',tag:'TOP L MERCHANT',tone:'#ad5b64',score:p=>{const r=record(p);return r.matches?N(r.losses)/N(r.matches)*100:Math.max(0,100-wr(p))},detail:p=>{const r=record(p);return `${r.matches||games(p)} matches · ${r.losses||0} losses`}},
  {id:'selfglazer',title:'Self-Glazer Rankings',sub:'High rating, lighter end product. A deliberately unserious index.',icon:'✦',tag:'CHIEF GLAZER',tone:'#a98a3d',score:p=>Math.max(0,Math.min(100,rate(p)*12-(ga(p)/games(p))*12)),detail:p=>`${rate(p).toFixed(1)} avg · ${(ga(p)/games(p)).toFixed(2)} G+A / match`},
  {id:'maincharacter',title:'Main Character',sub:'Who owns the spotlight most often?',icon:'♛',tag:'MAIN CHARACTER',tone:'#6176a8',score:p=>Math.min(100,motm(p)*14+(ga(p)/games(p))*20+rate(p)*3),detail:p=>`${motm(p)} MOTM · ${ga(p)} G+A`}
 ];
 return defs.map(d=>({...d,ranked:ps.map(p=>({p,score:d.score(p)})).sort((a,b)=>b.score-a.score)}));
}
function v33EnglishPass(){
 const map=[
  ['DIVIZE','DIVISION'],['Výsledky','Results'],['Výhry','Wins'],['Remízy','Draws'],['Prohry','Losses'],['Góly','Goals'],['Vstřelené','Scored'],['Obdržené','Conceded'],['Góly / zápas','Goals / Match'],['Obdržené / zápas','Conceded / Match'],['Postup','Progress'],['hráčů','players'],['Soupeř','Opponent'],['zápasů','matches'],['Bez zápasů.','No matches yet.'],['Bez dat.','No data yet.'],['Zatím není dost dat.','Not enough data yet.']
 ];
 document.querySelectorAll('body *').forEach(el=>{
  if(el.children.length===0 && el.textContent){let t=el.textContent;for(const [a,b] of map)t=t.split(a).join(b);el.textContent=t}
 });
}
const __v33fun=v30RenderFun; v30RenderFun=function(h,a){__v33fun(h,a);v33EnglishPass()};
const __v33hist=loadHistory; loadHistory=async function(id){const r=await __v33hist(id);setTimeout(()=>{v31RenderMatchesPanel();v33EnglishPass()},0);return r};


/* v35: rebuild Matches as a clean single-column list. */
function v35ClubCrestHtml(){
  const info=S.raw?.info&&(S.raw.info[S.club?.id]||A(S.raw.info)[0]);
  const crestId=P(info?.customKit,['crestAssetId'],P(info,['crestAssetId'],null));
  return crestId?`<img src="${crestUrl(crestId)}" alt="">`:v31CrestByName(S.club?.name||'CL');
}
function v35OppCrestHtml(m,name){
  const raw=m?.oppRaw||{};
  const crestId=P(raw?.details?.customKit,['crestAssetId'],P(raw?.customKit,['crestAssetId'],P(raw,['crestAssetId'],null)));
  return crestId?`<img src="${crestUrl(crestId)}" alt="">`:v31CrestByName(name||'OP');
}
function v35ScorersLive(m){
  const ps=(m.players||[]).map(matchPlayer).filter(p=>N(p.goals)>0||N(p.assists)>0);
  if(!ps.length)return '<span class="matchNote35">No scorer data</span>';
  return ps.slice(0,4).map(p=>`<span class="matchChip35">${escapeHtml(p.name)}${N(p.goals)?` · ${N(p.goals)}G`:''}${N(p.assists)?` · ${N(p.assists)}A`:''}</span>`).join('');
}
function v35ScorersArchive(matchId){
  const ps=(S.history?.playerMatches||[]).filter(x=>String(x.match_id)===String(matchId)).filter(x=>N(x.goals)>0||N(x.assists)>0);
  if(!ps.length)return '<span class="matchNote35">No scorer data</span>';
  return ps.slice(0,4).map(p=>`<span class="matchChip35">${escapeHtml(p.player_name)}${N(p.goals)?` · ${N(p.goals)}G`:''}${N(p.assists)?` · ${N(p.assists)}A`:''}</span>`).join('');
}
function v35MatchRow(m,i,archive){
  const isA=!!archive;
  const date=isA?(archive.played_at?new Date(archive.played_at):null):m.date;
  const dateText=date?date.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}):'—';
  const type=isA?(archive.match_type||'Match'):(m.type||'Match');
  const result=isA?archive.result:m.result;
  const ourGoals=isA?N(archive.goals):m.og, oppGoals=isA?N(archive.opponent_goals):m.tg;
  const opp=isA?(archive.opponent||'Opponent'):(m.opp||'Opponent');
  const scorers=isA?v35ScorersArchive(archive.match_id):v35ScorersLive(m);
  return `<article class="match matchRow35 ${isA?'archive':''}" ${isA?`data-am="${archive.match_id}"`:`data-m="${i}"`}>
    <div class="matchMeta35"><span>${dateText}</span><b>${escapeHtml(String(type).replace(/^./,s=>s.toUpperCase()))}</b></div>
    <div class="matchTeam35 ours"><div class="matchCrest35">${v35ClubCrestHtml()}</div><div><strong>${escapeHtml(S.club?.name||'Our club')}</strong><small>Clubroom</small></div></div>
    <div class="matchScore35"><strong>${ourGoals}</strong><span>–</span><strong>${oppGoals}</strong></div>
    <div class="matchTeam35 opp"><div><strong>${escapeHtml(opp)}</strong><small>Opponent</small></div><div class="matchCrest35">${isA?v31CrestByName(opp):v35OppCrestHtml(m,opp)}</div></div>
    <div class="matchResult35 ${String(result||'D').toLowerCase()}">${result}</div>
    <div class="matchSummary35">${scorers}</div>
    <div class="matchExpand35">Details <span>⌄</span></div>
  </article>`;
}
v31RenderMatchesPanel = function(){
  const host=document.querySelector('#matchList');if(!host)return;
  const live=S.matches||[];
  const archive=S.history?.matches||[];
  const liveIds=new Set(live.map(m=>String(P(m.raw,['matchId','matchid','id'],''))));
  const older=archive.filter(x=>!liveIds.has(String(x.match_id))).slice(0,200);
  host.innerHTML=`<section class="matchesPage35">
    <div class="matchesHeader35"><div><span class="kicker">MATCH CENTRE</span><h3>Matches</h3><p>Live EA matches and your growing Clubroom archive.</p></div><div class="matchesFilters35"><button class="active" data-match-filter="all">All <b>${live.length+older.length}</b></button><button data-match-filter="live">Live <b>${live.length}</b></button><button data-match-filter="archive">Archive <b>${older.length}</b></button></div></div>
    <div class="matchesBlock35" data-match-section="live"><div class="matchesLabel35">EA live window</div><div class="matchesList35">${live.length?live.map((m,i)=>v35MatchRow(m,i,null)).join(''):'<div class="msg">No live matches available from EA.</div>'}</div></div>
    <div class="matchesBlock35" data-match-section="archive"><div class="matchesLabel35">Clubroom archive</div><div class="matchesList35">${older.length?older.map(m=>v35MatchRow(null,null,m)).join(''):'<div class="msg">No older archived matches yet.</div>'}</div></div>
  </section>`;
  document.querySelectorAll('[data-match-filter]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-match-filter]').forEach(x=>x.classList.toggle('active',x===btn));const f=btn.dataset.matchFilter;document.querySelectorAll('[data-match-section]').forEach(sec=>sec.hidden=!(f==='all'||sec.dataset.matchSection===f));});
}


/* v36: delegated match card opening after v35 dynamically replaces the list. */
document.addEventListener('click',e=>{
  const live=e.target.closest('.matchRow35[data-m]');
  if(!live)return;
  e.preventDefault();
  showMatch(Number(live.dataset.m));
});


/* v37 Analytics navigation + interactive views */
function v37OpenAnalytics(tab){
 document.querySelectorAll('[data-analytics-tab]').forEach(b=>b.classList.toggle('active',b.dataset.analyticsTab===tab));
 document.querySelectorAll('[data-analytics-pane]').forEach(p=>p.classList.toggle('active',p.dataset.analyticsPane===tab));
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-analytics-tab]');if(b)v37OpenAnalytics(b.dataset.analyticsTab)});

function v37PlayerName(x){return escapeHtml(x?.player_name||x?.pro_name||x?.name||'Unknown')}
function v37PlayerKey(x){return String(x?.player_id||x?.id||x?.player_name||x?.name||'').toLowerCase()}
function v37FmtDate(v){return v?new Date(v).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}):'—'}
function v37MetricValue(row,mode){
 if(mode==='rating') return N(row.rating)||null;
 if(mode==='tackles') return N(row.tackles_made);
 if(mode==='passing') return N(row.pass_attempts)?N(row.passes_made)/N(row.pass_attempts)*100:null;
 if(mode==='contrib') return N(row.goals)+N(row.assists);
 return null;
}
function v37MetricMeta(mode){
 return {rating:['Match Rating','rating',v=>v.toFixed(1)],tackles:['Tackles Made','tackles',v=>String(Math.round(v))],passing:['Pass Accuracy','%',v=>v.toFixed(0)+'%'],contrib:['Goal Contributions','G+A',v=>String(Math.round(v))]}[mode];
}
function v37RenderMatchByMatch(h){
 const host=$('#analyticsMatchByMatch'); if(!host)return;
 const pm=(h?.playerMatches||[]).slice();
 const players=[...new Map(pm.filter(x=>x.player_name).map(x=>[v37PlayerKey(x),{id:v37PlayerKey(x),name:x.player_name}])).values()];
 if(!players.length){host.innerHTML='<div class="msg">Match-by-match needs archived player match stats.</div>';return}
 const state={mode:'rating',window:20,selectedPlayers:[players[0].id]};
 const primary=()=>state.selectedPlayers[0]||players[0].id;
 const rowsFor=(playerId)=>pm.filter(x=>v37PlayerKey(x)===playerId)
   .map(row=>({row,meta:v39MatchMeta(h,row)}))
   .sort((a,b)=>new Date(a.meta?.played_at||a.row?.played_at||0)-new Date(b.meta?.played_at||b.row?.played_at||0))
   .slice(-state.window);
 const palette=['var(--cyan)','var(--gold)','var(--blue)'];
 const resultClass=(entry)=>{const r=String(entry?.meta?.result||entry?.row?.result||'').toUpperCase();return r==='W'?'w':r==='L'?'l':r==='D'?'d':'u'};
 const scoreText=(entry)=>{const m=entry?.meta||{},r=entry?.row||{};const gf=m.goals??r.goals_for??r.team_goals,ga=m.opponent_goals??r.goals_against??r.opponent_goals;return Number.isFinite(Number(gf))&&Number.isFinite(Number(ga))?`${Number(gf)}–${Number(ga)}`:'—'};
 const dateLong=(v)=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})};
 const draw=()=>{
   const meta=v37MetricMeta(state.mode), primaryId=primary(), primaryEntries=rowsFor(primaryId), primaryRows=primaryEntries.map(x=>x.row);
   if(primaryRows.length<2){
     $('#analyticsMatchGraph37').innerHTML='<div class="mbmEmpty58"><b>Not enough match data</b><span>At least two captured matches are needed for this trend.</span></div>';
     return;
   }
   const series=state.selectedPlayers.slice(0,3).map((id,index)=>{
     const entries=rowsFor(id), vals=entries.map(x=>v37MetricValue(x.row,state.mode));
     const valid=vals.filter(v=>v!=null&&Number.isFinite(v));
     return {id,index,name:players.find(p=>p.id===id)?.name||'Player',entries,vals,valid};
   });
   const allValid=series.flatMap(s=>s.valid);
   let min=0,max=10;
   if(state.mode==='rating'){min=5;max=10}
   else if(state.mode==='passing'){min=0;max=100}
   else {max=Math.max(1,...allValid);min=0}
   const W=1000,H=360,padL=62,padR=74,padT=34,padB=92,plotBottom=H-padB;
   const maxPoints=Math.max(2,...series.map(s=>s.vals.length));
   const x=(i,n)=>padL+i*((W-padL-padR)/Math.max(1,n-1));
   const y=v=>padT+(max-v)/Math.max(.0001,max-min)*(plotBottom-padT);
   const fmt=v=>v==null||!Number.isFinite(v)?'--':meta[2](v);
   const ticks=[0,.25,.5,.75,1].map(q=>max-(max-min)*q);
   const primarySeries=series[0], primaryValid=primarySeries.valid;
   const avg=primaryValid.length?primaryValid.reduce((a,b)=>a+b,0)/primaryValid.length:null;
   let bestIdx=-1,worstIdx=-1;
   primarySeries.vals.forEach((v,i)=>{if(v==null||!Number.isFinite(v))return;if(bestIdx<0||v>primarySeries.vals[bestIdx])bestIdx=i;if(worstIdx<0||v<primarySeries.vals[worstIdx])worstIdx=i});
   const renderSegments=(s)=>{
     const pts=s.vals.map((v,i)=>v==null||!Number.isFinite(v)?null:[x(i,s.vals.length),y(v)]),segments=[];let seg=[];
     pts.forEach(p=>{if(!p){if(seg.length)segments.push(seg),seg=[]}else seg.push(p)});if(seg.length)segments.push(seg);
     return {pts,segments};
   };
   const built=series.map(s=>({...s,...renderSegments(s)}));
   const primaryBuilt=built[0];
   const area=primaryBuilt.segments.length===1&&primaryBuilt.segments[0].length>1?`${primaryBuilt.segments[0].map(p=>p.join(',')).join(' ')} ${primaryBuilt.segments[0][primaryBuilt.segments[0].length-1][0]},${plotBottom} ${primaryBuilt.segments[0][0][0]},${plotBottom}`:'';
   const lines=built.map((s,si)=>{
     if(!s.valid.length)return `<line class="mbmMissingLine58" x1="${padL}" y1="${(padT+plotBottom)/2}" x2="${W-padR}" y2="${(padT+plotBottom)/2}"/><text class="mbmMissingText58" x="${W-padR}" y="${(padT+plotBottom)/2-7}" text-anchor="end">${escapeHtml(s.name)} · --</text>`;
     return s.segments.map(seg=>`<polyline class="mbmSeries58 mbmSeries${si}58 ${si===0?'primary':''}" style="--series:${palette[si]}" points="${seg.map(p=>p.join(',')).join(' ')}"/>`).join('');
   }).join('');
   const points=built.map((s,si)=>s.pts.map((p,i)=>{
     if(!p)return'';
     const e=s.entries[i],matchId=String(e?.row?.match_id||e?.meta?.match_id||'');
     const cls=si===0?(i===bestIdx?' best':i===worstIdx?' worst':''):'';
     return `<circle class="mbmNeutralPoint58${cls}" style="--series:${palette[si]}" cx="${p[0]}" cy="${p[1]}" r="${si===0?4.5:3.5}" tabindex="0" data-chart-point37="1" data-match37="${escapeHtml(matchId)}" data-player37-name="${escapeHtml(s.name)}" data-opponent37="${escapeHtml(v39Opponent(e?.meta,e?.row))}" data-score37="${escapeHtml(scoreText(e))}" data-date37="${escapeHtml(dateLong(e?.meta?.played_at||e?.row?.played_at))}" data-value37="${escapeHtml(fmt(s.vals[i]))}"></circle>`;
   }).join('')).join('');
   const badges=[['BEST',bestIdx,'best'],['WORST',worstIdx,'worst']].map(([label,idx,cls])=>{
     if(idx<0||(label==='WORST'&&worstIdx===bestIdx))return'';const p=primaryBuilt.pts[idx];if(!p)return'';
     const yy=Math.max(15,p[1]-21);return `<g class="mbmBadge58 ${cls}"><rect x="${p[0]-26}" y="${yy-12}" width="52" height="20" rx="10"/><text x="${p[0]}" y="${yy+2}" text-anchor="middle">${label}</text></g>`;
   }).join('');
   const avgY=avg==null?null:y(avg);
   const avgLine=avgY==null?'':`<line class="mbmAvgLine58" x1="${padL}" y1="${avgY}" x2="${W-padR}" y2="${avgY}"/><g class="mbmAvgLabel58"><rect x="${W-padR+8}" y="${avgY-12}" width="58" height="24" rx="12"/><text x="${W-padR+37}" y="${avgY+4}" text-anchor="middle">${fmt(avg)}</text></g>`;
   const resultStrip=primaryEntries.map((e,i)=>`<span class="${resultClass(e)}" title="${escapeHtml(v39Opponent(e.meta,e.row))} · ${escapeHtml(scoreText(e))}"></span>`).join('');
   const legend=built.map((s,i)=>`<span style="--series:${palette[i]}"><i></i>${escapeHtml(s.name)}${i===0?' · PRIMARY':''}</span>`).join('');
   const summaryAverage=avg;
   const summaryBest=bestIdx>=0?primarySeries.vals[bestIdx]:null;
   const summaryWorst=worstIdx>=0?primarySeries.vals[worstIdx]:null;
   const validChronological=primarySeries.vals.filter(v=>v!=null&&Number.isFinite(v));
   const trend=validChronological.length>=10?(()=>{const recent=validChronological.slice(-5),prev=validChronological.slice(-10,-5),a=recent.reduce((s,v)=>s+v,0)/5,b=prev.reduce((s,v)=>s+v,0)/5;return a-b})():null;
   const trendClass=trend==null?'neutral':trend>0?'up':trend<0?'down':'neutral';
   const trendText=trend==null?'--':`${trend>0?'↑ ':trend<0?'↓ ':''}${Math.abs(trend).toFixed(state.mode==='rating'?2:state.mode==='passing'?1:2)}${state.mode==='passing'?' pp':''}`;
   const sparklineFor=(id)=>{
     const vals=rowsFor(id).map(e=>v37MetricValue(e.row,state.mode));
     const valid=vals.filter(v=>v!=null&&Number.isFinite(v));
     if(valid.length<2)return '<span class="mbmSparkMissing59">--</span>';
     const sw=120,sh=34,pad=3,localMin=Math.min(...valid),localMax=Math.max(...valid),range=Math.max(.0001,localMax-localMin);
     const coords=valid.map((v,i)=>[pad+i*((sw-pad*2)/Math.max(1,valid.length-1)),sh-pad-((v-localMin)/range)*(sh-pad*2)]);
     return `<svg class="mbmSpark59" viewBox="0 0 ${sw} ${sh}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${coords.map(p=>p.join(',')).join(' ')}"/></svg>`;
   };
   const miniCards=players.slice(0,12).map(p=>{
     const vals=rowsFor(p.id).map(e=>v37MetricValue(e.row,state.mode));const valid=vals.filter(v=>v!=null&&Number.isFinite(v));const pav=valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:null;
     const selected=state.selectedPlayers.includes(p.id),si=selected?state.selectedPlayers.indexOf(p.id):-1;
     return `<button class="mbmMiniPlayer59${selected?' active':''}" data-mini-player37="${escapeHtml(p.id)}" style="--mini-series:${selected?(palette[si]||'var(--cyan)'):'transparent'}" aria-pressed="${selected?'true':'false'}"><span class="mbmMiniTop59"><span><i class="mbmMiniAvatar59">${escapeHtml(initials37(p.name))}</i><b>${escapeHtml(p.name)}</b></span><strong>${pav==null?'--':fmt(pav)}</strong></span>${sparklineFor(p.id)}</button>`;
   }).join('');
   $('#analyticsMatchGraph37').innerHTML=`<div class="mbmChartShell58"><div class="mbmChartMeta58"><div><span class="mbmLabel37">MATCH-BY-MATCH</span><h4>${escapeHtml(meta[0])}</h4></div><div class="mbmSeriesLegend58">${legend}</div></div><div class="mbmPlot37 mbmPlot58"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escapeHtml(meta[0])} player trends"><defs><linearGradient id="mbmPrimaryArea58" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2DD4BF" stop-opacity=".20"/><stop offset="100%" stop-color="#2DD4BF" stop-opacity="0"/></linearGradient></defs>${ticks.map((t,i)=>{const yy=padT+i*((plotBottom-padT)/(ticks.length-1));return `<line class="mbmGrid58" x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}"/><text class="mbmAxis58" x="${padL-12}" y="${yy+4}" text-anchor="end">${fmt(t)}</text>`}).join('')}<line class="mbmAxisLine58" x1="${padL}" y1="${plotBottom}" x2="${W-padR}" y2="${plotBottom}"/>${area?`<polygon class="mbmPrimaryArea58" points="${area}"/>`:''}${avgLine}${lines}${points}${badges}${primaryRows.map((r,i)=>`<text class="mbmXAxis58" x="${x(i,primaryRows.length)}" y="${plotBottom+24}" text-anchor="middle">${i+1}</text>`).join('')}</svg><div class="mbmTooltip58" hidden></div></div><div class="mbmResultRow58"><span class="mbmLabel37">RESULTS</span><div class="mbmResultStrip58" style="--result-count:${primaryEntries.length}">${resultStrip}</div><div class="mbmResultLegend58"><span><i class="w"></i>W</span><span><i class="d"></i>D</span><span><i class="l"></i>L</span></div></div><div class="mbmSummaryGrid59"><article><span>AVERAGE</span><strong>${summaryAverage==null?'--':fmt(summaryAverage)}</strong></article><article><span>BEST</span><strong>${summaryBest==null?'--':fmt(summaryBest)}</strong></article><article><span>WORST</span><strong>${summaryWorst==null?'--':fmt(summaryWorst)}</strong></article><article class="trend ${trendClass}"><span>TREND</span><strong>${trendText}</strong><small>LAST 5 VS PREV 5</small></article></div><div class="mbmMiniSection59"><div class="mbmMiniHeader59"><span class="mbmLabel37">PLAYER TRENDS</span><small>Click to add or remove · max 3</small></div><div class="mbmMiniGrid59">${miniCards}</div></div></div>`;
   host.querySelectorAll('[data-metric37]').forEach(b=>b.classList.toggle('active',b.dataset.metric37===state.mode));
   host.querySelectorAll('[data-window37]').forEach(b=>b.classList.toggle('active',Number(b.dataset.window37)===state.window));
   host.querySelectorAll('[data-player37]').forEach((b,i)=>{const selected=state.selectedPlayers.includes(b.dataset.player37);b.classList.toggle('active',selected);b.style.setProperty('--player-line',selected?palette[state.selectedPlayers.indexOf(b.dataset.player37)]||'var(--cyan)':'transparent')});
 };
 const mbmIcon37=(kind)=>({rating:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z"/></svg>`,tackles:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19l4.2-4.2M7 4l5.5 5.5M12.5 9.5l4-4M10 12l4 4M14 16l5-5"/></svg>`,passing:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 11l7-4M8.5 13l7 4"/></svg>`,contrib:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><path d="M12 5l2.1 3.2 3.9.8-2.7 2.8.5 4-3.8-1.7-3.8 1.7.5-4L6 9l3.9-.8L12 5z"/></svg>`})[kind]||'';
 const initials37=name=>String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
 host.innerHTML=`<div class="mbmToolbar37 mbmToolbarClubroom37"><div class="mbmTopRow37"><div><span class="mbmLabel37">METRIC</span><div class="metricSwitch37 metricSwitchClubroom37"><button class="active" data-metric37="rating">${mbmIcon37('rating')}<span>Match Rating</span></button><button data-metric37="tackles">${mbmIcon37('tackles')}<span>Tackles</span></button><button data-metric37="passing">${mbmIcon37('passing')}<span>Pass Accuracy</span></button><button data-metric37="contrib">${mbmIcon37('contrib')}<span>Goal Contributions</span></button></div></div><div><span class="mbmLabel37">WINDOW</span><div class="mbmWindowFix37" aria-label="Match window"><button data-window37="5">5</button><button data-window37="10">10</button><button class="active" data-window37="20">20</button></div></div></div><div class="mbmPlayersBlock37"><span class="mbmLabel37">PLAYERS · UP TO 3</span><div class="playerSwitch37 playerChips37">${players.slice(0,12).map((p,i)=>`<button class="${i?'':'active'}" data-player37="${escapeHtml(p.id)}" aria-pressed="${i?'false':'true'}"><span class="mbmAvatar37">${escapeHtml(initials37(p.name))}</span><span>${escapeHtml(p.name)}</span></button>`).join('')}</div></div></div><div id="analyticsMatchGraph37"></div>`;
 const hideTooltip=()=>{const t=host.querySelector('.mbmTooltip58');if(t)t.hidden=true};
 const showTooltip=(point,ev)=>{const t=host.querySelector('.mbmTooltip58');const plot=host.querySelector('.mbmPlot58');if(!t||!plot)return;const r=plot.getBoundingClientRect(),pr=point.getBoundingClientRect();t.innerHTML=`<b>${escapeHtml(point.dataset.player37Name||'Player')}</b><span>${escapeHtml(point.dataset.opponent37||'Opponent')} · ${escapeHtml(point.dataset.score37||'—')}</span><span>${escapeHtml(point.dataset.date37||'—')} · <strong>${escapeHtml(point.dataset.value37||'--')}</strong></span>`;const cx=(ev?.clientX??(pr.left+pr.width/2))-r.left,cy=(ev?.clientY??pr.top)-r.top;t.style.left=`${Math.max(8,Math.min(r.width-190,cx+12))}px`;t.style.top=`${Math.max(8,cy-72)}px`;t.hidden=false};
 const openMatchFromPoint=(point)=>{const id=point?.dataset?.match37;if(!id)return;openTab('matches');requestAnimationFrame(()=>{let row=[...document.querySelectorAll('.match.archive[data-am]')].find(x=>String(x.dataset.am)===String(id));if(!row){const idx=(S.matches||[]).findIndex(m=>String(P(m.raw,['matchId','matchid','id'],'')||m.matchId||'')===String(id));if(idx>=0)row=document.querySelector(`.match[data-m="${idx}"]`)}if(row){row.scrollIntoView({behavior:'smooth',block:'center'});if(!row.classList.contains('open'))row.click()}})};
 host.onclick=e=>{
   const point=e.target.closest('[data-chart-point37]');if(point){openMatchFromPoint(point);return}
   const metric=e.target.closest('[data-metric37]');if(metric){state.mode=metric.dataset.metric37;draw();return}
   const win=e.target.closest('[data-window37]');if(win){state.window=Number(win.dataset.window37)||20;draw();return}
   const mini=e.target.closest('[data-mini-player37]');if(mini){const id=mini.dataset.miniPlayer37,has=state.selectedPlayers.includes(id);if(has){if(state.selectedPlayers.length>1)state.selectedPlayers=state.selectedPlayers.filter(x=>x!==id)}else if(state.selectedPlayers.length<3)state.selectedPlayers=[...state.selectedPlayers,id];else state.selectedPlayers=[...state.selectedPlayers.slice(0,2),id];host.querySelectorAll('[data-player37]').forEach(b=>b.setAttribute('aria-pressed',state.selectedPlayers.includes(b.dataset.player37)?'true':'false'));draw();return}
   const player=e.target.closest('[data-player37]');if(player){const id=player.dataset.player37,has=state.selectedPlayers.includes(id);if(has){if(state.selectedPlayers.length>1)state.selectedPlayers=state.selectedPlayers.filter(x=>x!==id)}else if(state.selectedPlayers.length<3)state.selectedPlayers=[...state.selectedPlayers,id];else state.selectedPlayers=[...state.selectedPlayers.slice(0,2),id];host.querySelectorAll('[data-player37]').forEach(b=>b.setAttribute('aria-pressed',state.selectedPlayers.includes(b.dataset.player37)?'true':'false'));draw()}
 };
 host.onpointerover=e=>{const p=e.target.closest('[data-chart-point37]');if(p)showTooltip(p,e)};
 host.onpointermove=e=>{const p=e.target.closest('[data-chart-point37]');if(p)showTooltip(p,e)};
 host.onpointerout=e=>{if(e.target.closest('[data-chart-point37]'))hideTooltip()};
 host.onfocusin=e=>{const p=e.target.closest('[data-chart-point37]');if(p)showTooltip(p)};
 host.onfocusout=e=>{if(e.target.closest('[data-chart-point37]'))hideTooltip()};
 draw();
}

function v37RenderForm(h){
 const host=$('#analyticsForm');if(!host)return;const ms=(h?.matches||[]).slice(0,20).reverse();
 if(!ms.length){host.innerHTML='<div class="msg">No archived matches yet.</div>';return}
 const pts=ms.map(x=>x.result==='W'?3:x.result==='D'?1:0), gf=ms.map(x=>N(x.goals)),ga=ms.map(x=>N(x.opponent_goals));
 const W=1000,H=230,pad=28,max=Math.max(4,...gf,...ga);
 const line=arr=>arr.map((v,i)=>`${pad+i*((W-pad*2)/Math.max(1,arr.length-1))},${H-pad-(v/max)*(H-pad*2)}`).join(' ');
 const w=ms.filter(x=>x.result==='W').length,d=ms.filter(x=>x.result==='D').length,l=ms.length-w-d;
 host.innerHTML=`<div class="formSummary37"><div><small>LAST ${ms.length}</small><strong>${w}W · ${d}D · ${l}L</strong></div><div><small>GOALS</small><strong>${gf.reduce((a,b)=>a+b,0)} : ${ga.reduce((a,b)=>a+b,0)}</strong></div><div><small>POINTS / MATCH</small><strong>${(pts.reduce((a,b)=>a+b,0)/ms.length).toFixed(2)}</strong></div></div><div class="formResultStrip37">${ms.map(x=>`<span class="${String(x.result).toLowerCase()}" title="${escapeHtml(x.opponent||'Opponent')}">${x.result}</span>`).join('')}</div><div class="formGraph37"><div class="formLegend37"><span>Goals scored</span><span>Goals conceded</span></div><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline class="gf" points="${line(gf)}"/><polyline class="ga" points="${line(ga)}"/></svg></div>`;
}
function v37RenderPartnerships(a){
 const host=$('#analyticsPartnerships');if(!host)return;const chem=(a?.chemistry||[]).slice().sort((x,y)=>N(y.contributions)-N(x.contributions));
 host.innerHTML=chem.length?`<div class="partnerList37">${chem.slice(0,10).map((x,i)=>{const m=Math.max(1,N(x.matches)),wr=N(x.wins)/m*100,cpm=N(x.contributions)/m;return `<article><em>#${i+1}</em><div class="partnerNames37"><b>${escapeHtml(x.a_name)}</b><span>+</span><b>${escapeHtml(x.b_name)}</b></div><div class="partnerNums37"><span><b>${x.matches}</b>matches</span><span><b>${wr.toFixed(0)}%</b>win rate</span><span><b>${N(x.contributions)}</b>combined G+A</span><span><b>${cpm.toFixed(2)}</b>G+A / match</span></div></article>`}).join('')}</div><p class="analyticsNote37">This measures shared output while both players appeared. It does not claim that one directly assisted the other unless EA provides that event link.</p>`:'<div class="msg">Partnerships need shared archived matches.</div>';
}
function v37RenderClutch(h){
 const host=$('#analyticsClutch');if(!host)return;const pm=h?.playerMatches||[], mm=new Map((h?.matches||[]).map(m=>[String(m.match_id),m]));
 const agg=new Map(); for(const x of pm){const m=mm.get(String(x.match_id));if(!m)continue;const close=Math.abs(N(m.goals)-N(m.opponent_goals))<=1, win=m.result==='W';if(!close)continue;const k=v37PlayerKey(x),o=agg.get(k)||{name:x.player_name,matches:0,wins:0,ga:0,r:0,motm:0};o.matches++;o.wins+=win?1:0;o.ga+=N(x.goals)+N(x.assists);o.r+=N(x.rating);o.motm+=N(x.motm);agg.set(k,o)}
 const rows=[...agg.values()].map(x=>({...x,avg:x.matches?x.r/x.matches:0,score:(x.wins*5)+(x.ga*4)+(x.motm*6)+(x.avg*2)})).sort((a,b)=>b.score-a.score);
 host.innerHTML=rows.length?`<div class="impactGrid37">${rows.slice(0,6).map((x,i)=>`<article><small>#${i+1} · CLOSE MATCHES</small><h4>${escapeHtml(x.name)}</h4><strong>${Math.round(x.score)}</strong><div><span>${x.matches} matches</span><span>${x.wins} wins</span><span>${x.ga} G+A</span><span>${x.avg.toFixed(1)} avg</span></div></article>`).join('')}</div><p class="analyticsNote37">Clutch Index uses only archived matches decided by one goal or fewer: wins, G+A, MOTM and average rating.</p>`:'<div class="msg">Not enough close-match data yet.</div>';
}
function v37RenderCarry(h){
 const host=$('#analyticsCarry');if(!host)return;const pm=h?.playerMatches||[], matches=h?.matches||[],teamGoals=matches.reduce((s,m)=>s+N(m.goals),0);const agg=new Map();for(const x of pm){const k=v37PlayerKey(x),o=agg.get(k)||{name:x.player_name,matches:0,goals:0,assists:0,r:0};o.matches++;o.goals+=N(x.goals);o.assists+=N(x.assists);o.r+=N(x.rating);agg.set(k,o)}
 const rows=[...agg.values()].map(x=>{const ga=x.goals+x.assists,share=teamGoals?ga/teamGoals*100:0,avg=x.matches?x.r/x.matches:0,score=share*.7+avg*3;return {...x,ga,share,avg,score}}).sort((a,b)=>b.score-a.score);
 host.innerHTML=rows.length?`<div class="carryList37">${rows.slice(0,8).map((x,i)=>`<article><em>${i+1}</em><div><b>${escapeHtml(x.name)}</b><small>${x.goals}G + ${x.assists}A · ${x.avg.toFixed(1)} avg</small></div><div class="carryBar37"><span style="width:${Math.min(100,x.share)}%"></span></div><strong>${x.share.toFixed(1)}%</strong></article>`).join('')}</div><p class="analyticsNote37">Output Share = player G+A divided by the club's archived goals. It is a dependency indicator, not a literal share of goals created.</p>`:'<div class="msg">Carry Stats need archived player match data.</div>';
}
function v37RenderAnalytics(h,a){
 const sess=document.querySelector('#sessionsPanel');if(sess)sess.remove();
 v37RenderForm(h);v37RenderMatchByMatch(h);v37RenderPartnerships(a);v37RenderClutch(h);v37RenderCarry(h);
}
const __renderAnalyticsV37=renderAnalytics;renderAnalytics=function(h,a){__renderAnalyticsV37(h,a);const sess=document.querySelector('#sessionsPanel');if(sess)sess.remove();v37RenderAnalytics(h,a)};


/* v38: robust analytics navigation + redesigned cards */
(function(){
 const nav=document.getElementById('analyticsSubnav');
 if(nav){
   nav.addEventListener('click',function(e){
     const b=e.target.closest('[data-analytics-tab]'); if(!b)return;
     e.preventDefault(); e.stopPropagation();
     const tab=b.dataset.analyticsTab;
     nav.querySelectorAll('[data-analytics-tab]').forEach(x=>x.classList.toggle('active',x===b));
     document.querySelectorAll('[data-analytics-pane]').forEach(p=>{const on=p.dataset.analyticsPane===tab;p.classList.toggle('active',on);p.hidden=!on;});
   },true);
   document.querySelectorAll('[data-analytics-pane]').forEach(p=>p.hidden=!p.classList.contains('active'));
 }
 const fnav=document.getElementById('funSubnav');
 if(fnav){fnav.addEventListener('click',function(e){const b=e.target.closest('[data-fun-tab]');if(!b)return;e.preventDefault();e.stopPropagation();const tab=b.dataset.funTab;fnav.querySelectorAll('[data-fun-tab]').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('[data-fun-pane]').forEach(p=>{const on=p.dataset.funPane===tab;p.classList.toggle('active',on);p.hidden=!on;});},true);document.querySelectorAll('[data-fun-pane]').forEach(p=>p.hidden=!p.classList.contains('active'));}
})();

/* v57: removed v38 Match-by-Match override; the stabilized renderer above is authoritative. */


v30RankingCard = function(def,compact=false){
 const top=def.ranked[0];if(!top)return '<div class="msg">No data yet.</div>';
 if(compact)return `<article class="featuredRankCard rankArt-${def.id}" style="--tone:${def.tone}" data-rank="#1"><div class="frBody"><small>CLUBROOM INDEX</small><h4>${def.title}</h4><p>${def.sub}</p></div><div class="frWinner"><i>${def.icon}</i><div><b>${funName(top.p)}</b><span>${escapeHtml(def.detail(top.p))}</span></div><strong>${Math.round(top.score)}</strong></div></article>`;
 return `<article class="rankingHero30" style="--rank:${def.tone}"><div class="rankingHeroHead"><span>${def.icon}</span><h3>${def.title}</h3><p>${def.sub}</p></div><div class="rankingWinner30"><i>${def.icon}</i><div><small>${def.tag}</small><b>${funName(top.p)}</b><span>${escapeHtml(def.detail(top.p))}</span></div><strong>${Math.round(top.score)}</strong></div><div class="rankingList30">${def.ranked.slice(1,6).map((x,i)=>`<div><em>${i+2}</em><b>${funName(x.p)}</b><span><i style="width:${Math.max(3,Math.min(100,x.score))}%"></i></span><strong>${Math.round(x.score)}</strong></div>`).join('')}</div></article>`;
};

v30RenderDuos = function(a){
 const chem=(a?.chemistry||[]).slice().sort((x,y)=>v30DuoScore(y)-v30DuoScore(x));
 const initial=n=>(String(n||'?').trim()[0]||'?').toUpperCase();
 const html=chem.length?chem.map(x=>{const [label,tone]=v30DuoLabel(x),m=Math.max(1,N(x.matches)),wr=N(x.wins)/m*100,score=v30DuoScore(x);return `<article class="duoCard" style="--duo:${tone}"><div class="duoTop"><span class="duoLabel">${label}</span><div class="duoNames"><b data-initial="${initial(x.a_name)}">${escapeHtml(x.a_name)}</b><i>×</i><b data-initial="${initial(x.b_name)}">${escapeHtml(x.b_name)}</b></div></div><div class="duoStats"><div><b>${score}</b><span>Duo Score</span></div><div><b>${wr.toFixed(0)}%</b><span>Win Rate</span></div><div><b>${x.matches}</b><span>Matches Together</span></div><div><b>${x.contributions}</b><span>Combined G+A</span></div></div><div class="duoMeta">${escapeHtml(x.a_name)} · ${N(x.a_goals)}G + ${N(x.a_assists)}A &nbsp; · &nbsp; ${escapeHtml(x.b_name)} · ${N(x.b_goals)}G + ${N(x.b_assists)}A</div></article>`}).join(''):'<div class="msg">Duo Cards need at least two shared archived matches.</div>';
 const all=$('#goalPartners');if(all)all.innerHTML=html;const feat=$('#featuredDuos');if(feat)feat.innerHTML=html;
};

/* Small health helper for Club+ so collector state is visible without digging through Render logs. */
async function v38LoadHealth(){try{const h=await fetchJSON('/api/health',5000);const db=$('#dbState');if(db&&h.database){db.textContent=h.collectorEnabled?'DB ON · COLLECTOR ON':'DB ON · COLLECTOR OFF';db.title=`Collector interval: ${Math.round((h.collectorIntervalMs||0)/60000)} min · batch ${h.collectorBatch||0}`}}catch{}}
const __renderV38=render;render=function(id,d,searchClub=null){__renderV38(id,d,searchClub);v38LoadHealth();};


/* v39: analytics rebuild — no meaningless line charts, no Partnerships tab. */
(function(){
  function openAnalytics39(tab){
    const nav=document.getElementById('analyticsSubnav');
    if(!nav)return;
    const exists=[...document.querySelectorAll('[data-analytics-pane]')].some(p=>p.dataset.analyticsPane===tab);
    if(!exists) tab='form';
    nav.querySelectorAll('[data-analytics-tab]').forEach(b=>b.classList.toggle('active',b.dataset.analyticsTab===tab));
    document.querySelectorAll('[data-analytics-pane]').forEach(p=>{
      const on=p.dataset.analyticsPane===tab;
      p.classList.toggle('active',on);
      p.hidden=!on;
      p.style.display=on?'block':'none';
    });
  }
  document.addEventListener('click',function(e){
    const b=e.target.closest('#analyticsSubnav [data-analytics-tab]');
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openAnalytics39(b.dataset.analyticsTab);
  },true);
  window.v39OpenAnalytics=openAnalytics39;
  setTimeout(()=>openAnalytics39(document.querySelector('#analyticsSubnav .active')?.dataset.analyticsTab||'form'),0);
})();

function v39MatchMeta(h,row){
  const m=(h?.matches||[]).find(x=>String(x.match_id)===String(row?.match_id));
  return m||{};
}
function v39Date(v){
  if(!v)return '—';
  const d=new Date(v); if(Number.isNaN(d.getTime()))return '—';
  return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
}
function v39Result(m,row){return String(m?.result||row?.result||'—').toUpperCase()}
function v39Opponent(m,row){return m?.opponent||row?.opponent||'Opponent'}

v37RenderForm=function(h){
  const host=$('#analyticsForm'); if(!host)return;
  const ms=(h?.matches||[]).slice().sort((a,b)=>new Date(a.played_at||0)-new Date(b.played_at||0)).slice(-18);
  if(!ms.length){host.innerHTML='<div class="msg">No archived matches yet.</div>';return}
  const w=ms.filter(x=>x.result==='W').length,d=ms.filter(x=>x.result==='D').length,l=ms.length-w-d;
  const gf=ms.reduce((s,x)=>s+N(x.goals),0),ga=ms.reduce((s,x)=>s+N(x.opponent_goals),0),pts=w*3+d;
  const streak=(()=>{let out=[];for(let i=ms.length-1;i>=0;i--){const r=ms[i].result;if(!r)break;if(!out.length||r===out[0])out.unshift(r);else break}return out.length?`${out.length}${out[0]}`:'—'})();
  host.innerHTML=`<div class="form39">
    <div class="formKpis39">
      <div><small>LAST ${ms.length}</small><b>${w}W · ${d}D · ${l}L</b></div>
      <div><small>POINTS / MATCH</small><b>${(pts/ms.length).toFixed(2)}</b></div>
      <div><small>GOAL DIFFERENCE</small><b>${gf-ga>=0?'+':''}${gf-ga}</b></div>
      <div><small>CURRENT STREAK</small><b>${streak}</b></div>
    </div>
    <div class="formTimeline39">${ms.map((m,i)=>{const r=String(m.result||'').toLowerCase();return `<article class="${r}"><div class="ftTop39"><span>${v39Date(m.played_at)}</span><b>${String(m.result||'—')}</b></div><strong>${N(m.goals)}<i>:</i>${N(m.opponent_goals)}</strong><p>${escapeHtml(m.opponent||'Opponent')}</p><small>Match ${i+1}</small></article>`}).join('')}</div>
    <div class="formLegend39"><span><i class="w"></i>Win</span><span><i class="d"></i>Draw</span><span><i class="l"></i>Loss</span><em>Oldest → newest</em></div>
  </div>`;
};

/* v57: removed v39 Match-by-Match override; the stabilized renderer above is authoritative. */


v37RenderClutch=function(h){
  const host=$('#analyticsClutch');if(!host)return;
  const pm=h?.playerMatches||[], mm=new Map((h?.matches||[]).map(m=>[String(m.match_id),m])),agg=new Map();
  for(const x of pm){
    const m=mm.get(String(x.match_id)); if(!m)continue;
    if(Math.abs(N(m.goals)-N(m.opponent_goals))>1)continue;
    const k=v37PlayerKey(x); if(!k)continue;
    const o=agg.get(k)||{name:x.player_name||'Unknown',matches:0,wins:0,ga:0,ratingSum:0,ratingCount:0,motm:0};
    o.matches++; if(m.result==='W')o.wins++; o.ga+=N(x.goals)+N(x.assists);
    const rt=N(x.rating);if(rt>0){o.ratingSum+=rt;o.ratingCount++} o.motm+=N(x.motm);agg.set(k,o);
  }
  const rows=[...agg.values()].filter(x=>x.matches>=2).map(x=>{
    const avg=x.ratingCount?x.ratingSum/x.ratingCount:0,wr=x.wins/x.matches*100,gapm=x.ga/x.matches,motmRate=x.motm/x.matches;
    const score=Math.max(0,Math.min(100,wr*.35+Math.min(2,gapm)/2*25+Math.max(0,Math.min(1,(avg-6)/3))*25+Math.min(1,motmRate)*15));
    return {...x,avg,wr,gapm,score};
  }).sort((a,b)=>b.score-a.score);
  host.innerHTML=rows.length?`<div class="clutch39"><div class="clutchLead39"><small>CLOSE-MATCH PROXY</small><h4>Impact when the final margin is one goal or less</h4><p>This does not invent goal timing. It uses only archived result, G+A, MOTM and rating data.</p></div><div class="clutchGrid39">${rows.slice(0,8).map((x,i)=>`<article><div class="clutchRank39"><span>#${i+1}</span><b>${Math.round(x.score)}</b></div><h4>${escapeHtml(x.name)}</h4><div class="clutchBar39"><i style="width:${x.score}%"></i></div><div class="clutchMeta39"><span><b>${x.matches}</b>close matches</span><span><b>${x.wr.toFixed(0)}%</b>win rate</span><span><b>${x.gapm.toFixed(2)}</b>G+A / match</span><span><b>${x.avg?x.avg.toFixed(1):'—'}</b>avg rating</span></div></article>`).join('')}</div></div>`:'<div class="msg">Clutch needs at least two archived close matches per player.</div>';
};

/* Partnerships stay in Fun. Analytics deliberately does not render a duplicate. */
v37RenderPartnerships=function(){};

/* v43 Sessions workspace */
(function(){
 const state={filter:'all',data:null,selected:null};
 const fmtDuration=min=>{min=Math.max(0,Math.round(N(min)));const h=Math.floor(min/60),m=min%60;return h?`${h}h ${m}m`:`${m}m`};
 const dLabel=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})};
 const time=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})};
 const stats=(s,f)=>f==='all'?s.all:(s.byType?.[f]||{matches:0,wins:0,draws:0,losses:0,goals:0,conceded:0,goalDiff:0,winRate:0,pointsPerMatch:0,players:[]});
 const relevant=(s,f)=> (s.matches||[]).filter(m=>f==='all'||m.type===f);
 const resultClass=x=>String(x||'').toLowerCase();
 function sparkSvg(session,filter){
  const ms=relevant(session,filter); if(!ms.length)return '<div class="sessionNoChart43">No match data.</div>';
  const ids=[];const names=new Map();
  for(const m of ms)for(const p of m.players||[]){const id=String(p.player_id);if(!ids.includes(id)){ids.push(id);names.set(id,p.player_name||'Player')}}
  const top=ids.map(id=>({id,name:names.get(id),avg:ms.reduce((a,m)=>{const p=(m.players||[]).find(x=>String(x.player_id)===id);return a+(p&&N(p.rating)>0?N(p.rating):0)},0)})).sort((a,b)=>b.avg-a.avg).slice(0,3);
  if(!top.length)return '<div class="sessionNoChart43">Player ratings are not available for this session.</div>';
  const W=760,H=210,pad=24,min=5,max=10,step=ms.length>1?(W-pad*2)/(ms.length-1):0;
  const y=v=>pad+(max-Math.max(min,Math.min(max,N(v))))/(max-min)*(H-pad*2);
  const cls=['lineA','lineB','lineC'];
  const lines=top.map((pl,idx)=>{const pts=ms.map((m,i)=>{const p=(m.players||[]).find(x=>String(x.player_id)===pl.id);return p&&N(p.rating)>0?`${pad+i*step},${y(p.rating)}`:null}).filter(Boolean);return pts.length>1?`<polyline class="${cls[idx]}" points="${pts.join(' ')}"/>`:''}).join('');
  const dots=top.map((pl,idx)=>ms.map((m,i)=>{const p=(m.players||[]).find(x=>String(x.player_id)===pl.id);return p&&N(p.rating)>0?`<circle class="${cls[idx]}Dot" cx="${pad+i*step}" cy="${y(p.rating)}" r="4"/>`:''}).join('')).join('');
  const grid=[6,7,8,9,10].map(v=>`<g><line x1="${pad}" x2="${W-pad}" y1="${y(v)}" y2="${y(v)}"/><text x="3" y="${y(v)+4}">${v}</text></g>`).join('');
  const legend=top.map((p,i)=>`<span class="${cls[i]}">${escapeHtml(p.name)}</span>`).join('');
  return `<div class="sessionChart43"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><g class="chartGrid43">${grid}</g>${lines}${dots}</svg><div class="sessionLegend43"><span class="teamAvg43">Ratings</span>${legend}</div></div>`;
 }
 function renderDetail(s){
  const host=document.getElementById('sessionDetail43'); if(!host||!s)return;
  const x=stats(s,state.filter),ms=relevant(s,state.filter),players=x.players||[];
  const bestStretch=(()=>{let best=0,cur=0;for(const m of ms){cur=m.result==='W'?cur+1:0;best=Math.max(best,cur)}return best})();
  const ratings=[]; for(const m of ms)for(const p of m.players||[])if(N(p.rating)>0)ratings.push(N(p.rating));
  const hi=ratings.length?Math.max(...ratings):0,lo=ratings.length?Math.min(...ratings):0;
  host.innerHTML=`
   <div class="sessionDetailTop43"><div><span class="kicker">SESSION DETAIL</span><h3>${dLabel(s.startedAt)}</h3><p>${time(s.startedAt)} – ${time(s.estimatedEndAt)} · ${s.active?'Active run':'Completed run'}</p></div><div class="sessionStatus43 ${s.active?'live':''}">${s.active?'● LIVE':'✓ COMPLETED'}</div></div>
   <div class="sessionDetailMetrics43">
    <div><b>${x.matches}</b><span>Matches</span></div><div><b>${fmtDuration(s.durationMinutes)}</b><span>Duration</span></div><div><b>${x.goalDiff>=0?'+':''}${x.goalDiff}</b><span>Goal diff · ${x.goals}:${x.conceded}</span></div><div><b>${N(x.pointsPerMatch).toFixed(2)}</b><span>Points / match</span></div><div><b>${x.passAccuracy?N(x.passAccuracy).toFixed(0)+'%':'—'}</b><span>Pass accuracy</span></div><div><b>${x.shotConversion?N(x.shotConversion).toFixed(0)+'%':'—'}</b><span>Shot conversion</span></div><div><b>${x.cleanSheets||0}</b><span>Clean sheets</span></div>
   </div>
   <div class="sessionDetailGrid43">
    <section class="sessionCardPanel43 performance"><div class="sessionPanelTitle43"><div><span>PERFORMANCE CENTER</span><h4>Rating trend</h4></div><small>${x.matches} matches</small></div>${sparkSvg(s,state.filter)}</section>
    <section class="sessionCardPanel43 leaders"><div class="sessionPanelTitle43"><div><span>SQUAD LEADERS</span><h4>Session performers</h4></div></div><div class="sessionLeaders43">${players.slice(0,5).map((p,i)=>`<div><span>${i+1}</span><div><b>${escapeHtml(p.player_name||'Player')}</b><small>${p.goals} G · ${p.assists} A · ${p.contributions} G+A</small></div><strong>${p.rating?N(p.rating).toFixed(1):'—'}</strong></div>`).join('')||'<div class="msg">No player data.</div>'}</div></section>
   </div>
   <div class="sessionInsights43"><div><span>BEST STRETCH</span><b>${bestStretch?`${bestStretch} wins in a row`:'—'}</b></div><div><span>TEAM RATING</span><b>${x.teamRating?N(x.teamRating).toFixed(2):'—'}</b></div><div><span>BIGGEST RATING SWING</span><b>${ratings.length?`+${Math.max(0,hi-lo).toFixed(1)}`:'—'}</b></div><div><span>WIN RATE</span><b>${N(x.winRate).toFixed(0)}%</b></div></div>
   <section class="sessionCardPanel43 matches"><div class="sessionPanelTitle43"><div><span>MATCHES IN THIS SESSION</span><h4>${ms.length} archived matches</h4></div></div><div class="sessionMatchRows43">${ms.map((m,i)=>{const motm=(m.players||[]).slice().sort((a,b)=>N(b.motm)-N(a.motm)||N(b.rating)-N(a.rating))[0];const contrib=(m.players||[]).slice().sort((a,b)=>(N(b.goals)+N(b.assists))-(N(a.goals)+N(a.assists)))[0];return `<div class="sessionMatchRow43"><span class="mode43 ${m.type}">${escapeHtml(m.type||'match')}</span><small>${time(m.played_at)} · Match ${i+1}</small><div class="sessionClub43"><b>${escapeHtml(S.club?.name||'Clubroom')}</b><strong>${m.goals}:${m.opponent_goals}</strong><b>${escapeHtml(m.opponent||'Opponent')}</b></div><span class="sessionResult43 ${resultClass(m.result)}">${m.result==='W'?'Win':m.result==='L'?'Loss':'Draw'}</span><em>${motm&&N(motm.motm)?`★ ${escapeHtml(motm.player_name)} MOTM`:contrib?`${escapeHtml(contrib.player_name)} ${N(contrib.goals)}G ${N(contrib.assists)}A`:''}</em></div>`}).join('')}</div></section>`;
 }
 function render(){
  const data=state.data,list=document.getElementById('sessionList42'),sum=document.getElementById('sessionSummary42'),live=document.getElementById('sessionLive42'),count=document.getElementById('sessionArchiveCount43');if(!data||!list||!sum)return;
  const sessions=(data.sessions||[]).filter(s=>stats(s,state.filter).matches>0);if(!state.selected||!sessions.some(s=>s.id===state.selected))state.selected=sessions[0]?.id||null;
  const total=sessions.reduce((a,s)=>a+stats(s,state.filter).matches,0),wins=sessions.reduce((a,s)=>a+stats(s,state.filter).wins,0),gf=sessions.reduce((a,s)=>a+stats(s,state.filter).goals,0),ga=sessions.reduce((a,s)=>a+stats(s,state.filter).conceded,0);
  if(count)count.textContent=`${sessions.length} sessions`;if(live){const cur=(data.sessions||[])[0];live.classList.toggle('active',!!cur?.active);live.textContent=cur?.active?`● ACTIVE SESSION · ${fmtDuration(cur.durationMinutes)}`:'ARCHIVE READY'}
  sum.innerHTML=`<div><small>SESSIONS</small><b>${sessions.length}</b></div><div><small>MATCHES</small><b>${total}</b></div><div><small>WIN RATE</small><b>${total?Math.round(wins/total*100):0}%</b></div><div><small>GOAL DIFF</small><b>${gf-ga>=0?'+':''}${gf-ga}</b></div>`;
  list.innerHTML=sessions.length?sessions.map(s=>{const x=stats(s,state.filter),ms=relevant(s,state.filter),tp=x.topPlayer;return `<button class="sessionArchiveCard43 ${s.id===state.selected?'selected':''} ${s.active?'live':''}" data-session-id43="${escapeHtml(s.id)}"><div class="sessionArchiveTop43"><div><span>${dLabel(s.startedAt)}</span><small>${fmtDuration(s.durationMinutes)}</small></div><strong>${x.wins}-${x.draws}-${x.losses}</strong></div><div class="sessionArchiveMetrics43"><div><b>${x.goals}</b><span>Goals</span></div><div><b>${N(x.pointsPerMatch).toFixed(2)}</b><span>Avg pts</span></div><div><b>${x.teamRating?N(x.teamRating).toFixed(2):'—'}</b><span>Team rtg</span></div></div><div class="sessionTimeline43">${ms.slice(0,8).map(m=>`<i class="${resultClass(m.result)}" title="${m.result} ${m.goals}:${m.opponent_goals}">${m.result}</i>`).join('')}</div><div class="sessionArchivePlayer43">${tp?`<span>★ ${escapeHtml(tp.player_name)}</span><b>${tp.rating?N(tp.rating).toFixed(1):'—'} RTG · ${tp.goals}G ${tp.assists}A</b>`:'<span>No player data</span>'}</div></button>`}).join(''):'<div class="msg">No sessions for this filter yet.</div>';
  const selected=sessions.find(s=>s.id===state.selected);if(selected)renderDetail(selected);
 }
 window.v43RenderSessions=function(a){state.data=a?.sessionMeta||{sessions:a?.sessions||[],active:false};render()};
 document.addEventListener('click',e=>{const f=e.target.closest('#sessionFilters42 [data-session-filter]');if(f){state.filter=f.dataset.sessionFilter;state.selected=null;document.querySelectorAll('#sessionFilters42 [data-session-filter]').forEach(x=>x.classList.toggle('active',x===f));render();return}const s=e.target.closest('[data-session-id43]');if(s){state.selected=s.dataset.sessionId43;render();}});
})();

const __renderAnalyticsV43=renderAnalytics;renderAnalytics=function(h,a){__renderAnalyticsV43(h,a);v43RenderSessions(a)};

/* v44 step 3 — Overview Key Threats + Recent Sessions. UI only; no new data sources. */
function overviewPlayerName44(p){return p?.pro_name||p?.player_name||p?.name||'—'}
function renderOverviewThreats44(h=null){
 const host=document.getElementById('overviewThreats44'); if(!host)return;
 const archive=Array.isArray(h?.players)&&h.players.length?h.players:null;
 const players=(archive||S.players||[]).filter(Boolean);
 if(!players.length){host.innerHTML='<div class="msg">No player data available.</div>';return}
 const games=p=>Math.max(0,N(archive?p.matches:p.games));
 const goals=p=>N(p.goals), assists=p=>N(p.assists), shots=p=>N(p.shots);
 const named=p=>escapeHtml(String(overviewPlayerName44(p)));
 const cards=[];
 const scorer=players.slice().sort((a,b)=>goals(b)-goals(a))[0];
 if(scorer){const g=games(scorer);cards.push({tone:'cyan',icon:'⚽',label:'TOP SCORER',name:named(scorer),value:g?(goals(scorer)/g).toFixed(2):String(goals(scorer)),metric:g?'Goals / game':'Goals',meta:`${goals(scorer)} goals · ${g||0} matches`})}
 const clinical=players.filter(p=>shots(p)>0).sort((a,b)=>(goals(b)/shots(b))-(goals(a)/shots(a)))[0];
 if(clinical){cards.push({tone:'green',icon:'◎',label:'CLINICAL',name:named(clinical),value:(goals(clinical)/shots(clinical)*100).toFixed(1)+'%',metric:'Shot conversion',meta:`${goals(clinical)} goals · ${shots(clinical)} shots`})}
 const creator=players.filter(p=>games(p)>0).sort((a,b)=>(assists(b)/games(b))-(assists(a)/games(a)))[0];
 if(creator){const g=games(creator);cards.push({tone:'purple',icon:'⌘',label:'CREATOR',name:named(creator),value:(assists(creator)/g).toFixed(2),metric:'Assists / game',meta:`${assists(creator)} assists · ${g} matches`})}
 if(archive){
  const defenders=players.map(p=>({...p,_def:N(p.interceptions)+N(p.tackles_won)})).filter(p=>p._def>0&&games(p)>0).sort((a,b)=>(b._def/games(b))-(a._def/games(a)));
  const defender=defenders[0];
  if(defender){cards.push({tone:'gold',icon:'◇',label:'DEFENSIVE',name:named(defender),value:(defender._def/games(defender)).toFixed(2),metric:'Def. actions / game',meta:`${N(defender.interceptions)} interceptions · ${N(defender.tackles_won)} tackles won`})}
 }
 host.innerHTML=cards.slice(0,4).map(c=>`<article class="threatCard44 ${c.tone}"><div class="threatLabel44"><span>${c.icon}</span><b>${c.label}</b></div><h4>${c.name}</h4><strong>${c.value}</strong><p>${c.metric}</p><small>${c.meta}</small></article>`).join('')||'<div class="msg">No supported threat metrics available.</div>';
}
function overviewDuration44(min){min=Math.max(0,Math.round(N(min)));const h=Math.floor(min/60),m=min%60;return h?`${h}h ${m}m`:`${m}m`}
function overviewSessionDate44(v){const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}
function renderOverviewSessions44(a=null){
 const host=document.getElementById('overviewSessions44'); if(!host)return;
 const sessions=a?.sessionMeta?.sessions||a?.sessions||[];
 if(!sessions.length){host.innerHTML='<div class="msg">No archived sessions yet.</div>';return}
 host.innerHTML=sessions.slice(0,2).map(s=>{const x=s.all||{},tp=x.topPlayer,ms=s.matches||[];return `<button class="overviewSessionCard44 ${s.active?'activeRun':''}" data-goto="sessions"><div class="overviewSessionTop44"><div><span>▣</span><b>${overviewSessionDate44(s.startedAt)}</b></div><small>${overviewDuration44(s.durationMinutes)}</small></div><div class="overviewSessionBody44"><div class="overviewSessionRecord44"><strong>${N(x.wins)}-${N(x.draws)}-${N(x.losses)}</strong><span>Record</span></div><div class="overviewSessionMini44"><div><b>${N(x.goals)}</b><span>Goals</span></div><div><b>${N(x.pointsPerMatch).toFixed(2)}</b><span>Avg pts</span></div><div><b>${N(x.teamRating)>0?N(x.teamRating).toFixed(2):'—'}</b><span>Team rtg</span></div></div></div><div class="overviewSessionTimeline44">${ms.slice(0,8).map(m=>`<i class="${String(m.result||'').toLowerCase()}" title="${escapeHtml(String(m.opponent||'Opponent'))} ${N(m.goals)}:${N(m.opponent_goals)}"><span>${m.result||'—'}</span><small>${N(m.goals)}:${N(m.opponent_goals)}</small></i>`).join('')}</div><div class="overviewSessionLeader44">${tp?`<span>★ ${escapeHtml(String(tp.player_name||'Player'))}</span><b>${N(tp.rating)>0?N(tp.rating).toFixed(1)+' RTG · ':''}${N(tp.goals)}G ${N(tp.assists)}A</b>`:'<span>Player detail unavailable</span>'}</div></button>`}).join('');
}

/* v44 step 4 — Overview Performance Center. UI only; uses existing history/player-match data. */
const overviewPerformance44={history:null,limit:10};
function overviewPerfName44(p){return String(p?.pro_name||p?.player_name||p?.name||'Player')}
function overviewPerfDate44(v){const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}
function overviewPerfSeries44(matches,pms){
 const byMatch=new Map();
 for(const r of pms){const k=String(r.match_id);if(!byMatch.has(k))byMatch.set(k,[]);byMatch.get(k).push(r)}
 const team=matches.map(m=>{const rs=(byMatch.get(String(m.match_id))||[]).map(x=>N(x.rating)).filter(v=>v>0);return rs.length?rs.reduce((a,b)=>a+b,0)/rs.length:null});
 const players=new Map();
 for(const r of pms){const rating=N(r.rating);if(!(rating>0))continue;const key=String(r.player_id||r.player_name||'');if(!key)continue;let x=players.get(key);if(!x){x={key,name:overviewPerfName44(r),ratings:new Map(),sum:0,count:0};players.set(key,x)}x.ratings.set(String(r.match_id),rating);x.sum+=rating;x.count++}
 const minApps=Math.min(2,Math.max(1,matches.length));
 const top=[...players.values()].filter(x=>x.count>=minApps).sort((a,b)=>(b.sum/b.count)-(a.sum/a.count)||b.count-a.count).slice(0,3).map(x=>({name:x.name,values:matches.map(m=>x.ratings.get(String(m.match_id))??null),avg:x.sum/x.count,count:x.count}));
 return {team,top};
}
function overviewPerfPath44(values,w=700,h=230){
 const left=42,right=14,top=18,bottom=34,plotW=w-left-right,plotH=h-top-bottom;
 const x=i=>left+(values.length<=1?plotW/2:i*plotW/(values.length-1));
 const y=v=>top+(10-Math.max(5,Math.min(10,v)))/5*plotH;
 const parts=[];let seg=[];
 values.forEach((v,i)=>{if(v==null||!Number.isFinite(Number(v))){if(seg.length){parts.push(seg);seg=[]}}else seg.push([x(i),y(Number(v))])});if(seg.length)parts.push(seg);
 return parts.map(a=>a.length===1?`M ${a[0][0]} ${a[0][1]} l .01 .01`:`M ${a.map((p,i)=>`${i?'L ':''}${p[0]} ${p[1]}`).join(' ')}`).join(' ')
}
function renderOverviewPerformance44(h=null,limit=null){
 const chart=document.getElementById('overviewPerformanceChart44'),summary=document.getElementById('overviewPerformanceSummary44'),metrics=document.getElementById('overviewPerformanceMetrics44'),select=document.getElementById('overviewPerformanceRange44');
 if(!chart||!summary||!metrics)return;
 if(h)overviewPerformance44.history=h;if(limit)overviewPerformance44.limit=N(limit)||10;
 const data=overviewPerformance44.history;if(!data?.enabled){chart.innerHTML='<div class="msg">Performance Center needs the Clubroom archive.</div>';summary.innerHTML='';metrics.innerHTML='<div class="msg">No archived performance metrics yet.</div>';return}
 if(select)select.value=String(overviewPerformance44.limit);
 const recent=(data.matches||[]).slice(0,overviewPerformance44.limit).reverse();
 if(!recent.length){chart.innerHTML='<div class="msg">No archived matches yet.</div>';summary.innerHTML='';metrics.innerHTML='<div class="msg">No archived performance metrics yet.</div>';return}
 const ids=new Set(recent.map(m=>String(m.match_id))),pms=(data.playerMatches||[]).filter(x=>ids.has(String(x.match_id)));
 const series=overviewPerfSeries44(recent,pms),w=700,hg=230;
 const grid=[5,6,7,8,9,10].map(v=>{const y=18+(10-v)/5*(hg-18-34);return `<g><line x1="42" y1="${y}" x2="686" y2="${y}"/><text x="8" y="${y+4}">${v.toFixed(1)}</text></g>`}).join('');
 const labels=recent.map((m,i)=>{if(recent.length>10&&i%2)return'';const x=42+(recent.length<=1?644/2:i*644/(recent.length-1));return `<text class="xLabel" x="${x}" y="218" text-anchor="middle">${overviewPerfDate44(m.played_at)}</text>`}).join('');
 const lines=[{name:'Team avg',values:series.team,cls:'team'},...series.top.map((x,i)=>({name:x.name,values:x.values,cls:`p${i+1}`}))];
 const hasRating=lines.some(s=>s.values.some(v=>v!=null));
 chart.innerHTML=hasRating?`<div class="performanceChartTitle44"><div><b>Match rating trend</b><span>${recent.length} archived matches</span></div></div><svg class="performanceSvg44" viewBox="0 0 ${w} ${hg}" preserveAspectRatio="none"><g class="performanceGrid44">${grid}${labels}</g>${lines.map(s=>`<path class="ratingLine44 ${s.cls}" d="${overviewPerfPath44(s.values,w,hg)}"/>`).join('')}${lines.map(s=>s.values.map((v,i)=>v==null?'':`<circle class="ratingDot44 ${s.cls}" cx="${42+(s.values.length<=1?644/2:i*644/(s.values.length-1))}" cy="${18+(10-Math.max(5,Math.min(10,N(v))))/5*(hg-18-34)}" r="2.8"><title>${escapeHtml(s.name)} · ${N(v).toFixed(2)}</title></circle>`).join('')).join('')}</svg><div class="performanceLegend44">${lines.map(s=>`<span><i class="${s.cls}"></i>${escapeHtml(s.name)}</span>`).join('')}</div>`:'<div class="msg">These matches do not contain archived rating data.</div>';
 const wins=recent.filter(m=>m.result==='W').length,draws=recent.filter(m=>m.result==='D').length,losses=recent.length-wins-draws,goals=recent.reduce((s,m)=>s+N(m.goals),0),teamRatings=series.team.filter(v=>v!=null),avgRating=teamRatings.length?teamRatings.reduce((a,b)=>a+b,0)/teamRatings.length:null;
 summary.innerHTML=`<div class="performanceSummaryLabel44">WINDOW SUMMARY</div><div class="performanceRecord44"><b class="w">${wins}</b><span>W</span><i>–</i><b class="d">${draws}</b><span>D</span><i>–</i><b class="l">${losses}</b><span>L</span></div><div class="performanceSummaryRows44"><div><span>Goals scored</span><b>${goals}</b></div><div><span>Win rate</span><b>${(wins/recent.length*100).toFixed(0)}%</b></div><div><span>Avg team rating</span><b class="positive">${avgRating!=null?avgRating.toFixed(2):'—'}</b></div></div>${series.top[0]?`<div class="performanceTopPlayer44"><span>TOP RATED</span><b>${escapeHtml(series.top[0].name)}</b><small>${series.top[0].avg.toFixed(2)} avg · ${series.top[0].count} matches</small></div>`:''}`;
 const passAttempts=pms.reduce((s,x)=>s+N(x.pass_attempts),0),passes=pms.reduce((s,x)=>s+N(x.passes_made),0),shots=pms.reduce((s,x)=>s+N(x.shots),0),playerGoals=pms.reduce((s,x)=>s+N(x.goals),0),clean=recent.filter(m=>N(m.opponent_goals)===0).length;
 const cards=[{icon:'↗',label:'PASS ACCURACY',value:passAttempts?(passes/passAttempts*100).toFixed(1)+'%':'—',meta:passAttempts?`${passes} / ${passAttempts} completed`:'No pass attempts captured',tone:'cyan'},{icon:'◎',label:'SHOT CONVERSION',value:shots?(playerGoals/shots*100).toFixed(1)+'%':'—',meta:shots?`${playerGoals} goals · ${shots} shots`:'No shots captured',tone:'purple'},{icon:'◇',label:'CLEAN SHEETS',value:String(clean),meta:`${clean} of ${recent.length} matches`,tone:'green'}];
 metrics.innerHTML=cards.map(c=>`<article class="performanceMetric44 ${c.tone}"><span class="metricIcon44">${c.icon}</span><div><small>${c.label}</small><b>${c.value}</b><em>${c.meta}</em></div></article>`).join('');
}
document.addEventListener('change',e=>{if(e.target?.id==='overviewPerformanceRange44')renderOverviewPerformance44(null,e.target.value)});
