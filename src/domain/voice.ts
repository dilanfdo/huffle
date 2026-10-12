import type { Mood } from './mood';

export type VoiceContext = {
  name: string;
  mood: Mood;
  loggedToday: boolean;
  /** Live streak (0 once lapsed). */
  streak: number;
  /** Whether the user has ever logged a session. */
  hasHistory: boolean;
  /** Local hour, 0-23. */
  hour: number;
  /** Stable per-day seed so the line doesn't flicker between renders. */
  seed: string;
};

function pick<T>(options: readonly T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return options[hash % options.length];
}

/** What the Huffling says on Home: warm, playful, never guilt. First person. */
export function hufflingLine(ctx: VoiceContext): string {
  const { name, loggedToday, streak, hasHistory, hour, seed } = ctx;

  if (!hasHistory) {
    return pick(
      [`Hi! I'm ${name}. Want to start with something tiny?`, `Hey, it's me, ${name}. Ready when you are!`],
      seed,
    );
  }

  if (loggedToday) {
    return pick(
      [
        'That felt great. Thanks for showing up!',
        streak >= 2 ? `${streak} days and glowing. Look at us!` : 'Today is done. Look at us!',
        "I'm feeling steady. Same time tomorrow?",
        'You moved, I breathe easier. Teamwork!',
      ],
      seed,
    );
  }

  if (streak >= 2) {
    if (hour >= 18) {
      return pick(
        [
          `Your ${streak}-day streak is still alive. Tonight?`,
          `A short one still counts. ${streak} days on the line!`,
          `I'm guarding your ${streak}-day streak. Quick walk?`,
        ],
        seed,
      );
    }
    return pick(
      [
        `Day ${streak + 1} is waiting. Ready for a little something?`,
        `${streak} days strong. Shall we keep it going?`,
        'Morning! A tiny move today keeps the glow.',
      ],
      seed,
    );
  }

  if (streak === 1) {
    return pick(['One day down. Want to make it two?', "Day two? I'm in if you are!"], seed);
  }

  return pick(
    [
      'Hey, stranger. I kept your spot warm.',
      'No pressure. A tiny restart is still a start.',
      `${name} here. Even five minutes counts!`,
    ],
    seed,
  );
}
