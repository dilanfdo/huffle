import { fromLocalDateString, toLocalDateString } from './dates';

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
