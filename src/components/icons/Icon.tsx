import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { FLAME_PATH, ICONS, type IconName, type IconShape } from './paths';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Decorative by default; wrap in a labelled Pressable/View for accessibility. */
export function Icon({ name, size = 24, color = '#3D405B', strokeWidth = 2 }: Props) {
  const shape: IconShape = ICONS[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {shape.rects?.map((r, i) => (
        <Rect key={`r${i}`} x={r.x} y={r.y} width={r.width} height={r.height} rx={r.rx} />
      ))}
      {shape.circles?.map((c, i) => (
        <Circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} />
      ))}
      {shape.d?.map((d, i) => (
        <Path key={`p${i}`} d={d} />
      ))}
    </Svg>
  );
}

/** Solid gradient flame for streaks. */
export function FlameIcon({ size = 28, dim = false }: { size?: number; dim?: boolean }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no"
      opacity={dim ? 0.35 : 1}
    >
      <Defs>
        <LinearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFB347" />
          <Stop offset="1" stopColor="#E8552B" />
        </LinearGradient>
      </Defs>
      <Path d={FLAME_PATH} fill="url(#flame)" />
      <Path d="M12.3 21a2.6 2.6 0 0 1-2.6-2.6c0-1.3.9-2.1 1.6-3 .3 1 .8 1.4 1.4 1.5.5-.8.5-1.7.4-2.6 1.1.8 1.8 2 1.8 4.1A2.6 2.6 0 0 1 12.3 21Z" fill="#FFE08A" />
    </Svg>
  );
}
