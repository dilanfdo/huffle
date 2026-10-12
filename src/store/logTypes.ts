export type LogSessionInput = {
  habitTypeId: string;
  durationMinutes?: number | null;
  note?: string | null;
  at?: Date;
};

export type LogSessionResult = {
  session: import('../data').SessionLogRecord;
  xpAwarded: number;
  previousStage: import('../domain').EvolutionStageId;
  newStage: import('../domain').EvolutionStageId;
  evolved: boolean;
  previousMood: import('../domain').Mood;
  newMood: import('../domain').Mood;
  firstSessionOfDay: boolean;
  /** A freeze token was spent to cover a missed day on this log. */
  freezeUsed: boolean;
  /** A freeze token was earned by reaching a streak milestone on this log. */
  freezeEarned: boolean;
  /** Streak length after this log. */
  streakDays: number;
  /** Set when this log lands the streak on a celebration length. */
  streakMilestone: number | null;
};
