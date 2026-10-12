import { create } from 'zustand';
import {
  habitTypeRepository,
  sessionLogRepository,
  type HabitTypeRecord,
  type SessionLogRecord,
} from '../data';

type SessionState = {
  habitTypes: HabitTypeRecord[];
  sessions: SessionLogRecord[];
  setHabitTypes: (habitTypes: HabitTypeRecord[]) => void;
  setSessions: (sessions: SessionLogRecord[]) => void;
  addSession: (session: SessionLogRecord) => void;
  loadHabitTypes: (category?: string) => Promise<void>;
  loadSessions: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set) => ({
  habitTypes: [],
  sessions: [],

  setHabitTypes: (habitTypes) => set({ habitTypes }),
  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions].sort(
        (a, b) => b.completedAt.localeCompare(a.completedAt),
      ),
    })),

  loadHabitTypes: async (category = 'fitness') => {
    const habitTypes = await habitTypeRepository.listHabitTypes(category);
    set({ habitTypes });
  },

  loadSessions: async () => {
    const sessions = await sessionLogRepository.listSessionLogs();
    set({ sessions });
  },
}));
