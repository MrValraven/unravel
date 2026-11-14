import { useMemo } from "react";
import { resolveDeck } from "../content/resolveDeck";
import type { Deck } from "../content/types";
import { restoreSession } from "../features/play/playSession";
import { useCustomDecks } from "../storage/customDecks";
import { useFavouriteIds } from "../storage/favourites";
import { useProgress } from "../storage/progress";

export interface ResumableGame {
  deck: Deck;
  /** 1-based number of the card the game stopped on. */
  currentCardNumber: number;
  totalCardCount: number;
}

/**
 * The saved game as the play screen would restore it today, so the numbers
 * match what Continue opens. Undefined when there is nothing left to continue.
 */
export const useResumableGame = (): ResumableGame | undefined => {
  const progress = useProgress();
  const favouriteIds = useFavouriteIds();
  const customDecks = useCustomDecks();

  return useMemo(() => {
    if (!progress) return undefined;
    const deck = resolveDeck(progress.deckId, { favouriteIds, customDecks });
    if (!deck) return undefined;
    const session = restoreSession(deck, progress);
    if (!session) return undefined;
    return {
      deck,
      currentCardNumber: session.position + 1,
      totalCardCount: session.order.length,
    };
  }, [progress, favouriteIds, customDecks]);
};
