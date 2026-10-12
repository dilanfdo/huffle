import { getDb } from '../db';
import { mapHuffling } from '../mappers';
import { enqueueOutbox } from '../outbox';
import type { HufflingRecord, HufflingRow } from '../types';
import type { WriteOptions } from '../writeOptions';

export async function getHuffling(): Promise<HufflingRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<HufflingRow>('SELECT * FROM hufflings LIMIT 1');
  return row ? mapHuffling(row) : null;
}

export async function getHufflingById(id: string): Promise<HufflingRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<HufflingRow>('SELECT * FROM hufflings WHERE id = ?', id);
  return row ? mapHuffling(row) : null;
}

export async function upsertHuffling(huffling: HufflingRecord, options?: WriteOptions): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO hufflings (id, name, evolution_stage, xp, mood, last_fed_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       evolution_stage = excluded.evolution_stage,
       xp = excluded.xp,
       mood = excluded.mood,
       last_fed_at = excluded.last_fed_at,
       updated_at = excluded.updated_at`,
    huffling.id,
    huffling.name,
    huffling.evolutionStage,
    huffling.xp,
    huffling.mood,
    huffling.lastFedAt,
    huffling.updatedAt,
  );
  if (!options?.fromSync) {
    await enqueueOutbox('Huffling', huffling.id);
  }
}

export async function listHufflingsUpdatedSince(iso: string): Promise<HufflingRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<HufflingRow>(
    'SELECT * FROM hufflings WHERE updated_at > ? ORDER BY updated_at ASC',
    iso,
  );
  return rows.map(mapHuffling);
}
