import { create } from 'zustand';
import { preferencesRepository, settingsRepository } from '../data';
import { COSMETIC_IDS, type CosmeticId } from '../domain';

const { KEY_SELECTED, KEY_GIFT_OPENED, KEY_SUPPORTER } = preferencesRepository;

function asCosmetic(value: string | null): CosmeticId | null {
  return (COSMETIC_IDS as readonly string[]).includes(value ?? '') ? (value as CosmeticId) : null;
}

type WardrobeState = {
  loaded: boolean;
  selected: CosmeticId | null;
  /** Local date (YYYY-MM-DD) on which the daily gift was last opened. */
  giftOpenedDate: string | null;
  /** Owns every cosmetic. Set by the purchase flow once billing is connected. */
  supporter: boolean;
  load: () => Promise<void>;
  select: (id: CosmeticId | null) => Promise<void>;
  openGift: (date: string) => Promise<void>;
  setSupporter: (value: boolean) => Promise<void>;
};

export const useWardrobeStore = create<WardrobeState>((set) => ({
  loaded: false,
  selected: null,
  giftOpenedDate: null,
  supporter: false,

  load: async () => {
    const [selected, gift, supporter] = await Promise.all([
      settingsRepository.getSetting(KEY_SELECTED),
      settingsRepository.getSetting(KEY_GIFT_OPENED),
      settingsRepository.getSetting(KEY_SUPPORTER),
    ]);
    set({
      loaded: true,
      selected: asCosmetic(selected),
      giftOpenedDate: gift,
      supporter: supporter === '1',
    });
  },

  select: async (id) => {
    set({ selected: id });
    await settingsRepository.setSetting(KEY_SELECTED, id);
    await preferencesRepository.touchPreferences();
  },

  openGift: async (date) => {
    set({ giftOpenedDate: date });
    await settingsRepository.setSetting(KEY_GIFT_OPENED, date);
    await preferencesRepository.touchPreferences();
  },

  setSupporter: async (value) => {
    set({ supporter: value });
    await settingsRepository.setSetting(KEY_SUPPORTER, value ? '1' : null);
    await preferencesRepository.touchPreferences();
  },
}));
