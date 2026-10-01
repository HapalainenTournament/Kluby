import {query,enabled} from "./db.js";
export async function dueClubs(limit=25){
 if(!enabled)return [];
 return (await query(`SELECT club_id,platform,name,check_interval_minutes FROM clubs
 WHERE tracking=TRUE AND (next_check_at IS NULL OR next_check_at<=now())
 ORDER BY COALESCE(next_check_at,to_timestamp(0)) ASC, last_seen DESC LIMIT $1`,[limit])).rows;
}
export async function rescheduleClub(clubId,platform,newMatches=0){
 if(!enabled)return;
 // Active clubs stay hot. Quiet clubs back off gradually up to 24h.
 await query(`UPDATE clubs SET
   consecutive_empty_checks=CASE WHEN $3>0 THEN 0 ELSE consecutive_empty_checks+1 END,
   check_interval_minutes=CASE WHEN $3>0 THEN 30
     WHEN consecutive_empty_checks>=7 THEN 1440
     WHEN consecutive_empty_checks>=3 THEN 360
     ELSE 90 END,
   next_check_at=now() + make_interval(mins => CASE WHEN $3>0 THEN 30
     WHEN consecutive_empty_checks>=7 THEN 1440
     WHEN consecutive_empty_checks>=3 THEN 360 ELSE 90 END)
 WHERE club_id=$1 AND platform=$2`,[clubId,platform,newMatches]);
}
