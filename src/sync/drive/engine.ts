import {
  clearUserData,
  habitTypeRepository,
  hufflingRepository,
  nowIso,
  preferencesRepository,
  runInTransaction,
  sessionLogRepository,
  streakRepository,
  userRepository,
  weeklyGoalRepository,
} from '../../data';
import { onOutboxChange } from '../../data/outbox';
import { bootstrapStores } from '../../store/bootstrap';
import { applyDomainRecord } from '../apply';
import type { DomainRecord } from '../records';
import { currentEmail, getAccessToken, isDriveConfigured, signInInteractive, signInSilent, signOut } from './auth';
import { createDriveApi } from './driveApi';
import {
  hasProfile,
  mergeSnapshots,
  profilesConflict,
  SNAPSHOT_VERSION,
  summarize,
  toDomainRecords,
  type Snapshot,
} from './snapshot';
import { useDriveStore } from './store';

export type SyncOutcome =
  | { status: 'ok' }
  | { status: 'conflict' }
  | { status: 'signed-out' }
  | { status: 'error'; message: string };

export type Resolution = 'cloud' | 'device';

const DEBOUNCE_MS = 4000;
const api = createDriveApi(getAccessToken);
const ui = () => useDriveStore.getState();

async function collectLocal(): Promise<Snapshot> {
  const [user, huffling, streak, habitTypes, sessions, weeks, preferences] = await Promise.all([
    userRepository.getUser(),
    hufflingRepository.getHuffling(),
    streakRepository.getStreak(),
    habitTypeRepository.listHabitTypes(),
    sessionLogRepository.listSessionLogs(),
    weeklyGoalRepository.listWeeklyGoalsUpdatedSince(''),
    preferencesRepository.getPreferences(),
  ]);
  return {
    version: SNAPSHOT_VERSION,
    savedAt: nowIso(),
    records: {
      User: user ? [user] : [],
      Huffling: huffling ? [huffling] : [],
      HabitType: habitTypes,
      SessionLog: sessions,
      Streak: streak ? [streak] : [],
      WeeklyGoal: weeks,
    },
    preferences,
  };
}

async function applyAll(items: DomainRecord[]): Promise<void> {
  await runInTransaction(async () => {
    for (const item of items) {
      await applyDomainRecord(item);
    }
  });
}

async function adopt(remote: Snapshot): Promise<void> {
  await clearUserData();
  await applyAll(toDomainRecords(remote));
  if (remote.preferences) {
    await preferencesRepository.applyPreferences(remote.preferences);
  }
  await bootstrapStores();
  await rescheduleReminders();
}

/** A restored profile brings its own reminder time, so the local schedule must follow it. */
async function rescheduleReminders(): Promise<void> {
  try {
    const { syncLocalNotifications } = await import('../../notifications/schedule');
    await syncLocalNotifications();
  } catch {
    // Reminders are best effort; the next app start reschedules them.
  }
}

function markSynced(): SyncOutcome {
  ui().patch({ status: 'idle', lastSyncedAt: nowIso(), error: null, conflict: null });
  return { status: 'ok' };
}

async function runOnce(resolve?: Resolution): Promise<SyncOutcome> {
  ui().patch({ status: 'syncing', error: null });
  try {
    const { id, snapshot: remote } = await api.load();
    const local = await collectLocal();

    if (resolve === 'cloud' && remote && hasProfile(remote)) {
      await adopt(remote);
      return markSynced();
    }

    if (resolve === 'device') {
      await api.save(id, { ...local, savedAt: nowIso() });
      return markSynced();
    }

    if (remote && profilesConflict(local, remote)) {
      if (local.records.SessionLog.length === 0) {
        await adopt(remote);
        return markSynced();
      }
      ui().patch({
        status: 'conflict',
        conflict: { local: summarize(local), remote: summarize(remote) },
      });
      return { status: 'conflict' };
    }

    const { merged, incoming, incomingPreferences, remoteStale } = mergeSnapshots(local, remote, nowIso());
    if (incoming.length > 0 || incomingPreferences) {
      await applyAll(incoming);
      if (incomingPreferences) {
        await preferencesRepository.applyPreferences(incomingPreferences);
      }
      await bootstrapStores();
      await rescheduleReminders();
    }
    if (remoteStale) {
      await api.save(id, merged);
    }
    return markSynced();
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'DriveError'
        ? 'Google Drive did not accept the request. Your data is safe on this device.'
        : 'Could not reach Google Drive. Your data is safe on this device.';
    ui().patch({ status: 'error', error: message });
    return { status: 'error', message };
  }
}

