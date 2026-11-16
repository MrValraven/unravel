import { useRef, type CSSProperties } from "react";
import { Link } from "react-router";
import { FiArrowRight, FiInfo, FiPlay, FiSliders } from "react-icons/fi";
import { AgeGateDialog } from "../../../components/AgeGateDialog";
import { DeckIcon } from "../../../components/DeckIcon";
import { Dialog } from "../../../components/Dialog";
import type { Deck } from "../../../content/types";
import { formatCopy, localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../../play/copy";
import { flowCopy } from "../../play/flowCopy";
import { useOtherSavedGame } from "../../play/setup/useOtherSavedGame";
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

/**
 * Bottom sheet with a deck's length, level mix and a few sample cards. Start
 * goes straight into play with the last-used options; Game options is the
 * quiet way to change them first.
 */
export const DeckPreviewSheet = ({
  deck,
  isOpen,
  onClose,
  hasDeckPage,
}: DeckPreviewSheetProps) => {
  const copy = useCopy(deckCopy);
  const flow = useCopy(flowCopy).preview;
  const setupCopy = useCopy(playCopy).setup;
  const locale = useLocale();
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const { startDeck, openGameOptions, runAfterAgeGate, ageGateProps } =
    useDeckStart();
  // Starting replaces the one saved game, and no setup screen warns any more.
  const otherSavedGame = useOtherSavedGame(deck?.id ?? "");

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
            <div className="deck-preview__more">
              <button
                type="button"
                className="button button--quiet"
                disabled={!canStart}
                onClick={() => openGameOptions(deck)}
              >
                <FiSliders aria-hidden="true" size={18} />
                {flow.gameOptions}
              </button>
              {hasDeckPage && (
                <Link
                  to={`/decks/${encodeURIComponent(deck.id)}`}
                  viewTransition
                  className="button button--quiet"
                >
                  {copy.preview.openDeckPage}
                  <FiArrowRight aria-hidden="true" size={18} />
                </Link>
              )}
            </div>
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
          {canStart && otherSavedGame.kind === "saved" && (
            <p className="deck-preview__note">
              <FiInfo aria-hidden="true" size={18} />
              {otherSavedGame.deckTitle
                ? formatCopy(setupCopy.replacesSavedGame, {
                    deck: otherSavedGame.deckTitle,
                  })
                : setupCopy.replacesSavedGameUntitled}
            </p>
          )}
        </div>
      </Dialog>
      <AgeGateDialog {...ageGateProps} />
    </>
  );
};

export default DeckPreviewSheet;
