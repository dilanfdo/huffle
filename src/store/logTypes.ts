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
};
