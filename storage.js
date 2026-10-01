import {enabled,query} from "./db.js";
const N=v=>Number(v??0);
const P=(o,ks,d=0)=>{for(const k of ks)if(o&&o[k]!=null)return o[k];return d};

function virtualName(o){
 if(!o||typeof o!=="object")return null;
 for(const k of ["proName","proname","virtualProName","virtualproname","virtualPro","vpName","pro_name","virtual_pro_name"]){
  const v=o[k]; if(typeof v==="string"&&v.trim()&&!/^\d+$/.test(v.trim()))return v.trim();
  if(v&&typeof v==="object"){const z=v.name||v.proName||v.playerName;if(typeof z==="string"&&z.trim())return z.trim()}
 }
 const both=`${P(o,["firstName","firstname","proFirstName","virtualProFirstName"],"")} ${P(o,["lastName","lastname","proLastName","virtualProLastName"],"")}`.trim();
 return both||null;
}
const accountName=o=>P(o,["playername","personaName","name","playerName","gamertag","displayName"],null);
function eventMap(x){const map=new Map();for(const [k,v] of Object.entries(x||{})){if(!k.startsWith("match_event_aggregate_")||typeof v!=="string")continue;for(const token of v.split(/[;,| ]+/)){const m=token.match(/^(\d+):(-?\d+(?:\.\d+)?)$/);if(m)map.set(Number(m[1]),(map.get(Number(m[1]))||0)+Number(m[2]))}}return map}
function flatPlayers(p){let out=[];if(!p||typeof p!=="object")return out;if(Array.isArray(p))return p;for(const [clubId,val] of Object.entries(p)){if(Array.isArray(val))out.push(...val.map((x,i)=>({...x,_clubId:clubId,_playerId:String(P(x,["personaId","playerId","id"],i))})));else if(val&&typeof val==="object")for(const [playerId,x] of Object.entries(val))if(x&&typeof x==="object")out.push({...x,_clubId:clubId,_playerId:playerId})}return out}
function clubsOf(m){const c=m?.clubs||m?.clubInfo||m?.teams||{};if(Array.isArray(c))return c.map((x,i)=>({id:String(P(x?.details,["clubId","id"],P(x,["clubId","id"],i))),x}));return Object.entries(c).map(([id,x])=>({id:String(id),x}))}

