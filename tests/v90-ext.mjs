// v90 extended stats: parser + derived values (runs the browser module in a tiny fake window).
import fs from "node:fs";import vm from "node:vm";import assert from "node:assert/strict";
const src=fs.readFileSync(new URL("../public/v90/stats-ext.js",import.meta.url),"utf8");
const ctx={window:{},document:{addEventListener(){},body:{},getElementById(){return null}},location:{pathname:"/"},MutationObserver:class{observe(){}},console};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);
const X=ctx.CLUBROOM_EXT90;let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;console.log("PASS",m)};
// real sample from Skutec FC (PursuiitCZ): 6 tackle attempts, 0 made -> event 1 = tackles lost = 6
const real={goals:"4",shots:"6",passesmade:"6",passattempts:"6",tacklesmade:"0",tackleattempts:"6",redcards:"0",match_event_aggregate_0:"1:6,100:2,104:1,107:2,110:1,111:15,112:1",match_event_aggregate_1:"",match_event_aggregate_2:"",match_event_aggregate_3:""};
const e=X.ext(real);
ok(e.tacklesLost===6&&e.tackles===0&&e.tackleAtt===6,"event 1 = tackles lost matches EA tackle fields");
ok(e.beaten===1&&e.possWonAtt===1&&e.possLost===2&&e.offsides===1,"beaten / possession won high / lost / offside parsed");
ok(e.passC===6&&e.passF===0,"passes fall back to EA pass fields without events 215/216");
const f=X.ext({shots:"5",goals:"1",match_event_aggregate_0:"13:2,18:1,14:1,215:30",match_event_aggregate_1:"19:1,216:6,174:4,158:1",match_event_aggregate_2:"",match_event_aggregate_3:""});
ok(f.shotsOn===3&&f.shotsOff===2&&f.inBox===3&&f.outBox===2,"shot split summed across all aggregate buckets");
const v=X.view(f);ok(v.passA===36&&v.passPct===83&&v.shotAcc===60&&!("drbPct" in v),"derived pass %, shot accuracy; no dribble % (EA has no attempts)");
const t=X.sum([f,f,null]);ok(t.passC===60&&t.hasEvents,"sums ignore missing players");
ok(X.ext({goals:"1"}).hasEvents===false,"old data without events flagged");
const app=fs.readFileSync(new URL("../public/app.js",import.meta.url),"utf8");
ok(!/<th>xG<\/th>/.test(app)&&!fs.readFileSync(new URL("../public/matchMetricsConfig.generated.js",import.meta.url),"utf8").includes("'xg'"),"xG/xA removed from tables and metrics");
ok(app.includes("<td>${pa?`${pass}/${pa}`:'--'}</td>"),"match table shows pass counts, not only %");
console.log(`v90 ext: ${n} PASS`);
