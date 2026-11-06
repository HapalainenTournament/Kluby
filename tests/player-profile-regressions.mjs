import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'.');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('public/app.js'),html=read('public/index.html'),css=read('public/style.css'),radar=read('public/charts/player-radar.js'),theme=read('public/charts/chart-theme.js'),cfg=read('public/charts/playerRadarConfig.generated.js'),server=read('server.js');
let failed=0;const test=(name,ok)=>{console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++};

test('popup playerView markup removed',!html.includes('id="playerView"'));
test('dedicated player page exists',html.includes('id="playerPage69"'));
test('player route is /club/:clubId/player/:playerId',app.includes('/^\\/club\\/([^/]+)\\/player\\/([^/]+)\\/?$/'));
test('showPlayer opens routed profile instead of overlay',app.includes('showPlayer=function(id){open69(id,true)}'));
test('back state stores tab and scroll',app.includes("clubroomScroll:window.scrollY")&&app.includes("clubroomTab:activeTab()"));
test('popstate restores scroll',app.includes("window.scrollTo({top:Number(e.state?.clubroomScroll)||0"));

test('hero uses existing player-card component',html.includes('id="playerHeroCardMount69"')&&app.includes("cardOnly69(p)"));
test('hero has Share and Change character',html.includes('id="playerShare69"')&&html.includes('id="playerCharacter69"'));
test('role badges reuse Key Threats metric definitions',app.includes("TOP SCORER")&&app.includes("CLINICAL")&&app.includes("CREATOR")&&app.includes("DEFENSIVE"));
test('hero has five requested metrics',app.includes("['MATCHES',a.matches]")&&app.includes("['G+A',a.ga]")&&app.includes("['AVG RATING'")&&app.includes("['MOTM',a.motm]")&&app.includes("['PASS %'"));
test('last-five form is archive result data',app.includes("rows.slice(0,5)")&&app.includes("playerForm69"));

test('radar config has six axes',(['attack','creation','passing','defense','discipline','rating'].every(x=>cfg.includes(`id:'${x}'`))));
test('radar values are per match/team percentile',app.includes('rankMetric69')&&app.includes('goalContributionsPerMatch')&&app.includes('redCardsPerMatch'));
test('discipline is lower-is-better',cfg.includes("key:'redCardsPerMatch',label:'Red cards / match',higherIsBetter:false"));
test('strengths hidden with fewer than 3 players',app.includes('if(r.teamCount<3)'));

test('Recharts uses named imports only',radar.includes('import {')&&!radar.includes('import * as')&&!radar.includes('import Recharts'));
test('Recharts imports only required radar components', ['ResponsiveContainer','RadarChart','PolarGrid','PolarAngleAxis','PolarRadiusAxis','Radar','Tooltip'].every(x=>radar.includes(x)));
test('shared chart theme wrapper exists',theme.includes('CLUBROOM_CHART_THEME')&&theme.includes('ClubroomChartFrame')&&theme.includes('ClubroomChartTooltip'));
test('radar animations disabled for DOM/PNG capture',radar.match(/isAnimationActive:false/g)?.length>=2);
test('radar exposes standalone SVG serializer for export compatibility',radar.includes('standaloneRadarSvg')&&radar.includes('XMLSerializer'));
test('radar does not use canvas or foreignObject',!radar.includes('canvas')&&!radar.includes('foreignObject'));

test('profile tabs include six requested tabs', ['Overview','Attacking','Passing','Defending','Trends','Match Log'].every(x=>html.includes(`>${x}<`)));
test('rating trend remains manual, not Recharts',app.includes('function ratingTrend69')&&!radar.includes('BarChart')&&!radar.includes('LineChart'));
test('rating trend uses W/D/L result classes',app.includes('ratingBar69 ${resultClass(r.result)}'));
test('rating trend has fixed 5-10 scale and average line',app.includes('(val-5)/5*100')&&app.includes('ratingAvg69'));
test('rating tooltip contains opponent score date rating',app.includes("tip=`${r.opponent||'Opponent'} · ${N(r.team_goals)}:${N(r.opponent_goals)} · ${date} · ${val.toFixed(1)}`"));

test('profile archive copy is English',app.includes('Archived matches with player stats')||app.includes('archived matches with player stats'));
test('server user-facing Czech errors removed',!/(Zadej|selhal|Neplatné|běží)/.test(server));
test('mobile profile CSS exists',css.includes('@media(max-width:520px)')&&css.includes('.playerHero69{grid-template-columns:1fr'));

process.exit(failed?1:0);
