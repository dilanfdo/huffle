import { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Page } from '../../components/Page';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../../components/PrimaryButton';
import { createLocalProfile } from '../../store';
import { colors } from '../../theme/colors';
import type { OnboardingStackParamList } from '../../root/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'NameHuffling'>;

export function NameHufflingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();

  async function onContinue() {
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createLocalProfile(trimmed);
      navigation.navigate('FirstSession');
    } catch {
      setError('Could not save that name. Try again — everything stays on this device.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Name your Huffling</Text>
          <Text style={styles.copy}>
            They’re a little winded to start — same as a lot of us. A name makes them yours.
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Pip"
            placeholderTextColor={colors.inkMuted}
            autoFocus
            autoCapitalize="words"
            maxLength={24}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={() => void onContinue()}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label={busy ? 'Saving…' : 'That’s their name'}
            onPress={() => void onContinue()}
            disabled={!trimmed || busy}
          />
        </View>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
  },
  copy: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.inkMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    color: colors.ink,
  },
  error: {
    color: colors.danger,
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
