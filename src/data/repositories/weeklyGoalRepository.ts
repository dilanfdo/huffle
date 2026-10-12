import { getDb } from '../db';
import { mapWeeklyGoal } from '../mappers';
import { enqueueOutbox } from '../outbox';
import type { WeeklyGoalRecord, WeeklyGoalRow } from '../types';
import type { WriteOptions } from '../writeOptions';

export async function getWeeklyGoalByWeekStart(
  weekStartDate: string,
): Promise<WeeklyGoalRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<WeeklyGoalRow>(
    'SELECT * FROM weekly_goals WHERE week_start_date = ?',
    weekStartDate,
  );
  return row ? mapWeeklyGoal(row) : null;
}

export async function getWeeklyGoalById(id: string): Promise<WeeklyGoalRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<WeeklyGoalRow>('SELECT * FROM weekly_goals WHERE id = ?', id);
  return row ? mapWeeklyGoal(row) : null;
}

export async function upsertWeeklyGoal(
  goal: WeeklyGoalRecord,
  options?: WriteOptions,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO weekly_goals (
      id, target_sessions, week_start_date, sessions_completed_this_week, updated_at
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      target_sessions = excluded.target_sessions,
      week_start_date = excluded.week_start_date,
      sessions_completed_this_week = excluded.sessions_completed_this_week,
      updated_at = excluded.updated_at`,
    goal.id,
    goal.targetSessions,
    goal.weekStartDate,
    goal.sessionsCompletedThisWeek,
    goal.updatedAt,
  );
  if (!options?.fromSync) {
    await enqueueOutbox('WeeklyGoal', goal.id);
  }
}

export async function listWeeklyGoalsUpdatedSince(iso: string): Promise<WeeklyGoalRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<WeeklyGoalRow>(
    'SELECT * FROM weekly_goals WHERE updated_at > ? ORDER BY updated_at ASC',
    iso,
  );
  return rows.map(mapWeeklyGoal);
}
