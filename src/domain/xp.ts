/** Flat XP for showing up. Duration/type do not affect XP in Phase 1a. */
export const BASE_SESSION_XP = 10;

/** +1 XP per current-streak day, so consistency is rewarded without a grind loop. */
export const STREAK_BONUS_PER_DAY = 1;

/** Cap so a long streak cannot produce huge single-session jumps. */
export const STREAK_BONUS_CAP = 5;

/**
 * Share of a session's XP that counts, by how many sessions were already logged
 * that day. Every session is still logged and celebrated; later ones just stop
 * paying so tiny entries can't be farmed. Never penalises rest days.
 */
export const SESSION_XP_MULTIPLIERS = [1, 0.5, 0.25] as const;

/** Sessions per day that still earn XP (the "daily glow"). */
export const DAILY_GLOW_SESSIONS = SESSION_XP_MULTIPLIERS.length;

/**
 * XP awarded for a session after the streak for that calendar day is applied.
 * Streak 1 → 11 XP, streak 5+ → 15 XP, for the first session of the day.
 */
export function xpForSession(currentStreakAfterLog: number, sessionsAlreadyToday = 0): number {
  const streakDays = Math.max(0, currentStreakAfterLog);
  const bonus = Math.min(streakDays, STREAK_BONUS_CAP) * STREAK_BONUS_PER_DAY;
  const multiplier = SESSION_XP_MULTIPLIERS[Math.max(0, sessionsAlreadyToday)] ?? 0;
  return Math.round((BASE_SESSION_XP + bonus) * multiplier);
}

export type DailyGlow = {
  /** Sessions today that earned XP, up to the daily limit. */
  counted: number;
  total: number;
  /** True once today's XP-earning sessions are used up. */
  full: boolean;
};

export function dailyGlow(sessionsToday: number): DailyGlow {
  const counted = Math.min(Math.max(0, sessionsToday), DAILY_GLOW_SESSIONS);
  return { counted, total: DAILY_GLOW_SESSIONS, full: counted >= DAILY_GLOW_SESSIONS };
}
