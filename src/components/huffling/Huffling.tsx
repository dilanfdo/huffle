import { StyleSheet, Text, View } from 'react-native';
import type { EvolutionStageId, Mood } from '../../domain';
import { EVOLUTION_STAGES, stageLabel, type CosmeticId } from '../../domain';
import { colors } from '../../theme/colors';
import { HufflingCharacter } from './HufflingCharacter';

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
  accessory?: CosmeticId | null;
};

/** Character with name and stage/mood caption, for screens that don't lay out their own labels. */
export function Huffling({ name, stage, mood, size = 180, accessory = null }: Props) {
  return (
    <View style={styles.wrap}>
      <HufflingCharacter stage={stage} mood={mood} size={size} accessory={accessory} />
      {name ? <Text style={styles.name}>{name}</Text> : null}
      <Text style={styles.meta}>{MOOD_LABEL[mood]}</Text>
      <Text style={styles.stage}>
        Stage {EVOLUTION_STAGES.findIndex((s) => s.id === stage) + 1} of {EVOLUTION_STAGES.length} ·{' '}
        {stageLabel(stage)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  name: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
  },
  meta: {
    marginTop: 4,
    fontSize: 15,
    color: colors.inkMuted,
  },
  stage: {
    marginTop: 2,
    fontSize: 13,
    color: colors.inkMuted,
  },
});
