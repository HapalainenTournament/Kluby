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

## V84 · Mobile navigation + overflow fixes
- [x] Phones (≤760px): top pill nav replaced by a fixed bottom bar (Overview, Players, Matches, Sessions, More); "More" sheet holds Compare, Analytics, Misc, Clubroom Pass.
- [x] Outside Overview the club hero collapses to a slim identity bar on phones so content starts on the first screen.
- [x] Real overflow fixed (grid tracks `minmax(0,1fr)`, tables scroll inside their wrapper); `html,body{overflow-x:hidden}` masking removed. Verified scrollWidth=390 on all tabs and Misc subtabs.
- [x] "Recent form" removed from the club hero card on all screen sizes.

## V85 · Paddle payments for Clubroom Pass
- [x] `paddle.js`: signed webhook verification (HMAC, 5 min replay window, secret rotation), idempotent events (`paddle_events`), out-of-order safe entitlement updates, old-subscription cancels can't end a newer Pass.
- [x] `/api/paddle/webhook` (raw body), `/api/pass/config`, `/api/pass/checkout` (stores consent evidence, blocks double purchase).
- [x] `/pass/checkout` page with Paddle.js overlay; Pass tab "Get Pass" pre-fills the club.
- [x] Terms §4–5 rewritten for Paddle as Merchant of Record; new `/refund` page (14-day refund).
- [x] Checkout stays closed unless `PASS_CHECKOUT=on` and all Paddle env vars are set.
- [ ] Fill `[DOPLNIT …]` operator name / contact email in Terms, Refund, About, Privacy before live review.

## V86 · Real EA archetypes + mobile crest
- [x] Formations use EA `archetypeid` (Progressor, Boss, Disruptor, Marauder, Recycler, Maestro, Creator, Spark, Magician, Finisher, Target Man, Keeper). Mapping from community research (github.com/Interactive-63/eafc-pro-clubs-api-research/issues/5; 4/7/9 inferred). Stat-derived style only as fallback.
- [x] Archive matches read the archetype from stored raw EA JSON; `window.clubroomArchetype(pid)` gives a player's latest archetype.
- [x] Formation header shows "1 GK · 1 DEF · 2 MID · 1 FWD"; lines spread so nodes don't overlap on phones.
- [x] Compact mobile hero clamps the real crest image (was overflowing).

## V87 · Session awards after the session
- [x] While a session is live, award cards are locked ("After the session") with an unlock time; reveal works once no match was played for 45 min; page re-renders automatically at unlock.

## V88 · Radar vs all of Clubroom
- [x] `/api/benchmarks` (benchmarks.js): per-match stats of every player stored in Clubroom (all clubs, both sides), players with 5+ matches (`BENCHMARK_MIN_MATCHES`), grouped GK/DEF/MID/FWD + ALL, 101 quantiles per metric, cached 6 h.
- [x] Player radar scores = share of same-position players you're at least as good as (50 = typical); squad-average line kept for context.
- [x] Falls back to the old squad ranking until a position has 20+ benchmark players (then ALL, then squad).
- [x] Strengths only ≥55, weaknesses only ≤45; "Top X% / Bottom X% of midfielders".
- [x] Bottom nav highlights Players/Matches on player and match pages.

## V89 · Refresh keeps the club
- [x] Loading/refreshing /club/:id or /club/:id/:tab opens that club and tab (was falling back to the homepage; player and match URLs already worked).

## V90 · Extended EA stats (no xG)
- [x] `public/v90/stats-ext.js`: parses match_event_aggregate events (confirmed IDs from github.com/Interactive-63/eafc-pro-clubs-api-research): passes completed/failed by direction & length, crosses, through balls, switches, shots on/off target in/outside box, dribbles, opponents beaten, skill beats, carries, dispossessed, tackles lost, possession won high / lost, fouls, fouls won, yellow cards, offsides.
- [x] Match → Player Stats: General / Shooting / Passing / Dribbling / Defending / Discipline groups for both teams; General table now shows pass counts (made/attempted) + %.
- [x] Match → Overview: team comparison bars.
- [x] Session detail, player profile (under radar) and Analytics → Detailed (club totals + us vs opponents per match).
- [x] xG/xA removed (EA sends none). Dribble % = completed vs dispossessed (EA has no dribble attempts).
- [ ] Squad Board columns from event data (needs per-player archive sums – profile card already has them).

## V91 · Smoother sessions + Squad Board detail
- [x] Award reveal swaps only the tapped card (flip animation) – no page re-render, charts stay.
- [x] Session leaderboard = swipeable slides (scroll-snap) with arrows, counter, dots, keyboard; bars animate in per slide; top 5 per stat.
- [x] Dribble % removed everywhere (EA sends no dribble attempts).
- [x] Squad Board: new Shooting / Dribbling / Discipline groups + extra Passing & Defense columns from EA events (per-match uses matches with event data).

