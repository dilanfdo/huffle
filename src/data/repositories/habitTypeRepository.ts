import { getDb } from '../db';
import { mapHabitType } from '../mappers';
import { enqueueOutbox } from '../outbox';
import type { HabitTypeRecord, HabitTypeRow } from '../types';
import type { WriteOptions } from '../writeOptions';

export async function listHabitTypes(category?: string): Promise<HabitTypeRecord[]> {
  const db = await getDb();
  if (category) {
    const rows = await db.getAllAsync<HabitTypeRow>(
      'SELECT * FROM habit_types WHERE category = ? ORDER BY id ASC',
      category,
    );
    return rows.map(mapHabitType);
  }
  const rows = await db.getAllAsync<HabitTypeRow>('SELECT * FROM habit_types ORDER BY id ASC');
  return rows.map(mapHabitType);
}

export async function getHabitType(id: string): Promise<HabitTypeRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<HabitTypeRow>('SELECT * FROM habit_types WHERE id = ?', id);
  return row ? mapHabitType(row) : null;
}

export async function upsertHabitType(habitType: HabitTypeRecord, options?: WriteOptions): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO habit_types (id, label, icon, category, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       label = excluded.label,
       icon = excluded.icon,
       category = excluded.category,
       updated_at = excluded.updated_at`,
    habitType.id,
    habitType.label,
    habitType.icon,
    habitType.category,
    habitType.updatedAt,
  );
  if (!options?.fromSync) {
    await enqueueOutbox('HabitType', habitType.id);
  }
}

export async function listHabitTypesUpdatedSince(iso: string): Promise<HabitTypeRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<HabitTypeRow>(
    'SELECT * FROM habit_types WHERE updated_at > ? ORDER BY updated_at ASC',
    iso,
  );
  return rows.map(mapHabitType);
}
