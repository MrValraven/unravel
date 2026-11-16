import { useId, useState } from "react";
import { useNavigate } from "react-router";
import { FiPlay, FiPlus } from "react-icons/fi";
import { PageHeader } from "../../components/PageHeader";
import { formatCopy, pluralize } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import {
  MAX_CUSTOM_DECKS,
  canCreateCustomDeck,
  createCustomDeckId,
  saveCustomDeck,
  useCustomDecks,
} from "../../storage/customDecks";
import { StatusMessage } from "./StatusMessage";
import type { SharedDeck } from "./codec";
import { customCopy } from "./copy";
import { numberCustomCards } from "./deckRules";
import { createSavedDeckState } from "./navigationState";
import { useStatusMessage } from "./useStatusMessage";
import "./ImportedDeckPreview.scss";

/** The decoded deck from a share link, with the two ways to keep it. */
export const ImportedDeckPreview = ({ deck }: { deck: SharedDeck }) => {
  const copy = useCopy(customCopy);
  const importerCopy = copy.importer;
  const navigate = useNavigate();
  const limitNoteId = useId();
  const [hasSaved, setHasSaved] = useState(false);
  const { notice, showStatus, dismissStatus } = useStatusMessage();
  useCustomDecks();
  // Read after subscribing above, so deleting a deck in another tab frees the buttons.
  const canCreate = canCreateCustomDeck();
  const limitReason = formatCopy(copy.deckLimit, { max: MAX_CUSTOM_DECKS });

  /** Every save makes a new deck with a fresh id, so importing twice gives two decks. */
  const saveDeck = (shouldPlay: boolean) => {
    if (hasSaved) return;
    if (!canCreateCustomDeck()) {
      showStatus(limitReason);
      return;
    }
    setHasSaved(true);
    const deckId = createCustomDeckId();
    const now = Date.now();
    saveCustomDeck({
      id: deckId,
      title: deck.title,
      cards: numberCustomCards(deckId, deck.cards),
      createdAt: now,
      updatedAt: now,
    });
    // Replace the import entry so Back never lands on this page and offers a second save.
    if (shouldPlay)
      void navigate(`/play/${encodeURIComponent(deckId)}`, {
        replace: true,
        viewTransition: true,
      });
    else
      void navigate("/custom", {
        replace: true,
        state: createSavedDeckState(deck.title),
        viewTransition: true,
      });
  };

  const isBlocked = !canCreate && !hasSaved;
  const blockedProps = isBlocked
    ? ({ "aria-disabled": true, "aria-describedby": limitNoteId } as const)
    : {};

  return (
    <div className="page imported-deck">
      <PageHeader
        backTo="/custom"
        backLabel={importerCopy.backLabel}
        title={importerCopy.title}
      />
      <main className="imported-deck__main">
        <section className="imported-deck__summary">
          <p className="imported-deck__eyebrow">{importerCopy.sharedWithYou}</p>
          <h2 className="imported-deck__title">{deck.title}</h2>
          <p className="imported-deck__count">
            {pluralize(deck.cards.length, copy.cardCount)}
          </p>
          <div className="imported-deck__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => saveDeck(true)}
              {...blockedProps}
            >
              <FiPlay aria-hidden="true" size={18} />
              {importerCopy.saveAndPlay}
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => saveDeck(false)}
              {...blockedProps}
            >
              <FiPlus aria-hidden="true" size={18} />
              {importerCopy.saveToDecks}
            </button>
          </div>
          {isBlocked && (
            <p id={limitNoteId} className="imported-deck__limit-note">
              {limitReason}
            </p>
          )}
          <p className="imported-deck__note">{importerCopy.privacyNote}</p>
        </section>

        <ol
          className="imported-deck__cards"
          role="list"
          aria-label={importerCopy.cardListLabel}
        >
          {deck.cards.map((card, cardIndex) => (
            <li
              key={`${cardIndex}-${card.type}`}
              className="imported-deck__card"
            >
              <span className="imported-deck__card-type">
                {copy.cardTypes[card.type]}
              </span>
              <p className="imported-deck__card-text">{card.text}</p>
            </li>
          ))}
        </ol>
      </main>
      <StatusMessage notice={notice} onDismissed={dismissStatus} />
    </div>
  );
};

export default ImportedDeckPreview;
