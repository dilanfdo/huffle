import { create } from 'zustand';
import { toLocalDateString } from '../domain';

type ClockState = {
  today: string;
  refresh: (now?: Date) => void;
};

/** Local calendar day, refreshed on app resume so day-derived UI doesn't go stale. */
export const useClockStore = create<ClockState>((set) => ({
  today: toLocalDateString(new Date()),
  refresh: (now = new Date()) => set({ today: toLocalDateString(now) }),
}));
