## v47 · PlayerCard step 4

- native PNG export on `<player-card>` via `exportBlob()` / `exportPng()`
- no new client dependency
- export embeds frame, mask, player image and crest when CORS permits
- remote/failed crest falls back safely instead of breaking export
- 1200×1800 default PNG export
- preview page includes Export PNG buttons for tier cards
- tier geometry and data mapping unchanged
