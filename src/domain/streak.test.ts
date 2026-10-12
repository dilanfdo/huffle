import { describe, expect, it } from 'vitest';
import { addLocalDays } from './dates';
import { applyCompletedDay, daysToNextFreezeToken, liveStreak, type StreakSnapshot } from './streak';

const base: StreakSnapshot = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  freezeUsedDates: [],
};

describe('applyCompletedDay', () => {
  it('starts a streak at 1 on the first ever day', () => {
    const next = applyCompletedDay(base, '2026-09-01', 0);
    expect(next.currentStreak).toBe(1);
    expect(next.longestStreak).toBe(1);
    expect(next.lastCompletedDate).toBe('2026-09-01');
  });

  it('does not change the streak for a second session on the same day', () => {
    const streak = { ...base, currentStreak: 3, longestStreak: 3, lastCompletedDate: '2026-09-03' };
    const next = applyCompletedDay(streak, '2026-09-03', 0);
    expect(next.currentStreak).toBe(3);
    expect(next.freezeTokensDelta).toBe(0);
  });

  it('increments on consecutive days', () => {
    const streak = { ...base, currentStreak: 2, longestStreak: 2, lastCompletedDate: '2026-09-02' };
    expect(applyCompletedDay(streak, '2026-09-03', 0).currentStreak).toBe(3);
  });

  it('spends a freeze token to cover exactly one missed day', () => {
    const streak = { ...base, currentStreak: 4, longestStreak: 4, lastCompletedDate: '2026-09-01' };
    const next = applyCompletedDay(streak, '2026-09-03', 1);
    expect(next.currentStreak).toBe(5);
    expect(next.freezeTokensDelta).toBe(-1);
    expect(next.freezeUsedDates).toEqual(['2026-09-02']);
  });

  it('resets to 1 after a missed day without a token, keeping longestStreak', () => {
    const streak = { ...base, currentStreak: 4, longestStreak: 6, lastCompletedDate: '2026-09-01' };
    const next = applyCompletedDay(streak, '2026-09-03', 0);
    expect(next.currentStreak).toBe(1);
    expect(next.longestStreak).toBe(6);
  });

  it('resets even with a token when more than one day was missed', () => {
    const streak = { ...base, currentStreak: 4, longestStreak: 4, lastCompletedDate: '2026-09-01' };
    expect(applyCompletedDay(streak, '2026-09-04', 3).currentStreak).toBe(1);
  });

  it('awards a freeze token when the streak reaches 7', () => {
    const streak = { ...base, currentStreak: 6, longestStreak: 6, lastCompletedDate: '2026-09-06' };
    const next = applyCompletedDay(streak, '2026-09-07', 0);
    expect(next.currentStreak).toBe(7);
    expect(next.freezeTokensDelta).toBe(1);
  });

  it('nets a spent and an earned token to zero when both happen on one day', () => {
    const streak = { ...base, currentStreak: 6, longestStreak: 6, lastCompletedDate: '2026-09-05' };
    const next = applyCompletedDay(streak, '2026-09-07', 1);
    expect(next.currentStreak).toBe(7);
    expect(next.freezeTokensDelta).toBe(0);
  });

  it('ignores a completed date earlier than the last one', () => {
    const streak = { ...base, currentStreak: 3, longestStreak: 3, lastCompletedDate: '2026-09-05' };
    const next = applyCompletedDay(streak, '2026-09-01', 0);
    expect(next.currentStreak).toBe(3);
    expect(next.lastCompletedDate).toBe('2026-09-05');
  });
});

describe('liveStreak', () => {
  const streak = { currentStreak: 5, lastCompletedDate: '2026-09-01' };

  it('is 0 before anything has been logged', () => {
    expect(liveStreak({ currentStreak: 0, lastCompletedDate: null }, 0, '2026-09-01')).toBe(0);
  });

  it('keeps the streak when today or yesterday was logged', () => {
    expect(liveStreak(streak, 0, '2026-09-01')).toBe(5);
    expect(liveStreak(streak, 0, '2026-09-02')).toBe(5);
  });

  it('keeps the streak after one missed day only if a freeze token can cover it', () => {
    expect(liveStreak(streak, 1, '2026-09-03')).toBe(5);
    expect(liveStreak(streak, 0, '2026-09-03')).toBe(0);
  });

  it('reads as 0 once more than one day has been missed', () => {
    expect(liveStreak(streak, 3, '2026-09-04')).toBe(0);
  });

  it('agrees with applyCompletedDay about whether a log today continues the streak', () => {
    const snapshot: StreakSnapshot = {
      currentStreak: 5,
      longestStreak: 5,
      lastCompletedDate: '2026-09-01',
      freezeUsedDates: [],
    };
    for (const today of ['2026-09-02', '2026-09-03', '2026-09-04']) {
      for (const tokens of [0, 1]) {
        const continues = applyCompletedDay(snapshot, today, tokens).currentStreak > 1;
        expect(liveStreak(snapshot, tokens, today) > 0).toBe(continues);
      }
    }
  });
});

describe('daysToNextFreezeToken', () => {
  it('counts down to the next multiple of the interval', () => {
    expect(daysToNextFreezeToken(0)).toBe(7);
    expect(daysToNextFreezeToken(1)).toBe(6);
    expect(daysToNextFreezeToken(6)).toBe(1);
  });

  it('restarts a full interval right after a token is earned', () => {
    expect(daysToNextFreezeToken(7)).toBe(7);
    expect(daysToNextFreezeToken(10)).toBe(4);
  });

  it('agrees with applyCompletedDay about when a token arrives', () => {
    for (const current of [0, 3, 6, 7, 13]) {
      const need = daysToNextFreezeToken(current);
      let snapshot: StreakSnapshot = {
        currentStreak: current,
        longestStreak: current,
        lastCompletedDate: current === 0 ? null : '2026-01-01',
        freezeUsedDates: [],
      };
      let earned = 0;
      let date = '2026-01-01';
      for (let day = 1; day <= need; day += 1) {
        date = current === 0 && day === 1 ? date : addLocalDays(date, 1);
        const next = applyCompletedDay(snapshot, date, 0);
        earned += next.freezeTokensDelta;
        snapshot = next;
        if (day < need) {
          expect(earned).toBe(0);
        }
      }
      expect(earned).toBe(1);
    }
  });
});
