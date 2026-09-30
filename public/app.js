const $=s=>document.querySelector(s),N=v=>Number(v??0),A=x=>Array.isArray(x)?x:(x&&typeof x==="object"?Object.values(x).filter(v=>v&&typeof v==="object"):[]);
const P=(o,ks,d=0)=>{for(const k of ks)if(o&&o[k]!=null)return o[k];return d};
const pct=v=>{let n=Number(v);return !Number.isFinite(n)||n<0?"—":(n>0&&n<=1?n*100:n).toFixed(1)+"%"};
let S={raw:null,club:null,players:[],matches:[]};

$("#search").onsubmit=async e=>{e.preventDefault();$("#results").innerHTML='<div class="msg">Hledám…</div>';try{let r=await fetch(`/api/search?q=${encodeURIComponent($("#q").value)}&platform=${$("#platform").value}`),d=await r.json();if(!r.ok)throw Error(d.error);let a=A(d).flatMap(x=>Array.isArray(x)?x:[x]).filter(x=>x.clubId||x.clubid||x.id);$("#results").innerHTML=a.length?a.slice(0,15).map(c=>`<div class="result" data-id="${c.clubId||c.clubid||c.id}"><b>${c.clubName||c.name||"Klub"}</b><span>ID ${c.clubId||c.clubid||c.id}</span></div>`).join(""):'<div class="msg">Nic nenalezeno.</div>';document.querySelectorAll(".result").forEach(x=>x.onclick=()=>load(x.dataset.id))}catch(e){$("#results").innerHTML=`<div class="msg">${e.message}</div>`}};
async function load(id){$("#results").innerHTML='<div class="msg">Načítám kompletní data…</div>';let r=await fetch(`/api/club/${id}?platform=${$("#platform").value}`),d=await r.json();if(!r.ok)return $("#results").innerHTML=`<div class="msg">${d.error}</div>`;render(id,d);$("#results").innerHTML=""}

function first(...vals){for(const v of vals)if(v!=null&&v!=="")return v;return 0}
function playerArray(d){let candidates=[d?.career?.members,d?.career?.players,d?.career,d?.members?.members,d?.members?.players,d?.members];for(const c of candidates){let a=A(c);if(a.length&&a.some(x=>P(x,["name","playerName","personaName","proName"],null)))return a}return[]}
function normalizePlayer(x){
 const games=N(P(x,["gamesPlayed","games","appearances"],0)),goals=N(P(x,["goals","goalsScored"],0)),assists=N(P(x,["assists"],0));
 return {raw:x,id:String(P(x,["personaId","playerId","id","name","personaName"],Math.random())),name:P(x,["name","playerName","personaName","proName"],"Neznámý"),
 games,goals,assists,ga:goals+assists,rating:Number(P(x,["ratingAve","averageRating","rating"],0)),motm:N(P(x,["manOfTheMatch","motm","mom"],0)),
 shots:N(P(x,["shots","shotsTaken","totalShots"],0)),shotRate:Number(P(x,["shotSuccessRate","shootingSuccessRate"],0)),
 passes:N(P(x,["passesMade","passes","totalPasses"],0)),passAttempts:N(P(x,["passAttempts","passesAttempted"],0)),passRate:Number(P(x,["passSuccessRate","passingSuccessRate"],0)),
 tackles:N(P(x,["tacklesMade","tackles","totalTackles"],0)),tackleAttempts:N(P(x,["tackleAttempts","tacklesAttempted"],0)),tackleRate:Number(P(x,["tackleSuccessRate"],0)),
 saves:N(P(x,["saves"],0)),clean:N(P(x,["cleanSheets","cleanSheet"],0)),reds:N(P(x,["redCards","redCard"],0)),position:P(x,["position","pos"],"—")}
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
  seconds:N(P(x,["secondsPlayed","gameTime","seconds"],0)),
  conceded:N(P(x,["goalsconceded","goalsConceded"],0)),
  cleanAny:N(P(x,["cleansheetsany"],0)),
  cleanDef:N(P(x,["cleansheetsdef"],0)),
  cleanGk:N(P(x,["cleansheetsgk"],0))
 }
}

