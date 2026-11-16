/** At or under this many cards still to come, the stack shows one card underneath. */
export const NEAR_END_CARDS = 3;

/** How many cards peek out under the current one: two, one near the end, none on the last card. */
export const getCardsBehind = (
  cardNumber: number,
  totalCards: number
): 0 | 1 | 2 => {
  const cardsLeft = totalCards - cardNumber;
  if (cardsLeft <= 0) return 0;
  return cardsLeft <= NEAR_END_CARDS ? 1 : 2;
};
