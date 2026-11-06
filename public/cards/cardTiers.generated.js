export const cardTiers = {
  fallbackTier: 'bronze',
  thresholds: [
    { tier: 'bronze', min: 0 },
    { tier: 'silver', min: 70 },
    { tier: 'gold', min: 80 },
    { tier: 'special', min: 90 }
  ],
  styles: {
    bronze: {
      label: 'Bronze',
      accent: '#CD7F32',
      accentSoft: 'rgba(205,127,50,.22)',
      text: '#F8E3CB',
      muted: '#D5B697',
      frameFilter: 'sepia(.62) saturate(1.55) hue-rotate(338deg) brightness(.88)',
      bg: 'radial-gradient(circle at 68% 20%,rgba(205,127,50,.16),transparent 30%),linear-gradient(155deg,#15100d 0%,#24170f 52%,#090706 100%)'
    },
    silver: {
      label: 'Silver',
      accent: '#D9E2EC',
      accentSoft: 'rgba(217,226,236,.18)',
      text: '#F8FAFC',
      muted: '#CBD5E1',
      frameFilter: 'grayscale(.92) saturate(.18) brightness(1.16) contrast(.94)',
      bg: 'radial-gradient(circle at 68% 20%,rgba(226,232,240,.14),transparent 30%),linear-gradient(155deg,#0b1119 0%,#17202b 52%,#070a0f 100%)'
    },
    gold: {
      label: 'Gold',
      accent: '#FBBF24',
      accentSoft: 'rgba(251,191,36,.16)',
      text: '#FFF7D6',
      muted: '#E7D8A9',
      frameFilter: 'saturate(1.08) contrast(1.02)',
      bg: 'radial-gradient(circle at 68% 20%,rgba(251,191,36,.14),transparent 28%),linear-gradient(155deg,#08111e 0%,#0c1727 52%,#050a12 100%)'
    },
    special: {
      label: 'Special',
      accent: '#2DD4BF',
      accent2: '#A855F7',
      accentSoft: 'rgba(45,212,191,.18)',
      text: '#ECFEFF',
      muted: '#A5F3FC',
      frameFilter: 'sepia(.18) saturate(1.85) hue-rotate(102deg) brightness(1.08) contrast(1.04)',
      bg: 'radial-gradient(circle at 72% 18%,rgba(168,85,247,.24),transparent 26%),radial-gradient(circle at 24% 34%,rgba(45,212,191,.20),transparent 28%),linear-gradient(155deg,#06141b 0%,#0a1830 48%,#080a16 100%)'
    }
  }
};