## V92 · Stripe (Managed Payments) instead of Paddle
- [x] `stripe.js`: Checkout Session (mode=subscription, managed_payments[enabled]=true, Stripe-Version 2026-04-22.dahlia), club_id in metadata + subscription_data.metadata, idempotency key per consent.
- [x] `/api/stripe/webhook`: Stripe-Signature HMAC + 5 min replay window; idempotent `billing_events`; customer.subscription.* → club_entitlements (period end from subscription items, past_due grace, out-of-order + old-subscription protection); checkout.session.completed links consent evidence.
- [x] `PAYMENT_PROVIDER=stripe|paddle` (default stripe when STRIPE_SECRET_KEY set); Paddle code kept.
- [x] Checkout page redirects to Stripe; return URL polls until the webhook activates the Pass.
- [x] Terms / Refund / Pass texts: Stripe + Link as merchant of record; cancel at app.link.com.
- [ ] Fill [DOPLNIT support email] in Refund policy; set support email in Stripe business details (Link escalates there).

## V93 · Current-gen search only
- [x] PS4 / Xbox One removed from homepage search (EA search errors for common-gen4 on FC 26); Switch not added (EA returns no clubs for nx). Saved gen4 clubs still open; server still accepts gen4/nx.

## V94 · Analytics player form + match-by-match
- [x] Form tab: "Rating run" – player chips with trend arrows, window 5/10/20/30, rating columns coloured by result, avg line, tap for match, last-N avg vs career, trend (regression slope), best/worst, squad pulse cards with sparklines.
- [x] Match-by-Match tab: 13 stats (incl. EA event stats) shown for the whole squad as small multiples with result-coloured dots, avg line, best/worst, top performer; old table under "All matches".

## V95 · One Legal page + ads readiness
- [x] /legal: Who runs Clubroom, Terms, Clubroom Pass (Stripe/Link MoR), Refunds, Privacy (GDPR table: data/source/purpose/basis/retention, processors, rights, ÚOOÚ), Cookies & ads, Remove a player (form). Operator details from env OPERATOR_NAME, OPERATOR_ICO, OPERATOR_ADDRESS, CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE.
- [x] Old /terms /privacy /cookies /removal /refund /about → 301 to /legal sections; footer = Legal · Clubroom Pass (+ Privacy choices once ads are on).
- [x] Ads off by default; ADS=on + ADSENSE_CLIENT=ca-pub-… injects AdSense loader on all pages and serves /ads.txt. Consent via Google Privacy & messaging (certified CMP); "Privacy choices" opens it.
- [ ] Before ads: AdSense → Privacy & messaging → EU regulations message (3 choices incl. "Do not consent"); Blocking controls → block gambling, dating, alcohol etc.

## V96 · Link previews, session report image, Discord reports
- [x] og.js: server-side SVG→PNG (resvg + bundled Inter TTF): club preview 1200×630 (crest, name, W/D/L, form, division, PASS) and session report (results, record, awards).
- [x] /og/club/:id.png (30 min cache); club pages get og:/twitter: tags; chat bots (Discord, WhatsApp, Telegram, …) get club name + record in title/description.
- [x] /api/session-card/:id.png?start=… + "Share report" button on finished sessions (native share sheet on phones, download on desktop).
- [x] Discord webhooks (Pass): Pass tab panel; up to 3 channels per club; test message on connect; removal needs key kept in the browser; job every 5 min posts each finished session once (≥2 matches) with embed + image; dead webhooks auto-disabled.
- [ ] Set PUBLIC_URL to the final domain after rebrand (used in previews and Discord links).

## V97 · Form tab = Rating run only
- [x] Old "Recent Form" match strip removed from Analytics → Form; side panel no longer clipped on desktop.

## V98 · Ads + reward unlock + Pass-only radar
- [x] /v98/gates.js: one rewarded ad unlocks ALL reward features for the club in this browser for 12 h (Pass clubs: all open, no ads). Gates only active when ads are configured (or ?gates=1 test mode with 5 s placeholder).
- [x] Reward: session awards, Misc (Streaks, Habits, Lucky Charm, Milestones, Awards, Wrapped), Analytics Clutch/Carry/Improvement/Detailed/Match-by-Match, Form 20/30, detailed EA stats (match groups, Squad Board Shooting/Dribbling/Discipline, profile + session detail).
- [x] Pass-only: player radar (+ archive, Discord, clean cards as before).
- [x] Rewarded ads via Google Ad Manager GPT (GAM_REWARDED_UNIT); no-fill → user still gets access. Banners via AdSense unit ADSENSE_SLOT_BANNER at the bottom of Overview, Matches, Analytics; never for Pass clubs.

## V99 · Readable rating chart + clear match counts
- [x] Performance Center rating chart renders at real pixel width (readable axes, round dots, re-render on resize); team average = white dashed line.
- [x] Compare: "Matches (EA career)" vs "Matches in Clubroom archive" rows; player header shows archive count with label; footnote explains the difference.

## V100 · Stat sources + AdSense verification
- [x] EA / ARCHIVE chips on every Squad Board column (from metric sample) and every Compare row; profile MATCHES shows its source.
- [x] ADSENSE_CLIENT without ADS=on → AdSense loader + google-adsense-account meta + ads.txt for site review; no ad slots, no gates. ADS=on turns everything on.

## v101
- Compare: separate EA career table vs Clubroom archive per-match table, explainer + coverage bar per player; up to 4 players with Pass (locked card for free).
- Match-by-Match: "All matches" list removed, card padding/footer fixed.
- Hat-tricks: breakdown League / Playoff / Friendly + type tag per row (archive only).
- NEXT (proposal sent): redesign Clutch / Carry / Improvement.
