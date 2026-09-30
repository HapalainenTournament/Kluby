# Clubroom FC27 v11

Datová oprava v10.

- division se bere primárně z výsledku leaderboard search (`currentDivision`), kde ji FC27 skutečně vrací
- ties jsou správně mapované jako remízy
- gamesPlayed se používá jako League Apps
- doplněny best division, streaks, promotions/relegations, clean sheets a úplný W/D/L blok
- squad tabulka používá season member stats: shot success, passes, pass %, tackles, tackle %, clean sheets, cards
- odstraněn neověřený `/clubs/match-player-stats`; player rows se čtou přímo z `/clubs/matches`
- crestAssetId se bere z `clubs/info.customKit`; pokud asset CDN nevrátí obrázek, UI bezpečně spadne na monogram
- backend DB/history zůstává zachovaný
