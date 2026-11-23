import type { CSSProperties, MouseEvent } from "react";
import { Link } from "react-router";
import { FiArrowRight } from "react-icons/fi";
import { DeckIcon } from "../../components/DeckIcon";
import { getDailyCard } from "../../content/dailyCard";
import { formatCopy, localize } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useCopy } from "../../i18n/useCopy";
import { useDeckStart } from "../decks/useDeckStart";
import { ReplaceSavedGameDialog } from "../play/setup/ReplaceSavedGameDialog";
import { homeCopy } from "./copy";
import "./DailyCard.scss";

/** The same warm-up card for everyone today, drawn from the decks anyone can open. */
export const DailyCard = ({ id }: { id?: string }) => {
  const copy = useCopy(homeCopy).dailyCard;
  const locale = useLocale();
  const { card, deck } = getDailyCard();
  const deckTitle = localize(deck.title, locale);
  const accentStyle = { "--deck-accent": deck.accent } as CSSProperties;
  const { startDeck, replaceDialogProps } = useDeckStart();

  // A plain click asks before replacing a saved game. Modified clicks keep the link's own behaviour.
  const handlePlayClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    startDeck(deck);
  };

  return (
    <section
      id={id}
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
            viewTransition
            onClick={handlePlayClick}
            aria-label={formatCopy(copy.playDeckLabel, { deck: deckTitle })}
          >
            {copy.playDeck}
            <FiArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </div>
      <ReplaceSavedGameDialog {...replaceDialogProps} />
    </section>
  );
};
