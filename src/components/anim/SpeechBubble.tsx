import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { useReducedMotion } from './useReducedMotion';

type Props = {
  text: string;
};

/** The Huffling's line; pops in whenever the text changes. */
export function SpeechBubble({ text }: Props) {
  const reduce = useReducedMotion();
  const scale = useRef(new Animated.Value(reduce ? 1 : 0.6)).current;

  useEffect(() => {
    if (reduce) {
      scale.setValue(1);
      return;
    }
    scale.setValue(0.6);
    const animation = Animated.spring(scale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [reduce, scale, text]);

  return (
    <Animated.View
      style={[styles.wrap, { opacity: scale.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1] }), transform: [{ scale }] }]}
    >
      <View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
      </View>
      <View style={styles.tail} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    transformOrigin: '50% 100%',
  },
  bubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 320,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  tail: {
    width: 14,
    height: 14,
    marginTop: -8,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    transform: [{ rotate: '45deg' }],
  },
});
