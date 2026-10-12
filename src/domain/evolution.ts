export const EVOLUTION_STAGE_IDS = [
  'winded',
  'catching_breath',
  'steady',
  'strong',
  'thriving',
] as const;

export type EvolutionStageId = (typeof EVOLUTION_STAGE_IDS)[number];

export type EvolutionStage = {
  id: EvolutionStageId;
  label: string;
  /** Inclusive XP floor for this stage. */
  minXp: number;
};

/**
 * Front-load the first evolution (~2 sessions at 10–11 XP each) so early
 * progress is visible. Later stages stretch out so Thriving is a real milestone.
 */
export const EVOLUTION_STAGES: readonly EvolutionStage[] = [
  { id: 'winded', label: 'Winded', minXp: 0 },
  { id: 'catching_breath', label: 'Catching Breath', minXp: 20 },
  { id: 'steady', label: 'Steady', minXp: 70 },
  { id: 'strong', label: 'Strong', minXp: 160 },
  { id: 'thriving', label: 'Thriving', minXp: 320 },
] as const;

export function stageFromXp(xp: number): EvolutionStageId {
  const safeXp = Math.max(0, xp);
  let current: EvolutionStageId = EVOLUTION_STAGES[0].id;
  for (const stage of EVOLUTION_STAGES) {
    if (safeXp >= stage.minXp) {
      current = stage.id;
    }
  }
  return current;
}

export function stageLabel(id: EvolutionStageId): string {
  const stage = EVOLUTION_STAGES.find((s) => s.id === id);
  return stage?.label ?? id;
}

/** XP needed to reach the next stage, or null if already Thriving. */
export function xpToNextStage(xp: number): number | null {
  const safeXp = Math.max(0, xp);
  const next = EVOLUTION_STAGES.find((stage) => stage.minXp > safeXp);
  if (!next) {
    return null;
  }
  return next.minXp - safeXp;
}

export type StageProgress = {
  current: EvolutionStage;
  /** Null once the Huffling is Thriving. */
  next: EvolutionStage | null;
  xpIntoStage: number;
  /** XP span of the current stage, or null at Thriving. */
  xpSpan: number | null;
  /** 0..1 position within the current stage; 1 at Thriving. */
  ratio: number;
};

export function stageProgress(xp: number): StageProgress {
  const safeXp = Math.max(0, xp);
  let currentIndex = 0;
  EVOLUTION_STAGES.forEach((stage, index) => {
    if (safeXp >= stage.minXp) {
      currentIndex = index;
    }
  });
  const current = EVOLUTION_STAGES[currentIndex];
  const next = EVOLUTION_STAGES[currentIndex + 1] ?? null;
  if (!next) {
    return { current, next: null, xpIntoStage: safeXp - current.minXp, xpSpan: null, ratio: 1 };
  }
  const xpSpan = next.minXp - current.minXp;
  const xpIntoStage = safeXp - current.minXp;
  return { current, next, xpIntoStage, xpSpan, ratio: Math.min(1, xpIntoStage / xpSpan) };
}
