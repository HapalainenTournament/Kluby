window.DUO_CATEGORIES = [
  { id:"best-duo", title:"Best Duo", badge:"WIN RATE", minSharedMatches:5, higherIsBetter:true, heroLabel:"WIN RATE", format:"percent", metric:duo=>duo.winRate, eligible:duo=>duo.wins>0 },
  { id:"rating-duo", title:"Rating Duo", badge:"RATING", minSharedMatches:5, higherIsBetter:true, heroLabel:"AVG RATING", format:"rating", metric:duo=>duo.avgRating, requirePositive:true },
  { id:"goal-machine", title:"Goal Machine", badge:"GOALS", minSharedMatches:3, higherIsBetter:true, heroLabel:"GOALS", format:"integer", metric:duo=>duo.combinedGoals, requirePositive:true },
  { id:"iron-pair", title:"Iron Pair", badge:"MATCHES", minSharedMatches:2, higherIsBetter:true, heroLabel:"MATCHES", format:"integer", metric:duo=>duo.sharedMatches },
  { id:"wall", title:"Wall", badge:"DEFENCE", minSharedMatches:5, higherIsBetter:false, heroLabel:"GA / MATCH", format:"decimal2", metric:duo=>duo.goalsConcededPerMatch, eligible:duo=>duo.wallEligible },
  { id:"cursed-duo", title:"Cursed Duo", badge:"WIN RATE", minSharedMatches:5, higherIsBetter:false, heroLabel:"WIN RATE", format:"percent", metric:duo=>duo.winRate }
];
