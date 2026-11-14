import type { PlayOptions } from "../../../storage/progress";

export interface PlaySession {
  deckId: string;
  /** Card ids in play order. Hidden cards are already removed. */
  order: string[];
  /** Index into `order` of the current card. Equals `order.length` when finished. */
  position: number;
  hiddenCardIds: string[];
  turnIndex: number;
  /**
   * 0 or 1: which of two named players answers first on the first card. The two
   * then swap who starts on every card. Ignored with any other player count.
   */
  firstStarterIndex: number;
  options: PlayOptions;
  startedAt: number;
  /** Card ids skipped once in this session. Session-only: it is not saved to storage. */
  skippedCardIds: string[];
}

export type PlayAction =
  | { type: "next" }
  | { type: "previous" }
  /** Moves the current card to the end of the order. A card skipped before is hidden instead. */
  | { type: "skip" }
  /** "Not tonight": removes the current card from the order for this session. */
  | { type: "hide" }
  /** 18+ Pass: same effect as hide. */
  | { type: "pass" }
  | { type: "restart"; order: string[] };
