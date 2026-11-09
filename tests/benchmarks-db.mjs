// Global benchmarks SQL against a THROWAWAY Postgres (DATABASE_URL). Seeds random players and checks the quantile output.
if(!process.env.DATABASE_URL){console.log('SKIP benchmarks DB (no DATABASE_URL)');process.exit(0)}
const {query,migrate,pool}=await import('../db.js');const B=await import('../benchmarks.js');
let n=0,fail=0;const check=(m,ok)=>{n++;console.log(`${ok?'PASS':'FAIL'} ${m}`);if(!ok)fail++};
await migrate();await query(`TRUNCATE matches CASCADE`);
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const POS=['goalkeeper','defender','midfielder','forward'];
for(let mi=0;mi<40;mi++){const id='bm'+mi;await query(`INSERT INTO matches(match_id,platform,played_at,match_type) VALUES($1,'common-gen5',now()-($2::int*interval '1 hour'),'league') ON CONFLICT DO NOTHING`,[id,mi]);
 for(let p=0;p<60;p++){if(rnd()<.3)continue;const pos=POS[p%4],fw=pos==='forward';
  await query(`INSERT INTO player_match_stats(match_id,player_id,club_id,position,rating,goals,assists,shots,passes_made,pass_attempts,tackles_made,interceptions,saves,red_cards,motm)
   VALUES($1,$2,'c'||($3::int%6),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,[id,'p'+p,p,pos,6+rnd()*3,fw?Math.floor(rnd()*3):Math.floor(rnd()*1.3),Math.floor(rnd()*2),Math.floor(rnd()*5),10+Math.floor(rnd()*30),20+Math.floor(rnd()*30),Math.floor(rnd()*5),Math.floor(rnd()*4),pos==='goalkeeper'?Math.floor(rnd()*6):0,rnd()<.03?1:0,rnd()<.1?1:0])}}
const b=await B.benchmarks();
check('groups for every position + ALL',['GK','DEF','MID','FWD','ALL'].every(k=>b.groups[k]));
check('ALL counts every qualifying player',b.groups.ALL.n===b.groups.GK.n+b.groups.DEF.n+b.groups.MID.n+b.groups.FWD.n);
const q=b.groups.FWD.metrics.goalsPerMatch;
check('101 quantiles, ascending',q.length===101&&q.every((v,i)=>i===0||v>=q[i-1]));
check('forwards score more than defenders at the median',b.groups.FWD.metrics.goalsPerMatch[50]>b.groups.DEF.metrics.goalsPerMatch[50]);
check('pass accuracy is a percentage',b.groups.MID.metrics.passAccuracy[50]>20&&b.groups.MID.metrics.passAccuracy[100]<=100);
check('min matches filter applied',b.minMatches===5);
console.log(JSON.stringify(b).length>1000?'PASS payload built':'FAIL payload');
await import('node:fs').then(fs=>fs.writeFileSync(process.env.BENCH_OUT||'/dev/null',JSON.stringify(b)));
await pool.end();console.log(`benchmarks db: ${n-fail}/${n} PASS`);if(fail)process.exit(1);
