import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { useReducedMotion } from './useReducedMotion';

type Props = {
  /** 0..1 */
  ratio: number;
  height?: number;
  fillColor?: string;
  accessibilityLabel: string;
};

export function AnimatedBar({ ratio, height = 10, fillColor = colors.accent, accessibilityLabel }: Props) {
  const reduce = useReducedMotion();
  const fill = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    if (reduce) {
      fill.setValue(ratio);
      return;
    }
    const animation = Animated.timing(fill, {
      toValue: ratio,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [fill, ratio, reduce]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      style={[styles.track, { height, borderRadius: height / 2 }]}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: fillColor,
          width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.line,
    overflow: 'hidden',
  },
});
