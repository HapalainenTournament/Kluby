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


## v78 aktualizace (2026-11-06)

| ID | Stav | Co je hotové / co zbývá | Dokončeno |
|---|---|---|---|
| 02 | ✅ | Hráčská karta: postava usazená do portrait slotu (stejná velikost a výška u všech), kódem kreslený panel statistik překrývá zapečené čáry rámu, SVG ikony ve spodní řadě. | 2026-11-06 |
| 03 | 🟡 | Beze změny logiky – `canonicalOvr()` sdílí Players i Chemistry; `--` jen když EA OVR nepošle. Ověřit na reálném klubu. | — |
| 04 | ✅ | Fallback: když hero ukáže `--`, dohledá se `currentDivision` přes `/api/search` podle ID klubu a uloží do Recent. | 2026-11-06 |
| 05 | ✅ | Všech 8 podzáložek viditelných a funkčních (Records, Streaks, Habits, Lucky Charm, Milestones, Awards s reveal/losováním a týdenním resetem, Wrapped se sdílením PNG). Jen archivní data, min. vzorky v `CFG`. | 2026-11-06 |
| 06 | ✅ | Club Pulse (série, Last 10, postupy/sestupy) + Trophy Cabinet (vlastní SVG trofeje, EA playoff achievements přes `/api/club-honours/:id`, 13 Clubroom achievementů s progress barem, NEW štítek, detail dialog). | 2026-11-06 |
| 07 | 🟡 | Hotovo: přejmenování na Clubroom Pass, stránka `/pass`, Pass záložka (Free vs Pass), homepage promo, PASS štítky v Recent/Favorites, zlatý premium vzhled, placeholder ad gates (vypnuté, `?gates=1`), `/api/pass/status` přes `PASS_ACTIVE_CLUBS`. **Chybí:** skutečný platební provider + webhooky, reálné reklamy, CMP. | — |
| 09 | ✅ | Filtr typů League / Playoff (/ Friendly) místo Live/Archive; iniciály a odkazy na skutečná loga (Wikipedia) nahrazeny neutrálním template erbem. | 2026-11-06 |
| 12 | ✅ | Tab Creativity v Analytics (archiv, min. 5 zápasů, #1 zlatě, popis vzorce jednou). | 2026-11-06 |
| 13 | ✅ | Homepage promo karta Pass (4 výhody, 4 €/měsíc za klub, CTA), PASS štítky, navigace s ikonou vstupenky. | 2026-11-06 |
| 14 | 🟡 | Nové části používají vlastní SVG sadu (`ClubroomIcons78`), hráčská karta bez emoji. Zbývá ⇄ a drobné Unicode znaky ve starších částech. | — |

- **2026-11-06 — V78-001 — ✅ dokončeno 2026-11-06:** Misc podzáložky, Club Pulse, Trophy Cabinet, Clubroom Pass UI, Creativity tab, divize fallback, template erby, oprava hero na mobilu (recent form přetékal stránku). Testy: `tests/v78-regressions.mjs` (součást `npm run test:regressions`). Vizuálně ověřeno přes Playwright na **syntetických testovacích datech** (ne reálný klub).
- **Pozn.:** `tests/squad-board-step2.mjs` a `tests/card-layers-step1.mjs` padaly už ve v77 (zastaralé aserce z dřívějších verzí, nejsou v `test:regressions`).
- **Konfigurace:** `PASS_ACTIVE_CLUBS=142426,...` zapne Pass pro dané kluby do doby, než budou webhooky. `?passPreview=1` = jen náhled vzhledu. `?gates=1` = náhled zámků za reklamu.

- **2026-11-06 — WEB-014 — ✅ dokončeno 2026-11-06:** Homepage přeskládaná: kompaktnější hledání, výsledky hned pod polem, Recent/Favorites pod nimi, Pass jako úzký zlatý pruh; při zobrazených výsledcích se pruh a feature karty skryjí.

- **2026-11-06 — CARD-015 — ✅ dokončeno 2026-11-06:** Hráčská karta: OVR jen číslo uvnitř rámu, erb vycentrovaný do štítu rámu, spodní řada (zápasy/G/A/MOTM) uvnitř kódového panelu a větší. Trophy Cabinet: interní EA názvy sezón (CLUBS_LEAGUE_CLOSED_SEASON_…) převedeny na čitelné. Matches: góly a asistence rozdělené do dvou řádků se štítky GOALS / ASSISTS a odlišnými ikonami.

- **2026-11-07 — V81-001 — ✅ dokončeno 2026-11-07:** Sessions přepsané z archivu: live detekce (poslední zápas ≤ 45 min), live karta na Overview s MVP a formou, automatické obnovení každé 2 min přes `/api/live-refresh/:id` (server max 1× za 60 s na klub, jen když je stránka vidět), seznam session s filtry League/Playoff a týden/měsíc/vše, detail session (bilance, rozdíl skóre, přihrávky a konverze vs soupeř, čistá konta, týmový rating, karty zápasů se štítky, hráči vs vlastní průměr, žebříček 14 metrik, graf ratingů, session awards s odkrytím, únava podle pořadí zápasu, sdílení PNG).
- **2026-11-07 — V81-002 — ✅ dokončeno 2026-11-07:** Detail zápasu: štítky (Hat-trick, Clean sheet, Thriller, Statement win, Red card), pozice v session, duel nejlepších hráčů obou týmů, rozšířené butterfly (průměrný rating, konverze, asistence, druhé asistence, driblinky), gólmani obou týmů, sdílení, předchozí/další zápas, tabulka hráčů s Drb/TB a „vs avg“, řazení podle ratingu, nulové řádky skryté.
- **2026-11-07 — V81-003 — 🟡 čeká na data:** xG/xA se zobrazí jen pokud EA pošle pole (`xg`, `expectedGoals`, `xa`, `expectedAssists`…). Diagnostika: `/api/ea-fields/<clubId>` vypíše klíče a desetinná event ID – pošli výstup, podle něj to napojíme. Žádný odhad xG se nepočítá.
- Web push notifikace záměrně nejsou.

- **2026-11-07 — V82-001 — ✅ dokončeno 2026-11-07:** Archiv jen pro placené kluby. Free kluby mají držet posledních 10 zápasů **od každého typu** (liga/playoff/přátelák, `FREE_ARCHIVE_LIMIT`). **Mazání je zatím VYPNUTÉ** – zapne se `ARCHIVE_PRUNE=on` (maže po každém uložení a každých 6 h) nebo `ARCHIVE_PRUNE=dry-run` (jen loguje). Nemaže se zápas, kde hrál prémiový klub nebo který je mezi 10 nejnovějšími jiného sledovaného klubu. Vlastní klub 142426 je navždy premium (`OWNER_CLUB_IDS`). Pass klub má po skončení 30 dní ochranu (`PASS_GRACE_DAYS`). Tabulka `club_entitlements` připravená pro webhook platební brány. Ověřeno integračním testem na Postgres 16 (`tests/archive-retention-db.mjs`).
- **2026-11-07 — V82-002 — ✅ dokončeno 2026-11-07:** Formace: svislé hřiště, útok vždy nahoru, hráči na své lajně (GK/DEF/MID/FWD), ikona herního stylu (Finisher, Playmaker, Dribbler, Engine, Wall, Keeper), rating, G/A, MOTM, červená karta, přepínač náš tým / soupeř. Styl našich hráčů z kariéry v archivu (5+ zápasů), jinak z daného zápasu, vždy relativně k týmu.

- **2026-11-07 — V83-001 — ✅ dokončeno 2026-11-07:** Nové logo (bílé CR + zlatá střecha na průhledném pozadí): hlavička, favicon, apple-touch-icon, PWA ikony 192/512, `clubroom-logo.png`. Minimalistické animace (nástup karet, růst progress barů, odpočet čísel, kreslení čar grafu, pop forem, hover zdvih, lesk na zlatém CTA) – vše vypnuté při `prefers-reduced-motion`. Oprava useknutých W/D/L ve Window summary.

## Auditní omezení

Toto je audit zdrojového ZIPu, **ne** test živého provozu. U bodů s ✅ je doložená požadovaná implementace v kódu. Produkční funkčnost, reálné EA odpovědi, platební sandbox a UI screenshoty z tohoto auditu nevyplývají.
