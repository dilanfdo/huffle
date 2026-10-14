import type { IconName } from './paths';

const BY_LABEL: Record<string, IconName> = {
  walk: 'footprints',
  'home workout': 'home',
  gym: 'dumbbell',
  run: 'activity',
  sport: 'trophy',
  other: 'sparkles',
};

/** Seeded movement types get a line icon; custom types fall back to their stored emoji. */
export function habitIconName(label: string): IconName | null {
  return BY_LABEL[label.trim().toLowerCase()] ?? null;
}
