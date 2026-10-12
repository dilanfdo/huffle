import { getDb } from '../db';
import { mapSessionLog } from '../mappers';
import { enqueueOutbox } from '../outbox';
import type { SessionLogRecord, SessionLogRow } from '../types';
import type { WriteOptions } from '../writeOptions';

export async function insertSessionLog(
  log: SessionLogRecord,
  options?: WriteOptions,
): Promise<void> {
  await upsertSessionLog(log, options);
}

export async function getSessionLog(id: string): Promise<SessionLogRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SessionLogRow>('SELECT * FROM session_logs WHERE id = ?', id);
  return row ? mapSessionLog(row) : null;
}

export async function upsertSessionLog(
  log: SessionLogRecord,
  options?: WriteOptions,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO session_logs (
      id, habit_type_id, completed_at, duration_minutes, xp_awarded, note, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      habit_type_id = excluded.habit_type_id,
      completed_at = excluded.completed_at,
      duration_minutes = excluded.duration_minutes,
      xp_awarded = excluded.xp_awarded,
      note = excluded.note,
      updated_at = excluded.updated_at`,
    log.id,
    log.habitTypeId,
    log.completedAt,
    log.durationMinutes,
    log.xpAwarded,
    log.note,
    log.updatedAt,
  );
  if (!options?.fromSync) {
    await enqueueOutbox('SessionLog', log.id);
  }
}

export async function listSessionLogs(): Promise<SessionLogRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionLogRow>(
    'SELECT * FROM session_logs ORDER BY completed_at DESC',
  );
  return rows.map(mapSessionLog);
}

export async function listSessionLogsUpdatedSince(iso: string): Promise<SessionLogRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionLogRow>(
    'SELECT * FROM session_logs WHERE updated_at > ? ORDER BY updated_at ASC',
    iso,
  );
  return rows.map(mapSessionLog);
}

export async function countSessionLogsOnLocalDay(
  startIso: string,
  endIso: string,
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM session_logs WHERE completed_at >= ? AND completed_at < ?',
    startIso,
    endIso,
  );
  return row?.count ?? 0;
}
