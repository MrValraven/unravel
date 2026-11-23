/**
 * Router state that says the player already agreed to replace the saved game,
 * so the play page does not ask a second time. The deck pages write it and the
 * play page reads it.
 */
export const REPLACE_CONFIRMED_STATE = { isReplaceConfirmed: true } as const;

export const isReplaceConfirmed = (state: unknown): boolean =>
  typeof state === "object" &&
  state !== null &&
  "isReplaceConfirmed" in state &&
  state.isReplaceConfirmed === true;
