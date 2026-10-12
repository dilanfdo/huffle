import type { TextStyle } from 'react-native';

/** Subset of the Material 3 type scale; sizes/line heights follow the M3 spec. */
export const type = {
  displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '800' },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '700' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;
