/**
 * Notification voice. Tone dial lives here: playful and persistent, never
 * shaming. Edit freely — structure and timing are in plan.ts.
 */
export type DailyKind = 'daily' | 'comeback';

type Vars = { name: string; streak: number };
type Line = { title: (v: Vars) => string; body: (v: Vars) => string };

function pick<T>(options: readonly T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return options[hash % options.length];
}

const STREAK_ALIVE: readonly Line[] = [
  {
    title: (v) => `${v.name} is keeping your ${v.streak}-day streak warm`,
    body: () => 'One small move today and it keeps glowing.',
  },
  {
    title: (v) => `Day ${v.streak + 1} is waiting`,
    body: (v) => `A walk around the block counts. ${v.name} will take it.`,
  },
  {
    title: (v) => `${v.name} did a little stretch for you`,
    body: (v) => `Your turn? Any movement keeps the ${v.streak}-day streak going.`,
  },
];

const GENERIC: readonly Line[] = [
  { title: (v) => `${v.name} is around`, body: () => 'A little movement is enough — whenever you feel like it.' },
  { title: () => 'Got five minutes?', body: (v) => `${v.name} is ready for a tiny adventure.` },
  { title: (v) => `${v.name} saved you a spot`, body: () => 'Any movement counts. Walk, stretch, wiggle.' },
];

const MISSED_ONE: readonly Line[] = [
  { title: (v) => `${v.name} missed you yesterday`, body: () => 'No big deal. One session and they perk right up.' },
  { title: () => 'Your streak is taking a quick nap', body: (v) => `Wake it up with a little movement. ${v.name} will cheer.` },
];

const MISSED_FEW: readonly Line[] = [
  { title: (v) => `${v.name} is a little winded without you`, body: () => 'Come say hi — a short walk is plenty.' },
  { title: () => 'Tiny restarts count', body: (v) => `${v.name} is ready whenever you are.` },
];

const MISSED_MANY: readonly Line[] = [
  { title: (v) => `${v.name} keeps a spot warm for you`, body: () => 'No pressure. Whenever you’re ready, we’ll start small.' },
  { title: () => 'Still here, still rooting for you', body: (v) => `${v.name} would love to see you. Five minutes is plenty.` },
];

export function dailyCopy(args: {
  name: string;
  /** Local days since the last logged session, as of the notification's date; null if never. */
  gap: number | null;
  /** Streak as it would stand on that date if nothing more is logged. */
  streak: number;
  hasFreeze: boolean;
  seed: string;
}): { kind: DailyKind; title: string; body: string } {
  const { name, gap, streak, hasFreeze, seed } = args;
  const vars: Vars = { name, streak };

  if (gap === 2 && hasFreeze && streak >= 1) {
    return {
      kind: 'comeback',
      title: 'A freeze token has your back',
      body: `${name} covered yesterday. Keep the ${streak}-day streak going today.`,
    };
  }

  let kind: DailyKind = 'daily';
  let pool: readonly Line[];
  if (gap === null || gap <= 1) {
    pool = streak >= 2 ? STREAK_ALIVE : GENERIC;
  } else if (gap === 2) {
    kind = 'comeback';
    pool = MISSED_ONE;
  } else if (gap <= 4) {
    kind = 'comeback';
    pool = MISSED_FEW;
  } else {
    kind = 'comeback';
    pool = MISSED_MANY;
  }

  const line = pick(pool, seed);
  return { kind, title: line.title(vars), body: line.body(vars) };
}

export function streakRiskCopy(args: { name: string; streak: number; hasFreeze: boolean; seed: string }): {
  title: string;
  body: string;
} {
  const { name, streak, hasFreeze, seed } = args;
  const options = [
    { title: `${name} is guarding your ${streak}-day streak`, body: 'A few minutes tonight keeps it alive.' },
    { title: `Streak check: ${streak} days`, body: 'Still time today. Even a five-minute walk counts.' },
    {
      title: `${streak} days and counting`,
      body: hasFreeze
        ? `You have a freeze token if today gets away from you — but ${name} would love a quick move.`
        : `${name} is cheering from the sidelines. Tonight?`,
    },
  ] as const;
  return pick(options, seed);
}

/** Content for the Settings "Send a test reminder" button. Clearly a test, but in the Huffling's voice. */
export function testReminderCopy(args: { name: string; reminderTime: string }): { title: string; body: string } {
  return {
    title: `${args.name} is around`,
    body: `This is a test reminder. Your daily nudge arrives at ${args.reminderTime}.`,
  };
}
