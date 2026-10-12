import {
  createId,
  nowIso,
  runInTransaction,
  sessionLogRepository,
  streakRepository,
  hufflingRepository,
  userRepository,
  weeklyGoalRepository,
  type HufflingRecord,
  type SessionLogRecord,
  type StreakRecord,
  type UserRecord,
  type WeeklyGoalRecord,
} from '../data';
import {
  applyCompletedDay,
  fromLocalDateString,
  moodFromLastFedAt,
  stageFromXp,
  toLocalDateString,
  weekStartDateString,
  xpForSession,
} from '../domain';
import { useHufflingStore } from './hufflingStore';
import type { LogSessionInput, LogSessionResult } from './logTypes';
import { useSessionStore } from './sessionStore';
import { useStreakStore } from './streakStore';
import { useUserStore } from './userStore';

async function ensureWeeklyGoal(
  user: UserRecord,
  localDate: string,
  at: Date,
): Promise<WeeklyGoalRecord> {
  const weekStart = weekStartDateString(fromLocalDateString(localDate));
  const existing = await weeklyGoalRepository.getWeeklyGoalByWeekStart(weekStart);
  if (existing) {
    return existing;
  }

  return {
    id: createId(),
    targetSessions: user.weeklyGoal,
    weekStartDate: weekStart,
    sessionsCompletedThisWeek: 0,
    updatedAt: nowIso(at),
  };
}

/**
 * Single write path for feeding the Huffling. Updates session, XP/stage/mood,
 * streak, freeze tokens, and this week's session count in one SQLite transaction.
 */
export async function logSession(input: LogSessionInput): Promise<LogSessionResult> {
  const at = input.at ?? new Date();
  const timestamp = nowIso(at);
  const localDate = toLocalDateString(at);

  const user = useUserStore.getState().user;
  const huffling = useHufflingStore.getState().huffling;
  const streak = useStreakStore.getState().streak;

  if (!user || !huffling || !streak) {
    throw new Error('Cannot log a session before the local profile exists');
  }

  const streakResult = applyCompletedDay(
    streak,
    localDate,
    user.streakFreezeTokens,
  );
  const firstSessionOfDay = streak.lastCompletedDate !== localDate;
  const xpAwarded = xpForSession(streakResult.currentStreak);
  const previousStage = huffling.evolutionStage;
  const previousMood = huffling.mood;
  const nextXp = huffling.xp + xpAwarded;
  const newStage = stageFromXp(nextXp);
  const newMood = moodFromLastFedAt(timestamp, at);

  const session: SessionLogRecord = {
    id: createId(),
    habitTypeId: input.habitTypeId,
    completedAt: timestamp,
    durationMinutes: input.durationMinutes ?? null,
    xpAwarded,
    note: input.note?.trim() ? input.note.trim() : null,
    updatedAt: timestamp,
  };

  const nextHuffling: HufflingRecord = {
    ...huffling,
    xp: nextXp,
    evolutionStage: newStage,
    mood: newMood,
    lastFedAt: timestamp,
    updatedAt: timestamp,
  };

  const nextStreak: StreakRecord = {
    ...streak,
    currentStreak: streakResult.currentStreak,
    longestStreak: streakResult.longestStreak,
    lastCompletedDate: streakResult.lastCompletedDate,
    freezeUsedDates: streakResult.freezeUsedDates,
    updatedAt: timestamp,
  };

  const nextUser: UserRecord = {
    ...user,
    streakFreezeTokens: Math.max(0, user.streakFreezeTokens + streakResult.freezeTokensDelta),
    updatedAt: timestamp,
  };

  const week = await ensureWeeklyGoal(user, localDate, at);
  const nextWeek: WeeklyGoalRecord = {
    ...week,
    sessionsCompletedThisWeek: week.sessionsCompletedThisWeek + 1,
    updatedAt: timestamp,
  };

  await runInTransaction(async () => {
    await sessionLogRepository.insertSessionLog(session);
    await hufflingRepository.upsertHuffling(nextHuffling);
    await streakRepository.upsertStreak(nextStreak);
    await userRepository.upsertUser(nextUser);
    await weeklyGoalRepository.upsertWeeklyGoal(nextWeek);
  });

  useSessionStore.getState().addSession(session);
  useHufflingStore.getState().setHuffling(nextHuffling);
  useStreakStore.getState().setStreak(nextStreak);
  useUserStore.getState().setUser(nextUser);
  if (nextWeek.weekStartDate === weekStartDateString(at)) {
    useUserStore.getState().setCurrentWeek(nextWeek);
  }

  return {
    session,
    xpAwarded,
    previousStage,
    newStage,
    evolved: newStage !== previousStage,
    previousMood,
    newMood,
    firstSessionOfDay,
  };
}
