import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '../anim/useReducedMotion';
import { colors } from '../../theme/colors';
import { type } from '../../theme/typography';

type Props = {
  counted: number;
  total: number;
  full: boolean;
};

function Orb({ lit, pop }: { lit: boolean; pop: boolean }) {
  const reduce = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pop || reduce) {
      return;
    }
    scale.setValue(1.7);
    Animated.spring(scale, { toValue: 1, friction: 3, tension: 130, useNativeDriver: true }).start();
  }, [pop, reduce, scale]);

  return <Animated.View style={[styles.orb, lit && styles.orbLit, { transform: [{ scale }] }]} />;
}

/** Today's glow: how many sessions have fully fed the Huffling so far. */
export function GlowMeter({ counted, total, full }: Props) {
  const previous = useRef(counted);
  const justLit = counted > previous.current ? counted - 1 : -1;

  useEffect(() => {
    previous.current = counted;
  }, [counted]);

  return (
    <View
      accessible
      accessibilityLabel={`Daily glow, ${counted} of ${total}${full ? ', full for today' : ''}`}
      style={styles.row}
    >
      <Text style={styles.label}>{full ? 'Fully glowing today' : "Today's glow"}</Text>
      <View style={styles.orbs}>
        {Array.from({ length: total }, (_, index) => (
          <Orb key={index} lit={index < counted} pop={index === justLit} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    ...type.labelLarge,
    color: colors.inkSecondary,
  },
  orbs: {
    flexDirection: 'row',
    gap: 6,
  },
  orb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.line,
  },
  orbLit: {
    backgroundColor: colors.energized,
  },
});
