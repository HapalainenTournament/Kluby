Clubroom FC27 v39

# Clubroom FC27 v30

- Fun má druhou navigační lištu, takže není jeden nekonečný scroll.
- Featured, Duo Cards, Superlatives, Ghost, L Merchant, Self-Glazer, Main Character, Stat Padder a Extras jsou samostatné podzáložky.
- Chemistry tabulka byla nahrazena Duo Cards.
- Duo Cards používají společné zápasy z PostgreSQL, win rate a kombinované G+A.
- Analytics už neobsahuje Club Snapshot ani syrovou Chemistry tabulku.
- Passing Insights je přesunuté do Analytics.
- Fun rankings mají editoriální karty bez generovaných obrázků.
- Databázový archiv zůstává zachovaný.


## v40 event match probe

The background collector now also probes likely FC27 special-event/tournament match type values: `tournamentMatch`, `tournament`, `eventMatch`, `liveEventMatch`, and `clubTournamentMatch`. Successful responses are archived as match type `event` and retain the raw EA candidate in `_eaMatchType`. Invalid candidates fail independently and do not stop league/playoff/friendly collection.

Diagnostic endpoint: `/api/event-probe/:clubId?platform=common-gen5` returns the status and recent match IDs for each candidate without requiring UI changes.


## v41 database export
Set an environment variable named `EXPORT_TOKEN` to a long random value in Render.
Then download a backup from `/api/db-export?token=YOUR_TOKEN`.
The endpoint returns a JSON attachment containing all Clubroom PostgreSQL tables and row counts.
Do not commit or share the token.


## v43 modern reface
- modernized global visual system and navigation
- Sessions promoted to a first-class main tab
- desktop session archive + selected session detail workspace
- session filters: All / League / Playoff
- session team rating, pass accuracy, shot conversion, clean sheets and player leaders
- richer session match detail and rating trend visualization
