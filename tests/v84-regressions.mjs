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
ok(app.includes("function benchPct69(q,v,lowerBetter)")&&app.includes("benchGroup69(obj)"),"radar scores against Postgame-wide distribution");
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
// v94
{const t=r("public/v94/trends.js"),html=r("public/index.html");
ok(html.includes('id="formTrend94"')&&html.includes('id="mbm94"')&&html.includes("/v94/trends.js"),"Analytics form + match-by-match trend views mounted");
ok(t.includes("const WINDOWS=[5,10,20,30]")&&t.includes("function trendOf(ys)"),"window 5/10/20/30 and trend label from regression slope");
ok(t.includes("class=\"col94")&&t.includes("RES[res]"),"form uses rating columns coloured by result");
ok(t.includes("mbmGrid94")&&t.includes("['beaten','Opponents beaten'"),"match-by-match shows whole squad per stat incl. EA event stats");
ok(html.includes('<div id="mbm94"></div>'),"Match-by-Match small multiples host");}
// v95
{const srv=r("server.js"),legal=r("public/legal.html"),fsx=await import("node:fs");
ok(["terms","privacy","cookies","removal","refund","about"].every(f=>!fsx.existsSync(new URL(`../public/${f}.html`,import.meta.url))),"old legal pages merged into /legal");
ok(srv.includes('res.redirect(301,`/legal#${anchor}`)'),"old legal URLs redirect to /legal sections");
ok(["#about","#terms","#pass","#refunds","#privacy","#cookies","#removal"].every(a=>legal.includes(`href="${a}"`))&&legal.includes("{{OPERATOR_NAME}}")&&legal.includes("Art. 6(1)(f)"),"legal page has all sections, operator from env, GDPR bases");
ok(srv.includes("ADSENSE_CLIENT")&&srv.includes('app.get("/ads.txt"')&&srv.includes("adsInject("),"ads ready but off until ADS=on + ADSENSE_CLIENT");
ok(r("public/index.html").includes('<a href="/legal">Legal</a><a href="/pass">Postgame Pass</a>'),"footer: Legal + Postgame Pass");}
// v96
{const srv=r("server.js"),ss=r("public/v81/sessions-v81.js"),html=r("public/index.html");
ok(srv.includes('app.get(["/og/club/:id.png","/og/club/:id"]')&&srv.includes("summary_large_image")&&srv.includes("BOT_RE"),"club link previews: OG image + tags for chat bots");
ok(srv.includes('replace(/<meta (?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>/g,"")'),"default OG tags replaced on club pages");
ok(srv.includes('app.get(["/api/session-card/:id.png"')&&ss.includes("data-share-session96")&&ss.includes("${!lv?"),"session report PNG, share button only after the session");
ok(srv.includes('app.post("/api/discord/:id"')&&srv.includes('app.delete("/api/discord/:id/:hook"')&&srv.includes("setInterval(discordJob"),"Discord webhooks: add/remove + background job");
ok(html.includes('id="discord96"')&&html.includes("Session reports posted to your Discord"),"Discord panel in Pass tab + listed as Pass benefit");}
// v98
{const g=r("public/v98/gates.js"),srv=r("server.js"),t=r("public/v94/trends.js");
ok(g.includes("const HOURS=12")&&g.includes("Date.now()-unlockedAt()<HOURS*3600e3"),"one reward ad unlocks everything for the club for 12 h");
ok(g.includes("['.playerRadarSection69','pass','Player radar']"),"player radar is Pass-only");
ok(g.includes("const REWARD_ON=()=>ADS.on||TEST")&&g.includes("pass()||"),"reward gates only when ads are on; Pass opens everything");
ok(g.includes("rewardedSlotGranted")&&g.includes("fail()"),"GPT rewarded ad with no-fill fallback (user still gets access)");
ok(srv.includes("window.CLUBROOM_ADS=")&&srv.includes("GAM_REWARDED_UNIT")&&srv.includes("ADSENSE_SLOT_BANNER"),"ad config from env");
ok(t.includes("+w.dataset.win94>10&&window.CR_GATES&&!window.CR_GATES.open('reward')"),"Form 20/30 behind reward");
ok(!r("public/v78/clubroom-v78.js").includes("adGates:{enabled:qs.get('gates')==='1'"),"old v78 placeholder gates replaced");}
// v100
{const app=r("public/app.js"),srv=r("server.js");
ok(app.includes("function srcChip100(kind)")&&app.includes("srcChip100(m.sample==='matches'?'ea'")&&app.includes('const CAREER100=new Set(["games","goals","assists","ga","motm"])'),"every Squad Board / Compare stat shows its source (EA career vs Postgame archive)");
ok(srv.includes("const adsOn=()=>")&&srv.includes('name="google-adsense-account"'),"ADSENSE_CLIENT alone = AdSense site verification without gates");}
// v101
{const c=r("public/v101/compare.js"),html=r("public/index.html"),v78=r("public/v78/clubroom-v78.js");
ok(c.includes("const MAX=()=>pass()?4:2")&&c.includes("Compare up to 4 players"),"Compare: 2 players free, up to 4 with Pass");
ok(c.includes("cmpExplain101")&&c.includes("CAREER_ROWS")&&c.includes("ARCH_ROWS"),"Compare explains EA career vs Postgame archive in two separate tables");
ok(c.includes("x.shots>=10?pc(x.goals,x.shots)"),"shot conversion needs 10+ shots");
ok(!html.includes("All matches")&&html.includes('<div id="analyticsMatchByMatch" hidden>'),"Match-by-Match: All matches list removed");
ok(v78.includes("typeTag101"),"hat-tricks show match type breakdown");}
// v102
{const i=r("public/v102/insights.js"),html=r("public/index.html"),g=r("public/v98/gates.js");
ok(["impact","development","fatigue","when","detailed"].every(t=>html.includes(`data-analytics-tab="${t}"`))&&!html.includes('data-analytics-tab="clutch"')&&!html.includes('data-analytics-tab="passing"'),"Analytics tabs: Form, MBM, Impact, Development, Fatigue, When we win, Detailed");
ok(i.includes("m.result==='W'&&N(r.goals)>0&&N(r.goals)>=m.og-m.tg"),"decisive win = win that needed his goals");
ok(i.includes("bOf(m.sessionIndex)")&&i.includes("BANDS"),"fatigue by match number + day/time heatmap");
ok(i.includes("benchLock102")&&i.includes("if(!pass())"),"Development percentiles are Pass-only");
ok(g.includes('[data-analytics-pane="impact"]')&&!g.includes('[data-analytics-pane="match"]'),"new tabs behind reward ad; Match-by-Match free");
ok(html.includes("<b>POSTGAME</b>")&&r("server.js").includes('"admin@postgame.gg"')&&r("server.js").includes('"Kryštof Kadlec"'),"rebrand to Postgame + operator defaults");}
// v102.0.1: index.html must stay balanced (a broken nesting hid the whole Misc tab)
{const s=r("public/index.html");const a=s.indexOf('data-pane="analytics"'),b=s.indexOf('data-pane="misc"');const seg=s.slice(a,b);
ok(seg.split("<section").length===seg.split("</section>").length&&seg.split("<div").length===seg.split("</div>").length,"Analytics markup is balanced, Misc is not swallowed");}
ok(!r("public/v101/compare.js").includes("data-compare-swap62"),"Compare: no swap button");
