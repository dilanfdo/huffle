import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

/** Animates a displayed integer toward `value`; the first render shows it immediately. */
export function useCountUp(value: number, duration = 800): number {
  const reduce = useReducedMotion();
  const anim = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);
  const first = useRef(true);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    if (first.current || reduce) {
      first.current = false;
      anim.setValue(value);
      setDisplay(value);
      return;
    }
    const animation = Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [anim, duration, reduce, value]);

  return display;
}
