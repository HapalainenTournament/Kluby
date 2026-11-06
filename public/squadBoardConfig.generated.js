export const SQUAD_BOARD_MIN_MATCHES71=5;
export const SQUAD_BOARD_GROUPS70=[
 {id:'general',label:'General'},
 {id:'attack',label:'Attack'},
 {id:'creation',label:'Creation'},
 {id:'defense',label:'Defense'},
 {id:'passing',label:'Passing'}
];
export const SQUAD_BOARD_METRICS70=[
 {id:'matches',label:'Matches',group:'general',valueKey:'matches',format:'integer',higherIsBetter:true,rankKey:'games',perMatch:'sample',sample:'matches'},
 {id:'rating',label:'Avg rating',group:'general',valueKey:'rating',format:'decimal1',higherIsBetter:true,rankKey:'rating',perMatch:'same',sample:'matches'},
 {id:'motm',label:'MOTM',group:'general',valueKey:'motm',format:'integer',higherIsBetter:true,rankKey:'motm',perMatch:'divide',sample:'matches'},
 {id:'overall',label:'Overall',group:'general',valueKey:'overall',format:'integer',higherIsBetter:true,perMatch:'same',sample:'matches'},
 {id:'goals',label:'Goals',group:'attack',valueKey:'goals',format:'integer',higherIsBetter:true,rankKey:'goals',perMatch:'divide',sample:'matches'},
 {id:'shots',label:'Shots',group:'attack',valueKey:'shots',format:'integer',higherIsBetter:true,rankKey:'shots',perMatch:'divide',sample:'matches'},
 {id:'shotRate',label:'Shot %',group:'attack',valueKey:'shotRate',format:'percent',higherIsBetter:true,rankKey:'shotRate',perMatch:'same',sample:'matches'},
 {id:'ga',label:'G+A',group:'attack',valueKey:'ga',format:'integer',higherIsBetter:true,rankKey:'ga',perMatch:'divide',sample:'matches'},
 {id:'assists',label:'Assists',group:'creation',valueKey:'assists',format:'integer',higherIsBetter:true,rankKey:'assists',perMatch:'divide',sample:'matches'},
 {id:'secondAssists',label:'2nd assists',group:'creation',valueKey:'secondAssists',format:'integer',higherIsBetter:true,perMatch:'divide',sample:'archiveMatches'},
 {id:'throughBalls',label:'Through balls',group:'creation',valueKey:'throughBalls',format:'integer',higherIsBetter:true,perMatch:'divide',sample:'archiveMatches'},
 {id:'dribbles',label:'Dribbles',group:'creation',valueKey:'dribbles',format:'integer',higherIsBetter:true,perMatch:'divide',sample:'archiveMatches'},
 {id:'tacklesWon',label:'Tackles won',group:'defense',valueKey:'tacklesWon',format:'integer',higherIsBetter:true,perMatch:'divide',sample:'archiveMatches'},
 {id:'tackleRate',label:'Tackle %',group:'defense',valueKey:'tackleRate',format:'percent',higherIsBetter:true,rankKey:'tackleRate',perMatch:'same',sample:'matches'},
 {id:'interceptions',label:'Interceptions',group:'defense',valueKey:'interceptions',format:'integer',higherIsBetter:true,perMatch:'divide',sample:'archiveMatches'},
 {id:'cleanSheets',label:'Clean sheets',group:'defense',valueKey:'cleanSheets',format:'integer',higherIsBetter:true,perMatch:'rate',sample:'archiveMatches',perMatchFormat:'percent'},
 {id:'passRate',label:'Pass %',group:'passing',valueKey:'passRate',format:'percent',higherIsBetter:true,rankKey:'passRate',perMatch:'same',sample:'matches'},
 {id:'passes',label:'Passes',group:'passing',valueKey:'passes',format:'integer',higherIsBetter:true,rankKey:'passes',perMatch:'divide',sample:'matches'},
 {id:'passAttempts',label:'Pass attempts',group:'passing',valueKey:'passAttempts',format:'integer',higherIsBetter:true,perMatch:'divide',sample:'matches'}
];
