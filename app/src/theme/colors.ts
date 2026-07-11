/** Dark, warm palette — amber/gold accent on near-black, ported 1:1 from the Claude Design prototype. */
export const colors = {
  bg: '#0a0908',
  bgApp: '#0f0e0c',
  bgAppAlt: '#0d0c0a',
  bgHeaderTop: '#171410',
  bgHeaderTopStrong: '#1c1710',
  bgCard: '#18140f',
  bgCardAlt: '#16120d',
  bgInset: '#120f0b',
  bgInsetAlt: '#151107',
  bgChip: '#191510',
  bgChipB: '#161207',
  bgTileB: '#191307',

  border: 'rgba(255,255,255,0.07)',
  borderSoft: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.09)',
  borderInput: 'rgba(255,255,255,0.1)',
  borderHover: 'rgba(255,255,255,0.18)',

  textPrimary: '#f4f1ea',
  textSecondary: '#e8e2d8',
  textTertiary: '#c8c1b6',
  textMuted: '#a8a196',
  textFaint: '#8a8377',
  textDisabled: '#6e675b',

  amber: '#f5b301',
  amberDark: '#e0870a',
  amberLight: '#f5cf5a',
  amberInk: '#1a1206',

  green: '#4cc38a',
  greyNeutral: '#98a2b3',
  negative: '#e08a6f',

  leaguePL: '#9b8cf0',
  leagueL1: '#6fa8e0',
  leagueBL: '#e0776f',
  leagueSA: '#6fc59a',
  leagueLL: '#e0a86f',

  sourceOfficiel: '#4cc38a',
  sourceJournaliste: '#f5b301',
  sourceMedia: '#6fa8e0',
  sourceNonVerifie: '#98a2b3',
} as const;

export const gradients = {
  amber: ['#f5b301', '#e0870a'] as const,
  header: ['#171410', '#0f0e0c'] as const,
  headerStrong: ['#1c1710', '#0f0e0c'] as const,
  headerB: ['#161309', '#0d0c0a'] as const,
};

export function glow(color: string, alpha: number) {
  return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
}

export const shadowAmber = {
  shadowColor: colors.amber,
  shadowOpacity: 0.45,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 0 },
  elevation: 8,
};
