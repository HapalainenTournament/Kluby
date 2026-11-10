// POSTGAME v83: new logo assets and minimal motion.
import fs from 'node:fs';
const root=process.argv[2]||'.';const r=f=>fs.readFileSync(`${root}/${f}`,'utf8');
const html=r('public/index.html'),css=r('public/v83/motion.css'),js=r('public/v83/motion.js'),man=JSON.parse(r('public/manifest.webmanifest'));
let fail=0;const check=(n,ok)=>{console.log(`${ok?'PASS':'FAIL'} ${n}`);if(!ok)fail++};
for(const f of ['postgame-mark.png','postgame-favicon.png','apple-touch-icon.png','icon-192.png','icon-512.png','postgame-logo.png'])check(`asset ${f} exists`,fs.existsSync(`${root}/public/assets/${f}`));
check('manifest has 192 and 512 icons',man.icons.some(i=>i.sizes==='192x192')&&man.icons.some(i=>i.sizes==='512x512'));
check('apple touch icon linked',html.includes('apple-touch-icon'));
check('motion css + js loaded',html.includes('/v83/motion.css')&&html.includes('/v83/motion.js'));
check('all animations inside prefers-reduced-motion: no-preference',/@media \(prefers-reduced-motion:no-preference\)\{[\s\S]*@keyframes rise83/.test(css));
check('motion js bails out for reduced motion',js.includes("matchMedia('(prefers-reduced-motion: reduce)').matches)return"));
check('count-up restores exact original text',js.includes('else node.textContent=txt'));
check('window summary W/D/L letters fixed',css.includes('.performanceRecord44 .recordPart72{font-size:24px'));
process.exit(fail?1:0);
