import fs from 'node:fs';
const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../public/style.css',import.meta.url),'utf8');
const cfg=fs.readFileSync(new URL('../public/matchMetricsConfig.generated.js',import.meta.url),'utf8');
const checks=[
 ['deduplicates live/archive by match id',/const ids=new Set\(live\.map/.test(app)&&/filter\(m=>!ids\.has\(String\(m\.match_id\)\)\)/.test(app)],
 ['list groups by day',/matchDayHead73/.test(app)&&/weekday:'short'/.test(app)],
 ['source result and opponent filters exist',/data-source73/.test(app)&&/data-result73/.test(app)&&/matchSearch73/.test(app)],
 ['our club omitted from match list row',!/matchRow73[\s\S]{0,900}S\.club\?\.name/.test(app.match(/function row73[\s\S]*?function groupKey/)[0])],
 ['row opens dedicated route',/\/match\/\$\{encodeURIComponent/.test(app)&&/data-match-open73/.test(app)],
 ['dedicated match page exists',/id="matchPage73"/.test(html)&&/Overview<\/button>/.test(html)&&/Player Stats/.test(html)&&/Formations/.test(html)],
 ['back restores stored scroll',/clubroomScroll:window\.scrollY/.test(app)&&/window\.scrollTo\(\{top:Number\(e\.state\?\.clubroomScroll\)/.test(app)],
 ['butterfly config has four groups',/Scoring/.test(cfg)&&/Passing/.test(cfg)&&/Defending/.test(cfg)&&/Discipline/.test(cfg)],
 ['red cards are lower is better',/id:'redCards'[\s\S]*higherIsBetter:false/.test(cfg)],
 ['missing butterfly metric is hidden',/if\(av==null\|\|bv==null\)return''/.test(app)],
 ['goals minute note is single EA note',/Minute not provided by EA\./.test(app)&&/matchEaNote73/.test(app)],
 ['MOTM requires actual flag',/find\(x=>N\(x\.motm\)>0\)/.test(app)],
 ['player stats our team first and own players clickable',/playerTable73\(d\.ours,true\)[\s\S]*playerTable73\(d\.opp,false\)/.test(app)&&/data-player-open73/.test(app)],
 ['rating heatmap exists',/ratingCell73\.top/.test(css)&&/ratingClass73/.test(app)],
 ['formations have explicit missing state',/Formation not provided by EA\./.test(app)],
 ['mobile list and stacked goals rules exist',/@media\(max-width:640px\)/.test(css)&&/goalColumns73\{grid-template-columns:1fr\}/.test(css)],
 ['no Details button in new row',!/Details/.test(app.match(/function row73[\s\S]*?function groupKey/)[0])],
 ['custom SVG icons used for contributors',/appBadgeIcon67\('topScorer'/.test(app)&&/appBadgeIcon67\('creator'/.test(app)]
];
let fail=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)fail++}process.exit(fail?1:0);
