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
