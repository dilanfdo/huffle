import { create } from 'zustand';
import {
  createId,
  hufflingRepository,
  nowIso,
  type HufflingRecord,
} from '../data';
import { moodFromLastFedAt, stageFromXp, type Mood } from '../domain';

type HufflingState = {
  huffling: HufflingRecord | null;
  setHuffling: (huffling: HufflingRecord | null) => void;
  persistHuffling: (huffling: HufflingRecord) => Promise<void>;
  createHuffling: (name: string, at?: Date) => Promise<HufflingRecord>;
  rename: (name: string) => Promise<void>;
  refreshMood: (now?: Date) => Promise<void>;
};

export const useHufflingStore = create<HufflingState>((set, get) => ({
  huffling: null,

  setHuffling: (huffling) => set({ huffling }),

  persistHuffling: async (huffling) => {
    await hufflingRepository.upsertHuffling(huffling);
    set({ huffling });
  },

  createHuffling: async (name, at = new Date()) => {
    const timestamp = nowIso(at);
    const huffling: HufflingRecord = {
      id: createId(),
      name: name.trim(),
      evolutionStage: stageFromXp(0),
      xp: 0,
      mood: moodFromLastFedAt(null, at),
      lastFedAt: null,
      updatedAt: timestamp,
    };
    await hufflingRepository.upsertHuffling(huffling);
    set({ huffling });
    return huffling;
  },

  rename: async (name) => {
    const existing = get().huffling;
    if (!existing) {
      throw new Error('Huffling not found');
    }
    await get().persistHuffling({
      ...existing,
      name: name.trim(),
      updatedAt: nowIso(),
    });
  },

  refreshMood: async (now = new Date()) => {
    const existing = get().huffling;
    if (!existing) {
      return;
    }
    const mood: Mood = moodFromLastFedAt(existing.lastFedAt, now);
    if (mood === existing.mood) {
      return;
    }
    await get().persistHuffling({
      ...existing,
      mood,
      updatedAt: nowIso(now),
    });
  },
}));
