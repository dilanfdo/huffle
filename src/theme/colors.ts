export const colors = {
  bg: '#F6F1E8',
  surface: '#FFFDF8',
  ink: '#3D405B',
  inkMuted: '#6B6E82',
  accent: '#E07A5F',
  accentDark: '#C4624A',
  calm: '#81B29A',
  winded: '#C9B8A8',
  neutral: '#E8D5B5',
  energized: '#F4A261',
  line: '#E6DFD2',
  danger: '#C44536',
  // Tonal surfaces (Material 3 container roles) on top of bg/surface.
  surfaceContainer: '#EFE8DA',
  accentContainer: '#FBE5DC',
  onAccentContainer: '#7A2E1B',
  calmContainer: '#DCEBE3',
  onCalmContainer: '#2F5744',
  // Secondary text that still passes AA on surfaceContainer (inkMuted does not).
  inkSecondary: '#565A70',
  // Soft amber for gentle nudges and "glow" moments (never the alarm-coloured coral).
  glowContainer: '#FDF0D3',
  onGlowContainer: '#6B4A06',
} as const;
