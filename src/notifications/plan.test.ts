import { describe, expect, it } from 'vitest';
import { toLocalDateString } from '../domain';
import { HORIZON_DAYS, planNotifications, type PlanInput } from './plan';

const base: PlanInput = {
  now: new Date(2026, 8, 10, 9, 0), // Thu 10 Sep 2026, 09:00
  name: 'Pip',
  reminderHour: 19,
  reminderMinute: 0,
  lastCompletedDate: '2026-09-09',
  currentStreak: 4,
  freezeTokens: 0,
};

function perDay(plan: ReturnType<typeof planNotifications>) {
  const counts = new Map<string, number>();
  for (const item of plan) {
    const day = toLocalDateString(item.at);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return counts;
}

describe('planNotifications', () => {
  it('never sends more than two nudges a day', () => {
    for (const counts of perDay(planNotifications(base)).values()) {
      expect(counts).toBeLessThanOrEqual(2);
    }
  });

  it('plans a daily reminder plus an evening streak-save today when the streak is alive', () => {
    const plan = planNotifications(base);
    const today = plan.filter((n) => toLocalDateString(n.at) === '2026-09-10');
    expect(today.map((n) => n.kind).sort()).toEqual(['daily', 'streak-risk']);
    const risk = today.find((n) => n.kind === 'streak-risk');
    expect(risk?.at.getHours()).toBe(20);
    expect(risk?.at.getMinutes()).toBe(30);
  });

  it('skips today entirely once a session is logged, and starts tomorrow', () => {
    const plan = planNotifications({ ...base, lastCompletedDate: '2026-09-10' });
    expect(plan.some((n) => toLocalDateString(n.at) === '2026-09-10')).toBe(false);
    expect(plan[0].at.getDate()).toBe(11);
  });

  it('skips a reminder time that has already passed today', () => {
    const plan = planNotifications({ ...base, now: new Date(2026, 8, 10, 19, 30) });
    expect(plan.some((n) => n.kind === 'daily' && toLocalDateString(n.at) === '2026-09-10')).toBe(false);
    expect(plan.some((n) => n.kind === 'streak-risk')).toBe(true);
  });

  it('drops the evening nudge when it would crowd the daily reminder', () => {
    const plan = planNotifications({ ...base, reminderHour: 20, reminderMinute: 0 });
    expect(plan.some((n) => n.kind === 'streak-risk')).toBe(false);
  });

  it('has no streak-save for a short streak', () => {
    const plan = planNotifications({ ...base, currentStreak: 1 });
    expect(plan.some((n) => n.kind === 'streak-risk')).toBe(false);
  });

  it('fades out after the horizon so an absent user is not nagged forever', () => {
    const plan = planNotifications(base);
    const last = plan[plan.length - 1].at;
    const horizon = new Date(2026, 8, 10 + HORIZON_DAYS, 0, 0);
    expect(last.getTime()).toBeLessThan(horizon.getTime());
  });

  it('switches to comeback copy as days are missed', () => {
    const plan = planNotifications({ ...base, lastCompletedDate: '2026-09-05', currentStreak: 3 });
    const kinds = plan.filter((n) => n.kind !== 'streak-risk').map((n) => n.kind);
    expect(kinds.every((k) => k === 'comeback')).toBe(true);
  });

  it('mentions the freeze token when it will cover a missed day', () => {
    const plan = planNotifications({ ...base, lastCompletedDate: '2026-09-09', freezeTokens: 1 });
    const tomorrow = plan.find((n) => toLocalDateString(n.at) === '2026-09-11');
    expect(tomorrow?.title).toMatch(/freeze token/i);
  });

  it('uses unique ids and personalises with the name', () => {
    const plan = planNotifications(base);
    expect(new Set(plan.map((n) => n.id)).size).toBe(plan.length);
    expect(plan.some((n) => n.title.includes('Pip') || n.body.includes('Pip'))).toBe(true);
  });
});
