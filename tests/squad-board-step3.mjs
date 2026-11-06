import fs from 'node:fs';
const root=process.argv[2]||'.';
const app=fs.readFileSync(root+'/public/app.js','utf8');
const cfg=fs.readFileSync(root+'/public/squadBoardConfig.generated.js','utf8');
const html=fs.readFileSync(root+'/public/index.html','utf8');
const css=fs.readFileSync(root+'/public/style.css','utf8');
const checks=[
 ['Total / Per match control',html.includes('data-squad-mode71="total"')&&html.includes('data-squad-mode71="perMatch"')],
 ['minimum matches config',cfg.includes('SQUAD_BOARD_MIN_MATCHES71=5')],
 ['config per-match modes',cfg.includes("perMatch:'divide'")&&cfg.includes("perMatch:'same'")&&cfg.includes("perMatch:'rate'")],
 ['archive sample configured',cfg.includes("sample:'archiveMatches'")],
 ['display value respects mode',app.includes('squadMetricValue71')&&app.includes("squadBoardMode71==='perMatch'" )],
 ['qualification excludes under-min',app.includes('squadQualified71')&&app.includes('squadSample71')],
 ['rank heatmap derives displayed values',app.includes('squadRanks71')&&app.includes('squadMetricValue71(d,metric)')],
 ['#1 crown',app.includes("appBadgeIcon67('mvp',12)")&&css.includes('.squadRank1_71')],
 ['top3 and last styles',css.includes('.squadRankTop71')&&css.includes('.squadRankLast71')],
 ['under-min note',app.includes('min. ${squadBoardConfig70.minMatches} matches')&&css.includes('.squadUnder71')],
 ['cards use shared mode-aware comparator',app.includes("list.sort((a,b)=>squadCompare70(a,b,rank,squadBoardSort70.dir))")]
];
let fail=0;for(const [n,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${n}`);if(!ok)fail++}process.exit(fail?1:0);
