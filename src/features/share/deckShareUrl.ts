import { getBuiltinDeck } from "../../content/decks";

/**
 * The link a share carries: a built-in deck's own page, else the home page. Favourites
 * and custom decks live only on this device, so they have no page to link to.
 */
export const buildDeckShareUrl = (deckId: string, origin: string): string =>
  getBuiltinDeck(deckId)
    ? `${origin}/decks/${encodeURIComponent(deckId)}`
    : `${origin}/`;
