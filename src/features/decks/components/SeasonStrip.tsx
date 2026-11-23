import { useId } from "react";
import { Link } from "react-router";
import { FiArrowRight, FiCalendar } from "react-icons/fi";
import { getInSeasonDecks, getNextSeasonalDeck } from "../../../content/decks";
import type { Deck } from "../../../content/types";
import { formatCopy, localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { deckCopy } from "../copy";
import { formatSeasonStart } from "../seasonLabel";
import { DeckCard } from "./DeckCard";
import "./SeasonStrip.scss";

interface SeasonStripProps {
  /** Pins the date; defaults to now. */
  today?: Date;
  /** Opens the deck preview. Without it, tiles link to the deck page. */
  onSelectDeck?: (deck: Deck) => void;
}

/**
 * Decks in season right now as deck tiles, or, when none are, one line naming
 * the next seasonal deck and the day it starts. Seasonal decks also stay in
 * their own category below.
 */
export const SeasonStrip = ({ today, onSelectDeck }: SeasonStripProps) => {
  const copy = useCopy(deckCopy).season;
  const locale = useLocale();
  const headingId = useId();
  const now = today ?? new Date();
  const inSeasonDecks = getInSeasonDecks(now);

  if (inSeasonDecks.length > 0) {
    return (
      <section className="season-strip" aria-labelledby={headingId}>
        <h2 id={headingId} className="season-strip__title">
          {copy.inSeasonTitle}
        </h2>
        <ul className="season-strip__list" role="list">
          {inSeasonDecks.map((deck) => (
            <li key={deck.id}>
              {onSelectDeck ? (
                <DeckCard deck={deck} onSelect={onSelectDeck} />
              ) : (
                <DeckCard deck={deck} to={`/decks/${deck.id}`} />
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const next = getNextSeasonalDeck(now);
  if (next === undefined || next.deck.season === undefined) return null;

  return (
    <Link
      to={`/decks/${next.deck.id}`}
      viewTransition
      className="season-strip__coming-up"
    >
      <FiCalendar aria-hidden="true" size={20} />
      <span className="season-strip__coming-up-text">
        {formatCopy(copy.comingUp, {
          deck: localize(next.deck.title, locale),
          date: formatSeasonStart(next.deck.season, locale),
        })}
      </span>
      <FiArrowRight aria-hidden="true" size={18} />
    </Link>
  );
};

export default SeasonStrip;
