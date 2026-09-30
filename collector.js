import {query,enabled} from "./db.js";
export async function dueClubs(limit=25){
 if(!enabled)return [];
 return (await query(`SELECT club_id,platform,name FROM clubs WHERE tracking=TRUE AND
 (last_checked IS NULL OR last_checked < now()-interval '60 minutes')
 ORDER BY COALESCE(last_checked,to_timestamp(0)) ASC LIMIT $1`,[limit])).rows;
}
