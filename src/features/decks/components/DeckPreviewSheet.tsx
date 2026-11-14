import { useRef, type CSSProperties } from "react";
import { Link } from "react-router";
import { FiExternalLink, FiPlay } from "react-icons/fi";
import { AgeGateDialog } from "../../../components/AgeGateDialog";
import { DeckIcon } from "../../../components/DeckIcon";
import { Dialog } from "../../../components/Dialog";
import type { Deck } from "../../../content/types";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { deckCopy } from "../copy";
import { useDeckStart } from "../useDeckStart";
import { DeckBadges } from "./DeckBadges";
import { LevelBreakdown } from "./LevelBreakdown";
import { SampleCards } from "./SampleCards";
import "./DeckPreviewSheet.scss";

const PREVIEW_SAMPLE_COUNT = 3;

interface DeckPreviewSheetProps {
  /** The last previewed deck stays set while the sheet animates out. */
  deck: Deck | null;
  isOpen: boolean;
  onClose: () => void;
  /** Builtin decks have a standalone page; favourites and custom decks do not. */
  hasDeckPage: boolean;
}

/** Bottom sheet with a deck's length, level mix and a few sample cards before starting. */
export const DeckPreviewSheet = ({
  deck,
  isOpen,
  onClose,
  hasDeckPage,
}: DeckPreviewSheetProps) => {
  const copy = useCopy(deckCopy);
  const locale = useLocale();
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const { startDeck, runAfterAgeGate, ageGateProps } = useDeckStart();

  if (!deck) return null;

  const accentStyle = { "--deck-accent": deck.accent } as CSSProperties;
  const canStart = deck.cards.length > 0;

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        variant="sheet"
        title={localize(deck.title, locale)}
        description={localize(deck.description, locale)}
        initialFocusRef={canStart ? startButtonRef : undefined}
        footer={
          <>
            {hasDeckPage && (
              <Link
                to={`/decks/${encodeURIComponent(deck.id)}`}
                className="button button--secondary"
              >
                <FiExternalLink aria-hidden="true" size={18} />
                {copy.preview.openDeckPage}
              </Link>
            )}
            <button
              ref={startButtonRef}
              type="button"
              className="button button--primary"
              disabled={!canStart}
              onClick={() => startDeck(deck)}
            >
              <FiPlay aria-hidden="true" size={18} />
              {copy.preview.startDeck}
            </button>
          </>
        }
      >
        <div className="deck-preview" style={accentStyle}>
          <div className="deck-preview__identity">
            <span className="deck-preview__icon" aria-hidden="true">
              <DeckIcon name={deck.icon} size={24} />
            </span>
            <DeckBadges deck={deck} cardCount={deck.cards.length} />
          </div>
          <LevelBreakdown cards={deck.cards} />
          <SampleCards
            deck={deck}
            sampleCount={PREVIEW_SAMPLE_COUNT}
            onRevealRequest={() => runAfterAgeGate(deck, () => undefined)}
          />
        </div>
      </Dialog>
      <AgeGateDialog {...ageGateProps} />
    </>
  );
};

export default DeckPreviewSheet;
