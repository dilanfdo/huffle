import { addLocalDays, fromLocalDateString, liveStreak, localDayDiff, toLocalDateString } from '../domain';
import { dailyCopy, streakRiskCopy } from './copy';

export type NotificationKind = 'daily' | 'comeback' | 'streak-risk';

export type PlannedNotification = {
  id: string;
  at: Date;
  kind: NotificationKind;
  title: string;
  body: string;
};

export type PlanInput = {
  now: Date;
  name: string;
  reminderHour: number;
  reminderMinute: number;
  /** Local YYYY-MM-DD of the last logged day, or null. */
  lastCompletedDate: string | null;
  currentStreak: number;
  freezeTokens: number;
};

/** Days of nudges scheduled ahead. They fade out on their own if the app isn't opened. */
export const HORIZON_DAYS = 7;
const EVENING_HOUR = 20;
const EVENING_MINUTE = 30;
/** The evening streak-save only fires if it lands this long after the daily reminder. */
const MIN_GAP_MINUTES = 90;
const SKIP_IF_WITHIN_MS = 60_000;

function atLocalTime(date: string, hour: number, minute: number): Date {
  const value = fromLocalDateString(date);
  value.setHours(hour, minute, 0, 0);
  return value;
}

/**
 * Pure planner for local notifications. At most two a day (daily + evening
 * streak-save), none on a day already logged, escalating warmth then silence.
 */
export function planNotifications(input: PlanInput): PlannedNotification[] {
  const { now, name, reminderHour, reminderMinute, lastCompletedDate, currentStreak, freezeTokens } = input;
  const today = toLocalDateString(now);
  const loggedToday = lastCompletedDate === today;
  const planned: PlannedNotification[] = [];
  const earliest = now.getTime() + SKIP_IF_WITHIN_MS;

  for (let offset = 0; offset < HORIZON_DAYS; offset += 1) {
    if (offset === 0 && loggedToday) {
      continue;
    }
    const date = addLocalDays(today, offset);
    const gap = lastCompletedDate ? localDayDiff(lastCompletedDate, date) : null;
    const streak = liveStreak({ currentStreak, lastCompletedDate }, freezeTokens, date);
    const at = atLocalTime(date, reminderHour, reminderMinute);

    if (at.getTime() > earliest) {
      const copy = dailyCopy({ name, gap, streak, hasFreeze: freezeTokens > 0, seed: date });
      planned.push({ id: `huffle-${date}-daily`, at, kind: copy.kind, title: copy.title, body: copy.body });
    }

    if (offset === 0 && streak >= 2) {
      const evening = atLocalTime(date, EVENING_HOUR, EVENING_MINUTE);
      const minutesAfterDaily = (evening.getTime() - at.getTime()) / 60_000;
      if (evening.getTime() > earliest && minutesAfterDaily >= MIN_GAP_MINUTES) {
        const copy = streakRiskCopy({ name, streak, hasFreeze: freezeTokens > 0, seed: date });
        planned.push({ id: `huffle-${date}-risk`, at: evening, kind: 'streak-risk', title: copy.title, body: copy.body });
      }
    }
  }

  return planned;
}
