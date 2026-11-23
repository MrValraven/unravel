import {
  useEffect,
  useId,
  useRef,
  type FocusEvent,
  type ReactNode,
} from "react";
import type { Card } from "../../../content/types";
import { formatCopy, localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import type { TurnInfo } from "../engine/selectors";
import { getCardBadgeLabel, getTurnLine } from "./cardBadge";
import { CardFooterPreview } from "./CardFooterPreview";
import { getCardsBehind } from "./cardStack";
import { PlayCard } from "./PlayCard";
import { useCardGestures, type SwipeDirection } from "./useCardGestures";
import type { CardMotion } from "./usePlaySession";
import "./CardStage.scss";

/** A card next to the current one, as it will look once it is on top. */
export interface CardPreview {
  card: Card;
  turn: TurnInfo;
  /** Pass-the-phone: the card waits covered, so a drag never shows its text. */
  cover?: { name: string };
}

interface CardStageProps {
  card: Card;
  cardNumber: number;
  totalCards: number;
  turn: TurnInfo;
  isTableMode: boolean;
  motion: CardMotion;
  footer: ReactNode;
  /** Shown under the card while it is dragged right. Missing on the last card. */
  nextPreview?: CardPreview;
  /** Shown under the card while it is dragged left. Missing on the first card. */
  previousPreview?: CardPreview;
  onNext: () => void;
  onPrevious: () => void;
  /** Called when focus sat on a control inside the card that just left the screen. */
  onCardFocusLost: () => void;
  /**
   * Pass-the-phone: the card waits behind "Pass the phone to {name}" until revealed.
   * While covered, the announcement names the player instead of reading the card.
   */
  cover?: { name: string; onReveal: () => void };
}

/**
 * The current card on top of the cards still to come, with a live announcement.
 * Swipe right or tap the right third for the next card, swipe left for the previous one.
 */
export const CardStage = ({
  card,
  cardNumber,
  totalCards,
  turn,
  isTableMode,
  motion,
  footer,
  nextPreview,
  previousPreview,
  onNext,
  onPrevious,
  onCardFocusLost,
  cover,
}: CardStageProps) => {
  const playText = useCopy(playCopy);
  const copy = playText.card;
  const locale = useLocale();
  const gestures = useCardGestures({
    cardKey: card.id,
    canGoPrevious: cardNumber > 1,
    onNext,
    onPrevious,
    // A covered card opens on a tap anywhere and never turns unread.
    onTap: cover?.onReveal,
  });
  const announcementId = useId();
  const cardsBehind = getCardsBehind(cardNumber, totalCards);
  const badgeLabel = getCardBadgeLabel(card.type, copy);
  const turnLine = getTurnLine(card.type, turn, copy);
  const announcement = [
    formatCopy(copy.position, { current: cardNumber, total: totalCards }),
    badgeLabel,
    ...(cover
      ? [
          formatCopy(playText.cover.passTo, { name: cover.name }),
          playText.cover.reveal,
        ]
      : [turnLine, localize(card.text, locale)]),
  ]
    .filter(Boolean)
    .join(". ");

  // The card region takes focus when play begins, so screen readers read the first card.
  useEffect(() => {
    gestures.ref.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the game screen mounts
  }, []);

  // A focused star, share or timer button leaves with its card; focus then moves to Next.
  const focusedCardIdRef = useRef<string | null>(null);
  const onCardFocusLostRef = useRef(onCardFocusLost);
  useEffect(() => {
    onCardFocusLostRef.current = onCardFocusLost;
  });
  useEffect(() => {
    const focusedCardId = focusedCardIdRef.current;
    if (focusedCardId === null || focusedCardId === card.id) return;
    focusedCardIdRef.current = null;
    if (!gestures.ref.current?.contains(document.activeElement))
      onCardFocusLostRef.current();
  }, [card.id, gestures.ref]);

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget)
      focusedCardIdRef.current = card.id;
  };
  // A null relatedTarget may mean the focused button was removed with its card, so the mark stays.
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof Node &&
      !event.currentTarget.contains(nextTarget)
    ) {
      focusedCardIdRef.current = null;
    }
  };

  // The reveal button leaves with the cover, so focus moves to the card once the
  // cover is gone: the card region is then described by the card, not the cover.
  const isCovered = cover !== undefined;
  const coveredCardIdRef = useRef<string | null>(isCovered ? card.id : null);
  useEffect(() => {
    const wasThisCardCovered = coveredCardIdRef.current === card.id;
    coveredCardIdRef.current = isCovered ? card.id : null;
    if (wasThisCardCovered && !isCovered)
      gestures.ref.current?.focus({ preventScroll: true });
  }, [card.id, isCovered, gestures.ref]);

  const renderUnderlay = (side: SwipeDirection) => {
    const preview = side === "next" ? nextPreview : previousPreview;
    if (preview) {
      return (
        <div className="card-stage__underlay" aria-hidden="true" inert>
          <PlayCard
            key={preview.card.id}
            card={preview.card}
            turn={preview.turn}
            isTableMode={isTableMode}
            isPreview
            footer={<CardFooterPreview card={preview.card} />}
            cover={preview.cover}
          />
        </div>
      );
    }
    if (side === "previous") return null;
    return (
      <div
        className="card-stage__underlay card-stage__underlay--end"
        aria-hidden="true"
        inert
      >
        <p className="card-stage__end-line">{copy.lastCard}</p>
      </div>
    );
  };

  return (
    <div
      ref={gestures.stageRef}
      className="card-stage"
      data-cards-behind={cardsBehind}
    >
      {gestures.underlaySide && renderUnderlay(gestures.underlaySide)}
      <div
        ref={gestures.ref}
        className="card-stage__gesture"
        role="group"
        aria-label={copy.currentCard}
        // Focus on the region reads the card itself, as the live announcement does.
        aria-describedby={announcementId}
        tabIndex={-1}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...gestures.handlers}
      >
        <PlayCard
          key={card.id}
          card={card}
          turn={turn}
          isTableMode={isTableMode}
          motion={motion}
          footer={footer}
          cover={cover}
        />
      </div>
      <p id={announcementId} className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
};

export default CardStage;
