import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FiMoreHorizontal } from "react-icons/fi";
import { PageHeader } from "../../../components/PageHeader";
import type { Card, Deck } from "../../../content/types";
import { useTintedThemeColor } from "../../../hooks/useThemeColor";
import { useWakeLock } from "../../../hooks/useWakeLock";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import {
  hasSeenCoachMark,
  markCoachMarkSeen,
} from "../../../storage/coachMarks";
import { playCopy } from "../copy";
import { playReducer } from "../engine/playReducer";
import {
  getCurrentCardId,
  getPassThePhoneName,
  getTurn,
} from "../engine/selectors";
import type { PlaySession } from "../engine/types";
import {
  getRevealedCards,
  markCardRevealed,
  toGameKey,
  toRevealKey,
} from "../revealedCards";
import { CardFooterActions } from "./CardFooterActions";
import { CardStage, type CardPreview } from "./CardStage";
import { PlayControls } from "./PlayControls";
import { PlayMenu } from "./PlayMenu";
import { PlayToolbar } from "./PlayToolbar";
import { StatusToast } from "./StatusToast";
import { useLevelUpNotice } from "./useLevelUpNotice";
import { usePlayKeyboard } from "./usePlayKeyboard";
import { usePlaySession } from "./usePlaySession";
import { useShareCard } from "./useShareCard";
import "./PlayScreen.scss";

/** The how-to line shows on this many cards of the player's first game. */
const HINT_CARDS = 3;
/** How much of the deck tone tints the browser chrome during play. */
const CHROME_TINT = 0.16;

/**
 * Pass-the-phone: the player a card is covered for, or nothing once that player has
 * revealed it. A skipped card that comes back to someone else is covered again.
 */
const getCoverName = (
  session: PlaySession,
  card: Card,
  revealedCards: ReadonlySet<string>
): string | undefined => {
  const name = getPassThePhoneName(session, card.type);
  return name === undefined || revealedCards.has(toRevealKey(card.id, name))
    ? undefined
    : name;
};

/**
 * The card a step away, with the turn it would bring, or nothing at either end of the deck.
 * A card still to be revealed comes covered, so dragging never shows its text.
 */
const getNeighbourPreview = (
  deck: Deck,
  session: PlaySession,
  step: "next" | "previous",
  revealedCards: ReadonlySet<string>
): CardPreview | undefined => {
  const neighbourSession = playReducer(session, { type: step });
  if (neighbourSession === session) return undefined;
  const neighbourCardId = getCurrentCardId(neighbourSession);
  const card = deck.cards.find((deckCard) => deckCard.id === neighbourCardId);
  if (!card) return undefined;
  const coverName = getCoverName(neighbourSession, card, revealedCards);
  return {
    card,
    turn: getTurn(neighbourSession, card.type),
    cover: coverName === undefined ? undefined : { name: coverName },
  };
};

interface PlayScreenProps {
  deck: Deck;
  initialSession: PlaySession;
}

/** The running game: header, progress, the card and its controls. */
export const PlayScreen = ({ deck, initialSession }: PlayScreenProps) => {
  const copy = useCopy(playCopy);
  const locale = useLocale();
  const levelUp = useLevelUpNotice();
  const play = usePlaySession(deck, initialSession, {
    onLevelUp: levelUp.show,
  });
  const share = useShareCard(deck);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  usePlayKeyboard({
    onNext: () => play.perform("next"),
    onPrevious: () => play.perform("previous"),
  });
  useWakeLock();
  useTintedThemeColor(deck.accent, CHROME_TINT);

  // Only the first game ever explains the swipe (or the keys), on its first few cards.
  const [isHintForThisGame] = useState(
    () => !hasSeenCoachMark("playGestureHint")
  );
  const [hasHintLeft, setHasHintLeft] = useState(false);
  const { session, currentCard } = play;
  const gameKey = toGameKey(session);
  // Read again on each reveal, and when a restart starts a new game with its cards covered.
  const [revealed, setRevealed] = useState(() => ({
    gameKey,
    keys: getRevealedCards(gameKey),
  }));
  const revealedCards =
    revealed.gameKey === gameKey ? revealed.keys : getRevealedCards(gameKey);
  const revealCard = (cardId: string, name: string) => {
    markCardRevealed(gameKey, cardId, name);
    setRevealed({ gameKey, keys: getRevealedCards(gameKey) });
  };
  const isHintVisible = isHintForThisGame && session.position < HINT_CARDS;
  const hasSeenHintEnough = session.position >= HINT_CARDS - 1;
  useEffect(() => {
    if (isHintForThisGame && hasSeenHintEnough)
      markCoachMarkSeen("playGestureHint");
  }, [isHintForThisGame, hasSeenHintEnough]);

  // No current card means the deck just finished and the end screen is on its way.
  if (!currentCard) return null;

  const cardNumber = session.position + 1;
  const totalCards = session.order.length;
  const isTableMode = session.options.isTableMode;
  const coverName = getCoverName(session, currentCard, revealedCards);

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
            nextPreview={getNeighbourPreview(
              deck,
              session,
              "next",
              revealedCards
            )}
            previousPreview={getNeighbourPreview(
              deck,
              session,
              "previous",
              revealedCards
            )}
            cover={
              coverName === undefined
                ? undefined
                : {
                    name: coverName,
                    onReveal: () => revealCard(currentCard.id, coverName),
                  }
            }
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
          {isHintForThisGame && !hasHintLeft && (
            <p
              className="play-screen__hint"
              data-visible={isHintVisible}
              aria-hidden={!isHintVisible || undefined}
              onTransitionEnd={(event) => {
                if (event.target === event.currentTarget && !isHintVisible)
                  setHasHintLeft(true);
              }}
            >
              <span className="play-screen__hint-touch">
                {copy.controls.gestureHint}
              </span>
              <span className="play-screen__hint-keys">
                {copy.controls.keyboardHint}
              </span>
            </p>
          )}
        </div>
      </div>
      <PlayMenu
        deckId={deck.id}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onRestart={play.restart}
      />
      <StatusToast message={share.statusMessage ?? levelUp.message} />
    </main>
  );
};

export default PlayScreen;
