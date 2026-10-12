import { addLocalDays, fromLocalDateString, toLocalDateString } from './dates';

export const DEFAULT_WEEKLY_TARGET = 3;

/** ISO-style week: Monday is day 0. Sunday maps to 6. */
export function startOfWeekMonday(date: Date): Date {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = local.getDay(); // 0 Sun … 6 Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  local.setDate(local.getDate() - daysFromMonday);
  return local;
}

export function weekStartDateString(date: Date = new Date()): string {
  return toLocalDateString(startOfWeekMonday(date));
}

export function isInWeekStarting(localDate: string, weekStart: string): boolean {
  const value = fromLocalDateString(localDate).getTime();
  const start = fromLocalDateString(weekStart).getTime();
  const end = start + 7 * 86_400_000;
  return value >= start && value < end;
}

export type WeekDay = {
  date: string;
  letter: string;
  isToday: boolean;
  isFuture: boolean;
  done: boolean;
};

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/** Monday-first row for the week containing `today`, marking days that have a session. */
export function weekDays(today: string, sessionDates: ReadonlySet<string>): WeekDay[] {
  const start = weekStartDateString(fromLocalDateString(today));
  return DAY_LETTERS.map((letter, index) => {
    const date = addLocalDays(start, index);
    return {
      date,
      letter,
      isToday: date === today,
      isFuture: date > today,
      done: sessionDates.has(date),
    };
  });
}
