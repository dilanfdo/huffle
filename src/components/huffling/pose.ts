import type { EvolutionStageId, Mood } from '../../domain';

/** Geometry for one evolution stage, in a 200x200 viewBox. Posture is the stage; breathing/face is the mood. */
export type StagePose = {
  bodyRx: number;
  bodyRy: number;
  bodyCy: number;
  /** Degrees the whole creature tilts; a tired slump reads as a lean. */
  lean: number;
  /** How far the ears droop outward, in degrees. */
  earDroop: number;
  /** Arm angle from hanging straight down; large values raise the arms. */
  armSpread: number;
  aura: boolean;
};

export const STAGE_POSE: Record<EvolutionStageId, StagePose> = {
  winded: { bodyRx: 68, bodyRy: 50, bodyCy: 118, lean: 6, earDroop: 55, armSpread: 8, aura: false },
  catching_breath: { bodyRx: 66, bodyRy: 54, bodyCy: 116, lean: 3, earDroop: 40, armSpread: 14, aura: false },
  steady: { bodyRx: 64, bodyRy: 58, bodyCy: 112, lean: 0, earDroop: 25, armSpread: 25, aura: false },
  strong: { bodyRx: 62, bodyRy: 62, bodyCy: 108, lean: 0, earDroop: 14, armSpread: 60, aura: false },
  thriving: { bodyRx: 60, bodyRy: 66, bodyCy: 104, lean: 0, earDroop: 6, armSpread: 140, aura: true },
};

/** Colour vibrancy rises with stage; the same hue family keeps it one creature. */
export type StagePalette = { top: string; bottom: string; belly: string };

export const STAGE_PALETTE: Record<EvolutionStageId, StagePalette> = {
  winded: { top: '#D9CBBB', bottom: '#BFAE9C', belly: '#EADFD2' },
  catching_breath: { top: '#EBD3AE', bottom: '#D8BC92', belly: '#F5E8D2' },
  steady: { top: '#F5C395', bottom: '#E8A672', belly: '#FBE3CC' },
  strong: { top: '#F7B079', bottom: '#EE8E55', belly: '#FCDCC2' },
  thriving: { top: '#F6A06A', bottom: '#E8743F', belly: '#FFD9BC' },
};

export type MoodFace = {
  eyes: 'closed' | 'soft' | 'bright';
  mouth: 'pant' | 'calm' | 'smile';
  cheekOpacity: number;
  sweat: boolean;
  puffs: boolean;
  sparkles: boolean;
};

export const MOOD_FACE: Record<Mood, MoodFace> = {
  winded: { eyes: 'closed', mouth: 'pant', cheekOpacity: 0.25, sweat: true, puffs: true, sparkles: false },
  neutral: { eyes: 'soft', mouth: 'calm', cheekOpacity: 0.35, sweat: false, puffs: false, sparkles: false },
  energized: { eyes: 'bright', mouth: 'smile', cheekOpacity: 0.5, sweat: false, puffs: false, sparkles: true },
};
