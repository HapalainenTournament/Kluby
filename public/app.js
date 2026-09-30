const $=s=>document.querySelector(s),N=v=>Number(v??0),A=x=>Array.isArray(x)?x:(x&&typeof x==="object"?Object.values(x).filter(v=>v&&typeof v==="object"):[]);
const P=(o,ks,d=0)=>{for(const k of ks)if(o&&o[k]!=null)return o[k];return d};
const pct=v=>{let n=Number(v);return !Number.isFinite(n)||n<0?"—":(n>0&&n<=1?n*100:n).toFixed(1)+"%"};
let S={raw:null,club:null,players:[],matches:[],searchClub:null};

$("#search").onsubmit=async e=>{e.preventDefault();$("#results").innerHTML='<div class="msg">Hledám…</div>';try{let r=await fetch(`/api/search?q=${encodeURIComponent($("#q").value)}&platform=${$("#platform").value}`),d=await r.json();if(!r.ok)throw Error(d.error);let a=A(d).flatMap(x=>Array.isArray(x)?x:[x]).filter(x=>x.clubId||x.clubid||x.id);$("#results").innerHTML=a.length?a.slice(0,15).map(c=>`<div class="result" data-id="${c.clubId||c.clubid||c.id}"><b>${c.clubName||c.name||"Klub"}</b><span>ID ${c.clubId||c.clubid||c.id}</span></div>`).join(""):'<div class="msg">Nic nenalezeno.</div>';document.querySelectorAll(".result").forEach(x=>x.onclick=()=>{const c=a.find(z=>String(z.clubId||z.clubid||z.id)===String(x.dataset.id));load(x.dataset.id,c||null)})}catch(e){$("#results").innerHTML=`<div class="msg">${e.message}</div>`}};
async function load(id,searchClub=null){$("#results").innerHTML='<div class="msg">Načítám kompletní data…</div>';let r=await fetch(`/api/club/${id}?platform=${$("#platform").value}`),d=await r.json();if(!r.ok)return $("#results").innerHTML=`<div class="msg">${d.error}</div>`;render(id,d,searchClub);$("#results").innerHTML="";history.replaceState(null,"",`/club/${id}`)}

