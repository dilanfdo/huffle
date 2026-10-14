import { describe, expect, it } from 'vitest';
import { canWear, COSMETICS, earnedCosmetics, todaysGift, unlockHint } from './cosmetics';
import { comebackDaysMissed } from './streak';
import { dailyGlow, xpForSession } from './xp';

describe('daily glow (diminishing XP within a day)', () => {
  it('pays in full for the first session, then less, then nothing', () => {
    const first = xpForSession(1, 0);
    expect(first).toBe(11);
    expect(xpForSession(1, 1)).toBe(Math.round(first / 2));
    expect(xpForSession(1, 2)).toBe(Math.round(first / 4));
    expect(xpForSession(1, 3)).toBe(0);
    expect(xpForSession(1, 10)).toBe(0);
  });

  it('keeps the old single-argument behaviour for a first session', () => {
    expect(xpForSession(5)).toBe(15);
  });

  it('caps what one day can earn', () => {
    const daily = [0, 1, 2, 3, 4, 5].reduce((sum, n) => sum + xpForSession(5, n), 0);
    expect(daily).toBeLessThanOrEqual(15 + 8 + 4);
  });

  it('reports the glow meter', () => {
    expect(dailyGlow(0)).toEqual({ counted: 0, total: 3, full: false });
    expect(dailyGlow(2).full).toBe(false);
    expect(dailyGlow(3).full).toBe(true);
    expect(dailyGlow(9).counted).toBe(3);
  });
});

describe('comebackDaysMissed', () => {
  it('counts missed days only when the streak restarted', () => {
    expect(comebackDaysMissed('2026-09-01', '2026-09-05', 1)).toBe(3);
    expect(comebackDaysMissed('2026-09-01', '2026-09-03', 1)).toBe(1);
  });

  it('is not a comeback for a consecutive day, same day, freeze-covered day, or first ever log', () => {
    expect(comebackDaysMissed('2026-09-01', '2026-09-02', 2)).toBeNull();
    expect(comebackDaysMissed('2026-09-01', '2026-09-01', 1)).toBeNull();
    expect(comebackDaysMissed('2026-09-01', '2026-09-03', 5)).toBeNull();
    expect(comebackDaysMissed(null, '2026-09-01', 1)).toBeNull();
  });
});

describe('cosmetics', () => {
  const none = { sessions: 0, longestStreak: 0, stage: 'winded' as const };

  it('unlocks from consistency, derived from history', () => {
    expect(earnedCosmetics(none)).toEqual([]);
    expect(earnedCosmetics({ ...none, sessions: 5 })).toContain('sweatband');
    expect(earnedCosmetics({ ...none, longestStreak: 7 })).toContain('scarf');
    expect(earnedCosmetics({ ...none, stage: 'steady' })).toContain('leaf_crown');
    const all = earnedCosmetics({ sessions: 99, longestStreak: 99, stage: 'thriving' });
    expect(all).toEqual(expect.arrayContaining(['sweatband', 'scarf', 'leaf_crown', 'glasses', 'cape']));
    expect(all).not.toContain('bow');
  });

  it('picks a stable daily gift the user does not own, until they own everything', () => {
    const a = todaysGift('2026-10-14', []);
    expect(a).toBe(todaysGift('2026-10-14', []));
    expect(a).not.toBeNull();
    const owned = COSMETICS.filter((c) => c.id !== 'bow').map((c) => c.id);
    expect(todaysGift('2026-10-14', owned)).toBe('bow');
    expect(todaysGift('2026-10-14', COSMETICS.map((c) => c.id))).toBeNull();
  });

  it('lets free users wear earned items and an opened gift, and supporters everything', () => {
    const ctx = { earned: ['scarf' as const], giftToday: 'bow' as const, giftOpened: false, supporter: false };
    expect(canWear('scarf', ctx)).toBe(true);
    expect(canWear('bow', ctx)).toBe(false);
    expect(canWear('bow', { ...ctx, giftOpened: true })).toBe(true);
    expect(canWear('sunhat', { ...ctx, giftOpened: true })).toBe(false);
    expect(canWear('sunhat', { ...ctx, supporter: true })).toBe(true);
  });

  it('gives a human hint for every item', () => {
    for (const c of COSMETICS) {
      expect(unlockHint(c.id).length).toBeGreaterThan(0);
    }
  });
});
