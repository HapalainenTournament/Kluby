# Clubroom FC27 v6

Opravy:
- Squad advanced stats se agregují z dostupných FC27 match player dat.
- žádné falešné 0.0 % bez attempts
- 2nd assists event 115 jsou výslovně označené jako RECENT WINDOW, ne season total
- další high-confidence FC27 eventy: interceptions 6, standing tackle won 229,
  sliding tackle won 230, completed dribble 174, successful through ball 152
- match detail a profil používají stejné normalizované hodnoty

Key Passes:
Současný veřejný FC27 výzkum nemá spolehlivě potvrzený event ID pro Key Passes.
v6 proto Key Passes NEVYMÝŠLÍ a nezobrazuje falešné číslo.

Důležité:
EA match endpoint poskytuje omezenou historii (typicky posledních 10 pro daný match type).
Pro skutečné season totals advanced statistik je potřeba perzistentně ukládat matchId + player stats
do databáze při každém načtení / pravidelném sběru.

Render:
Build: npm install
Start: npm start
