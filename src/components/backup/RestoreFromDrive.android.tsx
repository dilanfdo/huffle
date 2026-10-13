import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { bootstrapStores, type BootstrapState } from '../../store';
import { syncLocalNotifications } from '../../notifications/schedule';
import { isDriveConfigured } from '../../sync/drive/auth';
import { connectAndRestore } from '../../sync/drive/engine';
import { colors } from '../../theme/colors';

type Props = {
  onRestored: (state: BootstrapState) => void;
};

/** "Already have a Huffling?" path for a fresh install, via the user's Google Drive. */
export function RestoreFromDrive({ onRestored }: Props) {
  const [busy, setBusy] = useState(false);

  if (!isDriveConfigured()) {
    return null;
  }

  async function restore() {
    setBusy(true);
    try {
      const result = await connectAndRestore();
      if (result === 'restored') {
        const state = await bootstrapStores();
        await syncLocalNotifications();
        onRestored(state);
      } else if (result === 'none') {
        Alert.alert('No backup found', 'There is no Huffle backup in that Google account yet.');
      } else if (result === 'error') {
        Alert.alert('Could not restore', 'Check your connection and try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={busy}
      onPress={() => void restore()}
      style={styles.link}
    >
      <Text style={styles.text}>{busy ? 'Looking for your backup…' : 'Restore from Google Drive'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: {
    color: colors.accentDark,
    fontSize: 15,
    fontWeight: '700',
  },
});
