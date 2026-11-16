import { useId, useMemo } from "react";
import { getVisibleDecks } from "../../../content/decks";
import type { Deck } from "../../../content/types";
import { useCopy } from "../../../i18n/useCopy";
import { deckCopy } from "../copy";
import { getRelatedDecks } from "../deckSummary";
import { DeckCard } from "./DeckCard";
import "./RelatedDecks.scss";

const RELATED_DECK_COUNT = 4;

/** Up to four decks in season that share the category or an audience, each linking to its own page. */
export const RelatedDecks = ({ deck }: { deck: Deck }) => {
  const copy = useCopy(deckCopy).landing;
  const headingId = useId();
  const relatedDecks = useMemo(
    () => getRelatedDecks(deck, getVisibleDecks(), RELATED_DECK_COUNT),
    [deck]
  );

  if (relatedDecks.length === 0) return null;

  return (
    <section className="related-decks" aria-labelledby={headingId}>
      <h2 id={headingId} className="related-decks__title">
        {copy.relatedTitle}
      </h2>
      <ul className="related-decks__list" role="list">
        {relatedDecks.map((relatedDeck) => (
          <li key={relatedDeck.id}>
            <DeckCard deck={relatedDeck} to={`/decks/${relatedDeck.id}`} />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RelatedDecks;
