# CLUBROOM — BACKLOG

**Poslední audit / aktualizace:** 2026-11-06  
**Auditovaná verze:** `CLUBROOM-v76-LEGAL-BRAND-FULL.zip` (zdrojový stav, nikoli ověření produkce).  
**Legenda:** ✅ hotovo v kódu, 🟡 částečně, ❌ nezačato. Stav ✅ znamená, že je požadavek doložen implementací, nikoli automaticky dokončeným testem provozu.

## Pravidla evidence (platí od 2026-11-06)

1. Před každou další prací nejdřív přečíst tento `BACKLOG.md`.
2. Každý nový úkol nejdřív zapsat jako nový řádek, uchovávat kontext a důkazy.
3. Dokončený úkol přepnout na ✅ a uvést **datum dokončení YYYY-MM-DD**; částečné plnění nepřeznačovat za hotové.
4. U každé další předané verze přiložit aktualizovaný `BACKLOG.md` do kořene kompletního ZIPu.
5. Audit je pouze statický: nic neprokazuje funkčnost s reálnými EA daty, aktivními platbami nebo CMP.

- **2026-11-06 — AVATAR-001 — ✅ dokončeno v kódu 2026-11-06:** PlayerAvatar / CharacterLayer sjednocuje obrázek a barvu napříč Players, Compare, Profile, Partnerships, Pick a pair, Squad Board a Matches. Nahrazené renderovací cesty, zrušené ruční přepínání; přidané per-character masky a testy. **Runtime screenshot skutečného klubu zablokoval prohlížeč (`ERR_BLOCKED_BY_ADMINISTRATOR`); přiložena pouze jasně označená syntetická kompozice.**

## Audit požadavků (2026-11-06)

