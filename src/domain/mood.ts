import { localDayDiff, toLocalDateString } from './dates';

export const MOOD_IDS = ['winded', 'neutral', 'energized'] as const;
export type Mood = (typeof MOOD_IDS)[number];

/**
 * Temporary energy from recent feeding. Missed days make the Huffling look
 * tired again; logging a session reverses this instantly. Never changes stage/XP.
 *
 * - Fed today → energized
 * - Last fed yesterday → neutral
 * - 2+ local days ago, or never fed → winded
 */
export function moodFromLastFedAt(
  lastFedAt: string | null,
  now: Date = new Date(),
): Mood {
  if (!lastFedAt) {
    return 'winded';
  }

  const lastFed = new Date(lastFedAt);
  if (Number.isNaN(lastFed.getTime())) {
    return 'winded';
  }

  const gap = localDayDiff(toLocalDateString(lastFed), toLocalDateString(now));
  if (gap <= 0) {
    return 'energized';
  }
  if (gap === 1) {
    return 'neutral';
  }
  return 'winded';
}
