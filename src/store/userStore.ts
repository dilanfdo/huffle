import { create } from 'zustand';
import {
  createId,
  nowIso,
  userRepository,
  type UserRecord,
  type WeeklyGoalRecord,
} from '../data';
import { DEFAULT_WEEKLY_TARGET } from '../domain';

type UserState = {
  user: UserRecord | null;
  currentWeek: WeeklyGoalRecord | null;
  setUser: (user: UserRecord | null) => void;
  setCurrentWeek: (currentWeek: WeeklyGoalRecord | null) => void;
  persistUser: (user: UserRecord) => Promise<void>;
  patchUser: (patch: Partial<Omit<UserRecord, 'id' | 'createdAt'>>) => Promise<UserRecord>;
  createUser: (at?: Date) => Promise<UserRecord>;
  markOpened: (at?: Date) => Promise<void>;
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  currentWeek: null,

  setUser: (user) => set({ user }),
  setCurrentWeek: (currentWeek) => set({ currentWeek }),

  persistUser: async (user) => {
    await userRepository.upsertUser(user);
    set({ user });
  },

  patchUser: async (patch) => {
    const existing = get().user;
    if (!existing) {
      throw new Error('User not found');
    }
    const next: UserRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: nowIso(),
    };
    await userRepository.upsertUser(next);
    set({ user: next });
    return next;
  },

  createUser: async (at = new Date()) => {
    const timestamp = nowIso(at);
    const user: UserRecord = {
      id: createId(),
      createdAt: timestamp,
      streakFreezeTokens: 0,
      onboardingComplete: false,
      weeklyGoal: DEFAULT_WEEKLY_TARGET,
      reminderHour: 19,
      reminderMinute: 0,
      lastOpenedAt: timestamp,
      updatedAt: timestamp,
    };
    await userRepository.upsertUser(user);
    set({ user });
    return user;
  },

  markOpened: async (at = new Date()) => {
    const existing = get().user;
    if (!existing) {
      return;
    }
    await get().patchUser({ lastOpenedAt: nowIso(at) });
  },
}));
