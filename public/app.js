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

$("#search").onsubmit=async e=>{e.preventDefault();$("#results").innerHTML='<div class="msg">Hledám…</div>';try{let d=await fetchJSON(`/api/search?q=${encodeURIComponent($("#q").value)}&platform=${$("#platform").value}`,9000);let a=A(d).flatMap(x=>Array.isArray(x)?x:[x]).filter(x=>x.clubId||x.clubid||x.id);$("#results").innerHTML=a.length?a.slice(0,15).map(c=>`<div class="result" data-id="${c.clubId||c.clubid||c.id}"><b>${c.clubName||c.name||"Klub"}</b><span>ID ${c.clubId||c.clubid||c.id}</span></div>`).join(""):'<div class="msg">Nic nenalezeno.</div>';document.querySelectorAll(".result").forEach(x=>x.onclick=()=>{const c=a.find(z=>String(z.clubId||z.clubid||z.id)===String(x.dataset.id));load(x.dataset.id,c||null)})}catch(e){$("#results").innerHTML=`<div class="msg">${e.message}</div>`}};
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
 $("#clubName").textContent=name;
 const fallback=(name.match(/[A-Z0-9]/ig)||["C"]).slice(0,2).join("").toUpperCase();$("#clubFallback").textContent=fallback;
 const crest=$("#clubCrest"); crest.hidden=true; $("#clubFallback").hidden=false;
 if(crestId){ crest.src=`https://eafc24.content.easports.com/fifa/fltOnlineAssets/24B23FDE-7835-41C2-87A2-F453DFDB2E82/2024/fcweb/crests/256x256/l${crestId}.png`; crest.onload=()=>{crest.hidden=false;$("#clubFallback").hidden=true}; crest.onerror=()=>{crest.hidden=true;$("#clubFallback").hidden=false}; }$("#divisionBadge").textContent=`DIV ${division}`;$("#skillBadge").textContent=`SR ${skill}`;$("#clubIdBadge").textContent=`ID ${id}`;$("#recW").textContent=`${w}W`;$("#recD").textContent=`${dr}D`;$("#recL").textContent=`${l}L`;
 let form=ms.slice(0,10).map(m=>m.result);$("#formPills").innerHTML=form.map(x=>`<span class="formPill ${x.toLowerCase()}">${x}</span>`).join("");let fw=form.filter(x=>x==="W").length,fd=form.filter(x=>x==="D").length,fl=form.filter(x=>x==="L").length;$("#formSummary").textContent=form.length?`${fw}W · ${fd}D · ${fl}L`:"—";
 let wr=g?(w/g*100):0,gd=gf-ga,winStreak=N(P(o,["wstreak","winStreak"],0)),unbeaten=N(P(o,["unbeatenstreak","unbeatenStreak"],0)),promotions=N(P(o,["promotions"],0)),relegations=N(P(o,["relegations"],0)),cleanSheets=N(P(searchClub||{},["cleanSheets"],P(o,["cleanSheets"],0)));
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
 document.querySelectorAll("[data-m]").forEach(x=>x.onclick=()=>showMatch(+x.dataset.m));
 let er=d.errors||{};$("#status").innerHTML=["info","overall","career","members","achievements","league","playoff","friendly"].map(k=>`<div class="endpoint"><span>${k}</span><b>${er[k]?"CHYBA":"OK"}</b></div>`).join("");
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
function fillCompare(){let opts=S.players.map(p=>`<option value="${p.id}">${p.name}</option>`).join("");$("#cmpA").innerHTML=opts;$("#cmpB").innerHTML=opts;if(S.players[1])$("#cmpB").value=S.players[1].id;compare()}
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
function compare(){
 let aa=S.players.find(x=>x.id===$("#cmpA").value),bb=S.players.find(x=>x.id===$("#cmpB").value);if(!aa||!bb)return;let a=advancedFor(aa),b=advancedFor(bb);
 const rows=[["Matches","games"],["Goals","goals"],["Assists","assists"],["Second assists","secondAssists"],["G+A","ga"],["Avg rating","rating"],["MOTM","motm"],["Shots","shots"],["Passes completed","passes"],["Pass accuracy","passRate"],["Tackles","tackles"],["Tackle success","tackleRate"],["Dribbles","dribbles"],["Interceptions","interceptions"],["Saves","saves"]];
 const fmt=(k,v)=>v==null?"—":k.includes("Rate")?pct(v):k==="rating"&&v?Number(v).toFixed(2):v;
 const score=(x,y)=>x==null||y==null?"":Number(x)>Number(y)?"winner":"";
 $("#compareCoverage").innerHTML=`<div class="comparePlayerHead"><strong>${escapeHtml(a.name)}</strong><span>${a.trackedMatches||0} match-level zápasů</span></div><div class="compareVs">VS</div><div class="comparePlayerHead right"><strong>${escapeHtml(b.name)}</strong><span>${b.trackedMatches||0} match-level zápasů</span></div>`;
 $("#compareBody").innerHTML=`<div class="compareCards">${rows.map(([label,k])=>`<div class="compareRow"><div class="compareValue ${score(a[k],b[k])}">${fmt(k,a[k])}</div><div class="compareLabel">${label}</div><div class="compareValue ${score(b[k],a[k])}">${fmt(k,b[k])}</div></div>`).join("")}</div><div class="compareFoot">Career totals používají EA career data. Detailní metriky se automaticky skládají z uložené historie a aktuálně dostupných zápasů. Jakmile databáze zachytí další zápasy, rozsah se sám rozšiřuje.</div>`;
}
$("#cmpA").onchange=compare;$("#cmpB").onchange=compare;document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$("#"+b.dataset.close).hidden=true);
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
  renderArchiveMatches(h.matches||[]);renderAnalytics(h,a);renderFun(h,a);renderDbPlayers(h);compare();
 }catch(e){$("#dbState").textContent="DB ERROR";$("#chemistry").innerHTML=`<div class="msg">${escapeHtml(e.message)}</div>`}
}
function renderDbPlayers(h){
 const db=new Map((h.players||[]).map(x=>[String(x.player_id),x]));
 document.querySelectorAll("[data-p]").forEach(el=>{const p=S.players.find(q=>String(q.id)===String(el.dataset.p)),q=db.get(String(el.dataset.p));if(p&&q?.pro_name)el.innerHTML=`<b>${escapeHtml(q.pro_name)}</b>${p.accountName&&p.accountName!==q.pro_name?`<small class="subname">${escapeHtml(p.accountName)}</small>`:""}`})
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
 const pane=document.querySelector('[data-pane="analytics"]');let sessions=pane.querySelector("#sessionsPanel");if(!sessions){sessions=document.createElement("section");sessions.id="sessionsPanel";sessions.className="panel";pane.appendChild(sessions)}sessions.innerHTML=`<div class="panelHead"><h3>Session Reports</h3><span>pauza 2+ hodiny = nová session</span></div>${(a.sessions||[]).length?`<div class="table"><table><thead><tr><th>Start</th><th>Matches</th><th>W-D-L</th><th>Goals</th><th>Conceded</th><th>GD</th></tr></thead><tbody>${a.sessions.slice(0,20).map(x=>`<tr><td>${new Date(x.started_at).toLocaleString("cs-CZ")}</td><td>${x.matches}</td><td>${x.wins}-${x.draws}-${x.losses}</td><td>${x.goals}</td><td>${x.conceded}</td><td>${N(x.goals)-N(x.conceded)>=0?"+":""}${N(x.goals)-N(x.conceded)}</td></tr>`).join("")}</tbody></table></div>`:'<div class="msg">Zatím bez session historie.</div>'}`;
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
 $("#funMatchByMatch").innerHTML=$("#funForm").innerHTML;
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
 $("#funMatchByMatch").innerHTML=rows?`<table class="funTable"><thead><tr><th>Date</th><th>Result</th><th>Score</th><th>Opponent</th><th>Best player</th></tr></thead><tbody>${rows}</tbody></table>`:'<div class="msg">Bez historie zápasů.</div>';
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
$("#openSearch").onclick=()=>{history.replaceState(null,"","/");$("#dash").hidden=true;$("#home").hidden=false;$("#q").focus()};
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
function liveMatchDetail(i){
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
function archiveDetail(matchId){
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
 _renderFunV21(h,a); const ps=a.players||[], ms=h.matches||[];
 const n=x=>escapeHtml(x?.player_name||x?.name||"—"), by=k=>ps.slice().sort((x,y)=>N(y[k])-N(x[k]))[0];
 const top=[by("goals"),by("assists"),by("rating"),by("motm")].filter(Boolean);
 const front=document.querySelector("#bestFront");if(front)front.innerHTML=top.length?`<div class="pitch"><div class="pitchLine"></div>${top.map((p,i)=>`<article class="pitchPlayer p${i}"><small>${i===0?"ST":i===1?"CAM":i===2?"RAM":"LAM"}</small><strong>${N(p.rating).toFixed(1)}</strong><b>${n(p)}</b><span>${N(p.goals)} G · ${N(p.assists)} A</span></article>`).join("")}</div>`:'<div class="msg">Potřebujeme hráčská data.</div>';
 const pass=document.querySelector("#passingInsights");if(pass){const ranked=ps.filter(x=>N(x.pass_attempts)>0).sort((x,y)=>N(y.passes_made)/N(y.pass_attempts)-N(x.passes_made)/N(x.pass_attempts));pass.innerHTML=ranked.length?`<div class="insightList"><h4>PASS ACCURACY RANKINGS</h4>${ranked.map((p,i)=>{const pc=N(p.passes_made)/N(p.pass_attempts)*100;return `<div class="insightRow"><i>${i+1}</i><b>${n(p)}</b><div><span style="width:${Math.min(100,pc)}%"></span></div><strong>${pc.toFixed(1)}%</strong></div>`}).join("")}<h4>VOLUME PASSERS / MATCH</h4>${ranked.slice().sort((x,y)=>N(y.passes_made)/Math.max(1,N(y.matches))-N(x.passes_made)/Math.max(1,N(x.matches))).map((p,i)=>`<div class="volumeRow"><b>${n(p)}</b><span>${(N(p.passes_made)/Math.max(1,N(p.matches))).toFixed(1)} / match</span></div>`).join("")}</div>`:'<div class="msg">Passing insights se objeví po uložení pass eventů.</div>'}
 const clutch=document.querySelector("#clutchStats");if(clutch){const c=ps.slice().sort((x,y)=>(N(y.goals)+N(y.assists)+N(y.motm)*2)-(N(x.goals)+N(x.assists)+N(x.motm)*2)).slice(0,4);clutch.innerHTML=c.length?`<div class="clutchBoard">${c.map((p,i)=>`<article><small>#${i+1}</small><b>${n(p)}</b><strong>${N(p.goals)+N(p.assists)+N(p.motm)*2}</strong><span>clutch index · G+A + 2×MOTM</span></article>`).join("")}</div>`:'<div class="msg">Bez dat.</div>'}
 const pad=document.querySelector("#statPadder");if(pad){const r=ps.map(p=>({p,score:(N(p.goals)+N(p.assists))*10-(N(p.rating)||0)*3})).sort((x,y)=>y.score-x.score);pad.innerHTML=r.length?`<div class="padderBoard">${r.slice(0,5).map((x,i)=>`<div><span>#${i+1}</span><b>${n(x.p)}</b><em>${N(x.p.goals)+N(x.p.assists)} G+A</em><strong>${N(x.p.rating).toFixed(1)} avg</strong></div>`).join("")}<p>Fun index, ne skutečný úsudek o hráči. Počítá produkci proti ratingu.</p></div>`:'<div class="msg">Bez dat.</div>'}
};

// v22: reference-matched Players cards and three-tab inline match details.
function posGroup(pos){const p=String(pos||'').toUpperCase();if(/GK|GOAL/.test(p))return'GK';if(/CB|LB|RB|LWB|RWB|DEF/.test(p))return'DEF';if(/CM|CAM|CDM|LM|RM|MID/.test(p))return'MID';return'FWD'}
function playerAdvancedForCard(p){return advancedFor(p)}
function creativityScore(p){const a=playerAdvancedForCard(p),m=Math.max(1,N(a.trackedMatches));return ((N(a.dribbles)+N(a.secondAssists)*2)/m)*90/90}
function renderPlayerCards(){
 const host=$('#playerCards');if(!host)return;let list=S.players.slice();const rank=$('#playerRank')?.value||'squad';
 if(rank!=='squad')list.sort((a,b)=>{if(rank==='creativity')return creativityScore(b)-creativityScore(a);return N(playerSortValue(b,rank))-N(playerSortValue(a,rank))});
 const counts={GK:0,DEF:0,MID:0,FWD:0};list.forEach(p=>counts[posGroup(p.position)]++);
 $('#positionSummary').innerHTML=`<span class="posPill gk">🧤 Goalkeepers: ${counts.GK}</span><span class="posPill def">🛡 Defenders: ${counts.DEF}</span><span class="posPill mid">🎯 Midfielders: ${counts.MID}</span><span class="posPill fwd">⚡ Forwards: ${counts.FWD}</span>`;
 const creative=list.map(p=>({p,s:creativityScore(p),a:playerAdvancedForCard(p)})).filter(x=>x.a.trackedMatches).sort((a,b)=>b.s-a.s).slice(0,5);
 $('#creativityRanking').innerHTML=creative.length?creative.map((x,i)=>`<span><b>#${i+1} ${escapeHtml(x.p.name)}</b><em>${x.s.toFixed(2)}</em></span>`).join(''):'<small>Čekám na match-level dribbles / second assists.</small>';
 host.innerHTML=list.map(p=>{const a=playerAdvancedForCard(p),games=Math.max(1,N(p.games)),pr=a.passRate!=null?pct(a.passRate):(p.passRate?pct(p.passRate):'—'),sr=p.shotRate?pct(p.shotRate):(a.shots?`${(N(p.goals)/N(a.shots)*100).toFixed(0)}%`:'—');return `<article class="playerCard" data-p="${p.id}"><div class="pcHead"><span class="pcPos ${posGroup(p.position).toLowerCase()}">${escapeHtml(String(p.position||posGroup(p.position)))}</span><div><h4>${escapeHtml(p.name)}</h4>${p.accountName&&p.accountName!==p.name?`<small>${escapeHtml(p.accountName)}</small>`:''}</div><strong>${p.rating?p.rating.toFixed(1):'—'}<small>Avg Rating</small></strong></div><div class="pcCore"><div><b>${p.games}</b><span>Games</span></div><div><b>${p.goals}</b><span>Goals</span></div><div><b>${p.assists}</b><span>Assists</span></div><div><b>${p.motm}</b><span>MOTM</span></div></div><div class="pcRates"><div><b>${p.winRate?pct(p.winRate):'—'}</b><span>Win Rate</span></div><div><b>${pr}</b><span>Pass %</span></div><div><b>${sr}</b><span>Shot %</span></div></div><div class="pcPer"><div><b>${(p.goals/games).toFixed(2)}</b><span>Goals/Game</span></div><div><b>${(p.assists/games).toFixed(2)}</b><span>Assists/Game</span></div><div><b>${(p.ga/games).toFixed(2)}</b><span>G+A/Game</span></div></div><div class="pcCreative"><span>Creativity</span><b>${a.trackedMatches?creativityScore(p).toFixed(2):'—'}</b><small>${a.trackedMatches||0} captured matches</small></div></article>`}).join('');
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
