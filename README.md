# Clubroom v4.1

Oprava podle skutečného EA match payloadu:
- playername -> skutečné jméno hráče
- passesmade / passattempts
- tacklesmade / tackleattempts
- shots, saves, mom, redcards, pos, secondsPlayed
- hráči se filtrují podle club ID
- názvy klubů se čtou z clubs[clubId].details.name
- player ID se zachová z klíče objektu players[clubId][playerId]
- pass % a tackle % se dopočítávají z made/attempts

Render:
Build: npm install
Start: npm start
