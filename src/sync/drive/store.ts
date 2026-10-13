import { create } from 'zustand';
import type { ProfileSummary } from './snapshot';

export type DriveStatus =
  | 'not-configured'
  | 'signed-out'
  | 'idle'
  | 'syncing'
  | 'error'
  | 'conflict';

type DriveState = {
  status: DriveStatus;
  email: string | null;
  lastSyncedAt: string | null;
  error: string | null;
  conflict: { local: ProfileSummary; remote: ProfileSummary } | null;
  patch: (next: Partial<Omit<DriveState, 'patch'>>) => void;
};

export const useDriveStore = create<DriveState>((set) => ({
  status: 'not-configured',
  email: null,
  lastSyncedAt: null,
  error: null,
  conflict: null,
  patch: (next) => set(next),
}));
