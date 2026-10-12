import { getDb } from '../db';
import { mapStreak } from '../mappers';
import { enqueueOutbox } from '../outbox';
import type { StreakRecord, StreakRow } from '../types';
import type { WriteOptions } from '../writeOptions';

export async function getStreak(): Promise<StreakRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<StreakRow>('SELECT * FROM streaks LIMIT 1');
  return row ? mapStreak(row) : null;
}

export async function getStreakById(id: string): Promise<StreakRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<StreakRow>('SELECT * FROM streaks WHERE id = ?', id);
  return row ? mapStreak(row) : null;
}

export async function upsertStreak(streak: StreakRecord, options?: WriteOptions): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO streaks (
      id, current_streak, longest_streak, last_completed_date, freeze_used_dates, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      current_streak = excluded.current_streak,
      longest_streak = excluded.longest_streak,
      last_completed_date = excluded.last_completed_date,
      freeze_used_dates = excluded.freeze_used_dates,
      updated_at = excluded.updated_at`,
    streak.id,
    streak.currentStreak,
    streak.longestStreak,
    streak.lastCompletedDate,
    JSON.stringify(streak.freezeUsedDates),
    streak.updatedAt,
  );
  if (!options?.fromSync) {
    await enqueueOutbox('Streak', streak.id);
  }
}

export async function listStreaksUpdatedSince(iso: string): Promise<StreakRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<StreakRow>(
    'SELECT * FROM streaks WHERE updated_at > ? ORDER BY updated_at ASC',
    iso,
  );
  return rows.map(mapStreak);
}
