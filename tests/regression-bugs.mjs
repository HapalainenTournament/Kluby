import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.argv[2] || process.cwd();
let failed=0;
function ok(cond,msg){if(cond)console.log('PASS',msg);else{console.log('FAIL',msg);failed++}}
const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');

// BUG1: Fun renderer must not overwrite Analytics match-by-match after analytics renderer.
const funWrappers=[...app.matchAll(/renderFun\s*=\s*function\s*\([^)]*\)\s*\{([^}]|\}(?!;))*\};/gs)].map(m=>m[0]);
const overwrites=funWrappers.filter(x=>/renderAnalyticsMatch29\s*\(/.test(x));
ok(overwrites.length===0,'BUG1 legacy renderFun no longer calls renderAnalyticsMatch29');
ok(/state\.mode=metric\.dataset\.metric37;\s*draw\(\)/.test(app),'BUG1 metric click updates state and redraws');
ok(/state\.window=Number\(win\.dataset\.window37\)\|\|20;\s*draw\(\)/.test(app),'BUG1 window click updates state and redraws');
ok(/state\.selectedPlayers=.*draw\(\)/s.test(app),'BUG1 player click updates selected players and redraws');

// BUG2 static wiring.
ok(/avatarMarkup\(/.test(app) && /<player-avatar/.test(fs.readFileSync(path.join(root,'public/cards/player-card.js'),'utf8')),'BUG2 all player surfaces render PlayerAvatar');
const charsPath=path.join(root,'public/cards/characters.js');
ok(fs.existsSync(charsPath),'BUG2 character registry module exists');
if(fs.existsSync(charsPath)){
  const store=new Map();
  const context={window:{},localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},console};
  vm.createContext(context); vm.runInContext(fs.readFileSync(charsPath,'utf8'),context);
  const C=context.window.ClubroomCharacters;
  ok(C.positionCategory('forward')==='FWD' && C.positionCategory('midfielder')==='MID' && C.positionCategory('defender')==='DEF' && C.positionCategory('goalkeeper')==='GK','BUG2 EA positions map to character categories');
  const p={id:'123',position:'midfielder',name:'A'};
  const auto=C.getCharacterForPlayer(p);
  ok(auto && auto.id.startsWith('mid-'),'BUG2 automatic selection uses position pool');
  const other=C.getCharactersForPosition('midfielder').find(x=>x.id!==auto.id);
  ok(!!other,'BUG2 midfielder pool has alternate character');
  if(other){C.setCharacterForPlayer(p.id,other.id);ok(C.getCharacterForPlayer(p)?.id===auto.id,'BUG2 manual overrides cannot change character');
    const context2={window:{},console};vm.createContext(context2);vm.runInContext(fs.readFileSync(charsPath,'utf8'),context2);
    ok(context2.window.ClubroomCharacters.getCharacterForPlayer(p)?.id===auto.id,'BUG2 automatic archetype survives reload');}
  C.registerPlayers([{id:'123',name:'Hapalainen',position:'midfielder'}]);
  ok(C.getCharacterForPlayer({id:'123'}).id===C.getCharacterForPlayer({name:'Hapalainen'}).id,'BUG2 alias resolves to same character');
  for(const list of Object.values(C.registry))for(const c of list)ok(fs.existsSync(path.join(root,'public',c.src.replace(/^\//,''))),`BUG2 asset exists ${c.src}`);
}
process.exit(failed?1:0);
