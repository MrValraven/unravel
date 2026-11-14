import { useId, useState, type Dispatch, type RefObject } from "react";
import { FiPlus } from "react-icons/fi";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { CardEditorRow } from "./CardEditorRow";
import { FieldProblem } from "./FieldMeta";
import { customCopy } from "./copy";
import { MAX_CARDS, type TextProblem } from "./deckRules";
import {
  createDraftCard,
  type DraftAction,
  type DraftCard,
  type MoveDirection,
} from "./editorModel";
import type { FocusRequest } from "./useEditorFocus";

interface CardListEditorProps {
  cards: DraftCard[];
  /** Problems to show, by card key (empty until the player tries to save). */
  cardProblems: Record<string, TextProblem>;
  /** Deck-level problem message to show, if any. */
  deckProblemMessage?: string;
  dispatch: Dispatch<DraftAction>;
  requestFocus: (request: FocusRequest) => void;
  cardListRef: RefObject<HTMLOListElement | null>;
  addCardButtonRef: RefObject<HTMLButtonElement | null>;
}

export const CardListEditor = ({
  cards,
  cardProblems,
  deckProblemMessage,
  dispatch,
  requestFocus,
  cardListRef,
  addCardButtonRef,
}: CardListEditorProps) => {
  const editorCopy = useCopy(customCopy).editor;
  const headingId = useId();
  const deckProblemId = useId();
  const cardLimitNoteId = useId();
  const isAtCardLimit = cards.length >= MAX_CARDS;
  // Cards on screen when the editor opened appear without the enter animation.
  const [openingCardKeys] = useState(
    () => new Set(cards.map((card) => card.key))
  );

  const addCard = () => {
    if (isAtCardLimit) return;
    const card = createDraftCard();
    dispatch({ type: "add-card", card });
    requestFocus({ cardKey: card.key, target: "text" });
  };

  const moveCard = (key: string, direction: MoveDirection) => {
    const fromIndex = cards.findIndex((card) => card.key === key);
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    dispatch({ type: "move-card", key, direction });
    // Stay on the same arrow unless the card reached the end where that arrow is disabled.
    let target: "move-up" | "move-down" =
      direction === "up" ? "move-up" : "move-down";
    if (toIndex === 0) target = "move-down";
    if (toIndex === cards.length - 1) target = "move-up";
    requestFocus({ cardKey: key, target });
  };

  const deleteCard = (key: string) => {
    const cardIndex = cards.findIndex((card) => card.key === key);
    const neighbour = cards[cardIndex + 1] ?? cards[cardIndex - 1];
    dispatch({ type: "delete-card", key });
    requestFocus(
      neighbour ? { cardKey: neighbour.key, target: "text" } : "add-card"
    );
  };

  return (
    <section className="deck-editor__cards" aria-labelledby={headingId}>
      <div className="deck-editor__cards-header">
        <h2 id={headingId} className="deck-editor__cards-title">
          {editorCopy.cardsHeading}
        </h2>
        <span className="deck-editor__card-count">
          {formatCopy(editorCopy.cardCountOfMax, {
            count: cards.length,
            max: MAX_CARDS,
          })}
        </span>
      </div>
      <ol ref={cardListRef} className="deck-editor__card-list" role="list">
        {cards.map((card, cardIndex) => (
          <CardEditorRow
            key={card.key}
            card={card}
            cardNumber={cardIndex + 1}
            isFirst={cardIndex === 0}
            isLast={cardIndex === cards.length - 1}
            isNew={!openingCardKeys.has(card.key)}
            problem={cardProblems[card.key]}
            onTextChange={(cardKey, text) =>
              dispatch({ type: "set-card-text", key: cardKey, text })
            }
            onTypeChange={(cardKey, cardType) =>
              dispatch({ type: "set-card-type", key: cardKey, cardType })
            }
            onMove={moveCard}
            onDelete={deleteCard}
          />
        ))}
      </ol>
      {deckProblemMessage && (
        <FieldProblem id={deckProblemId} message={deckProblemMessage} />
      )}
      <button
        ref={addCardButtonRef}
        type="button"
        className="deck-editor__add"
        aria-disabled={isAtCardLimit ? true : undefined}
        aria-describedby={
          [
            deckProblemMessage && deckProblemId,
            isAtCardLimit && cardLimitNoteId,
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onClick={addCard}
      >
        <span className="deck-editor__add-icon" aria-hidden="true">
          <FiPlus size={18} />
        </span>
        {editorCopy.addCard}
      </button>
      {isAtCardLimit && (
        <p id={cardLimitNoteId} className="deck-editor__limit-note">
          {formatCopy(editorCopy.cardLimit, { max: MAX_CARDS })}
        </p>
      )}
    </section>
  );
};

export default CardListEditor;
