import pg from "pg";
const {Pool}=pg;
export const enabled=!!process.env.DATABASE_URL;
export const pool=enabled?new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.DATABASE_URL?.includes("localhost")?false:{rejectUnauthorized:false},
  max:5
}):null;

export async function query(text,params=[]){
  if(!enabled) return {rows:[],rowCount:0};
  return pool.query(text,params);
}

export async function migrate(){
 if(!enabled){console.log("DATABASE_URL není nastaveno — Clubroom běží v live-only režimu.");return;}
 await query(`
 CREATE TABLE IF NOT EXISTS clubs(
   club_id TEXT NOT NULL,
   platform TEXT NOT NULL,
   name TEXT,
   first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
   last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
   last_checked TIMESTAMPTZ,
   tracking BOOLEAN NOT NULL DEFAULT TRUE,
   PRIMARY KEY(club_id,platform)
 );
 CREATE TABLE IF NOT EXISTS players(
   player_id TEXT PRIMARY KEY,
   ea_name TEXT,
   pro_name TEXT,
   first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
   last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
 );
 CREATE TABLE IF NOT EXISTS club_memberships(
   club_id TEXT NOT NULL,
   platform TEXT NOT NULL,
   player_id TEXT NOT NULL,
   first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
   last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
   PRIMARY KEY(club_id,platform,player_id)
 );
 CREATE TABLE IF NOT EXISTS matches(
   match_id TEXT PRIMARY KEY,
   platform TEXT NOT NULL,
   played_at TIMESTAMPTZ,
   match_type TEXT,
   raw_json JSONB,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 );
 CREATE TABLE IF NOT EXISTS match_clubs(
   match_id TEXT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
   club_id TEXT NOT NULL,
   club_name TEXT,
   goals INTEGER NOT NULL DEFAULT 0,
   result CHAR(1),
   PRIMARY KEY(match_id,club_id)
 );
 CREATE TABLE IF NOT EXISTS player_match_stats(
   match_id TEXT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
   player_id TEXT NOT NULL,
   club_id TEXT NOT NULL,
   player_name TEXT,
   position TEXT,
   rating REAL,
   goals INTEGER DEFAULT 0,
   assists INTEGER DEFAULT 0,
   second_assists INTEGER DEFAULT 0,
   shots INTEGER DEFAULT 0,
   passes_made INTEGER DEFAULT 0,
   pass_attempts INTEGER DEFAULT 0,
   tackles_made INTEGER DEFAULT 0,
   tackle_attempts INTEGER DEFAULT 0,
   interceptions INTEGER DEFAULT 0,
   standing_tackles_won INTEGER DEFAULT 0,
   sliding_tackles_won INTEGER DEFAULT 0,
   dribbles INTEGER DEFAULT 0,
   through_balls INTEGER DEFAULT 0,
   saves INTEGER DEFAULT 0,
   motm INTEGER DEFAULT 0,
   red_cards INTEGER DEFAULT 0,
   seconds_played INTEGER DEFAULT 0,
   PRIMARY KEY(match_id,player_id,club_id)
 );
 CREATE TABLE IF NOT EXISTS player_match_events(
   match_id TEXT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
   player_id TEXT NOT NULL,
   club_id TEXT NOT NULL,
   event_id INTEGER NOT NULL,
   value REAL NOT NULL DEFAULT 0,
   PRIMARY KEY(match_id,player_id,club_id,event_id)
 );
 CREATE TABLE IF NOT EXISTS club_snapshots(
   id BIGSERIAL PRIMARY KEY,
   club_id TEXT NOT NULL,
   platform TEXT NOT NULL,
   captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   skill_rating REAL,
   wins INTEGER,
   draws INTEGER,
   losses INTEGER,
   goals_for INTEGER,
   goals_against INTEGER
 );
 CREATE INDEX IF NOT EXISTS idx_pms_player ON player_match_stats(player_id);
 CREATE INDEX IF NOT EXISTS idx_pms_club ON player_match_stats(club_id);
 CREATE INDEX IF NOT EXISTS idx_matches_played ON matches(played_at DESC);
 CREATE INDEX IF NOT EXISTS idx_events_event ON player_match_events(event_id);
 CREATE INDEX IF NOT EXISTS idx_snapshots_club ON club_snapshots(club_id,platform,captured_at DESC);
 `);
 console.log("PostgreSQL schema připraveno.");
}
