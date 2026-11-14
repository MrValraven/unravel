import { FiPlay, FiShare2, FiStar } from "react-icons/fi";
import type { Card } from "../../../content/types";
import { useCopy } from "../../../i18n/useCopy";
import { useFavouriteIds } from "../../../storage/favourites";
import { playCopy } from "../copy";
import { canFavouriteCard } from "../playSession";
import { formatClock } from "./useCountdown";
import "./CountdownTimer.scss";

interface CardFooterPreviewProps {
  card: Card;
}

/**
 * A still picture of CardFooterActions for the card waiting under the one being
 * dragged. Same classes and sizes, so the card keeps its layout when it becomes
 * the current card, with no timer running and nothing to focus.
 */
export const CardFooterPreview = ({ card }: CardFooterPreviewProps) => {
  const timerCopy = useCopy(playCopy).timer;
  const favouriteIds = useFavouriteIds();
  const isFavourite = favouriteIds.includes(card.id);
  const timerSeconds = card.type === "challenge" ? (card.timerSeconds ?? 0) : 0;

  return (
    <>
      {timerSeconds > 0 ? (
        <div className="countdown">
          <div className="countdown__ring">
            <svg viewBox="0 0 48 48">
              <circle className="countdown__track" cx="24" cy="24" r="21" />
              <circle className="countdown__progress" cx="24" cy="24" r="21" />
            </svg>
            <span className="countdown__clock">
              {formatClock(timerSeconds)}
            </span>
          </div>
          <span className="countdown__button">
            <FiPlay size={18} />
            <span>{timerCopy.start}</span>
          </span>
        </div>
      ) : (
        <span />
      )}
      <div className="play-card__actions">
        {canFavouriteCard(card.id) && (
          <span className="icon-button play-card__action">
            <FiStar size={22} fill={isFavourite ? "currentColor" : "none"} />
          </span>
        )}
        <span className="icon-button play-card__action">
          <FiShare2 size={22} />
        </span>
      </div>
    </>
  );
};

export default CardFooterPreview;
