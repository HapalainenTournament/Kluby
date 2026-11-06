export type MatchMetric = { id:string; label:string; higherIsBetter:boolean; format:'integer'|'percent' };
export type MatchMetricGroup = { id:string; title:string; metrics:MatchMetric[] };
export const MATCH_METRIC_GROUPS:MatchMetricGroup[] = [
 {id:'scoring',title:'Scoring',metrics:[{id:'goals',label:'Goals',higherIsBetter:true,format:'integer'},{id:'shots',label:'Shots',higherIsBetter:true,format:'integer'},{id:'saves',label:'Saves',higherIsBetter:true,format:'integer'}]},
 {id:'passing',title:'Passing',metrics:[{id:'passes',label:'Passes completed',higherIsBetter:true,format:'integer'},{id:'passAttempts',label:'Pass attempts',higherIsBetter:true,format:'integer'},{id:'passPct',label:'Pass accuracy',higherIsBetter:true,format:'percent'},{id:'throughBalls',label:'Through balls',higherIsBetter:true,format:'integer'}]},
 {id:'defending',title:'Defending',metrics:[{id:'tackles',label:'Tackles',higherIsBetter:true,format:'integer'},{id:'tacklePct',label:'Tackle success',higherIsBetter:true,format:'percent'},{id:'interceptions',label:'Interceptions',higherIsBetter:true,format:'integer'},{id:'saves',label:'Saves',higherIsBetter:true,format:'integer'}]},
 {id:'discipline',title:'Discipline',metrics:[{id:'redCards',label:'Red cards',higherIsBetter:false,format:'integer'}]}
];
