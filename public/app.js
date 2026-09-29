
const $ = s => document.querySelector(s);
const n = v => Number(v ?? 0);
const pick = (o, keys, fallback=0) => { for(const k of keys) if(o && o[k] != null) return o[k]; return fallback; };
const arr = x => Array.isArray(x) ? x : x ? Object.values(x).filter(v=>v && typeof v==="object") : [];

$("#searchForm").addEventListener("submit", async e => {
  e.preventDefault();
  const box=$("#searchResults"); box.innerHTML='<div class="loading">Hledám v EA databázi…</div>';
  try{
    const r=await fetch(`/api/search?q=${encodeURIComponent($("#clubInput").value)}&platform=${$("#platform").value}`);
    const data=await r.json(); if(!r.ok) throw new Error(data.error);
    const clubs=arr(data).flatMap(v=>Array.isArray(v)?v:[v]).filter(x=>x.clubId||x.clubid||x.id);
    if(!clubs.length){box.innerHTML='<div class="loading">Nic. Buď překlep, nebo EA zase praktikuje svůj oblíbený sport: neposkytování dat.</div>';return}
    box.innerHTML=clubs.slice(0,12).map(c=>`<div class="result" data-id="${c.clubId||c.clubid||c.id}"><b>${c.clubName||c.name||"Neznámý klub"}</b><small>${c.clubId||c.clubid||c.id} · ${c.currentDivision ? "Divize "+c.currentDivision : "Pro Clubs"}</small></div>`).join("");
    box.querySelectorAll(".result").forEach(el=>el.onclick=()=>loadClub(el.dataset.id));
  }catch(err){box.innerHTML=`<div class="loading error">${err.message}</div>`}
});

async function loadClub(id){
  $("#searchResults").innerHTML='<div class="loading">Načítám klub, hráče a zápasy…</div>';
  const platform=$("#platform").value;
  try{
    const r=await fetch(`/api/club/${id}?platform=${platform}`), d=await r.json();
    if(!r.ok) throw new Error(d.error);
    render(id,d); $("#searchResults").innerHTML=""; $("#dashboard").scrollIntoView({behavior:"smooth"});
  }catch(err){$("#searchResults").innerHTML=`<div class="loading error">${err.message}</div>`}
}
function render(id,d){
  const info=(d.info && (d.info[id]||Object.values(d.info)[0]))||{};
  const overall=(d.overall && (d.overall[id]||Object.values(d.overall)[0]))||d.overall||{};
  $("#clubName").textContent=info.name||overall.clubName||`Club ${id}`;
  $("#clubMeta").textContent=`${info.customKit?.stadName||"EA Pro Clubs"} · Club ID ${id}`;
  const w=n(pick(overall,["wins","win","gamesWon"])), dr=n(pick(overall,["draws","draw","gamesDrawn"])), l=n(pick(overall,["losses","loss","gamesLost"]));
  const gp=w+dr+l, gf=n(pick(overall,["goals","goalsFor","goalsScored"])), ga=n(pick(overall,["goalsAgainst","goalsConceded"]));
  $("#skill").textContent=pick(overall,["skillRating","skill","clubSkillRating"],"—");
  $("#record").textContent=`${w}-${dr}-${l}`; $("#games").textContent=`${gp} zápasů`;
  $("#winrate").textContent=gp?`${Math.round(w/gp*100)}%`:"—";
  $("#gd").textContent=gf||ga ? `${gf-ga>=0?"+":""}${gf-ga}`:"—"; $("#gfga").textContent=gf||ga?`${gf}:${ga} skóre`:"bez dat";
  renderPlayers(d.members); renderMatches(d.matches, info.name||overall.clubName||"Váš klub");
  $("#dashboard").classList.remove("hidden"); $("#emptyState").style.display="none";
}
function normalizePlayers(data){
  let p=arr(data);
  if(data?.members) p=arr(data.members);
  if(data?.players) p=arr(data.players);
  return p.map(x=>({
    name:pick(x,["name","playerName","personaName","proName"],"Neznámý"),
    games:n(pick(x,["gamesPlayed","games","appearances"])),
    goals:n(pick(x,["goals","goalsScored"])),
    assists:n(pick(x,["assists"])),
    rating:Number(pick(x,["ratingAve","averageRating","rating"],0))
  })).sort((a,b)=>(b.goals+b.assists)-(a.goals+a.assists));
}
function renderPlayers(data){
  const p=normalizePlayers(data); $("#playerCount").textContent=`${p.length} hráčů`;
  $("#players").innerHTML=p.length?p.map((x,i)=>`<tr><td>${i+1}</td><td>${x.name}</td><td>${x.games}</td><td>${x.goals}</td><td>${x.assists}</td><td><b>${x.goals+x.assists}</b></td><td>${x.rating?`<span class="rating">${x.rating.toFixed(1)}</span>`:"—"}</td></tr>`).join(""):'<tr><td colspan="7">EA neposlalo hráčské career stats.</td></tr>';
  if(p.length){const m=p[0];$("#mvp").innerHTML=`<div class="avatar">${m.goals+m.assists}</div><h4>${m.name}</h4><p>${m.goals} gólů · ${m.assists} asistencí · ${m.games} zápasů. Aktuální král tabulky podle G+A.</p>`}
}
function renderMatches(data,club){
  const ms=arr(data).slice(0,20);
  $("#matchList").innerHTML=ms.length?ms.map(m=>{
    const clubs=m.clubs||m.clubInfo||{}; const vals=arr(clubs);
    let home=vals[0]||{}, away=vals[1]||{};
    if(!vals.length){home={name:pick(m,["homeClubName","homeName"],"Domácí"),goals:pick(m,["homeGoals","homeScore"],0)};away={name:pick(m,["awayClubName","awayName"],"Hosté"),goals:pick(m,["awayGoals","awayScore"],0)}}
    const hn=home.name||home.clubName||"Domácí", an=away.name||away.clubName||"Hosté";
    const hs=n(pick(home,["goals","score"],pick(m,["homeGoals","homeScore"],0))), as=n(pick(away,["goals","score"],pick(m,["awayGoals","awayScore"],0)));
    const ours=hn.toLowerCase()===club.toLowerCase()?hs:as, theirs=hn.toLowerCase()===club.toLowerCase()?as:hs;
    const result=ours>theirs?"W":ours<theirs?"L":"D";
    const ts=pick(m,["timestamp","date","matchTimestamp"],"");
    const date=ts?new Date(String(ts).length<13?n(ts)*1000:ts).toLocaleDateString("cs-CZ"):"—";
    return `<div class="match"><span class="date">${date}</span><span class="home">${hn}</span><span class="score">${hs} : ${as}</span><span class="away">${an}</span><span class="badge ${result.toLowerCase()}">${result}</span></div>`
  }).join(""):'<div class="loading">Žádná historie zápasů nebyla vrácena.</div>';
}
