export interface RandomTurn {
  askerIndex: number;
  answererIndex: number;
}

/** One mulberry32 step on `seed + step * golden ratio`: a 32-bit integer hash. */
const mix = (seed: number, step: number): number => {
  let state = (seed + Math.imul(step, 0x9e3779b9)) >>> 0;
  state = (state + 0x6d2b79f5) >>> 0;
  let mixed = Math.imul(state ^ (state >>> 15), state | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
  return (mixed ^ (mixed >>> 14)) >>> 0;
};

/**
 * Who answers when random turns are on, from a seed saved with the game, so Previous,
 * resume and restore all show the same player. Needs 3 or more players.
 *
 *   s(0) = mix(seed, 0) mod n
 *   s(k) = (s(k-1) + 1 + mix(seed, k) mod (n - 1)) mod n   (never equals s(k-1))
 *
 * The answerer of card `turnIndex` is s(turnIndex + 1) and the asker is s(turnIndex),
 * the previous card's answerer. Each step is computed from the start, which is cheap
 * for the few hundred cards a game holds.
 */
export function getRandomTurn(
  seed: number,
  turnIndex: number,
  playerCount: number
): RandomTurn {
  const lastStep = Math.max(turnIndex, 0) + 1;
  let current = mix(seed, 0) % playerCount;
  let previous = current;
  for (let step = 1; step <= lastStep; step += 1) {
    previous = current;
    current =
      (current + 1 + (mix(seed, step) % (playerCount - 1))) % playerCount;
  }
  return { askerIndex: previous, answererIndex: current };
}
