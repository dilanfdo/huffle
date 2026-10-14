import { useMemo } from 'react';
import {
  canWear,
  dailyGlow,
  earnedCosmetics,
  toLocalDateString,
  todaysGift,
  type CosmeticId,
} from '../domain';
import { useClockStore } from './clockStore';
import { useHufflingStore } from './hufflingStore';
import { useSessionStore } from './sessionStore';
import { useStreakStore } from './streakStore';
import { useWardrobeStore } from './wardrobeStore';

export type CosmeticsView = {
  earned: CosmeticId[];
  giftToday: CosmeticId | null;
  giftOpened: boolean;
  /** Logged today and a gift is waiting to be opened. */
  giftReady: boolean;
  supporter: boolean;
  /** What the Huffling is wearing right now (null if none or no longer wearable). */
  worn: CosmeticId | null;
  loggedToday: boolean;
  sessionsToday: number;
  glow: ReturnType<typeof dailyGlow>;
  can: (id: CosmeticId) => boolean;
};

/** Everything cosmetic/daily-reward UI needs, derived from history plus tiny local settings. */
export function useCosmetics(): CosmeticsView {
  const today = useClockStore((s) => s.today);
  const stage = useHufflingStore((s) => s.huffling?.evolutionStage ?? 'winded');
  const longestStreak = useStreakStore((s) => s.streak?.longestStreak ?? 0);
  const lastCompleted = useStreakStore((s) => s.streak?.lastCompletedDate ?? null);
  const sessions = useSessionStore((s) => s.sessions);
  const { selected, giftOpenedDate, supporter } = useWardrobeStore();

  return useMemo(() => {
    const earned = earnedCosmetics({ sessions: sessions.length, longestStreak, stage });
    const giftToday = supporter ? null : todaysGift(today, earned);
    const giftOpened = giftOpenedDate === today;
    const loggedToday = lastCompleted === today;
    const sessionsToday = sessions.filter(
      (s) => toLocalDateString(new Date(s.completedAt)) === today,
    ).length;
    const can = (id: CosmeticId) => canWear(id, { earned, giftToday, giftOpened, supporter });
    return {
      earned,
      giftToday,
      giftOpened,
      giftReady: loggedToday && giftToday !== null && !giftOpened,
      supporter,
      worn: selected && can(selected) ? selected : null,
      loggedToday,
      sessionsToday,
      glow: dailyGlow(sessionsToday),
      can,
    };
  }, [giftOpenedDate, lastCompleted, longestStreak, selected, sessions, stage, supporter, today]);
}
