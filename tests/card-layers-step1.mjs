import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=path.resolve(process.argv[2]||'.');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const layout=read('public/cards/cardLayout.generated.js');
const card=read('public/cards/player-card.js');
const checks=[
  ['portraitWindow exists in shared layout',/portraitWindow\s*:\s*\[/.test(layout)],
  ['portrait window uses percentage polygon clip',/clip-path:polygon\(\$\{portraitPolygon\(\)\}\)/.test(card)],
  ['portrait lower edge fades into banner',/mask-image:linear-gradient\(to bottom/.test(card)],
  ['frame bitmap is rendered before portrait clip',card.indexOf('class="layer frame"') < card.indexOf('class="portraitClip"')],
  ['frame fills exact card container',/\.frame\{z-index:1;width:100%;height:100%;object-fit:fill/.test(card)],
  ['portrait uses full container inside clip window',/\.player\{position:absolute;inset:0;width:100%;height:100%/.test(card)],
  ['jersey layer remains inside portrait clip',card.indexOf('class="jerseyTint"') > card.indexOf('class="portraitClip"')],
];
let bad=0; for(const [label,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)bad++;} process.exit(bad?1:0);
