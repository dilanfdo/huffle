import { create } from 'zustand';

export type ICloudAvailability =
  | 'checking'
  | 'unavailable-module'
  | 'no-account'
  | 'restricted'
  | 'available'
  | 'error';

type SyncUiState = {
  availability: ICloudAvailability;
  lastError: string | null;
  lastPulledAt: string | null;
  setAvailability: (availability: ICloudAvailability, lastError?: string | null) => void;
  setLastPulledAt: (iso: string | null) => void;
};

export const useSyncStore = create<SyncUiState>((set) => ({
  availability: 'checking',
  lastError: null,
  lastPulledAt: null,
  setAvailability: (availability, lastError = null) => set({ availability, lastError }),
  setLastPulledAt: (lastPulledAt) => set({ lastPulledAt }),
}));
