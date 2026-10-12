import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from '../anim/useReducedMotion';
import type { WeekDay } from '../../domain';
import { colors } from '../../theme/colors';

type DotProps = { day: WeekDay; index: number };

function Dot({ day, index }: DotProps) {
  const reduce = useReducedMotion();
  const scale = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const wasDone = useRef(day.done);

  useEffect(() => {
    if (reduce) {
      scale.setValue(1);
      return;
    }
    const animation = Animated.spring(scale, {
      toValue: 1,
      delay: index * 55,
      friction: 4,
      tension: 150,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [index, reduce, scale]);

  useEffect(() => {
    if (day.done && !wasDone.current && !reduce) {
      scale.setValue(1.5);
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 130, useNativeDriver: true }).start();
    }
    wasDone.current = day.done;
  }, [day.done, reduce, scale]);

  useEffect(() => {
    if (!day.isToday || day.done || reduce) {
      ring.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [day.done, day.isToday, reduce, ring]);

  const filled = day.done;
  const label = `${day.letter}${day.isToday ? ', today' : ''}${filled ? ', done' : ''}`;

  return (
    <View style={styles.col} accessible accessibilityLabel={label}>
      <Animated.View style={[styles.slot, { transform: [{ scale }] }]}>
        {day.isToday && !filled ? (
          <Animated.View
            style={[
              styles.ring,
              {
                opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
              },
            ]}
          />
        ) : null}
        <View
          style={[
            styles.dot,
            filled && styles.dotDone,
            !filled && day.isToday && styles.dotToday,
            !filled && day.isFuture && styles.dotFuture,
          ]}
        >
          {filled ? <View style={styles.check} /> : null}
        </View>
      </Animated.View>
      <Text style={[styles.letter, day.isToday && styles.letterToday]}>{day.letter}</Text>
    </View>
  );
}

export function WeekDots({ days }: { days: WeekDay[] }) {
  return (
    <View style={styles.row}>
      {days.map((day, index) => (
        <Dot key={day.date} day={day} index={index} />
      ))}
    </View>
  );
}

const SIZE = 30;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    alignItems: 'center',
    gap: 6,
    minWidth: 36,
  },
  slot: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dot: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.calm,
    borderColor: colors.calm,
  },
  dotToday: {
    borderColor: colors.accent,
  },
  dotFuture: {
    opacity: 0.55,
  },
  check: {
    width: 7,
    height: 13,
    marginTop: -2,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#fff',
    transform: [{ rotate: '45deg' }],
  },
  letter: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  letterToday: {
    color: colors.accentDark,
    fontWeight: '800',
  },
});
