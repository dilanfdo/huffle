import { Platform } from 'react-native';
import { nowIso } from './ids';
import { getDb } from './db';

export const SYNC_RECORD_TYPES = [
  'User',
  'Huffling',
  'HabitType',
  'SessionLog',
  'Streak',
  'WeeklyGoal',
] as const;

export type SyncRecordType = (typeof SYNC_RECORD_TYPES)[number];

export type OutboxItem = {
  recordType: SyncRecordType;
  recordId: string;
  queuedAt: string;
};

type OutboxListener = () => void;
const listeners = new Set<OutboxListener>();

/** Notified after any local write is queued for sync. Returns an unsubscribe function. */
export function onOutboxChange(listener: OutboxListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function enqueueOutbox(recordType: SyncRecordType, recordId: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sync_outbox (record_type, record_id, queued_at)
     VALUES (?, ?, ?)
     ON CONFLICT(record_type, record_id) DO UPDATE SET queued_at = excluded.queued_at`,
    recordType,
    recordId,
    nowIso(),
  );
  listeners.forEach((listener) => listener());
}

export async function listOutbox(): Promise<OutboxItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    record_type: string;
    record_id: string;
    queued_at: string;
  }>('SELECT * FROM sync_outbox ORDER BY queued_at ASC');
  return rows.map((row) => ({
    recordType: row.record_type as SyncRecordType,
    recordId: row.record_id,
    queuedAt: row.queued_at,
  }));
}

export async function deleteOutboxItem(
  recordType: SyncRecordType,
  recordId: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'DELETE FROM sync_outbox WHERE record_type = ? AND record_id = ?',
    recordType,
    recordId,
  );
}

export async function getChangeTag(
  recordType: SyncRecordType,
  recordId: string,
): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ change_tag: string }>(
    'SELECT change_tag FROM sync_change_tags WHERE record_type = ? AND record_id = ?',
    recordType,
    recordId,
  );
  return row?.change_tag ?? null;
}

export async function setChangeTag(
  recordType: SyncRecordType,
  recordId: string,
  changeTag: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sync_change_tags (record_type, record_id, change_tag)
     VALUES (?, ?, ?)
     ON CONFLICT(record_type, record_id) DO UPDATE SET change_tag = excluded.change_tag`,
    recordType,
    recordId,
    changeTag,
  );
}
