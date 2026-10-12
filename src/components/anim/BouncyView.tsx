import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

type Props = {
  /** A new non-null value triggers a squash-and-jump. */
  trigger: string | number | null;
  children: ReactNode;
};

export function BouncyView({ trigger, children }: Props) {
  const reduce = useReducedMotion();
  const lift = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(1)).current;
  const last = useRef<Props['trigger']>(trigger);

  useEffect(() => {
    if (trigger === null || trigger === last.current || reduce) {
      last.current = trigger;
      return;
    }
    last.current = trigger;
    const animation = Animated.sequence([
      Animated.timing(squash, { toValue: 0.88, duration: 90, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(lift, { toValue: -34, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(squash, { toValue: 1.1, duration: 180, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(lift, { toValue: 0, friction: 4, tension: 160, useNativeDriver: true }),
        Animated.spring(squash, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [lift, reduce, squash, trigger]);

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: lift },
          { scaleY: squash },
          { scaleX: squash.interpolate({ inputRange: [0.88, 1, 1.1], outputRange: [1.08, 1, 0.94] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
