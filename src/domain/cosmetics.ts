import { EVOLUTION_STAGE_IDS, type EvolutionStageId } from './evolution';

export const COSMETIC_IDS = [
  'sweatband',
  'scarf',
  'leaf_crown',
  'glasses',
  'cape',
  'bow',
  'star_pin',
  'sunhat',
] as const;

export type CosmeticId = (typeof COSMETIC_IDS)[number];

type Unlock =
  | { kind: 'sessions'; count: number }
  | { kind: 'streak'; days: number }
  | { kind: 'stage'; stage: EvolutionStageId }
  | { kind: 'gift' };

export type Cosmetic = { id: CosmeticId; label: string; unlock: Unlock };

/** Earned items are permanent for everyone; gift items arrive as the daily gift or with Supporter. */
export const COSMETICS: readonly Cosmetic[] = [
  { id: 'sweatband', label: 'Sweatband', unlock: { kind: 'sessions', count: 5 } },
  { id: 'scarf', label: 'Cosy scarf', unlock: { kind: 'streak', days: 7 } },
  { id: 'leaf_crown', label: 'Leaf crown', unlock: { kind: 'stage', stage: 'steady' } },
  { id: 'glasses', label: 'Round glasses', unlock: { kind: 'sessions', count: 25 } },
  { id: 'cape', label: 'Hero cape', unlock: { kind: 'stage', stage: 'thriving' } },
  { id: 'bow', label: 'Ribbon bow', unlock: { kind: 'gift' } },
  { id: 'star_pin', label: 'Star pin', unlock: { kind: 'gift' } },
  { id: 'sunhat', label: 'Sunhat', unlock: { kind: 'gift' } },
];

export type CosmeticProgress = {
  sessions: number;
  longestStreak: number;
  stage: EvolutionStageId;
};

function stageIndex(stage: EvolutionStageId): number {
  return EVOLUTION_STAGE_IDS.indexOf(stage);
}

export function cosmeticLabel(id: CosmeticId): string {
  return COSMETICS.find((c) => c.id === id)?.label ?? id;
}

/** Items earned through consistency; derived from history so they never need storing. */
export function earnedCosmetics(progress: CosmeticProgress): CosmeticId[] {
  return COSMETICS.filter(({ unlock }) => {
    switch (unlock.kind) {
      case 'sessions':
        return progress.sessions >= unlock.count;
      case 'streak':
        return progress.longestStreak >= unlock.days;
      case 'stage':
        return stageIndex(progress.stage) >= stageIndex(unlock.stage);
      case 'gift':
        return false;
    }
  }).map((c) => c.id);
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Today's gift: a stable pick for the date from items the user doesn't own yet,
 * so free users meet something new each day. Null once they own everything.
 */
export function todaysGift(date: string, owned: readonly CosmeticId[]): CosmeticId | null {
  const pool = COSMETICS.filter((c) => !owned.includes(c.id));
  if (pool.length === 0) {
    return null;
  }
  return pool[hash(date) % pool.length].id;
}

export function canWear(
  id: CosmeticId,
  ctx: { earned: readonly CosmeticId[]; giftToday: CosmeticId | null; giftOpened: boolean; supporter: boolean },
): boolean {
  if (ctx.supporter || ctx.earned.includes(id)) {
    return true;
  }
  return ctx.giftOpened && ctx.giftToday === id;
}

export function unlockHint(id: CosmeticId): string {
  const unlock = COSMETICS.find((c) => c.id === id)?.unlock;
  switch (unlock?.kind) {
    case 'sessions':
      return `Log ${unlock.count} sessions`;
    case 'streak':
      return `Reach a ${unlock.days}-day streak`;
    case 'stage':
      return `Reach the ${unlock.stage.replace('_', ' ')} stage`;
    default:
      return 'Appears as a daily gift';
  }
}
