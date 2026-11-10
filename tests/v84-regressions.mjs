import fs from "node:fs";import assert from "node:assert/strict";
const r=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log("PASS",m)};
const html=r("public/index.html"),css=r("public/v83/mobile-v84.css"),js=r("public/v83/mobile-nav-v84.js"),v78=r("public/v78/v78.css");
ok(html.includes("/v83/mobile-v84.css")&&html.includes("/v83/mobile-nav-v84.js"),"v84 mobile assets loaded");
ok(/\.heroForm44\{display:none!important\}/.test(css),"recent form removed from the club hero on every screen size");
ok(!/html,body\{overflow-x:hidden\}/.test(v78),"no overflow-x masking on html/body");
ok(css.includes(".playersPage,.miscPage68{grid-template-columns:minmax(0,1fr)!important}"),"grid pages cannot grow wider than the screen");
ok(/\.squadBoardScroller70[^}]*overflow-x:auto/.test(css),"squad board scrolls inside its own wrapper");
ok(/body\.hasClub84 \.topNav44\{display:none!important\}/.test(css)&&css.includes("env(safe-area-inset-bottom)"),"phones swap top pills for a bottom bar with safe-area padding");
for(const t of ["stats","players","matches","sessions","compare","analytics","misc","plus"])ok(js.includes(`['${t}'`),`bottom nav reaches tab ${t}`);
ok(js.includes("openTab(b.dataset.bn84"),"bottom nav uses the existing openTab router");
ok(js.includes("requestAnimationFrame")&&js.includes("!==hc"),"observer cannot loop on its own class changes");
ok(js.includes("Escape"),"More sheet closes on Escape");
console.log(`v84 regressions: ${n} PASS`);
// v86
{const f=r("public/v81/formations-v82.js"),app=r("public/app.js");
ok(app.includes("archetype:(x.archetypeid"),"matchPlayer keeps EA archetypeid");
ok(/12:'finisherA'/.test(f)&&/13:'target'/.test(f)&&/8:'maestro'/.test(f),"EA archetype ids mapped to names");
ok(f.includes("const ak=archKey(p);if(ak)return {key:ak,fromData:true}"),"real archetype wins over stat-derived style");
ok(f.includes("withArchetypes(d)"),"archive matches read archetype from stored raw EA data");
ok(/heroCrest44 :is\(img,svg,picture,club-crest,\.clubCrestFallback\)\{max-width:44px!important/.test(css),"compact hero clamps real crest images");}
console.log("v86 checks done");
// v87
{const s=r("public/v81/sessions-v81.js");
ok(s.includes("function awardsHtml(s,x,live)")&&s.includes("awardsHtml(s,x,lv)"),"session awards know whether the session is live");
ok(s.includes("After the session")&&s.includes("Awards unlock when the session ends"),"live session shows locked awards");
ok(s.includes("isLive(cur)&&a.dataset.s81Key.endsWith"),"reveal click ignored during a live session");
ok(s.includes("function scheduleUnlock()"),"awards unlock automatically when the session expires");}
// v88
{const app=r("public/app.js"),srv=r("server.js"),b=r("benchmarks.js");
ok(srv.includes('app.get("/api/benchmarks"')&&b.includes("GROUPING SETS ((grp),())"),"global benchmarks endpoint per position + all");
ok(b.includes("HAVING COUNT(*)>=$1"),"benchmarks only count players with the minimum matches");
ok(app.includes("function benchPct69(q,v,lowerBetter)")&&app.includes("benchGroup69(obj)"),"radar scores against Clubroom-wide distribution");
ok(app.includes("legacyRadar69(p,team,obj,cfg)"),"falls back to squad ranking while benchmark sample is too small");
ok(app.includes("x.player>=55")&&app.includes("x.player<=45"),"strengths/weaknesses only when clearly above/below typical");}
// v89
{const app=r("public/app.js");
ok(app.includes("location.pathname.match(/^\\/club\\/([^/]+)(?:\\/([a-z]+))?\\/?$/)"),"refresh on /club/:id[/:tab] reloads that club");
ok(app.includes("openTab(tab,false)"),"refresh restores the tab");}
// v91
{const s=r("public/v81/sessions-v81.js"),cfg=r("public/squadBoardConfig.generated.js"),x=r("public/v90/stats-ext.js");
ok(s.includes("<template>${front}</template>")&&s.includes("a.replaceWith(f)"),"award reveal swaps only that card (no page re-render)");
ok(s.includes("function lbCarousel(x)")&&r("public/v81/v81.css").includes("scroll-snap-type:x mandatory"),"session leaderboard is a swipeable slide carousel");
ok(!s.includes("data-s81-metric=\"${q[0]}\""),"old metric chips removed");
ok(["shooting","dribbling","discipline"].every(g=>cfg.includes(`id:'${g}'`))&&cfg.includes("sample:'eventMatches'"),"Squad Board has detailed event groups");
ok(x.includes("squadBoardData70=function(p)")&&!x.includes("drbPct"),"Squad Board merges event sums; no dribble %");}
