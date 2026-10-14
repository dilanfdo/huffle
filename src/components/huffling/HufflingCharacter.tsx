import { useId } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { stageLabel, type CosmeticId, type EvolutionStageId, type Mood } from '../../domain';
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
  accessory?: CosmeticId | null;
};

/** The Huffling, drawn in code: stage sets posture and colour, mood sets face and extras. */
export function HufflingCharacter({ stage, mood, size = 160, accessory = null }: Props) {
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
  const headTop = cy - ry * 0.95;

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

        {accessory === 'cape' ? (
          <Path
            d={`M${CX - rx * 0.62} ${cy - ry * 0.45} Q${CX - rx * 1.3} ${cy + ry * 0.3} ${CX - rx * 1.02} ${cy + ry * 0.88} L${CX + rx * 1.02} ${cy + ry * 0.88} Q${CX + rx * 1.3} ${cy + ry * 0.3} ${CX + rx * 0.62} ${cy - ry * 0.45} Z`}
            fill="#D9534F"
          />
        ) : null}

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

        {accessory === 'sweatband' ? (
          <G>
            <Path
              d={`M${CX - rx * 0.8} ${cy - ry * 0.5} Q${CX} ${cy - ry * 0.62} ${CX + rx * 0.8} ${cy - ry * 0.5}`}
              stroke="#4DB6AC"
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={`M${CX - rx * 0.7} ${cy - ry * 0.5} Q${CX} ${cy - ry * 0.62} ${CX + rx * 0.7} ${cy - ry * 0.5}`}
              stroke="#fff"
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
              opacity={0.8}
            />
          </G>
        ) : null}
        {accessory === 'scarf' ? (
          <G>
            <Path
              d={`M${CX - rx * 0.8} ${cy + ry * 0.5} Q${CX} ${cy + ry * 0.7} ${CX + rx * 0.8} ${cy + ry * 0.5}`}
              stroke="#E57373"
              strokeWidth={14}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d={`M${CX + rx * 0.35} ${cy + ry * 0.58} L${CX + rx * 0.5} ${cy + ry * 0.58} L${CX + rx * 0.55} ${cy + ry * 0.95} L${CX + rx * 0.38} ${cy + ry * 0.95} Z`}
              fill="#EF9A9A"
            />
          </G>
        ) : null}
        {accessory === 'leaf_crown' ? (
          <G fill="#81B29A" stroke="#5E8F78" strokeWidth={1.5}>
            <Ellipse cx={CX - 15} cy={headTop + 4} rx={6} ry={13} transform={`rotate(-35 ${CX - 15} ${headTop + 4})`} />
            <Ellipse cx={CX} cy={headTop - 2} rx={6.5} ry={14} />
            <Ellipse cx={CX + 15} cy={headTop + 4} rx={6} ry={13} transform={`rotate(35 ${CX + 15} ${headTop + 4})`} />
          </G>
        ) : null}
        {accessory === 'glasses' ? (
          <G stroke={FEATURE} strokeWidth={3} fill="#ffffff" fillOpacity={0.25}>
            <Circle cx={CX - eyeDx} cy={eyeY} r={13} />
            <Circle cx={CX + eyeDx} cy={eyeY} r={13} />
            <Path d={`M${CX - eyeDx + 13} ${eyeY} L${CX + eyeDx - 13} ${eyeY}`} fill="none" />
          </G>
        ) : null}
        {accessory === 'bow' ? (
          <G fill="#F48FB1" stroke="#EC6A9B" strokeWidth={1}>
            <Path d={`M${CX - rx * 0.5} ${earY + 16} L${CX - rx * 0.5 - 15} ${earY + 7} L${CX - rx * 0.5 - 15} ${earY + 25} Z`} />
            <Path d={`M${CX - rx * 0.5} ${earY + 16} L${CX - rx * 0.5 + 15} ${earY + 7} L${CX - rx * 0.5 + 15} ${earY + 25} Z`} />
            <Circle cx={CX - rx * 0.5} cy={earY + 16} r={5} fill="#EC6A9B" />
          </G>
        ) : null}
        {accessory === 'star_pin' ? (
          <Path
            d={star(CX + rx * 0.5, cy + ry * 0.45, 10)}
            fill="#FFD54F"
            stroke="#F9A825"
            strokeWidth={1.5}
          />
        ) : null}
        {accessory === 'sunhat' ? (
          <G>
            <Path
              d={`M${CX - 26} ${headTop + 8} Q${CX} ${headTop - 30} ${CX + 26} ${headTop + 8} Z`}
              fill="#F2CC8F"
            />
            <Path
              d={`M${CX - 24} ${headTop + 5} Q${CX} ${headTop - 6} ${CX + 24} ${headTop + 5}`}
              stroke="#E07A5F"
              strokeWidth={5}
              fill="none"
            />
            <Ellipse cx={CX} cy={headTop + 9} rx={48} ry={9} fill="#F2CC8F" stroke="#D9B26F" strokeWidth={1.5} />
          </G>
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
