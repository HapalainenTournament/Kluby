# Clubroom FC27 v8

Hlavní změny:
- stahuje leagueMatch, playoffMatch a friendlyMatch zvlášť
- navíc volá FC27 match-player-stats pro všechny tři typy
- snaží se zachovat kompletní raw player fields, ne jen několik předem vybraných statistik
- Virtual Pro Name parser hledá proName / virtualProName / vpName a firstName+lastName varianty
- odděluje EA/PS/Xbox/PC account name a Virtual Pro Name
- nalezený Pro Name se ukládá do `players.pro_name` a zobrazuje se jako primární jméno
- account handle zůstává jako sekundární jméno
- všechny match event aggregates a raw match JSON zůstávají archivované
- historie se dál deduplikuje podle match_id

Důležité:
EA FC27 endpointy jsou neoficiální/undocumented. Pokud konkrétní Pro Name není v žádném z veřejných payloadů,
v8 ho nevymyslí. Díky širšímu match-player ingestu ale nově zachytí pole, která v7 vůbec nestahovala.

Render:
npm install
npm start
DATABASE_URL = Render PostgreSQL connection string
