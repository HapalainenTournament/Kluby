# CLUBROOM v78

Novinky: Misc (Records, Streaks, Habits, Lucky Charm, Milestones, Awards s losováním, Wrapped), Overview Club Pulse + Trophy Cabinet s achievementy, Clubroom Pass (nav, /pass, homepage promo, PASS štítky, zlatý premium vzhled, ad gates placeholder), Analytics tab Creativity, filtr League/Playoff, template erby, hráčská karta s kódovým panelem statistik.

Kód: `public/v78/clubroom-v78.js`, `public/v78/v78.css`, `public/v78/achievements.js` (pravidla achievementů), `public/pass.html`, server: `/api/pass/status`, `/api/club-honours/:id`.

Env: `PASS_ACTIVE_CLUBS` (čárkou oddělená ID klubů s aktivním Passem, dokud nejsou platby).
Náhledy: `?passPreview=1`, `?gates=1`.
Testy: `npm run test:regressions`.
