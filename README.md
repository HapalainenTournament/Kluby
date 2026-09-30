# Clubroom v5

Novinky:
- hráčský profil doplňuje střely, přihrávky, tackly, saves a pozici z dostupných match dat
- second assists z EA match_event_aggregate eventu 115
- completed dribbles z eventu 174
- second assists a dribbles v detailu zápasu i Compare
- žádné falešné 0.0 % při chybějících datech
- RAW JSON z UI zůstává odstraněný
- EA/PSN jméno je zobrazené; číselné ID se uživateli necpe

Pro Name:
Ve veřejně ověřených současných FC endpoint datech nebylo nalezeno spolehlivé samostatné pole pro jméno vytvořeného Virtual Pro.
v5 ho proto nevymýšlí. Pokud EA začne/už vrací takové pole v některém payloadu, parser lze doplnit.

Poznámka:
Statistiky označené * jsou součty pouze z historie zápasů, kterou EA aktuálně vrátí, nikoli celoživotní career totals.

Render:
Build: npm install
Start: npm start