let running: Promise<SyncOutcome> | null = null;
let rerun = false;

/** One sync at a time; a request made mid-sync triggers a follow-up run. */
export function syncNow(resolve?: Resolution): Promise<SyncOutcome> {
  if (running) {
    rerun = true;
    return running;
  }
  running = (async () => {
    try {
      let outcome = await runOnce(resolve);
      while (rerun && outcome.status === 'ok') {
        rerun = false;
        outcome = await runOnce();
      }
      return outcome;
    } finally {
      running = null;
      rerun = false;
    }
  })();
  return running;
}

let subscribed = false;
let timer: ReturnType<typeof setTimeout> | undefined;

function subscribeToLocalChanges(): void {
  if (subscribed) {
    return;
  }
  subscribed = true;
  onOutboxChange(() => {
    const { status } = ui();
    if (status === 'signed-out' || status === 'not-configured' || status === 'conflict') {
      return;
    }
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => void syncNow(), DEBOUNCE_MS);
  });
}

/** App launch and resume: restore the session silently, then reconcile. */
export async function startDriveSync(): Promise<void> {
  if (!isDriveConfigured()) {
    ui().patch({ status: 'not-configured' });
    return;
  }
  subscribeToLocalChanges();
  if (ui().status === 'conflict') {
    return;
  }
  const email = currentEmail() ?? (await signInSilent());
  if (!email) {
    ui().patch({ status: 'signed-out', email: null });
    return;
  }
  ui().patch({ email });
  await syncNow();
}

/** Fresh install with no profile: restore from Drive if a backup is reachable silently. */
export async function restoreFromDriveIfEmpty(): Promise<boolean> {
  if (!isDriveConfigured()) {
    return false;
  }
  const email = await signInSilent();
  if (!email) {
    return false;
  }
  try {
    const { snapshot } = await api.load();
    if (!snapshot || !hasProfile(snapshot)) {
      ui().patch({ status: 'idle', email });
      return false;
    }
    await adopt(snapshot);
    ui().patch({ status: 'idle', email, lastSyncedAt: nowIso() });
    return true;
  } catch {
    return false;
  }
}

export type ConnectResult = 'restored' | 'none' | 'cancelled' | 'error';

/** Welcome-screen path: sign in and adopt an existing backup if there is one. */
export async function connectAndRestore(): Promise<ConnectResult> {
  try {
    const email = await signInInteractive();
    if (!email) {
      return 'cancelled';
    }
    ui().patch({ email });
    const { snapshot } = await api.load();
    if (!snapshot || !hasProfile(snapshot)) {
      ui().patch({ status: 'idle' });
      return 'none';
    }
    await adopt(snapshot);
    markSynced();
    return 'restored';
  } catch {
    return 'error';
  }
}

/** Settings path: sign in, then reconcile with whatever is in Drive. */
export async function connectDrive(): Promise<SyncOutcome | { status: 'cancelled' }> {
  try {
    const email = await signInInteractive();
    if (!email) {
      return { status: 'cancelled' };
    }
    ui().patch({ email, status: 'idle' });
    subscribeToLocalChanges();
    return await syncNow();
  } catch {
    ui().patch({ status: 'error', error: 'Could not sign in to Google. Try again.' });
    return { status: 'error', message: 'sign-in failed' };
  }
}

export async function disconnectDrive(): Promise<void> {
  await signOut();
  ui().patch({ status: 'signed-out', email: null, conflict: null, error: null });
}
