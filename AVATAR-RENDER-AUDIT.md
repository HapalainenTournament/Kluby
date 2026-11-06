# CLUBROOM — Audit renderování postav (v77)

**Datum:** 2026-11-06. **Zdroj:** v76 backlog ZIP. Kontrola: `rg -n "cards/players|cards/characters|comparePortrait|portrait\(|<img|Change character|Change first|Change second" public`.

| Oblast | Původní render | Výsledek v77 |
|---|---|---|
| Players collectibles | `public/cards/player-card.js` `.player` a univerzální `.jerseyTint` | `player-avatar variant="card"` uvnitř PlayerCard |
| Player profile | `cardOnly69()` v `public/app.js` používalo PlayerCard | Stejné PlayerCard a PlayerAvatar jako Players |
| Squad Board | `squadCharacter70()` → `<img src=...>` | `avatarMarkup(p,'mini')` |
| Compare header | `comparePortrait62()` → `<img>` | `avatarMarkup(p,'bust')` |
| Compare picker modal | `comparePortrait62()` → `<img>` | `avatarMarkup(p,'mini')` |
| Chemistry Partnerships | lokální `portrait()` → `<img>` | `avatarMarkup(a/b,'bust')` |
| Chemistry Pick a pair | lokální `portrait()` → `<img>` + text Change first/second | `avatarMarkup(p,'bust')`, výběr klikem na celou kartu |
| Chemistry selection modal | lokální `portrait()` → `<img>` | `avatarMarkup(p,'mini')` |
| Matches MOTM | vlastní `getCharacterForPlayer()?.src` → `<img>` | `avatarMarkup(p,'mini')` |
| Legacy manual picker | `openCharacterPicker()`, tlačítka `Change character` | Odstraněno z aplikace a profilu |
| Design preview PlayerCard | samostatný PlayerCard bez načtení registru | Načítá centrální `characters.js` + `player-avatar.js` |

`public/cards/characters.js` je jediný registr charakterů a resolver `getCharacterForPlayer`. `public/cards/player-avatar.js` je jediné místo, které vytvoří `<img>` postavy; interní `CharacterLayer` vytvoří shodně transformovaný obraz a obarvení podle **masky odpovídající konkrétní postavě**. `public/cards/characters/masks/*.png` obsahují osm nových rozměrově sladěných masek. Klubovou barvu bere aplikace primárně z EA `customKit.kitColor1`, poté z dostupné klubové palety; při chybějících datech neprezentuje náhodnou barvu jako ověřenou.

**OVR:** společné `canonicalOvr(p)` v `public/app.js` používá PlayerCard i obě varianty Chemistry; pokud EA nevrátí hodnotu, zůstává `--`.

**Testy:** `npm run test:regressions` včetně `tests/avatar-consistency-v77.mjs`. Ověřuje stejné ID, cestu postavy a masky pro Hapalainena napříč pěti renderovacími kontexty, odkaz na jedinou komponentu i odstranění ručních voleb.

**Omezení:** testovací obraz `CLUBROOM-v77-Hapalainen-five-views-TEST.png` je syntetická kompozice s ilustrativním ID/OVR/barvou, nikoli screenshot živé aplikace. Chrome/Playwright v tomto prostředí odmítal lokální stránky `ERR_BLOCKED_BY_ADMINISTRATOR`; produkční výsledek se musí vizuálně ověřit po nahrání.