function render(id,d){
 let info=(d.info&&(d.info[id]||A(d.info)[0]))||{},o=(d.overall&&(d.overall[id]||A(d.overall)[0]))||d.overall||{},name=info.name||o.clubName||`Club ${id}`;
 let w=N(P(o,["wins","gamesWon"])),dr=N(P(o,["draws","gamesDrawn"])),l=N(P(o,["losses","gamesLost"])),g=w+dr+l,gf=N(P(o,["goals","goalsFor","goalsScored"])),ga=N(P(o,["goalsAgainst","goalsConceded"]));
 let ps=playerArray(d).map(normalizePlayer).sort((a,b)=>b.ga-a.ga),ms=(d.matches||[]).map(m=>normalizeMatch(m,name,id));
 S={raw:d,club:{id,name},players:ps,matches:ms};
 $("#clubName").textContent=name;$("#clubMeta").textContent=`Club ID ${id} · ${d.platform}`;$("#skill").textContent=P(o,["skillRating","skill","clubSkillRating"],"—");$("#record").textContent=`${w}-${dr}-${l}`;$("#wr").textContent=g?Math.round(w/g*100)+"%":"—";$("#gd").textContent=gf||ga?`${gf-ga>=0?"+":""}${gf-ga}`:"—";
 $("#playerCount").textContent=`${ps.length} hráčů`;$("#players").innerHTML=ps.length?ps.map((p,i)=>`<tr><td>${i+1}</td><td data-p="${p.id}">${p.name}</td><td>${p.games}</td><td>${p.goals}</td><td>${p.assists}</td><td><b>${p.ga}</b></td><td>${p.rating?p.rating.toFixed(1):"—"}</td><td>${p.motm}</td><td>${p.shots||"—"}</td><td>${pct(p.shotRate)}</td><td>${p.passes||"—"}</td><td>${pct(p.passRate)}</td><td>${p.tackles||"—"}</td><td>${pct(p.tackleRate)}</td></tr>`).join(""):'<tr><td colspan="14">EA neposlalo career hráče.</td></tr>';
 document.querySelectorAll("[data-p]").forEach(x=>x.onclick=()=>showPlayer(x.dataset.p));
 let scorer=[...ps].sort((a,b)=>b.goals-a.goals)[0],assist=[...ps].sort((a,b)=>b.assists-a.assists)[0],rating=[...ps].sort((a,b)=>b.rating-a.rating)[0];
 $("#leaders").innerHTML=ps.length?[[scorer,"TOP SCORER",`${scorer.goals} G`],[assist,"PLAYMAKER",`${assist.assists} A`],[rating,"RATING KING",rating.rating?rating.rating.toFixed(2):"—"]].map(([p,t,s])=>`<div class="leader"><small>${t}</small><b>${p.name}</b><span>${s}</span></div>`).join(""):"";
 $("#matchList").innerHTML=ms.length?ms.map((m,i)=>`<div class="match" data-m="${i}"><span>${m.date?m.date.toLocaleDateString("cs-CZ"):"—"}</span><span>${m.type}</span><span class="home">${m.ours}</span><span class="score">${m.og}:${m.tg}</span><b>${m.opp}</b><b class="${m.result.toLowerCase()}">${m.result}</b></div>`).join(""):'<div class="msg">EA neposlalo historii zápasů.</div>';
 document.querySelectorAll("[data-m]").forEach(x=>x.onclick=()=>showMatch(+x.dataset.m));
 let er=d.errors||{};$("#status").innerHTML=["info","overall","career","members","achievements","league","playoff","friendly"].map(k=>`<div class="endpoint"><span>${k}</span><b class="${er[k]?"bad":"ok"}">${er[k]?"CHYBA":"OK"}</b></div>`).join("");
 fillCompare();$("#raw").textContent=JSON.stringify(d,null,2);$("#dash").hidden=false;$("#dash").scrollIntoView({behavior:"smooth"})
}
function stat(k,v){return`<div class="stat"><small>${k}</small><b>${v}</b></div>`}
function showPlayer(id){
 let p=S.players.find(x=>x.id===id);if(!p)return;
 let recent=S.matches.map(m=>{let s=m.players.map(matchPlayer).find(x=>x.id===id||String(x.name).toLowerCase()===String(p.name).toLowerCase());return s?{m,s}:null}).filter(Boolean).slice(0,10);
 let ratings=recent.map(x=>x.s.rating).filter(Boolean).reverse(),max=Math.max(10,...ratings);
 $("#playerContent").innerHTML=`<div class="profile"><small>PLAYER PROFILE · ${S.club.name}</small><h2>${p.name}</h2><div class="stats">${stat("MATCHES",p.games)}${stat("GOALS",p.goals)}${stat("ASSISTS",p.assists)}${stat("G+A",p.ga)}${stat("AVG RATING",p.rating?p.rating.toFixed(2):"—")}${stat("MOTM",p.motm)}${stat("SHOTS",p.shots||"—")}${stat("SHOT %",pct(p.shotRate))}${stat("PASSES",p.passes||"—")}${stat("PASS %",pct(p.passRate))}${stat("TACKLES",p.tackles||"—")}${stat("TACKLE %",pct(p.tackleRate))}${stat("SAVES",p.saves||"—")}${stat("CLEAN SHEETS",p.clean||"—")}${stat("RED CARDS",p.reds||"—")}${stat("POSITION",p.position)}</div><h3 class="sectionTitle">RATING TREND · LAST ${ratings.length}</h3>${ratings.length?`<div class="chart">${ratings.map(r=>`<div class="bar" style="height:${Math.max(5,r/max*100)}%"><span>${r.toFixed(1)}</span></div>`).join("")}</div>`:'<div class="msg">Pro graf zatím nejsou match ratings.</div>'}<h3 class="sectionTitle">RECENT MATCHES</h3>${recent.length?matchStatsTable(recent.map(x=>x.s),recent.map(x=>x.m.opp)):'<div class="msg">EA u načtených zápasů nespárovalo hráče.</div>'}</div>`;$("#playerView").hidden=false
}
function matchStatsTable(ps,opps=[]){return`<div class="table"><table><thead><tr><th>Hráč</th><th>Pos</th><th>Rating</th><th>G</th><th>A</th><th>Shots</th><th>Passes</th><th>Pass Att.</th><th>Pass%</th><th>Tackles</th><th>Tackle Att.</th><th>Tackle%</th><th>Saves</th><th>MOTM</th><th>RC</th></tr></thead><tbody>${ps.map((p,i)=>`<tr><td>${opps[i]||p.name}</td><td>${p.pos||"—"}</td><td>${p.rating?p.rating.toFixed(1):"—"}</td><td>${p.goals}</td><td>${p.assists}</td><td>${p.shots}</td><td>${p.passes}</td><td>${p.passAttempts}</td><td>${pct(p.passRate)}</td><td>${p.tackles}</td><td>${p.tackleAttempts}</td><td>${pct(p.tackleRate)}</td><td>${p.saves}</td><td>${p.motm}</td><td>${p.reds}</td></tr>`).join("")}</tbody></table></div>`}
function showMatch(i){
 let m=S.matches[i],ps=m.players.map(matchPlayer);
 $("#matchContent").innerHTML=`<div class="profile"><small>${m.type.toUpperCase()} · ${m.date?m.date.toLocaleDateString("cs-CZ"):""}</small><h2>${m.ours} ${m.og}:${m.tg} ${m.opp}</h2><div class="stats">${stat("RESULT",m.result)}${stat("OUR GOALS",m.og)}${stat("OPP GOALS",m.tg)}${stat("PLAYERS",ps.length)}</div><h3 class="sectionTitle">PLAYER MATCH STATS</h3>${ps.length?matchStatsTable(ps):'<div class="msg">EA v tomto match payloadu neposlalo player stats. Otevři RAW JSON dole na dashboardu pro kontrolu struktury.</div>'}<h3 class="sectionTitle">RAW MATCH DATA</h3><pre class="debug">${escapeHtml(JSON.stringify(m.raw,null,2))}</pre></div>`;$("#matchView").hidden=false
}
function fillCompare(){let opts=S.players.map(p=>`<option value="${p.id}">${p.name}</option>`).join("");$("#cmpA").innerHTML=opts;$("#cmpB").innerHTML=opts;if(S.players[1])$("#cmpB").value=S.players[1].id;compare()}
function compare(){let a=S.players.find(x=>x.id===$("#cmpA").value),b=S.players.find(x=>x.id===$("#cmpB").value);if(!a||!b)return;let rows=[["Matches","games"],["Goals","goals"],["Assists","assists"],["G+A","ga"],["Avg rating","rating"],["MOTM","motm"],["Shots","shots"],["Shot %","shotRate"],["Passes","passes"],["Pass %","passRate"],["Tackles","tackles"],["Tackle %","tackleRate"],["Clean sheets","clean"],["Red cards","reds"]];$("#compareBody").innerHTML=`<div class="compareGrid">${rows.map(([label,k])=>{let av=a[k],bv=b[k],fmt=k.includes("Rate")?pct:(v=>k==="rating"&&v?Number(v).toFixed(2):v||"—");return`<div class="cmpCell ${Number(av)>Number(bv)&&k!=="reds"?"better":""}">${fmt(av)}</div><div class="cmpCell">${label}</div><div class="cmpCell ${Number(bv)>Number(av)&&k!=="reds"?"better":""}">${fmt(bv)}</div>`}).join("")}</div>`}
$("#cmpA").onchange=compare;$("#cmpB").onchange=compare;$("#rawBtn").onclick=()=>{$("#raw").hidden=!$("#raw").hidden};document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$("#"+b.dataset.close).hidden=true);
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
