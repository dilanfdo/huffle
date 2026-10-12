import { StyleSheet, Text, View } from 'react-native';
import { STAGE_EMOJI } from '../../components/huffling/HufflingPlaceholder';
import { EVOLUTION_STAGES, type EvolutionStageId } from '../../domain';
import { colors } from '../../theme/colors';
import { space } from '../../theme/layout';
import { type } from '../../theme/typography';

type Props = {
  currentStageId: EvolutionStageId;
  xp: number;
};

type Status = 'reached' | 'current' | 'upcoming';

export function StageTimeline({ currentStageId, xp }: Props) {
  const currentIndex = EVOLUTION_STAGES.findIndex((stage) => stage.id === currentStageId);

  return (
    <View>
      {EVOLUTION_STAGES.map((stage, index) => {
        const status: Status =
          index < currentIndex ? 'reached' : index === currentIndex ? 'current' : 'upcoming';
        const isLast = index === EVOLUTION_STAGES.length - 1;
        const detail =
          status === 'reached'
            ? 'Reached'
            : status === 'current'
              ? 'You are here'
              : `${stage.minXp - xp} XP to go`;

        return (
          <View
            key={stage.id}
            accessible
            accessibilityLabel={`${stage.label}, from ${stage.minXp} XP. ${detail}`}
            style={styles.row}
          >
            <View style={styles.rail}>
              <View style={[styles.node, nodeStyle[status]]} />
              {isLast ? null : (
                <View style={[styles.connector, status === 'reached' && styles.connectorDone]} />
              )}
            </View>
            <View style={[styles.content, isLast && styles.contentLast]}>
              <Text style={[styles.emoji, status === 'upcoming' && styles.dim]}>
                {STAGE_EMOJI[stage.id]}
              </Text>
              <View style={styles.text}>
                <Text style={[styles.stageLabel, status === 'upcoming' && styles.labelDim]}>
                  {stage.label}
                </Text>
                <Text style={styles.detail}>
                  {stage.minXp === 0 ? 'Where every Huffling starts' : `From ${stage.minXp} XP`}
                  {' · '}
                  {detail}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const NODE = 20;

const nodeStyle = StyleSheet.create({
  reached: { backgroundColor: colors.calm, borderColor: colors.calm },
  current: {
    backgroundColor: colors.accent,
    borderColor: colors.accentContainer,
    borderWidth: 5,
    width: NODE + 6,
    height: NODE + 6,
    borderRadius: (NODE + 6) / 2,
  },
  upcoming: { backgroundColor: 'transparent', borderColor: colors.line },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.lg,
  },
  rail: {
    width: NODE + 6,
    alignItems: 'center',
  },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2,
    marginTop: space.xs,
  },
  connector: {
    flex: 1,
    width: 2,
    minHeight: space.lg,
    marginVertical: space.xs,
    backgroundColor: colors.line,
  },
  connectorDone: {
    backgroundColor: colors.calm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingBottom: space.xl,
  },
  contentLast: {
    paddingBottom: 0,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 36,
  },
  dim: {
    opacity: 0.45,
  },
  text: {
    flex: 1,
  },
  stageLabel: {
    ...type.titleMedium,
    color: colors.ink,
  },
  labelDim: {
    color: colors.inkSecondary,
  },
  detail: {
    ...type.bodyMedium,
    color: colors.inkSecondary,
  },
});
