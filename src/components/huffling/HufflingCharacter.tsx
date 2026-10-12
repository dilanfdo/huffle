import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { stageLabel, type EvolutionStageId, type Mood } from '../../domain';
import { colors } from '../../theme/colors';
import { MOOD_FACE, STAGE_PALETTE, STAGE_POSE } from './pose';

const MOOD_NAME: Record<Mood, string> = {
  winded: 'catching their breath',
  neutral: 'settling in',
  energized: 'feeling fed',
};

const CX = 100;
const FEATURE = colors.ink;
const MOUTH_FILL = '#5B2A22';
const HALO: Record<Mood, string> = {
  winded: colors.winded,
  neutral: colors.neutral,
  energized: colors.energized,
};

function star(cx: number, cy: number, r: number): string {
  return `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r}Z`;
}

type Props = {
  stage: EvolutionStageId;
  mood: Mood;
  size?: number;
};

/** The Huffling, drawn in code: stage sets posture and colour, mood sets face and extras. */
export function HufflingCharacter({ stage, mood, size = 160 }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const pose = STAGE_POSE[stage];
  const palette = STAGE_PALETTE[stage];
  const face = MOOD_FACE[mood];

  const { bodyRx: rx, bodyRy: ry, bodyCy: cy } = pose;
  const eyeY = cy - ry * 0.2;
  const eyeDx = rx * 0.42;
  const mouthY = cy + ry * 0.12;
  const cheekY = cy + ry * 0.1;
  const shoulderY = cy - ry * 0.1;
  const earY = cy - ry * 0.86;
  const feetY = cy + ry - 2;

  const bodyGradient = `${uid}body`;
  const auraGradient = `${uid}aura`;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${stageLabel(stage)} Huffling, ${MOOD_NAME[mood]}`}
    >
      <Defs>
        <LinearGradient id={bodyGradient} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.top} />
          <Stop offset="1" stopColor={palette.bottom} />
        </LinearGradient>
        <RadialGradient id={auraGradient} cx="50%" cy="50%" r="50%">
          <Stop offset="0.55" stopColor="#FFE2B8" stopOpacity="0.85" />
          <Stop offset="1" stopColor="#FFE2B8" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Circle cx={CX} cy={104} r={92} fill={HALO[mood]} opacity={0.3} />
      {pose.aura ? <Circle cx={CX} cy={cy} r={98} fill={`url(#${auraGradient})`} /> : null}
      <Ellipse cx={CX} cy={feetY + 8} rx={rx * 0.85} ry={7} fill={FEATURE} opacity={0.12} />

      <G transform={`rotate(${pose.lean} ${CX} ${feetY})`}>
        <Ellipse cx={CX - rx * 0.45} cy={feetY} rx={15} ry={9} fill={palette.bottom} />
        <Ellipse cx={CX + rx * 0.45} cy={feetY} rx={15} ry={9} fill={palette.bottom} />

        {[-1, 1].map((side) => {
          const sx = CX + side * rx * 0.92;
          return (
            <G key={`arm${side}`} transform={`rotate(${-side * pose.armSpread} ${sx} ${shoulderY})`}>
              <Ellipse cx={sx} cy={shoulderY + 16} rx={10} ry={19} fill={palette.bottom} />
            </G>
          );
        })}

        {[-1, 1].map((side) => (
          <G
            key={`ear${side}`}
            transform={`rotate(${side * pose.earDroop} ${CX + side * rx * 0.55} ${earY + 10})`}
          >
            <Ellipse cx={CX + side * rx * 0.55} cy={earY} rx={12} ry={18} fill={palette.top} />
            <Ellipse cx={CX + side * rx * 0.55} cy={earY + 2} rx={6} ry={11} fill={palette.belly} />
          </G>
        ))}

        <Ellipse cx={CX} cy={cy} rx={rx} ry={ry} fill={`url(#${bodyGradient})`} />
        <Ellipse cx={CX} cy={cy + ry * 0.38} rx={rx * 0.58} ry={ry * 0.42} fill={palette.belly} opacity={0.9} />

        {[-1, 1].map((side) => (
          <Circle
            key={`cheek${side}`}
            cx={CX + side * rx * 0.62}
            cy={cheekY}
            r={8}
            fill="#F08A7A"
            opacity={face.cheekOpacity}
          />
        ))}

        {[-1, 1].map((side) => {
          const ex = CX + side * eyeDx;
          if (face.eyes === 'closed') {
            return (
              <Path
                key={`eye${side}`}
                d={`M${ex - 8} ${eyeY} Q${ex} ${eyeY + 7} ${ex + 8} ${eyeY}`}
                stroke={FEATURE}
                strokeWidth={3.5}
                strokeLinecap="round"
                fill="none"
              />
            );
          }
          const r = face.eyes === 'bright' ? 7.5 : 6;
          return (
            <G key={`eye${side}`}>
              <Circle cx={ex} cy={eyeY} r={r} fill={FEATURE} />
              <Circle cx={ex + 2.2} cy={eyeY - 2.4} r={face.eyes === 'bright' ? 3 : 2} fill="#fff" />
            </G>
          );
        })}

        {face.mouth === 'pant' ? (
          <G>
            <Ellipse cx={CX} cy={mouthY + 4} rx={7} ry={9} fill={MOUTH_FILL} />
            <Ellipse cx={CX} cy={mouthY + 9} rx={4} ry={3} fill="#E58B8B" />
          </G>
        ) : null}
        {face.mouth === 'calm' ? (
          <Path
            d={`M${CX - 9} ${mouthY} Q${CX} ${mouthY + 7} ${CX + 9} ${mouthY}`}
            stroke={FEATURE}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
        ) : null}
        {face.mouth === 'smile' ? (
          <Path
            d={`M${CX - 13} ${mouthY - 2} C${CX - 10} ${mouthY + 17} ${CX + 10} ${mouthY + 17} ${CX + 13} ${mouthY - 2} Z`}
            fill={MOUTH_FILL}
            stroke={MOUTH_FILL}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ) : null}
      </G>

      {face.sweat ? (
        <Path
          d={`M${CX + rx * 0.62} ${cy - ry * 0.62} c6 8 7 15 0 17 c-7 -2 -6 -9 0 -17 Z`}
          fill="#BFE3F2"
        />
      ) : null}
      {face.puffs ? (
        <G fill="#fff" opacity={0.95}>
          <Circle cx={CX + rx * 0.82} cy={mouthY + 6} r={6} />
          <Circle cx={CX + rx * 0.98} cy={mouthY - 2} r={4.5} />
          <Circle cx={CX + rx * 0.9} cy={mouthY + 18} r={4} />
        </G>
      ) : null}
      {face.sparkles ? (
        <G fill="#FFF3C4">
          <Path d={star(CX - rx * 0.95, cy - ry * 0.85, 9)} />
          <Path d={star(CX + rx * 0.98, cy - ry * 0.6, 7)} />
          <Path d={star(CX + rx * 0.7, cy - ry * 1.1, 5)} />
        </G>
      ) : null}
    </Svg>
  );
}
