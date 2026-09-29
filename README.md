# Clubroom — Pro Clubs Tracker

Hotový MVP tracker pro EA Sports FC Pro Clubs.

## Spuštění
1. Nainstaluj Node.js 20+
2. V této složce spusť `npm install`
3. Spusť `npm run dev`
4. Otevři `http://localhost:3000`

## Co umí
- hledání klubů podle názvu
- current-gen / last-gen / Switch platformy
- klubový dashboard
- W/D/L, win rate, skill rating, skóre
- leaderboard hráčů
- poslední league + playoff zápasy
- server-side proxy, timeout a krátkodobá cache

## Poznámka k EA
Používá neoficiální/undocumented endpointy na `proclubs.ea.com`. EA je může změnit. Proto je EA komunikace izolovaná v `server.js`; když EA něco přejmenuje, nemusí se rozkopat celý frontend.

## Další rozumný krok
Přidat PostgreSQL/Supabase archiv zápasů, snapshoty hráčských statistik, session stats, H2H a vlastní awards.
