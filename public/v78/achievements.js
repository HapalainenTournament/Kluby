// CLUBROOM v78 · Clubroom achievements (rules). Values are computed from archived matches only.
// metric = key produced by clubroom-v78.js achievementState(); target = threshold to unlock.
window.CLUBROOM_ACHIEVEMENTS = Object.freeze([
  {id:'first-win',      title:'First Blood',       desc:'Win your first archived match.',              metric:'wins',          target:1,   tier:'bronze', icon:'cup'},
  {id:'matches-50',     title:'Regulars',          desc:'Play 50 archived matches.',                   metric:'matches',       target:50,  tier:'bronze', icon:'calendar'},
  {id:'matches-100',    title:'Centurions',        desc:'Play 100 archived matches.',                  metric:'matches',       target:100, tier:'silver', icon:'calendar'},
  {id:'matches-250',    title:'Lifers',            desc:'Play 250 archived matches.',                  metric:'matches',       target:250, tier:'gold',   icon:'calendar'},
  {id:'win-streak-5',   title:'On a Roll',         desc:'Win 5 matches in a row.',                     metric:'winStreak',     target:5,   tier:'silver', icon:'flame'},
  {id:'unbeaten-10',    title:'Unbreakable',       desc:'Go 10 matches without a defeat.',             metric:'unbeaten',      target:10,  tier:'gold',   icon:'shield'},
  {id:'goals-100',      title:'Hundred Club',      desc:'Score 100 goals as a club.',                  metric:'goals',         target:100, tier:'silver', icon:'ball'},
  {id:'goals-250',      title:'Goal Factory',      desc:'Score 250 goals as a club.',                  metric:'goals',         target:250, tier:'gold',   icon:'ball'},
  {id:'clean-sheets-5', title:'Shut Out',          desc:'Keep 5 clean sheets.',                        metric:'cleanSheets',   target:5,   tier:'bronze', icon:'glove'},
  {id:'clean-sheets-25',title:'The Wall',          desc:'Keep 25 clean sheets.',                       metric:'cleanSheets',   target:25,  tier:'gold',   icon:'glove'},
  {id:'thrashing',      title:'Statement Win',     desc:'Win a match by 5 or more goals.',             metric:'bestMargin',    target:5,   tier:'silver', icon:'bolt'},
  {id:'hat-trick',      title:'Hat-trick Hero',    desc:'A player scores 3+ goals in one match.',      metric:'hatTricks',     target:1,   tier:'bronze', icon:'star'},
  {id:'playoff-win',    title:'Playoff Winners',   desc:'Win an archived playoff match.',              metric:'playoffWins',   target:1,   tier:'silver', icon:'cup'}
]);
