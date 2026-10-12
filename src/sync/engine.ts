import { nowIso } from '../data';
import {
  deleteOutboxItem,
  getChangeTag,
  listOutbox,
  setChangeTag,
  SYNC_RECORD_TYPES,
  type SyncRecordType,
} from '../data/outbox';
import { applyRemoteRecord, applyRemoteRecords, loadDomainRecord } from './apply';
import { CLOUDKIT_CONTAINER_ID, CLOUDKIT_ZONE, type CloudKitRecordLike } from './fields';
import { fromCloudKitRecord, newerUpdatedAt, toCloudKitRecord } from './records';
import { useSyncStore } from '../store/syncStore';
import { loadCloudKit } from './cloudkitModule';

type ExpoCloudKit = typeof import('expo-cloudkit');

let ck: ExpoCloudKit | null = null;
let started = false;

function asRecordLike(value: unknown): CloudKitRecordLike | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const rec = value as {
    recordType?: string;
    recordName?: string;
    changeTag?: string;
    zoneName?: string;
    fields?: CloudKitRecordLike['fields'];
  };
  if (!rec.recordType || !rec.recordName) {
    return null;
  }
  return {
    recordType: rec.recordType,
    recordName: rec.recordName,
    changeTag: rec.changeTag,
    zoneName: rec.zoneName,
    fields: rec.fields ?? {},
  };
}

function extractRecords(page: unknown): CloudKitRecordLike[] {
  if (Array.isArray(page)) {
    return page.map(asRecordLike).filter((row): row is CloudKitRecordLike => row !== null);
  }
  if (page && typeof page === 'object' && 'records' in page) {
    const records = (page as { records: unknown }).records;
    if (Array.isArray(records)) {
      return records.map(asRecordLike).filter((row): row is CloudKitRecordLike => row !== null);
    }
  }
  return [];
}

function extractCursor(page: unknown): unknown {
  if (page && typeof page === 'object' && 'cursor' in page) {
    return (page as { cursor?: unknown }).cursor;
  }
  return undefined;
}

async function queryAll(type: SyncRecordType): Promise<CloudKitRecordLike[]> {
  if (!ck) {
    return [];
  }
  const all: CloudKitRecordLike[] = [];
  let cursor: unknown;
  do {
    const page = await ck.queryRecords(
      type,
      undefined,
      undefined,
      CLOUDKIT_ZONE,
      'private',
      200,
      cursor as never,
    );
    all.push(...extractRecords(page));
    cursor = extractCursor(page);
  } while (cursor);
  return all;
}

async function flushOutbox(): Promise<void> {
  if (!ck) {
    return;
  }
  const items = await listOutbox();
  for (const item of items) {
    const domain = await loadDomainRecord(item.recordType, item.recordId);
    if (!domain) {
      await deleteOutboxItem(item.recordType, item.recordId);
      continue;
    }
    const changeTag = await getChangeTag(item.recordType, item.recordId);
    const payload = toCloudKitRecord(domain, changeTag);
    try {
      const saved = await ck.saveRecords([payload], 'private');
      const tag = saved[0]?.changeTag;
      if (tag) {
        await setChangeTag(item.recordType, item.recordId, tag);
      }
      await deleteOutboxItem(item.recordType, item.recordId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CloudKit save failed';
      useSyncStore.getState().setAvailability('error', message);
    }
  }
}

/**
 * Pull every record type into SQLite. Used for first launch on a second device
 * (empty local DB) and as a catch-up if the sync engine is unavailable.
 */
export async function pullFromCloudKit(): Promise<number> {
  if (!ck) {
    return 0;
  }
  let applied = 0;
  for (const type of SYNC_RECORD_TYPES) {
    const records = await queryAll(type);
    applied += await applyRemoteRecords(records);
  }
  if (applied > 0) {
    useSyncStore.getState().setLastPulledAt(nowIso());
  }
  return applied;
}

export async function startCloudKitSync(): Promise<void> {
  if (started) {
    return;
  }
  ck = loadCloudKit();
  if (!ck) {
    useSyncStore.getState().setAvailability('unavailable-module');
    return;
  }

  ck.configure(CLOUDKIT_CONTAINER_ID);
  const status = await ck.getAccountStatus();
  if (status !== 'available') {
    useSyncStore
      .getState()
      .setAvailability(status === 'noAccount' || status === 'restricted' ? 'no-account' : 'no-account');
    return;
  }

  useSyncStore.getState().setAvailability('available');
  try {
    await ck.createZone(CLOUDKIT_ZONE, 'private');
  } catch {
    // Zone may already exist.
  }

  try {
    await ck.startSyncEngine({
      zones: [CLOUDKIT_ZONE],
      database: 'private',
      automaticallySync: true,
      resolveConflicts: true,
    });
    ck.addSyncEngineListener((event) => {
      void (async () => {
        if (event.type === 'recordsFetched') {
          const changed = (event.changedRecords ?? [])
            .map(asRecordLike)
            .filter((row): row is CloudKitRecordLike => row !== null);
          await applyRemoteRecords(changed);
          useSyncStore.getState().setLastPulledAt(nowIso());
        }
        if (event.type === 'conflict') {
          const client = asRecordLike(event.clientRecord);
          const server = asRecordLike(event.serverRecord);
          if (!client || !server) {
            return;
          }
          const clientDomain = fromCloudKitRecord(client);
          const serverDomain = fromCloudKitRecord(server);
          const winner =
            clientDomain &&
            serverDomain &&
            newerUpdatedAt(clientDomain.record.updatedAt, serverDomain.record.updatedAt)
              ? client
              : server;
          ck?.resolveSyncConflict(event.requestId, winner);
        }
      })();
    });
  } catch {
    // Engine optional — query/save still work.
  }

  await pullFromCloudKit();
  await flushOutbox();
  started = true;
}

export async function restoreFromCloudIfEmpty(): Promise<boolean> {
  ck = loadCloudKit();
  if (!ck) {
    useSyncStore.getState().setAvailability('unavailable-module');
    return false;
  }
  ck.configure(CLOUDKIT_CONTAINER_ID);
  const status = await ck.getAccountStatus();
  if (status !== 'available') {
    useSyncStore.getState().setAvailability('no-account');
    return false;
  }
  try {
    await ck.createZone(CLOUDKIT_ZONE, 'private');
  } catch {
    // ignore
  }
  const applied = await pullFromCloudKit();
  return applied > 0;
}
