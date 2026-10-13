import { habitTypeRepository } from '../data';
import { hufflingRepository } from '../data';
import { sessionLogRepository } from '../data';
import { streakRepository } from '../data';
import { userRepository } from '../data';
import { weeklyGoalRepository } from '../data';
import { setChangeTag } from '../data/outbox';
import type { SyncRecordType } from '../data/outbox';
import { fromCloudKitRecord, newerUpdatedAt, type DomainRecord } from './records';
import type { CloudKitRecordLike } from './fields';

const FROM_SYNC = { fromSync: true } as const;

async function localUpdatedAt(item: DomainRecord): Promise<string | null> {
  switch (item.type) {
    case 'User':
      return (await userRepository.getUserById(item.record.id))?.updatedAt ?? null;
    case 'Huffling':
      return (await hufflingRepository.getHufflingById(item.record.id))?.updatedAt ?? null;
    case 'HabitType':
      return (await habitTypeRepository.getHabitType(item.record.id))?.updatedAt ?? null;
    case 'SessionLog':
      return (await sessionLogRepository.getSessionLog(item.record.id))?.updatedAt ?? null;
    case 'Streak':
      return (await streakRepository.getStreakById(item.record.id))?.updatedAt ?? null;
    case 'WeeklyGoal': {
      const byId = await weeklyGoalRepository.getWeeklyGoalById(item.record.id);
      if (byId) {
        return byId.updatedAt;
      }
      return (
        (await weeklyGoalRepository.getWeeklyGoalByWeekStart(item.record.weekStartDate))
          ?.updatedAt ?? null
      );
    }
  }
}

async function writeDomain(item: DomainRecord): Promise<void> {
  switch (item.type) {
    case 'User':
      await userRepository.upsertUser(item.record, FROM_SYNC);
      break;
    case 'Huffling':
      await hufflingRepository.upsertHuffling(item.record, FROM_SYNC);
      break;
    case 'HabitType':
      await habitTypeRepository.upsertHabitType(item.record, FROM_SYNC);
      break;
    case 'SessionLog':
      await sessionLogRepository.upsertSessionLog(item.record, FROM_SYNC);
      break;
    case 'Streak':
      await streakRepository.upsertStreak(item.record, FROM_SYNC);
      break;
    case 'WeeklyGoal': {
      const existing = await weeklyGoalRepository.getWeeklyGoalByWeekStart(
        item.record.weekStartDate,
      );
      if (existing && existing.id !== item.record.id) {
        await weeklyGoalRepository.upsertWeeklyGoal(
          { ...item.record, id: existing.id },
          FROM_SYNC,
        );
        break;
      }
      await weeklyGoalRepository.upsertWeeklyGoal(item.record, FROM_SYNC);
      break;
    }
  }
}

/** Last-write-wins on updatedAt. SessionLog is still merged by id (no deletes). */
export async function applyDomainRecord(item: DomainRecord): Promise<boolean> {
  if (!item.record.updatedAt) {
    return false;
  }
  const local = await localUpdatedAt(item);
  if (local && newerUpdatedAt(local, item.record.updatedAt)) {
    return false;
  }
  await writeDomain(item);
  return true;
}

export async function applyRemoteRecord(raw: CloudKitRecordLike): Promise<boolean> {
  const parsed = fromCloudKitRecord(raw);
  if (!parsed) {
    return false;
  }
  if (!(await applyDomainRecord(parsed))) {
    return false;
  }
  if (raw.changeTag) {
    await setChangeTag(parsed.type, parsed.record.id, raw.changeTag);
  }
  return true;
}

export async function applyRemoteRecords(records: CloudKitRecordLike[]): Promise<number> {
  let applied = 0;
  for (const record of records) {
    if (await applyRemoteRecord(record)) {
      applied += 1;
    }
  }
  return applied;
}

export async function loadDomainRecord(
  type: SyncRecordType,
  id: string,
): Promise<DomainRecord | null> {
  switch (type) {
    case 'User': {
      const record = await userRepository.getUserById(id);
      return record ? { type, record } : null;
    }
    case 'Huffling': {
      const record = await hufflingRepository.getHufflingById(id);
      return record ? { type, record } : null;
    }
    case 'HabitType': {
      const record = await habitTypeRepository.getHabitType(id);
      return record ? { type, record } : null;
    }
    case 'SessionLog': {
      const record = await sessionLogRepository.getSessionLog(id);
      return record ? { type, record } : null;
    }
    case 'Streak': {
      const record = await streakRepository.getStreakById(id);
      return record ? { type, record } : null;
    }
    case 'WeeklyGoal': {
      const record = await weeklyGoalRepository.getWeeklyGoalById(id);
      return record ? { type, record } : null;
    }
  }
}
