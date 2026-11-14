import type { CSSProperties } from "react";
import { Link } from "react-router";
import { FiArrowRight } from "react-icons/fi";
import { DeckIcon } from "../../components/DeckIcon";
import { getDailyCard } from "../../content/dailyCard";
import { formatCopy, localize } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useCopy } from "../../i18n/useCopy";
import { homeCopy } from "./copy";
import "./DailyCard.scss";

/** The same warm-up card for everyone today, drawn from the decks anyone can open. */
export const DailyCard = () => {
  const copy = useCopy(homeCopy).dailyCard;
  const locale = useLocale();
  const { card, deck } = getDailyCard();
  const deckTitle = localize(deck.title, locale);
  const accentStyle = { "--deck-accent": deck.accent } as CSSProperties;

  return (
    <section
      className="daily-card"
      style={accentStyle}
      aria-labelledby="daily-card-title"
    >
      <div className="daily-card__face">
        <div className="daily-card__header">
          <h2 id="daily-card-title" className="daily-card__eyebrow">
            {copy.eyebrow}
          </h2>
          <DeckIcon name={deck.icon} size={22} className="daily-card__icon" />
        </div>
        <blockquote className="daily-card__text">
          {localize(card.text, locale)}
        </blockquote>
        <div className="daily-card__footer">
          <p className="daily-card__deck">
            {formatCopy(copy.fromDeck, { deck: deckTitle })}
          </p>
          <Link
            to={`/play/${encodeURIComponent(deck.id)}`}
            className="button daily-card__play"
            aria-label={formatCopy(copy.playDeckLabel, { deck: deckTitle })}
          >
            {copy.playDeck}
            <FiArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};
