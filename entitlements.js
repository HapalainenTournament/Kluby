// CLUBROOM v82 · Clubroom Pass entitlements and free-archive retention.
// A club is premium when it is an OWNER club (always), listed in PASS_ACTIVE_CLUBS, or has an active
// row in club_entitlements (filled later by the payment provider webhook).
// Free clubs keep only their newest FREE_ARCHIVE_LIMIT matches PER MATCH TYPE (default 10: league, playoff,
// friendly…) – the same window EA itself shows. Deleting is OFF by default; enable with ARCHIVE_PRUNE=on
// (or ARCHIVE_PRUNE=dry-run to only log how many matches would be removed).
import {query,enabled} from "./db.js";
const ids=v=>String(v||"").split(",").map(x=>x.replace(/[^0-9]/g,"")).filter(Boolean);
// The owner's club is premium forever so its archive is never pruned. Override with OWNER_CLUB_IDS.
export const OWNER_CLUBS=new Set(ids(process.env.OWNER_CLUB_IDS??"142426"));
export const FREE_ARCHIVE_LIMIT=Math.max(1,Number(process.env.FREE_ARCHIVE_LIMIT||10));
const PRUNE_MODE=String(process.env.ARCHIVE_PRUNE||"off").toLowerCase();
export const PRUNE_ENABLED=PRUNE_MODE==="on"||PRUNE_MODE==="dry-run";
const envPass=()=>new Set(ids(process.env.PASS_ACTIVE_CLUBS));
let cache={at:0,set:new Set()};
async function dbPassClubs(){if(!enabled)return new Set();if(Date.now()-cache.at<60000)return cache.set;
 try{const r=await query(`SELECT club_id FROM club_entitlements WHERE plan IN ('pass','owner') AND (active_until IS NULL OR active_until>now())`);cache={at:Date.now(),set:new Set(r.rows.map(x=>String(x.club_id)))}}catch{cache={at:Date.now(),set:new Set()}}
 return cache.set}
export function resetEntitlementCache(){cache={at:0,set:new Set()}}
export async function premiumClubs(){return new Set([...OWNER_CLUBS,...envPass(),...await dbPassClubs()])}
export async function isPremium(clubId){const id=String(clubId);return OWNER_CLUBS.has(id)||envPass().has(id)||(await dbPassClubs()).has(id)}
export async function planOf(clubId){const id=String(clubId);if(OWNER_CLUBS.has(id))return "owner";return await isPremium(id)?"pass":"free"}
// Delete matches of a FREE club beyond its newest N. A match is kept when any premium club played in it,
// or when it is still among the newest N of another TRACKED club in that match (so that club keeps its 10).
// Untracked opponents (clubs nobody opened in Clubroom) do not protect a match.
// Grace period: archive of a club whose Pass ended less than PASS_GRACE_DAYS ago is not pruned yet.
export const PASS_GRACE_DAYS=Math.max(0,Number(process.env.PASS_GRACE_DAYS||30));
async function inGrace(clubId){if(!enabled)return false;try{const r=await query(`SELECT 1 FROM club_entitlements WHERE club_id=$1 AND active_until IS NOT NULL AND active_until>now()-($2::int*interval '1 day') LIMIT 1`,[String(clubId),PASS_GRACE_DAYS]);return r.rowCount>0}catch{return false}}
export async function pruneFreeArchive(clubId,{dryRun=PRUNE_MODE==="dry-run",force=false}={}){
 if(!enabled||(!PRUNE_ENABLED&&!force))return {pruned:0,skipped:"disabled"};
 const id=String(clubId);if(await isPremium(id))return {pruned:0,skipped:"premium"};if(await inGrace(id))return {pruned:0,skipped:"grace"};
 const keepIds=[...await premiumClubs()],limit=FREE_ARCHIVE_LIMIT;
 // Rank every match per club AND per match type (newest first). Only this club and tracked clubs are ranked.
 const sql=`WITH ranked AS (SELECT mc.club_id,mc.match_id,ROW_NUMBER() OVER (PARTITION BY mc.club_id,CASE WHEN m.match_type ILIKE '%playoff%' THEN 'playoff' WHEN m.match_type ILIKE '%league%' THEN 'league' WHEN m.match_type ILIKE '%friendly%' THEN 'friendly' ELSE COALESCE(LOWER(m.match_type),'other') END ORDER BY m.played_at DESC NULLS LAST,m.match_id DESC) rn
     FROM match_clubs mc JOIN matches m ON m.match_id=mc.match_id WHERE mc.club_id=$1 OR mc.club_id IN (SELECT club_id FROM clubs WHERE tracking)),
  old AS (SELECT r.match_id FROM ranked r WHERE r.club_id=$1 AND r.rn>$2 AND NOT EXISTS (
    SELECT 1 FROM match_clubs o WHERE o.match_id=r.match_id AND o.club_id<>$1 AND (o.club_id=ANY($3::text[]) OR EXISTS (
      SELECT 1 FROM ranked a WHERE a.club_id=o.club_id AND a.match_id=o.match_id AND a.rn<=$2))))`;
 if(dryRun){const r=await query(`${sql} SELECT COUNT(*)::int n FROM old`,[id,limit,keepIds]);return {pruned:0,wouldPrune:r.rows[0]?.n||0,dryRun:true}}
 const r=await query(`${sql} DELETE FROM matches m USING old WHERE m.match_id=old.match_id RETURNING m.match_id`,[id,limit,keepIds]);
 if(r.rowCount)console.log(`[ARCHIVE] pruned ${r.rowCount} old matches of free club ${id} (limit ${limit} per match type)`);
 return {pruned:r.rowCount||0};
}
export async function pruneAllFreeClubs(){if(!enabled||!PRUNE_ENABLED)return 0;let total=0;
 try{const r=await query(`SELECT DISTINCT club_id FROM clubs`);for(const row of r.rows){try{const x=await pruneFreeArchive(row.club_id);total+=x.pruned||x.wouldPrune||0;if(x.dryRun&&x.wouldPrune)console.log(`[ARCHIVE] dry-run: club ${row.club_id} would lose ${x.wouldPrune} matches`)}catch(e){console.warn("prune",row.club_id,e.message)}}}catch(e){console.warn("prune all",e.message)}
 return total}
