# CLUBROOM v75 · Chemistry stage

This is the complete uploadable project, based on the user-provided v74 archive. `.git` history is excluded.

## Implemented
- Misc tab order prepared, Chemistry visible; other tabs hidden until approved.
- Removed the Duo custom element, its runtime code, configuration, preview, and obsolete category grid. Kept `public/cards/frames/frame-duo.png`.
- Chemistry features: interactive partnership hero, player cards and picker, no duplicate selection, pair swap, best pair reset, win-rate matrix, top pairs and shared-match trios.
- Match-count thresholds in `public/miscConfig.generated.js` (default 5).
- Player roles and OVR use the same live player fields as standard player cards; no fabricated match data.
- Hero supports PNG export using existing card shared image rasterizer.
- Previous Fun/Awards content retained in hidden markup for later migration.

## Verification
- `npm run test:regressions` passes, `node --check public/app.js` passes.
- Browser layout checks run with explicitly synthetic fixture data; fixtures not included in this project.
- PNG export code path implemented but not exercised against a live deployment. Live EA archives not available in this sandbox. Screenshots are mock-data visual QA, not actual club stats.

## Deployment
Use this folder (with package.json and server.js at its root) as the project source. Install dependencies via `npm install`, run `npm start`. The ZIP root is `Kluby/`.
