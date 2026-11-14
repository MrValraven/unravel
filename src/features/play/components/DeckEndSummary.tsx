import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import type { DeckEndState } from "../deckEnd";
import "./DeckEndSummary.scss";

const MILLISECONDS_PER_MINUTE = 60_000;

/** Cards played, minutes and favourites saved in the game that just ended. */
export const DeckEndSummary = ({ endState }: { endState: DeckEndState }) => {
  const copy = useCopy(playCopy).end;
  const minutes = Math.round(
    endState.millisecondsPlayed / MILLISECONDS_PER_MINUTE
  );

  const items = [
    {
      key: "cards",
      value: String(endState.cardsPlayed),
      label:
        endState.cardsPlayed === 1
          ? copy.cardsPlayed.one
          : copy.cardsPlayed.other,
    },
    minutes < 1
      ? { key: "minutes", value: "", label: copy.underAMinute }
      : {
          key: "minutes",
          value: String(minutes),
          label:
            minutes === 1 ? copy.minutesPlayed.one : copy.minutesPlayed.other,
        },
    // A zero tile reads like a missed task, so it only shows once a card was starred.
    endState.favouritesSavedCount > 0 && {
      key: "favourites",
      value: String(endState.favouritesSavedCount),
      label:
        endState.favouritesSavedCount === 1
          ? copy.favouritesSaved.one
          : copy.favouritesSaved.other,
    },
  ].filter((item) => item !== false);

  return (
    <ul className="deck-end-summary" aria-label={copy.statsLabel}>
      {items.map((item) => (
        <li key={item.key} className="deck-end-summary__item">
          {item.value && (
            <span className="deck-end-summary__number">{item.value} </span>
          )}
          <span className="deck-end-summary__label">{item.label}</span>
        </li>
      ))}
    </ul>
  );
};

export default DeckEndSummary;
