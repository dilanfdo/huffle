import { describe, expect, it } from 'vitest';
import { streakMilestone } from './streak';
import { weekDays } from './week';
import { hufflingLine } from './voice';

describe('streakMilestone', () => {
  it('flags celebration lengths only', () => {
    expect(streakMilestone(7)).toBe(7);
    expect(streakMilestone(30)).toBe(30);
    expect(streakMilestone(8)).toBeNull();
    expect(streakMilestone(0)).toBeNull();
  });
});

describe('weekDays', () => {
  it('lists Monday to Sunday with done, today and future flags', () => {
    const days = weekDays('2026-09-10', new Set(['2026-09-07', '2026-09-09']));
    expect(days.map((d) => d.date)).toEqual([
      '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13',
    ]);
    expect(days.map((d) => d.done)).toEqual([true, false, true, false, false, false, false]);
    expect(days[3].isToday).toBe(true);
    expect(days[4].isFuture).toBe(true);
    expect(days[2].isFuture).toBe(false);
  });

  it('rolls into the right week on a Sunday', () => {
    const days = weekDays('2026-09-13', new Set());
    expect(days[0].date).toBe('2026-09-07');
    expect(days[6].isToday).toBe(true);
  });
});

describe('hufflingLine', () => {
  const ctx = { name: 'Pip', mood: 'neutral' as const, loggedToday: false, streak: 0, hasHistory: true, hour: 10, seed: '2026-09-10' };

  it('is deterministic for a given day', () => {
    expect(hufflingLine(ctx)).toBe(hufflingLine({ ...ctx }));
  });

  it('introduces itself before any history', () => {
    expect(hufflingLine({ ...ctx, hasHistory: false })).toMatch(/Pip/);
  });

  it('celebrates once logged today', () => {
    expect(hufflingLine({ ...ctx, loggedToday: true, streak: 3 }).length).toBeGreaterThan(0);
  });

  it('mentions the streak in the evening when it is on the line', () => {
    const line = hufflingLine({ ...ctx, streak: 5, hour: 20 });
    expect(line).toMatch(/5/);
  });

  it('never guilt-trips a lapsed user', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const line = hufflingLine({ ...ctx, streak: 0, seed });
      expect(line).not.toMatch(/disappoint|lazy|shame|failed|guilt/i);
    }
  });
});
