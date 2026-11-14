import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { FiGrid, FiRotateCcw } from "react-icons/fi";
import { AgeGateDialog } from "../../../components/AgeGateDialog";
import type { Deck } from "../../../content/types";
import { useCopy } from "../../../i18n/useCopy";
import { DeckPreviewSheet } from "../../decks/components/DeckPreviewSheet";
import { useDeckStart } from "../../decks/useDeckStart";
import { finderCopy } from "../copy";
import { FinderSuggestion } from "./FinderSuggestion";
import "./FinderResults.scss";

interface FinderResultsProps {
  suggestions: Deck[];
  onStartOver: () => void;
}

/** Up to three ranked decks, each with Start and Preview, plus a way to answer again. */
export const FinderResults = ({
  suggestions,
  onStartOver,
}: FinderResultsProps) => {
  const copy = useCopy(finderCopy).results;
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { startDeck, ageGateProps } = useDeckStart();
  const [previewDeck, setPreviewDeck] = useState<Deck | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const hasSuggestions = suggestions.length > 0;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const openPreview = (deck: Deck) => {
    setPreviewDeck(deck);
    setIsPreviewOpen(true);
  };

  return (
    <section className="finder-results" aria-labelledby={headingId}>
      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="finder-results__title"
      >
        {hasSuggestions ? copy.title : copy.emptyTitle}
      </h2>
      <p className="finder-results__intro">
        {hasSuggestions ? copy.intro : copy.emptyBody}
      </p>
      {hasSuggestions && (
        <ol className="finder-results__list" role="list">
          {suggestions.map((deck) => (
            <li key={deck.id}>
              <FinderSuggestion
                deck={deck}
                onStart={startDeck}
                onPreview={openPreview}
              />
            </li>
          ))}
        </ol>
      )}
      <div className="finder-results__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={onStartOver}
        >
          <FiRotateCcw aria-hidden="true" size={18} />
          {copy.startOver}
        </button>
        <Link to="/decks" className="button button--quiet">
          <FiGrid aria-hidden="true" size={18} />
          {copy.browseDecks}
        </Link>
      </div>
      <DeckPreviewSheet
        deck={previewDeck}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        hasDeckPage
      />
      <AgeGateDialog {...ageGateProps} />
    </section>
  );
};

export default FinderResults;
