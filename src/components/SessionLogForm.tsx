import { useEffect, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Page } from './Page';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HabitTypePicker } from './HabitTypePicker';
import { PrimaryButton } from './PrimaryButton';
import type { LogSessionInput } from '../store';
import { useSessionStore } from '../store';
import { colors } from '../theme/colors';

type Props = {
  title: string;
  copy: string;
  submitLabel: string;
  onSubmit: (input: LogSessionInput) => Promise<void>;
  onCancel?: () => void;
  header?: ReactNode;
};

export function SessionLogForm({
  title,
  copy,
  submitLabel,
  onSubmit,
  onCancel,
  header,
}: Props) {
  const insets = useSafeAreaInsets();
  const habitTypes = useSessionStore((s) => s.habitTypes);
  const loadHabitTypes = useSessionStore((s) => s.loadHabitTypes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (habitTypes.length === 0) {
      void loadHabitTypes('fitness');
    }
  }, [habitTypes.length, loadHabitTypes]);

  useEffect(() => {
    if (!selectedId && habitTypes[0]) {
      setSelectedId(habitTypes[0].id);
    }
  }, [habitTypes, selectedId]);

  async function onConfirm() {
    if (!selectedId || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const minutes = duration.trim() === '' ? null : Number.parseInt(duration, 10);
      await onSubmit({
        habitTypeId: selectedId,
        durationMinutes: minutes !== null && Number.isFinite(minutes) ? minutes : null,
        note: note.trim() || null,
      });
    } catch {
      setError('Could not log that session. Try again — nothing is lost.');
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
        {onCancel ? (
          <Pressable onPress={onCancel} style={styles.cancel} accessibilityRole="button">
            <Text style={styles.cancelText}>Close</Text>
          </Pressable>
        ) : null}
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {header}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.copy}>{copy}</Text>
          <HabitTypePicker types={habitTypes} selectedId={selectedId} onSelect={setSelectedId} />
          <Text style={styles.fieldLabel}>Duration (minutes, optional)</Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            placeholder="e.g. 20"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Felt good to show up"
            placeholderTextColor={colors.inkMuted}
            style={[styles.input, styles.note]}
            multiline
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton
            label={busy ? 'Saving…' : submitLabel}
            onPress={() => void onConfirm()}
            disabled={!selectedId || busy}
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
  cancel: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accentDark,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
  },
  copy: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  note: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.danger,
    fontSize: 15,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
