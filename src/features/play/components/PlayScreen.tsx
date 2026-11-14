import { useRef, useState, type CSSProperties } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
import { PageHeader } from "../../../components/PageHeader";
import type { Deck } from "../../../content/types";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import { playReducer } from "../engine/playReducer";
import { getCurrentCardId, getTurn } from "../engine/selectors";
import type { PlaySession } from "../engine/types";
import { CardFooterActions } from "./CardFooterActions";
import { CardStage, type CardPreview } from "./CardStage";
import { PlayControls } from "./PlayControls";
import { PlayMenu } from "./PlayMenu";
import { PlayToolbar } from "./PlayToolbar";
import { StatusToast } from "./StatusToast";
import { usePlayKeyboard } from "./usePlayKeyboard";
import { usePlaySession } from "./usePlaySession";
import { useShareCard } from "./useShareCard";
import "./PlayScreen.scss";

/** The card a step away, with the turn it would bring, or nothing at either end of the deck. */
const getNeighbourPreview = (
  deck: Deck,
  session: PlaySession,
  step: "next" | "previous"
): CardPreview | undefined => {
  const neighbourSession = playReducer(session, { type: step });
  if (neighbourSession === session) return undefined;
  const neighbourCardId = getCurrentCardId(neighbourSession);
  const card = deck.cards.find((deckCard) => deckCard.id === neighbourCardId);
  return card
    ? { card, turn: getTurn(neighbourSession, card.type) }
    : undefined;
};

interface PlayScreenProps {
  deck: Deck;
  initialSession: PlaySession;
}

/** The running game: header, progress, the card and its controls. */
export const PlayScreen = ({ deck, initialSession }: PlayScreenProps) => {
  const copy = useCopy(playCopy);
  const locale = useLocale();
  const play = usePlaySession(deck, initialSession);
  const share = useShareCard(deck);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  usePlayKeyboard({
    onNext: () => play.perform("next"),
    onPrevious: () => play.perform("previous"),
  });

  const { session, currentCard } = play;
  // No current card means the deck just finished and the end screen is on its way.
  if (!currentCard) return null;

  const cardNumber = session.position + 1;
  const totalCards = session.order.length;
  const isTableMode = session.options.isTableMode;
  const isGestureHintVisible = session.position === 0;

  return (
    <main
      className={`page play-screen${isTableMode ? " play-screen--table" : ""}`}
      style={{ "--deck-accent": deck.accent } as CSSProperties}
    >
      <PageHeader
        backTo="/decks"
        backLabel={copy.backToDecks}
        title={localize(deck.title, locale)}
        actions={
          <button
            type="button"
            className="icon-button"
            aria-label={copy.menu.open}
            aria-haspopup="dialog"
            onClick={() => setIsMenuOpen(true)}
          >
            <FiMoreHorizontal aria-hidden="true" size={24} />
          </button>
        }
      />
      <div className="play-screen__layout">
        <div className="play-screen__toolbar">
          <PlayToolbar
            cardNumber={cardNumber}
            totalCards={totalCards}
            progressFraction={cardNumber / totalCards}
          />
        </div>
        <div className="play-screen__stage">
          <CardStage
            card={currentCard}
            cardNumber={cardNumber}
            totalCards={totalCards}
            turn={getTurn(session, currentCard.type)}
            isTableMode={isTableMode}
            motion={play.motion}
            onNext={() => play.perform("next")}
            onPrevious={() => play.perform("previous")}
            onCardFocusLost={() => nextButtonRef.current?.focus()}
            nextPreview={getNeighbourPreview(deck, session, "next")}
            previousPreview={getNeighbourPreview(deck, session, "previous")}
            footer={
              <CardFooterActions
                card={currentCard}
                isSharing={share.isSharing}
                onShare={(card) => void share.shareCard(card)}
                onFavouriteAdded={play.noteFavouriteAdded}
              />
            }
          />
        </div>
        <div className="play-screen__controls">
          <PlayControls
            isFirstCard={session.position === 0}
            isLastCard={cardNumber === totalCards}
            isAdult={deck.isAdult}
            nextButtonRef={nextButtonRef}
            onAction={play.perform}
          />
          <p
            className="play-screen__hint"
            data-visible={isGestureHintVisible}
            aria-hidden={!isGestureHintVisible || undefined}
          >
            {copy.controls.gestureHint}
          </p>
        </div>
      </div>
      <PlayMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onRestart={play.restart}
      />
      <StatusToast message={share.statusMessage} />
    </main>
  );
};

export default PlayScreen;
