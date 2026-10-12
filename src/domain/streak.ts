import { addLocalDays, localDayDiff } from './dates';

/** Award a freeze token every N consecutive days so tokens accrue without a shop. */
export const FREEZE_TOKEN_STREAK_INTERVAL = 7;

/** Streak days still needed to earn the next freeze token (a full interval right after one). */
export function daysToNextFreezeToken(currentStreak: number): number {
  const streakDays = Math.max(0, currentStreak);
  return FREEZE_TOKEN_STREAK_INTERVAL - (streakDays % FREEZE_TOKEN_STREAK_INTERVAL);
}

export type StreakSnapshot = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  freezeUsedDates: string[];
};

export type ApplyCompletedDayResult = StreakSnapshot & {
  /** Change in freeze inventory: -1 consumed, +1 earned, or both (net 0). */
  freezeTokensDelta: number;
};

/**
 * Streak to show today, without logging. The stored count only changes on a
 * log, so after missed days it would still read as alive. Mirrors
 * applyCompletedDay: a log today keeps it going if the gap is 1, or 2 with a
 * freeze token to cover the missed day; otherwise the next log restarts at 1.
 */
export function liveStreak(
  streak: Pick<StreakSnapshot, 'currentStreak' | 'lastCompletedDate'>,
  freezeTokensAvailable: number,
  todayLocalDate: string,
): number {
  if (streak.lastCompletedDate === null) {
    return 0;
  }
  const gap = localDayDiff(streak.lastCompletedDate, todayLocalDate);
  if (gap <= 1) {
    return streak.currentStreak;
  }
  if (gap === 2 && freezeTokensAvailable > 0) {
    return streak.currentStreak;
  }
  return 0;
}

/**
 * Apply one completed local calendar day to streak state.
 * Extra sessions on the same day do not change the streak.
 * A single freeze token covers exactly one missed day (gap of 2).
 * Larger gaps reset the streak to 1 — we never delete history, only the count.
 */
export function applyCompletedDay(
  streak: StreakSnapshot,
  completedLocalDate: string,
  freezeTokensAvailable: number,
): ApplyCompletedDayResult {
  const freezeUsedDates = [...streak.freezeUsedDates];
  let freezeTokensDelta = 0;

  if (streak.lastCompletedDate === completedLocalDate) {
    return {
      ...streak,
      freezeUsedDates,
      freezeTokensDelta: 0,
    };
  }

  let currentStreak: number;

  if (streak.lastCompletedDate === null) {
    currentStreak = 1;
  } else {
    const gap = localDayDiff(streak.lastCompletedDate, completedLocalDate);

    if (gap <= 0) {
      // Completed date is before lastCompletedDate (clock skew / edits). Keep state.
      return {
        ...streak,
        freezeUsedDates,
        freezeTokensDelta: 0,
      };
    }

    if (gap === 1) {
      currentStreak = streak.currentStreak + 1;
    } else if (gap === 2 && freezeTokensAvailable > 0) {
      const missedDay = addLocalDays(streak.lastCompletedDate, 1);
      freezeUsedDates.push(missedDay);
      freezeTokensDelta -= 1;
      currentStreak = streak.currentStreak + 1;
    } else {
      currentStreak = 1;
    }
  }

  if (
    currentStreak > 0 &&
    currentStreak % FREEZE_TOKEN_STREAK_INTERVAL === 0 &&
    currentStreak !== streak.currentStreak
  ) {
    freezeTokensDelta += 1;
  }

  return {
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    lastCompletedDate: completedLocalDate,
    freezeUsedDates,
    freezeTokensDelta,
  };
}