| ID | Stav | Úkol | Doložený stav a co zbývá | Hlavní důkazy v kódu | Dokončeno |
|---|---|---|---|---|---|
| 01 | ✅ | Postavy: centrální archetypy, CharacterLayer ve všech zobrazeních, bez „Change character“, dres v klubové barvě | `characters.js` má registr podle pozic a výběr postavy, `cardJerseyColor()` získává klubovou barvu. V77 implementována jednotná komponenta `player-avatar` nad `CharacterLayer`, deterministický registr pro id/jméno, samostatná maska přesně rozměrově sladěná s každou postavou, všechny view migrovány; `Change character` a odkazy odstraněny. **Skutečný UI screenshot běžící aplikace není ověřen (blokace prohlížeče).** | `public/cards/characters.js`; `public/cards/player-avatar.js`; `public/app.js`; `public/cards/player-card.js`; `tests/avatar-consistency-v77.mjs`; `AVATAR-RENDER-AUDIT.md` | 2026-11-06 (statické a VM testy; live screenshot neověřen) |
| 02 | 🟡 | Hráčská karta: vrstvy, portraitWindow, kódový panel statistik, cqw a debug | Vrstva rámu / portrétu / masky, polygon `portraitWindow`, cqw stylování a `?debug=card` pro sloty existují. **Neexistuje samostatný kódový překryv panelu statistik** a obraz i maska nemají společně transformovaný portrait wrapper; debug neřeší focus očí / scale jednotlivých postav. | `public/cards/player-card.js`; `public/cards/cardLayout.generated.js`; `public/design-preview/cards/index.html` | — |
| 03 | 🟡 | OVR „--“ v Partnerships a Pick a pair | `playerOvr()` zkouší živé `S.players`, `raw.proOverall` a archivní `overall`, používá se v hero i pickeru. Od v77 používá PlayerCard i Chemistry `canonicalOvr()`. Hodnota `--` zůstává legitimní, pokud není podkladové EA číslo; správnost pro všechny hráče nebyla ověřena na reálných datech. | `public/app.js` (`playerOvr`, `displayPlayer`, `pickCard`, `cardMarkup`) | — |
| 04 | 🟡 | Divize „--“ na Overview hero | Zobrazování divize existuje, čte `currentDivision` / `division` ze search, overall a info; pokud nic nemá, vykreslí `--`. Chybí doložený test správného mapování a fallback u reálných klubů. | `public/app.js` (`let division=`, `divisionBadge`); `public/index.html` (`divisionBadge`) | — |
| 05 | 🟡 | Misc: Chemistry / Records / Streaks / Habits / Lucky Charm / Milestones / Awards / Wrapped | Navigace obsahuje všech osm v požadovaném pořadí, ale `visibleTabs` obsahuje pouze Chemistry. Ostatní taby jsou `hidden`; fun Awards zůstávají v samostatné sekci Misc, nejsou funkční podzáložkou Awards. | `public/index.html` (`data-misc-tab`, `miscOther68`); `public/miscConfig.generated.js` | — |
| 06 | ❌ | Overview: Club Pulse, Trophy Cabinet a achievementy | Nebyly nalezeny komponenty `Club Pulse`, `Trophy Cabinet` ani pravidla/registr achievementů; předchozí fáze končila plánem. | `public/index.html`; `public/app.js`; chybí `achievements.ts` | — |
| 07 | 🟡 | Clubroom Pass: název Club+, ad gates, premium vzhled, Pass stránka, test platby, reklamy a CMP | Existuje neaktivní checkout `/pass/checkout`, evidenční návrh souhlasu a odkaz v patičce. V navigaci a nadpisu přetrvává `Club+`; nebyly nalezeny reklamní zámky, premium vzhled ani živá CMP. Checkout je záměrně deaktivovaný, skutečné platební sandbox testy nedoloženy. | `public/index.html` (`clubPlusNav44`, Club+ Features); `public/pass/checkout.html`; `public/legal-client.js`; `server.js`; `db.js` | — |
| 08 | 🟡 | Právní stránky, souhlas s odstoupením, disclaimer EA | Stránky `/terms`, `/privacy`, `/cookies`, `/removal`, About a odkazovaný disclaimer v HTML existují. Checkout obsahuje nepředvyplněný checkbox a serverový model důkazu; platba je vypnutá, texty jsou návrhy s `[DOPLNIT]`, skutečná CMP a doručení potvrzení nejsou dokončeny. | `public/{terms,privacy,cookies,removal,about}.html`; `public/pass/checkout.html`; `server.js`; `db.js` | — |
| 09 | 🟡 | Matches: seskupení podle dnů, detail, League/Playoff, šablony erbů soupeřů | Implementován seznam po dnech, filtrace podle typu a výsledku i samostatný detail zápasu a testy. Není doložená kompletní šablona všech erbů soupeřů s ověřeným identifikátorem a zobrazením při chybějících datech. | `public/app.js` (v73 Matches, `matchDays73`, `matchPage73`); `public/index.html`; `tests/matches-v73.mjs` | — |
| 10 | ✅ | Profil hráče jako stránka: radar, strengths, taby | Je samostatná routa `/club/:clubId/player/:playerId`, radar, strength panely a šest profilových tabů. Ověřeno přítomností implementace, nikoliv živým vizuálním testem. | `public/app.js` (`playerPage69`); `public/index.html`; `public/charts/player-radar.js`; `tests/player-profile-regressions.mjs` | 2026-11-06 (ověřeno statickým auditem) |
| 11 | ✅ | Squad Board v Players + filtr pozic nad ním | Squad Board, řazení a filtrování GK/DEF/MID/FWD/All jsou zapojeny při renderování Players. | `public/index.html` (`positionSummary`, `squadBoard`); `public/app.js` (`renderPlayerControls67`, `renderSquadBoard70`, `playerPositionFilter67`); `tests/squad-board-step2.mjs` | 2026-11-06 (ověřeno statickým auditem) |
| 12 | 🟡 | Analytics: tab Creativity, Match-by-Match graf a test | Match-by-Match je implementován a existují testy Analytics; **samostatný tab Creativity není v navigaci** (jen Creativity ranking jinde). Recharts wrapper je použit pro profil radar, nikoli pro všechny analytics grafy; kompletní specifický grafový test není doložen. | `public/index.html` (`analyticsSubnav`, `analyticsMatchByMatch`); `public/app.js`; `public/charts/player-radar.js`; `tests/part3-ui-regressions.mjs` | — |
| 13 | ❌ | Homepage: promo Clubroom Pass, PASS štítky, navigace | **Nový požadavek zapsán 2026-11-06.** Pod vyhledáváním chybí zlatá karta „Clubroom Pass“ s 3–4 ikonami výhod, cenou `4 € / month for your whole club` a tlačítkem „See Clubroom Pass“. Recent searches a Favorites nemají PASS badge. Navigace stále uvádí `Club+` místo `Clubroom Pass` s ikonou vstupenky. Cena je návrhová a musí být ověřena s právními podmínkami před nasazením. | `public/index.html` (homepage, `clubPlusNav44`); `public/app.js` (recent/favorites); `public/style.css` | — |
| 14 | 🟡 | Vlastní SVG sada místo emoji | Existuje vlastní SVG knihovna badge ikon a její použití ve vybraných částech. Zůstávají emoji/Unicode ikony na hráčských kartách, Duo/Partnerships a v dalších statistikách či navigaci; migrace není plošná. | `public/icons/badges/index.js`; `public/app.js` (`appBadgeIcon67`); `public/cards/player-card.js` (`⚽`, `★`); `public/index.html` (`♛ Club+`) | — |

## Nové zadání k evidenci

- **2026-11-06 — AUDIT-001 — ✅ dokončeno 2026-11-06:** provést pouze statický audit 14 bodů podle aktuálního ZIP, vytvořit `BACKLOG.md`, vyznačit statusy a dodat tabulku; žádná implementace funkčních změn.
- **2026-11-06 — WEB-013 — ❌ otevřeno:** homepage promo Clubroom Pass (zlatá karta, 3–4 výhody s vlastními SVG ikonami, navržená cena 4 € měsíčně za celý klub, tlačítko See Clubroom Pass), PASS štítky v recent/favorites a přejmenování navigace na Clubroom Pass s tiketovou ikonou.
- **2026-11-06 — WORKFLOW-001 — 🟡 trvalé pravidlo:** číst BACKLOG před každou další prací, nové úkoly zapisovat před implementací, dokončení značit ✅ a datem; aktualizovaný soubor přibalovat do každého dalšího kompletního ZIP. Zavedené nyní, dodržování budoucích úkolů se bude potvrzovat průběžně.

## Auditní omezení

Toto je audit zdrojového ZIPu, **ne** test živého provozu. U bodů s ✅ je doložená požadovaná implementace v kódu. Produkční funkčnost, reálné EA odpovědi, platební sandbox a UI screenshoty z tohoto auditu nevyplývají.
