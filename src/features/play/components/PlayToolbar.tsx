import { formatCopy } from "../../../i18n/localize";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import "./PlayToolbar.scss";

interface PlayToolbarProps {
  cardNumber: number;
  totalCards: number;
  progressFraction: number;
}

/** Where you are in the deck. Text size lives in the game menu. */
export const PlayToolbar = ({
  cardNumber,
  totalCards,
  progressFraction,
}: PlayToolbarProps) => {
  const copy = useCopy(playCopy);

  return (
    <div className="play-toolbar">
      <div className="play-toolbar__progress">
        <p className="play-toolbar__position">
          {formatCopy(copy.card.position, {
            current: cardNumber,
            total: totalCards,
          })}
        </p>
        <div className="play-toolbar__track" aria-hidden="true">
          <span
            className="play-toolbar__fill"
            style={{ transform: `scaleX(${progressFraction})` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayToolbar;
