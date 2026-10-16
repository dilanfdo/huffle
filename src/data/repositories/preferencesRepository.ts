import { nowIso } from '../ids';
import { notifyLocalChange } from '../outbox';
import { getSetting, setSetting } from './settingsRepository';

export const KEY_SELECTED = 'wardrobe.selected';
export const KEY_GIFT_OPENED = 'gift.openedDate';
export const KEY_SUPPORTER = 'supporter.active';
const KEY_UPDATED_AT = 'prefs.updatedAt';

/** The device-local settings worth carrying to a new phone. */
export type PreferencesRecord = {
  selectedCosmetic: string | null;
  /** Local date (YYYY-MM-DD) the daily gift was last opened. */
  giftOpenedDate: string | null;
  supporter: boolean;
  updatedAt: string;
};

/** Null when the user has never set anything (nothing worth backing up). */
export async function getPreferences(): Promise<PreferencesRecord | null> {
  const [selected, gift, supporter, updatedAt] = await Promise.all([
    getSetting(KEY_SELECTED),
    getSetting(KEY_GIFT_OPENED),
    getSetting(KEY_SUPPORTER),
    getSetting(KEY_UPDATED_AT),
  ]);
  if (!selected && !gift && supporter !== '1') {
    return null;
  }
  return {
    selectedCosmetic: selected,
    giftOpenedDate: gift,
    supporter: supporter === '1',
    updatedAt: updatedAt ?? '',
  };
}

/** Writes a merged or restored copy. Does not notify: the caller is the sync engine itself. */
export async function applyPreferences(prefs: PreferencesRecord): Promise<void> {
  await setSetting(KEY_SELECTED, prefs.selectedCosmetic);
  await setSetting(KEY_GIFT_OPENED, prefs.giftOpenedDate);
  await setSetting(KEY_SUPPORTER, prefs.supporter ? '1' : null);
  await setSetting(KEY_UPDATED_AT, prefs.updatedAt || null);
}

/** Stamps a user-made change and tells the backup it has something new to save. */
export async function touchPreferences(): Promise<void> {
  await setSetting(KEY_UPDATED_AT, nowIso());
  notifyLocalChange();
}
