# Clubroom FC27 v18

## Změny
- kompletně rozšířený Fun: Squad Superlatives, Viral Rankings, Player Milestones, Form Graph, Goal Partnerships, Improvement Tips a Match-by-Match
- Fun funguje i bez DB v omezeném live režimu a automaticky se rozšíří po nasbírání historie
- Compare a archiv používají match-event fallbacky pro shots (217+218), passes (215/216), tackles (0/1), second assists (115), dribbles (174), interceptions (6)
- žádné falešné nuly, pokud detailní data skutečně nejsou k dispozici
- adaptivní PostgreSQL collector pro globální provoz: aktivní kluby cca 30 min, postupný backoff 90 min / 6 h / 24 h
- existující databáze se migruje pomocí ADD COLUMN IF NOT EXISTS
- dlouhodobý archiv je deduplikovaný přes match_id
- verze 18.0.0

Přihlašovací údaje k PostgreSQL nejsou součástí projektu. Backend čte pouze DATABASE_URL z prostředí.
