import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { HabitTypeRecord } from '../data';
import { colors } from '../theme/colors';

type Props = {
  types: HabitTypeRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function HabitTypePicker({ types, selectedId, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {types.map((type) => {
        const selected = type.id === selectedId;
        return (
          <Pressable
            key={type.id}
            onPress={() => onSelect(type.id)}
            style={[styles.chip, selected && styles.chipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={styles.icon}>{type.icon}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]}>{type.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: '#FDEEE8',
  },
  icon: {
    fontSize: 22,
    marginBottom: 6,
  },
  label: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.accentDark,
  },
});