export async function persistClubPayload(clubId,platform,d){
 if(!enabled)return {enabled:false,newMatches:0};
 const info=(d.info&&(d.info[clubId]||Object.values(d.info||{})[0]))||{},name=info.name||info.clubName||`Club ${clubId}`;
 await query(`INSERT INTO clubs(club_id,platform,name,last_seen,last_checked) VALUES($1,$2,$3,now(),now()) ON CONFLICT(club_id,platform) DO UPDATE SET name=EXCLUDED.name,last_seen=now(),last_checked=now()`,[clubId,platform,name]);
 const overall=(d.overall&&(d.overall[clubId]||Object.values(d.overall||{})[0]))||d.overall||{};
 await query(`INSERT INTO club_snapshots(club_id,platform,skill_rating,wins,draws,losses,goals_for,goals_against) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[clubId,platform,P(overall,["skillRating","skill","clubSkillRating"],null),N(P(overall,["wins","gamesWon"])),N(P(overall,["ties","draws","gamesDrawn"])),N(P(overall,["losses","gamesLost"])),N(P(overall,["goals","goalsFor","goalsScored"])),N(P(overall,["goalsAgainst","goalsConceded"]))]);
 let newMatches=0;
 for(const m of d.matches||[]){
  const mid=String(P(m,["matchId","matchid","id"],`${P(m,["timestamp","matchTimestamp"],Date.now())}-${m._matchType||"match"}-${clubId}`)),ts=P(m,["timestamp","matchTimestamp"],null),played=ts?new Date(String(ts).length<13?N(ts)*1000:N(ts)):null;
  const ins=await query(`INSERT INTO matches(match_id,platform,played_at,match_type,raw_json) VALUES($1,$2,$3,$4,$5) ON CONFLICT(match_id) DO UPDATE SET raw_json=EXCLUDED.raw_json RETURNING (xmax=0) inserted`,[mid,platform,played,m._matchType||"match",m]); if(ins.rows[0]?.inserted)newMatches++;
  const cs=clubsOf(m);
  for(const {id,x} of cs){const cn=P(x?.details,["name","clubName"],P(x,["name","clubName"],`Club ${id}`)),goals=N(P(x,["goals","score","goalsFor"],0)),other=cs.find(z=>z.id!==id),og=other?N(P(other.x,["goals","score","goalsFor"],0)):0,result=goals>og?"W":goals<og?"L":"D";await query(`INSERT INTO match_clubs(match_id,club_id,club_name,goals,result) VALUES($1,$2,$3,$4,$5) ON CONFLICT(match_id,club_id) DO UPDATE SET club_name=EXCLUDED.club_name,goals=EXCLUDED.goals,result=EXCLUDED.result`,[mid,id,cn,goals,result])}
  for(const x of flatPlayers(m.players||m.playerStats||m.members||{})){
   const pid=String(x._playerId||P(x,["personaId","playerId","id"],""));if(!pid)continue;const cid=String(x._clubId||clubId),pn=accountName(x)||pid,pro=virtualName(x);
   await query(`INSERT INTO players(player_id,ea_name,pro_name,last_seen) VALUES($1,$2,$3,now()) ON CONFLICT(player_id) DO UPDATE SET ea_name=COALESCE(EXCLUDED.ea_name,players.ea_name),pro_name=COALESCE(EXCLUDED.pro_name,players.pro_name),last_seen=now()`,[pid,pn,pro]);
   await query(`INSERT INTO club_memberships(club_id,platform,player_id,last_seen) VALUES($1,$2,$3,now()) ON CONFLICT(club_id,platform,player_id) DO UPDATE SET last_seen=now()`,[cid,platform,pid]);
   const ev=eventMap(x),pm=N(P(x,["passesmade","passesMade","passes"])),pa=N(P(x,["passattempts","passAttempts","passesAttempted"])),tm=N(P(x,["tacklesmade","tacklesMade","tackles"])),ta=N(P(x,["tackleattempts","tackleAttempts","tacklesAttempted"]));
   await query(`INSERT INTO player_match_stats(match_id,player_id,club_id,player_name,position,rating,goals,assists,second_assists,shots,passes_made,pass_attempts,tackles_made,tackle_attempts,interceptions,standing_tackles_won,sliding_tackles_won,dribbles,through_balls,saves,motm,red_cards,seconds_played) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) ON CONFLICT(match_id,player_id,club_id) DO UPDATE SET player_name=EXCLUDED.player_name,position=EXCLUDED.position,rating=EXCLUDED.rating,goals=EXCLUDED.goals,assists=EXCLUDED.assists,second_assists=EXCLUDED.second_assists,shots=EXCLUDED.shots,passes_made=EXCLUDED.passes_made,pass_attempts=EXCLUDED.pass_attempts,tackles_made=EXCLUDED.tackles_made,tackle_attempts=EXCLUDED.tackle_attempts,interceptions=EXCLUDED.interceptions,standing_tackles_won=EXCLUDED.standing_tackles_won,sliding_tackles_won=EXCLUDED.sliding_tackles_won,dribbles=EXCLUDED.dribbles,through_balls=EXCLUDED.through_balls,saves=EXCLUDED.saves,motm=EXCLUDED.motm,red_cards=EXCLUDED.red_cards,seconds_played=EXCLUDED.seconds_played`,[mid,pid,cid,pn,P(x,["pos","position"],null),Number(P(x,["rating","ratingAve"],0)),N(P(x,["goals","goalsScored"])),N(P(x,["assists"])),ev.get(115)||0,N(P(x,["shots","shotsTaken"])),pm,pa,tm,ta,ev.get(6)||0,ev.get(229)||0,ev.get(230)||0,ev.get(174)||0,ev.get(152)||0,N(P(x,["saves"])),N(P(x,["mom","motm","manOfTheMatch"])),N(P(x,["redcards","redCards"])),N(P(x,["secondsPlayed","gameTime"]))]);
   for(const [eid,value] of ev)await query(`INSERT INTO player_match_events(match_id,player_id,club_id,event_id,value) VALUES($1,$2,$3,$4,$5) ON CONFLICT(match_id,player_id,club_id,event_id) DO UPDATE SET value=EXCLUDED.value`,[mid,pid,cid,eid,value]);
  }
 }
 return {enabled:true,newMatches};
}

export async function history(clubId){
 if(!enabled)return {enabled:false,players:[],matches:[],snapshots:[],playerMatches:[]};
 const players=(await query(`SELECT s.player_id,MAX(s.player_name) player_name,MAX(p.pro_name) pro_name,COUNT(*)::int matches,SUM(goals)::int goals,SUM(assists)::int assists,SUM(second_assists)::int second_assists,SUM(shots)::int shots,SUM(passes_made)::int passes_made,SUM(pass_attempts)::int pass_attempts,SUM(tackles_made)::int tackles_made,SUM(tackle_attempts)::int tackle_attempts,SUM(interceptions)::int interceptions,SUM(standing_tackles_won+sliding_tackles_won)::int tackles_won,SUM(dribbles)::int dribbles,SUM(through_balls)::int through_balls,SUM(saves)::int saves,SUM(motm)::int motm,SUM(red_cards)::int red_cards,AVG(NULLIF(rating,0))::real rating FROM player_match_stats s LEFT JOIN players p ON p.player_id=s.player_id WHERE s.club_id=$1 GROUP BY s.player_id ORDER BY SUM(s.goals)+SUM(s.assists) DESC`,[clubId])).rows;
 const matches=(await query(`SELECT m.match_id,m.played_at,m.match_type,mc.goals,mc.result,(SELECT club_name FROM match_clubs o WHERE o.match_id=m.match_id AND o.club_id<>$1 LIMIT 1) opponent,(SELECT goals FROM match_clubs o WHERE o.match_id=m.match_id AND o.club_id<>$1 LIMIT 1) opponent_goals FROM matches m JOIN match_clubs mc ON mc.match_id=m.match_id AND mc.club_id=$1 ORDER BY m.played_at DESC LIMIT 1000`,[clubId])).rows;
 const playerMatches=(await query(`SELECT s.*,m.played_at,m.match_type,mc.result,mc.goals team_goals,(SELECT club_name FROM match_clubs o WHERE o.match_id=s.match_id AND o.club_id<>$1 LIMIT 1) opponent,(SELECT goals FROM match_clubs o WHERE o.match_id=s.match_id AND o.club_id<>$1 LIMIT 1) opponent_goals FROM player_match_stats s JOIN matches m ON m.match_id=s.match_id LEFT JOIN match_clubs mc ON mc.match_id=s.match_id AND mc.club_id=$1 WHERE s.club_id=$1 ORDER BY m.played_at DESC LIMIT 10000`,[clubId])).rows;
 const snapshots=(await query(`SELECT captured_at,skill_rating,wins,draws,losses,goals_for,goals_against FROM club_snapshots WHERE club_id=$1 ORDER BY captured_at DESC LIMIT 1000`,[clubId])).rows;
 return {enabled:true,players,matches,playerMatches,snapshots};
}

export async function analytics(clubId){
 if(!enabled)return {enabled:false,players:[],chemistry:[],sessions:[]};
 const players=(await query(`SELECT p.player_id,MAX(p.player_name) player_name,COUNT(*)::int matches,AVG(NULLIF(p.rating,0))::real rating,SUM(p.goals)::int goals,SUM(p.assists)::int assists,SUM(p.second_assists)::int second_assists,SUM(p.shots)::int shots,SUM(p.passes_made)::int passes_made,SUM(p.pass_attempts)::int pass_attempts,SUM(p.tackles_made)::int tackles_made,SUM(p.tackle_attempts)::int tackle_attempts,SUM(p.interceptions)::int interceptions,SUM(p.dribbles)::int dribbles,SUM(p.motm)::int motm FROM player_match_stats p WHERE p.club_id=$1 GROUP BY p.player_id`,[clubId])).rows;
 const chemistry=(await query(`SELECT a.player_id a_id,MAX(a.player_name) a_name,b.player_id b_id,MAX(b.player_name) b_name,COUNT(*)::int matches,SUM(CASE WHEN mc.result='W' THEN 1 ELSE 0 END)::int wins,SUM(a.goals+a.assists+b.goals+b.assists)::int contributions FROM player_match_stats a JOIN player_match_stats b ON a.match_id=b.match_id AND a.club_id=b.club_id AND a.player_id<b.player_id JOIN match_clubs mc ON mc.match_id=a.match_id AND mc.club_id=a.club_id WHERE a.club_id=$1 GROUP BY a.player_id,b.player_id HAVING COUNT(*)>=2 ORDER BY (SUM(CASE WHEN mc.result='W' THEN 1 ELSE 0 END)::float/COUNT(*)) DESC,COUNT(*) DESC LIMIT 30`,[clubId])).rows;
 const sessions=(await query(`WITH x AS (SELECT m.played_at,mc.result,mc.goals,(SELECT goals FROM match_clubs o WHERE o.match_id=m.match_id AND o.club_id<>$1 LIMIT 1) opp_goals,CASE WHEN lag(m.played_at) OVER(ORDER BY m.played_at)-m.played_at < interval '-2 hours' THEN 1 ELSE 0 END new_session FROM matches m JOIN match_clubs mc ON mc.match_id=m.match_id AND mc.club_id=$1), y AS (SELECT *,sum(new_session) OVER(ORDER BY played_at) grp FROM x) SELECT min(played_at) started_at,max(played_at) ended_at,count(*)::int matches,sum(CASE WHEN result='W' THEN 1 ELSE 0 END)::int wins,sum(CASE WHEN result='D' THEN 1 ELSE 0 END)::int draws,sum(CASE WHEN result='L' THEN 1 ELSE 0 END)::int losses,sum(goals)::int goals,sum(opp_goals)::int conceded FROM y GROUP BY grp ORDER BY max(played_at) DESC LIMIT 50`,[clubId])).rows;
 return {enabled:true,players,chemistry,sessions};
}