function first(...vals){for(const v of vals)if(v!=null&&v!=="")return v;return 0}
function playerArray(d){let candidates=[d?.career?.members,d?.career?.players,d?.career,d?.members?.members,d?.members?.players,d?.members];for(const c of candidates){let a=A(c);if(a.length&&a.some(x=>P(x,["name","playerName","personaName","proName"],null)))return a}return[]}
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
  shots:N(P(x,["shots","shotsTaken","totalShots"],0)),
  passes,passAttempts,passRate:passAttempts?passes/passAttempts*100:0,
  tackles,tackleAttempts,tackleRate:tackleAttempts?tackles/tackleAttempts*100:0,
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
 if(crestId){ crest.src=`https://eafc-clubs-assets.ea.com/fc27/crests/${crestId}.png`; crest.onload=()=>{crest.hidden=false;$("#clubFallback").hidden=true}; crest.onerror=()=>{crest.hidden=true;$("#clubFallback").hidden=false}; }$("#divisionBadge").textContent=`DIV ${division}`;$("#skillBadge").textContent=`SR ${skill}`;$("#clubIdBadge").textContent=`ID ${id}`;$("#recW").textContent=`${w}W`;$("#recD").textContent=`${dr}D`;$("#recL").textContent=`${l}L`;
 let form=ms.slice(0,10).map(m=>m.result);$("#formPills").innerHTML=form.map(x=>`<span class="formPill ${x.toLowerCase()}">${x}</span>`).join("");let fw=form.filter(x=>x==="W").length,fd=form.filter(x=>x==="D").length,fl=form.filter(x=>x==="L").length;$("#formSummary").textContent=form.length?`${fw}W · ${fd}D · ${fl}L`:"—";
 let wr=g?(w/g*100):0,gd=gf-ga,winStreak=N(P(o,["wstreak","winStreak"],0)),unbeaten=N(P(o,["unbeatenstreak","unbeatenStreak"],0)),promotions=N(P(o,["promotions"],0)),relegations=N(P(o,["relegations"],0)),cleanSheets=N(P(searchClub||{},["cleanSheets"],P(o,["cleanSheets"],0)));
 $("#clubStats").innerHTML=metric("Current Division",division!=="—"?`Division ${division}`:"—")+metric("Best Division",bestDivision!=="—"?`Division ${bestDivision}`:"—")+metric("League Apps",g||"—")+metric("Win Rate",g?wr.toFixed(1)+"%":"—")+metric("Wins",w)+metric("Draws",dr)+metric("Losses",l)+metric("Goals",gf||"—")+metric("Conceded",ga||"—")+metric("Goal Diff",(gf||ga)?`${gd>=0?"+":""}${gd}`:"—")+metric("Goals / Game",g?(gf/g).toFixed(2):"—")+metric("Conceded / Game",g?(ga/g).toFixed(2):"—")+metric("Skill Rating",skill)+metric("Win Streak",winStreak)+metric("Unbeaten Streak",unbeaten)+metric("Promotions",promotions)+metric("Relegations",relegations)+metric("Clean Sheets",cleanSheets||"—");
 $("#performanceStats").innerHTML=metric("Recent W",fw)+metric("Recent D",fd)+metric("Recent L",fl)+metric("Recent Goals",ms.slice(0,10).reduce((a,m)=>a+m.og,0))+metric("Recent Conceded",ms.slice(0,10).reduce((a,m)=>a+m.tg,0))+metric("Recent GD",ms.slice(0,10).reduce((a,m)=>a+m.og-m.tg,0))+metric("Squad",ps.length)+metric("League matches loaded",ms.filter(m=>m.type==="league").length)+metric("Playoff loaded",ms.filter(m=>m.type==="playoff").length)+metric("Friendly loaded",ms.filter(m=>m.type==="friendly").length);
 $("#playerCount").textContent=`${ps.length} hráčů`;$("#players").innerHTML=ps.length?ps.map((p,i)=>{let x=advancedFor(p);return `<tr><td>${i+1}</td><td data-p="${p.id}"><b>${p.name}</b>${p.accountName&&p.accountName!==p.name?`<small style="display:block;opacity:.55">${p.accountName}</small>`:""}</td><td>${p.games}</td><td>${p.goals}</td><td>${p.assists}</td><td><b>${p.ga}</b></td><td>${p.rating?p.rating.toFixed(1):"—"}</td><td>${p.motm}</td><td>${p.shotRate?pct(p.shotRate):"—"}</td><td>${p.passes||"—"}</td><td>${p.passRate?pct(p.passRate):"—"}</td><td>${p.tackles||"—"}</td><td>${p.tackleRate?pct(p.tackleRate):"—"}</td><td>${p.cleanDef||"—"}</td><td>${p.cleanGk||"—"}</td><td>${p.reds||0}</td></tr>`}).join(""):'<tr><td colspan="16">EA neposlalo career hráče.</td></tr>';
 document.querySelectorAll("[data-p]").forEach(x=>x.onclick=()=>showPlayer(x.dataset.p));
 let scorer=[...ps].sort((a,b)=>b.goals-a.goals)[0],assist=[...ps].sort((a,b)=>b.assists-a.assists)[0],rating=[...ps].sort((a,b)=>b.rating-a.rating)[0];
 $("#leaders").innerHTML=ps.length?[[scorer,"TOP SCORER",`${scorer.goals} G`],[assist,"PLAYMAKER",`${assist.assists} A`],[rating,"RATING KING",rating.rating?rating.rating.toFixed(2):"—"]].map(([p,t,z])=>`<div class="leader"><small>${t}</small><b>${p.name}</b><span>${z}</span></div>`).join(""):"";
 $("#funAwards").innerHTML=ps.length?[[scorer,"GOLDEN BOOT",`${scorer.goals} gólů`],[assist,"ASSIST KING",`${assist.assists} asistencí`],[rating,"MR. CONSISTENT",`${rating.rating?rating.rating.toFixed(2):"—"} rating`]].map(([p,t,z])=>`<article class="award"><span>${t}</span><b>${p.name}</b><p>${z}</p></article>`).join(""):"<div class=msg>Zatím bez dat.</div>";
 $("#analyticsCards").innerHTML=metric("Win Rate",g?wr.toFixed(1)+"%":"—")+metric("Goals/Game",g?(gf/g).toFixed(2):"—")+metric("Goal Diff",(gf||ga)?`${gd>=0?"+":""}${gd}`:"—")+metric("Top G+A",ps[0]?`${ps[0].name} · ${ps[0].ga}`:"—");
 $("#matchList").innerHTML=ms.length?ms.map((m,i)=>`<div class="match" data-m="${i}"><span>${m.date?m.date.toLocaleDateString("cs-CZ"):"—"}</span><span>${m.type}</span><span class="home">${m.ours}</span><span class="score">${m.og}:${m.tg}</span><b>${m.opp}</b><b class="${m.result.toLowerCase()}">${m.result}</b></div>`).join(""):'<div class="msg" style="padding:20px">EA neposlalo historii zápasů.</div>';
 document.querySelectorAll("[data-m]").forEach(x=>x.onclick=()=>showMatch(+x.dataset.m));
 let er=d.errors||{};$("#status").innerHTML=["info","overall","career","members","achievements","league","playoff","friendly"].map(k=>`<div class="endpoint"><span>${k}</span><b>${er[k]?"CHYBA":"OK"}</b></div>`).join("");
 fillCompare();$("#home").hidden=true;$("#dash").hidden=false;window.scrollTo({top:0,behavior:"smooth"});loadHistory(id)
}
function stat(k,v){return`<div class="stat"><small>${k}</small><b>${v}</b></div>`}
function showPlayer(id){
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
function showMatch(i){
 let m=S.matches[i],ps=m.players.map(matchPlayer);
 $("#matchContent").innerHTML=`<div class="profile"><small>${m.type.toUpperCase()} · ${m.date?m.date.toLocaleDateString("cs-CZ"):""}</small><h2>${m.ours} ${m.og}:${m.tg} ${m.opp}</h2><div class="stats">${stat("RESULT",m.result)}${stat("OUR GOALS",m.og)}${stat("OPP GOALS",m.tg)}${stat("PLAYERS",ps.length)}</div><h3 class="sectionTitle">PLAYER MATCH STATS</h3>${ps.length?matchStatsTable(ps):'<div class="msg">EA v tomto zápase neposlalo hráčské statistiky.</div>'}</div>`;$("#matchView").hidden=false
}
function fillCompare(){let opts=S.players.map(p=>`<option value="${p.id}">${p.name}</option>`).join("");$("#cmpA").innerHTML=opts;$("#cmpB").innerHTML=opts;if(S.players[1])$("#cmpB").value=S.players[1].id;compare()}
function advancedFor(p){
 let ms=S.matches.map(m=>m.players.map(matchPlayer).find(x=>x.id===p.id||String(x.name).toLowerCase()===String(p.name).toLowerCase())).filter(Boolean);
 let sum=k=>ms.reduce((a,x)=>a+N(x[k]),0),pa=sum("passAttempts"),pm=sum("passes"),ta=sum("tackleAttempts"),tm=sum("tackles");
 return {...p,shots:sum("shots"),passes:pm,passAttempts:pa,passRate:pa?pm/pa*100:0,tackles:tm,tackleAttempts:ta,tackleRate:ta?tm/ta*100:0,saves:sum("saves"),secondAssists:sum("secondAssists"),dribbles:sum("dribbles"),interceptions:sum("interceptions"),standingWon:sum("standingWon"),slidingWon:sum("slidingWon"),throughBalls:sum("throughBalls")}
}
function compare(){let aa=S.players.find(x=>x.id===$("#cmpA").value),bb=S.players.find(x=>x.id===$("#cmpB").value);if(!aa||!bb)return;let a=advancedFor(aa),b=advancedFor(bb);let rows=[["Matches","games"],["Goals","goals"],["Assists","assists"],["2nd assists (recent)*","secondAssists"],["G+A","ga"],["Avg rating","rating"],["MOTM","motm"],["Shots*","shots"],["Passes*","passes"],["Pass %*","passRate"],["Tackles*","tackles"],["Tackle %*","tackleRate"],["Dribbles*","dribbles"],["Saves*","saves"]];$("#compareBody").innerHTML=`<div class="compareGrid">${rows.map(([label,k])=>{let av=a[k],bv=b[k],fmt=k.includes("Rate")?pct:(v=>k==="rating"&&v?Number(v).toFixed(2):v??"—");return`<div class="cmpCell ${Number(av)>Number(bv)?"better":""}">${fmt(av)}</div><div class="cmpCell">${label}</div><div class="cmpCell ${Number(bv)>Number(av)?"better":""}">${fmt(bv)}</div>`}).join("")}</div><p class="note">* Z aktuálně dostupné historie zápasů EA.</p>`}
$("#cmpA").onchange=compare;$("#cmpB").onchange=compare;document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$("#"+b.dataset.close).hidden=true);
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

