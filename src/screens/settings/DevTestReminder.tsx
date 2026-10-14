import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { sendTestReminder } from '../../notifications/testReminder';
import { colors } from '../../theme/colors';

type Props = {
  onResult: (message: string) => void;
};

/** Development-only button. Loaded by SettingsScreen behind `__DEV__`. */
export function DevTestReminder({ onResult }: Props) {
  const [busy, setBusy] = useState(false);

  async function send() {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      const result = await sendTestReminder();
      onResult(
        result.status === 'scheduled'
          ? `Test reminder on its way. Lock your phone — it arrives in about ${result.inSeconds} seconds.`
          : 'Notifications are turned off for Huffle. Turn them on in system settings.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      onPress={() => void send()}
      disabled={busy}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Send a test reminder"
    >
      <Text style={styles.text}>{busy ? 'Sending…' : 'Send a test reminder (dev)'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
  },
  text: {
    color: colors.accentDark,
    fontWeight: '700',
    fontSize: 16,
  },
});
