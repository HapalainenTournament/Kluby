# Clubroom FC27 v7 — persistent history

## Co je nové
- PostgreSQL persistence
- deduplikace zápasů podle match_id
- players / club memberships / matches / match clubs / player match stats
- permanentní uložení všech dekódovaných `match_event_aggregate_*` jako event_id/value
- RAW match JSON v PostgreSQL JSONB pro budoucí re-parser
- club snapshots pro Skill Rating history
- historické totals pro second assists a advanced stats
- chemistry dvojic z uložených zápasů
- DB history panel ve frontendu
- aplikace funguje i bez DB v LIVE ONLY režimu

## Render — nejjednodušší instalace
Repo obsahuje `render.yaml`. V Renderu můžeš použít Blueprint a vytvořit web + PostgreSQL.
Nebo ručně:
1. vytvoř PostgreSQL
2. u web service přidej environment variable `DATABASE_URL` = Internal Database URL
3. Build: `npm install`
4. Start: `npm start`
5. deploy

Schema se vytvoří automaticky při startu.

## Jak se historie plní
Pokaždé, když někdo otevře klub, `/api/club/:id` stáhne aktuální EA data a nové matchId uloží.
Stejný zápas se podruhé neduplikuje.

## Collector
`collector.js` obsahuje výběr klubů, které jsou po hodině due. Pro skutečný automatický collector
doporučuji v dalším kroku samostatný Render Cron Job / worker, který volá interní ingest endpoint.
V7 už má databázový model připravený, ale schválně nespouští nekonečný background loop uvnitř free web service.

## Key passes
Nejsou natvrdo vymyšlené. V7 ukládá VŠECHNY raw event ID/value a celý RAW JSON.
Jakmile se Key Pass event spolehlivě identifikuje, lze ho dopočítat zpětně přes celou historii.

## Poznámka k RAW JSON
RAW se ukládá server-side, ale není zobrazený uživateli v UI.
