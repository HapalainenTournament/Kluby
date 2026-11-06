export const duoCardConfig = {
  highlightBetter: true,
  sideStats: [
    { key: 'avgRating', label: 'AVG RAT', format: 'rating', highlightBetter: true, higherIsBetter: true },
    { key: 'goalsPerGame', label: 'G/G', format: 'decimal2', highlightBetter: true, higherIsBetter: true },
    { key: 'assistsPerGame', label: 'A/G', format: 'decimal2', highlightBetter: true, higherIsBetter: true }
  ],
  hero: {
    enabled: true,
    key: 'linkUps',
    label: 'LINK-UPS',
    format: 'integer'
  },
  sharedStats: [
    { key: 'matches', label: 'MATCHES', icon: '⚽', format: 'integer' },
    { key: 'goals', label: 'GOALS', icon: '▥', format: 'integer' },
    { key: 'linkUps', label: 'LINK-UPS', icon: '↔', format: 'integer' },
    { key: 'motm', label: 'MOTM', icon: '♛', format: 'integer' }
  ],
  aliases: {
    avgRating: ['avgRating', 'rating', 'rat'],
    goalsPerGame: ['goalsPerGame', 'goalsPerMatch', 'gpg'],
    assistsPerGame: ['assistsPerGame', 'assistsPerMatch', 'apg'],
    matches: ['matches', 'sharedMatches', 'games'],
    goals: ['goals', 'combinedGoals'],
    linkUps: ['linkUps', 'linkups', 'directAssists', 'assistsToEachOther'],
    motm: ['motm', 'motms', 'combinedMotm']
  }
} as const;
