import type { CSSProperties } from "react";
import { DeckIcon } from "../../components/DeckIcon";
import { getBuiltinDeck } from "../../content/decks";
import type { Card, Deck } from "../../content/types";
import { localize } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useCopy } from "../../i18n/useCopy";
import { homeCopy } from "./copy";
import "./HeroFan.scss";

/**
 * Real opening cards from four decks for everyone, back of the fan first.
 * Card ids are never reused, so these stay pointed at the same cards.
 */
const FAN_CARDS = [
  { deckId: "silly-goose", cardId: "silly-goose-001" },
  { deckId: "spark-flow", cardId: "spark-flow-002" },
  { deckId: "bairro-alto", cardId: "bairro-alto-002" },
  { deckId: "first-date", cardId: "first-date-001" },
] as const;

interface FanCard {
  deck: Deck;
  card: Card;
}

const fanCards: FanCard[] = FAN_CARDS.flatMap(({ deckId, cardId }) => {
  const deck = getBuiltinDeck(deckId);
  const card = deck?.cards.find((candidate) => candidate.id === cardId);
  return deck && card ? [{ deck, card }] : [];
});

/** The product as the hero: a loose fan of real cards in their deck colours. */
export const HeroFan = () => {
  const copy = useCopy(homeCopy).fan;
  const locale = useLocale();

  if (fanCards.length === 0) return null;

  return (
    <div className="hero-fan" role="img" aria-label={copy.label}>
      {fanCards.map(({ deck, card }, index) => (
        <div
          key={card.id}
          className={`hero-fan__card hero-fan__card--${index + 1}`}
          style={{ "--deck-accent": deck.accent } as CSSProperties}
        >
          <div className="hero-fan__header">
            <DeckIcon name={deck.icon} size={18} />
            <span className="hero-fan__deck">
              {localize(deck.title, locale)}
            </span>
          </div>
          <p className="hero-fan__text">{localize(card.text, locale)}</p>
          <span className="hero-fan__mark">Unravel</span>
        </div>
      ))}
    </div>
  );
};
