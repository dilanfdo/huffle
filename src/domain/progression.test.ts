import { describe, expect, it } from 'vitest';
import { stageFromXp, stageProgress, xpToNextStage } from './evolution';
import { moodFromLastFedAt } from './mood';
import { startOfWeekMonday, weekStartDateString } from './week';
import { BASE_SESSION_XP, STREAK_BONUS_CAP, xpForSession } from './xp';
import { addLocalDays, localDayDiff } from './dates';

describe('xpForSession', () => {
  it('adds one XP per streak day up to the cap', () => {
    expect(xpForSession(1)).toBe(BASE_SESSION_XP + 1);
    expect(xpForSession(STREAK_BONUS_CAP)).toBe(BASE_SESSION_XP + STREAK_BONUS_CAP);
    expect(xpForSession(100)).toBe(BASE_SESSION_XP + STREAK_BONUS_CAP);
  });

  it('never goes below base XP', () => {
    expect(xpForSession(-4)).toBe(BASE_SESSION_XP);
  });
});

describe('evolution', () => {
  it('maps XP to stages at the inclusive thresholds', () => {
    expect(stageFromXp(0)).toBe('winded');
    expect(stageFromXp(19)).toBe('winded');
    expect(stageFromXp(20)).toBe('catching_breath');
    expect(stageFromXp(70)).toBe('steady');
    expect(stageFromXp(160)).toBe('strong');
    expect(stageFromXp(320)).toBe('thriving');
    expect(stageFromXp(10_000)).toBe('thriving');
  });

  it('reaches the first evolution within two sessions', () => {
    expect(stageFromXp(xpForSession(1) + xpForSession(2))).toBe('catching_breath');
  });

  it('reports XP to the next stage, or null at Thriving', () => {
    expect(xpToNextStage(0)).toBe(20);
    expect(xpToNextStage(25)).toBe(45);
    expect(xpToNextStage(320)).toBeNull();
  });
});

describe('moodFromLastFedAt', () => {
  const now = new Date(2026, 8, 10, 9, 0);

  it('is winded when never fed or unparseable', () => {
    expect(moodFromLastFedAt(null, now)).toBe('winded');
    expect(moodFromLastFedAt('not-a-date', now)).toBe('winded');
  });

  it('is energized when fed earlier today', () => {
    expect(moodFromLastFedAt(new Date(2026, 8, 10, 0, 5).toISOString(), now)).toBe('energized');
  });

  it('is neutral after one local day and winded after two', () => {
    expect(moodFromLastFedAt(new Date(2026, 8, 9, 23, 55).toISOString(), now)).toBe('neutral');
    expect(moodFromLastFedAt(new Date(2026, 8, 8, 12, 0).toISOString(), now)).toBe('winded');
  });
});

describe('week and date helpers', () => {
  it('starts weeks on Monday, with Sunday belonging to the previous Monday', () => {
    expect(weekStartDateString(new Date(2026, 8, 9))).toBe('2026-09-07');
    expect(weekStartDateString(new Date(2026, 8, 13))).toBe('2026-09-07');
    expect(weekStartDateString(new Date(2026, 8, 14))).toBe('2026-09-14');
    expect(startOfWeekMonday(new Date(2026, 8, 13, 23, 59)).getDay()).toBe(1);
  });

  it('counts whole local days across month boundaries', () => {
    expect(localDayDiff('2026-08-30', '2026-09-02')).toBe(3);
    expect(addLocalDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addLocalDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('stageProgress', () => {
  it('reports position within the current stage', () => {
    const p = stageProgress(45);
    expect(p.current.id).toBe('catching_breath');
    expect(p.next?.id).toBe('steady');
    expect(p.xpIntoStage).toBe(25);
    expect(p.xpSpan).toBe(50);
    expect(p.ratio).toBeCloseTo(0.5);
  });

  it('starts a stage at ratio 0 and treats negative XP as 0', () => {
    expect(stageProgress(20).ratio).toBe(0);
    expect(stageProgress(-5).current.id).toBe('winded');
  });

  it('is full at Thriving with no next stage', () => {
    const p = stageProgress(900);
    expect(p.current.id).toBe('thriving');
    expect(p.next).toBeNull();
    expect(p.xpSpan).toBeNull();
    expect(p.ratio).toBe(1);
  });
});
