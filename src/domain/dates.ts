/** Local calendar helpers. Streaks and weekly goals must not use UTC midnight. */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function assertLocalDateString(value: string): string {
  if (!DATE_RE.test(value)) {
    throw new Error(`Expected YYYY-MM-DD, got ${value}`);
  }
  return value;
}

/** Calendar date in the device timezone, e.g. 2026-09-03. */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD as a local midnight Date (not UTC). */
export function fromLocalDateString(value: string): Date {
  const [y, m, d] = assertLocalDateString(value).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole local calendar days from `from` to `to` (positive if `to` is later). */
export function localDayDiff(from: string, to: string): number {
  const a = fromLocalDateString(from).getTime();
  const b = fromLocalDateString(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function addLocalDays(value: string, days: number): string {
  const date = fromLocalDateString(value);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}

const DAY_LABEL = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

export function formatHistoryDayLabel(localDate: string, now: Date = new Date()): string {
  const today = toLocalDateString(now);
  if (localDate === today) {
    return 'Today';
  }
  if (localDate === addLocalDays(today, -1)) {
    return 'Yesterday';
  }
  return DAY_LABEL.format(fromLocalDateString(localDate));
}
