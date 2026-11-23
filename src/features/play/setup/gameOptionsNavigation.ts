/**
 * Router state the play menu's Game options link writes on the ?setup=1 entry it
 * pushes on top of the running game. Leaving Game options then pops that entry,
 * so history returns to the game's own entry instead of stacking a second one
 * for the same card. A ?setup=1 reached any other way carries no such state.
 */
export const OPENED_FROM_GAME_STATE = { isOpenedFromGame: true } as const;

export const isOpenedFromGame = (state: unknown): boolean =>
  typeof state === "object" &&
  state !== null &&
  "isOpenedFromGame" in state &&
  state.isOpenedFromGame === true;
