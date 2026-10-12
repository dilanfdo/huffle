import { StyleSheet, Text, View } from 'react-native';
import { useCountUp } from '../../components/anim/useCountUp';
import { colors } from '../../theme/colors';
import { radius, space } from '../../theme/layout';
import { type } from '../../theme/typography';

type Props = {
  label: string;
  value: number;
  unit?: string;
};

export function StatTile({ label, value, unit }: Props) {
  const shown = useCountUp(value);
  const spoken = unit ? `${label}, ${value} ${value === 1 ? unit : `${unit}s`}` : `${label}, ${value}`;
  return (
    <View accessible accessibilityLabel={spoken} style={styles.tile}>
      <Text style={styles.value}>{shown}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    gap: space.xs,
  },
  value: {
    ...type.displaySmall,
    color: colors.ink,
  },
  label: {
    ...type.labelLarge,
    color: colors.inkSecondary,
  },
});
