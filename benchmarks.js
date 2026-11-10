// POSTGAME v88 · Global player benchmarks: per-match stats of EVERY player Postgame has stored (all clubs, both sides of
// every match), grouped by position. Players need MIN_MATCHES matches in a position to count. Returned as 101 quantiles
// (0 %,1 %,…,100 %) per metric so the browser can turn any value into "better than X % of midfielders".
import {query,enabled} from "./db.js";
export const MIN_MATCHES=Math.max(1,Number(process.env.BENCHMARK_MIN_MATCHES||5));
const TTL=6*3600*1000;let cache={at:0,data:null,pending:null};
export const METRICS={
 goalsPerMatch:"goals::float/g",goalContributionsPerMatch:"(goals+assists)::float/g",shotsPerMatch:"shots::float/g",
 assistsPerMatch:"assists::float/g",secondAssistsPerMatch:"second_assists::float/g",throughBallsPerMatch:"through_balls::float/g",dribblesPerMatch:"dribbles::float/g",
 passesCompletedPerMatch:"passes::float/g",passAccuracy:"CASE WHEN pass_att>0 THEN passes*100.0/pass_att END",
 tacklesPerMatch:"tackles::float/g",tacklesWonPerMatch:"tackles_won::float/g",interceptionsPerMatch:"interceptions::float/g",savesPerMatch:"saves::float/g",
 redCardsPerMatch:"reds::float/g",averageRating:"rating",motmPerMatch:"motm::float/g"};
const Q=Array.from({length:101},(_,i)=>(i/100).toFixed(2)).join(",");
export function benchmarkSql(){
 const cols=Object.entries(METRICS).map(([k])=>`percentile_cont(ARRAY[${Q}]::float8[]) WITHIN GROUP (ORDER BY "${k}") AS "${k}"`).join(",\n ");
 return `WITH pm AS (
  SELECT player_id,club_id,CASE WHEN position ILIKE '%goal%' OR position ILIKE 'gk' THEN 'GK' WHEN position ILIKE '%def%' THEN 'DEF' WHEN position ILIKE '%mid%' THEN 'MID' ELSE 'FWD' END grp,
   COUNT(*) g,SUM(goals) goals,SUM(assists) assists,SUM(shots) shots,SUM(second_assists) second_assists,SUM(through_balls) through_balls,SUM(dribbles) dribbles,
   SUM(passes_made) passes,SUM(pass_attempts) pass_att,SUM(tackles_made) tackles,SUM(standing_tackles_won+sliding_tackles_won) tackles_won,SUM(interceptions) interceptions,
   SUM(saves) saves,SUM(red_cards) reds,SUM(motm) motm,AVG(NULLIF(rating,0)) rating
  FROM player_match_stats GROUP BY 1,2,3 HAVING COUNT(*)>=$1),
 m AS (SELECT grp,${Object.entries(METRICS).map(([k,e])=>`${e} AS "${k}"`).join(",")} FROM pm)
 SELECT COALESCE(grp,'ALL') grp,COUNT(*)::int n,
 ${cols}
 FROM m GROUP BY GROUPING SETS ((grp),())`;
}
async function compute(){
 const r=await query(benchmarkSql(),[MIN_MATCHES]);const groups={};
 for(const row of r.rows){const metrics={};for(const k of Object.keys(METRICS)){const a=row[k];if(Array.isArray(a)&&a.some(v=>v!=null))metrics[k]=a.map(v=>v==null?null:+Number(v).toFixed(4))}groups[row.grp]={n:row.n,metrics}}
 return {minMatches:MIN_MATCHES,updatedAt:new Date().toISOString(),groups};
}
export async function benchmarks(){
 if(!enabled)return {minMatches:MIN_MATCHES,groups:{}};
 if(cache.data&&Date.now()-cache.at<TTL)return cache.data;
 if(!cache.pending)cache.pending=compute().then(d=>{cache={at:Date.now(),data:d,pending:null};return d}).catch(e=>{cache.pending=null;throw e});
 return cache.pending;
}
