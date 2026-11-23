import { FiShare2, FiStar } from "react-icons/fi";
import { allowsTimer } from "../../../content/cardRules";
import type { Card } from "../../../content/types";
import { useHaptics } from "../../../hooks/useHaptics";
import { useCopy } from "../../../i18n/useCopy";
import { toggleFavourite, useFavouriteIds } from "../../../storage/favourites";
import { playCopy } from "../copy";
import { canFavouriteCard } from "../playSession";
import { CountdownTimer } from "./CountdownTimer";
import { VoteCountdown } from "./VoteCountdown";

interface CardFooterActionsProps {
  card: Card;
  isSharing: boolean;
  onShare: (card: Card) => void;
  onFavouriteAdded: (cardId: string) => void;
}

/** Challenge or hot-seat timer (or the vote count) on the left; favourite star and share on the right. */
export const CardFooterActions = ({
  card,
  isSharing,
  onShare,
  onFavouriteAdded,
}: CardFooterActionsProps) => {
  const copy = useCopy(playCopy).card;
  const haptics = useHaptics();
  const favouriteIds = useFavouriteIds();
  const isFavourite = favouriteIds.includes(card.id);
  const hasTimer =
    allowsTimer(card.type) &&
    card.timerSeconds !== undefined &&
    card.timerSeconds > 0;

  const handleFavourite = () => {
    if (!isFavourite) onFavouriteAdded(card.id);
    toggleFavourite(card.id);
    haptics.tap();
  };

  return (
    <>
      {card.type === "vote" ? (
        <VoteCountdown />
      ) : hasTimer ? (
        <CountdownTimer
          totalSeconds={card.timerSeconds ?? 0}
          onFinish={haptics.success}
        />
      ) : (
        <span aria-hidden="true" />
      )}
      <div className="play-card__actions">
        {canFavouriteCard(card.id) && (
          <button
            type="button"
            className="icon-button play-card__action"
            aria-label={copy.saveFavourite}
            aria-pressed={isFavourite}
            onClick={handleFavourite}
          >
            <FiStar
              aria-hidden="true"
              size={22}
              fill={isFavourite ? "currentColor" : "none"}
              className={isFavourite ? "play-card__star--on" : undefined}
            />
          </button>
        )}
        <button
          type="button"
          className="icon-button play-card__action"
          aria-label={copy.shareCard}
          aria-busy={isSharing || undefined}
          aria-disabled={isSharing || undefined}
          onClick={() => {
            if (!isSharing) onShare(card);
          }}
        >
          <FiShare2 aria-hidden="true" size={22} />
        </button>
      </div>
    </>
  );
};

export default CardFooterActions;
