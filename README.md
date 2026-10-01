# Clubroom FC27 v12

Hotfix datové vrstvy proti v11.

- squad používá `/members/stats` jako primární season dataset; career je pouze fallback
- opravené mapování přesných EA FC27 polí: passesMade, passSuccessRate, tacklesMade, tackleSuccessRate, shotSuccessRate, cleanSheetsDef/GK, redCards
- doplněné per-game G/Z, A/Z a G+A/Z
- crest používá skutečný EA FC web asset podle `customKit.crestAssetId`
- backend, DB historie, match analytics a tabs zachovány

## v15
- dlouhodobé player match logy a rozšířené profily hráčů
- historické zápasy z PostgreSQL vedle aktuálního EA okna
- analytics: form, finishing, passing, partnerships a session reports
- rozšířené Fun awards
- match detail: Match Stats / Player Stats / Formations (jen pokud je EA dodá)
- second assists archivované jako EA event 115
- key passes se záměrně nevymýšlejí bez ověřeného EA eventu
- Express 5 SPA fallback používá pojmenovaný wildcard `/{*splat}`


## v15: PostgreSQL archive + Compare
- Compare is now its own top-level tab.
- Advanced Compare metrics prefer PostgreSQL archive data and show — when coverage is not trustworthy instead of fake zeroes.
- Background collector revisits tracked clubs in batches (default: every 15 min, clubs due after 60 min).
- A club becomes tracked when a user actually opens it. This demand-driven model is suitable for worldwide growth without trying to crawl every club continuously.
- Tune with `COLLECTOR_BATCH`, `COLLECTOR_INTERVAL_MS`, or disable with `COLLECTOR_ENABLED=false`.
- PostgreSQL remains the source of truth for match history; EA's current 10-match window is only the ingestion window.