async function loadHistory(id){
 try{
  const [hr,ar]=await Promise.all([fetch(`/api/history/${id}`),fetch(`/api/analytics/${id}`)]);
  const h=await hr.json(),a=await ar.json();
  $("#dbState").textContent=h.enabled?"DATABASE ON":"LIVE ONLY";
  if(!h.enabled){
    $("#historyStats").innerHTML=metric("DATABASE","OFF")+metric("HISTORY","LIVE ONLY");
    $("#chemistry").innerHTML='<div class="msg">Nastav DATABASE_URL na Renderu. Pak se každý nalezený zápas začne archivovat.</div>';
    return;
  }
  // DB may have discovered a Virtual Pro name from raw match-player fields.
  const byId=new Map((h.players||[]).map(p=>[String(p.player_id),p]));
  let changed=false;
  for(const p of S.players){
    const dbp=byId.get(String(p.id));
    if(dbp?.pro_name && p.name!==dbp.pro_name){p.accountName=p.accountName||p.name;p.name=dbp.pro_name;changed=true;}
  }
  if(changed){
    $("#players").querySelectorAll("[data-p]").forEach(el=>{
      const p=S.players.find(q=>String(q.id)===String(el.dataset.p));
      if(p)el.innerHTML=`<b>${p.name}</b>${p.accountName&&p.accountName!==p.name?`<small style="display:block;opacity:.55">${p.accountName}</small>`:""}`;
    });
  }
  const games=h.matches.length,w=h.matches.filter(x=>x.result==="W").length;
  const goals=h.matches.reduce((s,x)=>s+N(x.goals),0);
  const sa=h.players.reduce((s,x)=>s+N(x.second_assists),0);
  $("#historyStats").innerHTML=metric("STORED MATCHES",games)+metric("DB WIN RATE",games?Math.round(w/games*100)+"%":"—")+metric("STORED GOALS",goals)+metric("2ND ASSISTS",sa);
  const snaps=[...h.snapshots].reverse().filter(x=>x.skill_rating!=null);
  $("#skillHistory").innerHTML=snaps.length>1?`<div class="title"><h3>SKILL HISTORY</h3></div><div class="chart">${snaps.slice(-60).map(x=>{let vals=snaps.slice(-60).map(y=>N(y.skill_rating)),mn=Math.min(...vals),mx=Math.max(...vals),height=mx===mn?50:10+(N(x.skill_rating)-mn)/(mx-mn)*90;return `<div class="bar" style="height:${height}%"><span>${Math.round(N(x.skill_rating))}</span></div>`}).join("")}</div>`:'';
  const chem=a.chemistry||[];
  $("#chemistry").innerHTML=chem.length?chem.map((x,i)=>`<div class="endpoint"><span>#${i+1} ${x.a_name} + ${x.b_name}</span><b>${x.matches} záp. · ${x.matches?Math.round(N(x.wins)/N(x.matches)*100):0}% WR</b></div>`).join(""):'<div class="msg">Chemistry se objeví po uložení více společných zápasů.</div>';
 }catch(e){$("#dbState").textContent="DB ERROR";$("#chemistry").innerHTML=`<div class="msg">${e.message}</div>`}
}

function openTab(tab,push=true){document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));document.querySelectorAll("[data-pane]").forEach(p=>p.classList.toggle("active",p.dataset.pane===tab));if(push&&S.club)history.replaceState(null,"",`/club/${S.club.id}/${tab==="stats"?"":tab}`.replace(/\/$/,""))}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>openTab(b.dataset.tab));
$("#openSearch").onclick=()=>{history.replaceState(null,"","/");$("#dash").hidden=true;$("#home").hidden=false;$("#q").focus()};
