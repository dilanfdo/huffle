import { StyleSheet, Text, View } from 'react-native';
import type { EvolutionStageId, Mood } from '../../domain';
import { stageLabel } from '../../domain';
import { colors } from '../../theme/colors';

export const STAGE_EMOJI: Record<EvolutionStageId, string> = {
  winded: '😮‍💨',
  catching_breath: '😮',
  steady: '🙂',
  strong: '💪',
  thriving: '✨',
};

const MOOD_COLOR: Record<Mood, string> = {
  winded: colors.winded,
  neutral: colors.neutral,
  energized: colors.energized,
};

export const MOOD_LABEL: Record<Mood, string> = {
  winded: 'Catching their breath',
  neutral: 'Settling in',
  energized: 'Feeling fed',
};

type Props = {
  name?: string;
  stage: EvolutionStageId;
  mood: Mood;
  size?: number;
  /** Render only the creature, for callers that lay out their own labels. */
  hideLabels?: boolean;
};

/** Placeholder visual until Phase 2 art. State is what matters: stage + mood. */
export function HufflingPlaceholder({ name, stage, mood, size = 160, hideLabels = false }: Props) {
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.blob,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: MOOD_COLOR[mood],
          },
        ]}
      >
        <Text style={[styles.emoji, { fontSize: size * 0.42 }]}>{STAGE_EMOJI[stage]}</Text>
      </View>
      {hideLabels ? null : (
        <>
          {name ? <Text style={styles.name}>{name}</Text> : null}
          <Text style={styles.meta}>
            {stageLabel(stage)} · {MOOD_LABEL[mood]}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  blob: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
  name: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
  },
  meta: {
    marginTop: 4,
    fontSize: 15,
    color: colors.inkMuted,
  },
});
