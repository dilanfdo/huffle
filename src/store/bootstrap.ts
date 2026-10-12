import {
  createId,
  getDb,
  hufflingRepository,
  nowIso,
  streakRepository,
  userRepository,
  weeklyGoalRepository,
  type WeeklyGoalRecord,
} from '../data';
import { weekStartDateString } from '../domain';
import { useClockStore } from './clockStore';
import { useHufflingStore } from './hufflingStore';
import { useSessionStore } from './sessionStore';
import { useStreakStore } from './streakStore';
import { useUserStore } from './userStore';

export type BootstrapState = {
  ready: boolean;
  hasProfile: boolean;
  onboardingComplete: boolean;
};

async function loadOrCreateCurrentWeek(
  weeklyTarget: number,
  now: Date,
): Promise<WeeklyGoalRecord> {
  const weekStart = weekStartDateString(now);
  const existing = await weeklyGoalRepository.getWeeklyGoalByWeekStart(weekStart);
  if (existing) {
    return existing;
  }
  const week: WeeklyGoalRecord = {
    id: createId(),
    targetSessions: weeklyTarget,
    weekStartDate: weekStart,
    sessionsCompletedThisWeek: 0,
    updatedAt: nowIso(now),
  };
  await weeklyGoalRepository.upsertWeeklyGoal(week);
  return week;
}

/**
 * Re-derives everything that depends on "today" after the app returns to the
 * foreground: mood decay, the current week's goal row, and the clock itself.
 */
export async function refreshForNow(now: Date = new Date()): Promise<void> {
  useClockStore.getState().refresh(now);
  await useHufflingStore.getState().refreshMood(now);
  const user = useUserStore.getState().user;
  if (!user) {
    return;
  }
  const current = useUserStore.getState().currentWeek;
  if (current && current.weekStartDate === weekStartDateString(now)) {
    return;
  }
  const week = await loadOrCreateCurrentWeek(user.weeklyGoal, now);
  useUserStore.getState().setCurrentWeek(week);
}

/**
 * Opens SQLite, hydrates Zustand, and reapplies missed-day mood decay.
 * Does not create a user/Huffling — that happens in onboarding.
 */
export async function bootstrapStores(now: Date = new Date()): Promise<BootstrapState> {
  await getDb();

  const [user, huffling, streak] = await Promise.all([
    userRepository.getUser(),
    hufflingRepository.getHuffling(),
    streakRepository.getStreak(),
  ]);

  useUserStore.getState().setUser(user);
  useHufflingStore.getState().setHuffling(huffling);
  useStreakStore.getState().setStreak(streak);

  await Promise.all([
    useSessionStore.getState().loadHabitTypes('fitness'),
    useSessionStore.getState().loadSessions(),
  ]);

  if (huffling) {
    await useHufflingStore.getState().refreshMood(now);
  }

  if (user) {
    const week = await loadOrCreateCurrentWeek(user.weeklyGoal, now);
    useUserStore.getState().setCurrentWeek(week);
    await useUserStore.getState().markOpened(now);
  }

  return {
    ready: true,
    hasProfile: Boolean(user && huffling && streak),
    onboardingComplete: user?.onboardingComplete ?? false,
  };
}

/** Called from onboarding after the user names their Huffling. */
export async function createLocalProfile(hufflingName: string, at: Date = new Date()): Promise<void> {
  await getDb();

  let user = useUserStore.getState().user ?? (await userRepository.getUser());
  if (user) {
    useUserStore.getState().setUser(user);
  } else {
    user = await useUserStore.getState().createUser(at);
  }

  const existingHuffling =
    useHufflingStore.getState().huffling ?? (await hufflingRepository.getHuffling());
  if (existingHuffling) {
    await useHufflingStore.getState().persistHuffling({
      ...existingHuffling,
      name: hufflingName.trim(),
      updatedAt: nowIso(at),
    });
  } else {
    await useHufflingStore.getState().createHuffling(hufflingName, at);
  }

  const existingStreak = useStreakStore.getState().streak ?? (await streakRepository.getStreak());
  if (existingStreak) {
    useStreakStore.getState().setStreak(existingStreak);
  } else {
    await useStreakStore.getState().createStreak(at);
  }

  const week = await loadOrCreateCurrentWeek(user.weeklyGoal, at);
  useUserStore.getState().setCurrentWeek(week);
}

export async function markOnboardingComplete(): Promise<void> {
  await useUserStore.getState().patchUser({ onboardingComplete: true });
  const { syncLocalNotifications } = await import('../notifications/schedule');
  await syncLocalNotifications();
}

export async function getCurrentWeeklyGoal(
  now: Date = new Date(),
): Promise<WeeklyGoalRecord | null> {
  return weeklyGoalRepository.getWeeklyGoalByWeekStart(weekStartDateString(now));
}

export async function setWeeklyGoalTarget(targetSessions: number): Promise<void> {
  const safeTarget = Math.max(1, Math.round(targetSessions));
  await useUserStore.getState().patchUser({ weeklyGoal: safeTarget });
  const week =
    useUserStore.getState().currentWeek ?? (await getCurrentWeeklyGoal());
  if (week) {
    const next = {
      ...week,
      targetSessions: safeTarget,
      updatedAt: nowIso(),
    };
    await weeklyGoalRepository.upsertWeeklyGoal(next);
    useUserStore.getState().setCurrentWeek(next);
  }
}
