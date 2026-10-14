import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';
import { PRIVACY_POLICY_URL } from '../config/links';
import { colors } from '../theme/colors';

type Props = {
  label?: string;
};

/** Opens the hosted privacy policy in the browser; shows a short note if no browser can open it. */
export function PrivacyPolicyLink({ label = 'Privacy policy' }: Props) {
  const [failed, setFailed] = useState(false);

  async function open() {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  return (
    <>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${label}, opens in your browser`}
        onPress={() => void open()}
        style={styles.link}
      >
        <Text style={styles.text}>{label}</Text>
      </Pressable>
      {failed ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          Couldn’t open the link. You can read it at {PRIVACY_POLICY_URL}
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
  },
  text: {
    color: colors.accentDark,
    fontSize: 16,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
});
