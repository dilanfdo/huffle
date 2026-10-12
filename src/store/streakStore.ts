import { create } from 'zustand';
import {
  createId,
  nowIso,
  streakRepository,
  type StreakRecord,
} from '../data';

type StreakState = {
  streak: StreakRecord | null;
  setStreak: (streak: StreakRecord | null) => void;
  persistStreak: (streak: StreakRecord) => Promise<void>;
  createStreak: (at?: Date) => Promise<StreakRecord>;
};

export const useStreakStore = create<StreakState>((set, get) => ({
  streak: null,

  setStreak: (streak) => set({ streak }),

  persistStreak: async (streak) => {
    await streakRepository.upsertStreak(streak);
    set({ streak });
  },

  createStreak: async (at = new Date()) => {
    const streak: StreakRecord = {
      id: createId(),
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      freezeUsedDates: [],
      updatedAt: nowIso(at),
    };
    await get().persistStreak(streak);
    return streak;
  },
}));
