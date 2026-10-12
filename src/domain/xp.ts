/** Flat XP for showing up. Duration/type do not affect XP in Phase 1a. */
export const BASE_SESSION_XP = 10;

/** +1 XP per current-streak day, so consistency is rewarded without a grind loop. */
export const STREAK_BONUS_PER_DAY = 1;

/** Cap so a long streak cannot produce huge single-session jumps. */
export const STREAK_BONUS_CAP = 5;

/**
 * XP awarded for a session after the streak for that calendar day is applied.
 * Streak 1 → 11 XP, streak 5+ → 15 XP.
 */
export function xpForSession(currentStreakAfterLog: number): number {
  const streakDays = Math.max(0, currentStreakAfterLog);
  const bonus = Math.min(streakDays, STREAK_BONUS_CAP) * STREAK_BONUS_PER_DAY;
  return BASE_SESSION_XP + bonus;
}
