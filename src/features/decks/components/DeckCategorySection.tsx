import { useId, type CSSProperties } from "react";
import type { DeckCategoryInfo } from "../../../content/decks";
import type { Deck } from "../../../content/types";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { categorySectionId } from "../deckSummary";
import { DeckCard } from "./DeckCard";
import "./DeckCategorySection.scss";

interface DeckCategorySectionProps {
  category: DeckCategoryInfo;
  decks: Deck[];
  onSelectDeck: (deck: Deck) => void;
}

/** One category heading, its note, and its decks. Nothing when the category has no visible decks. */
export const DeckCategorySection = ({
  category,
  decks,
  onSelectDeck,
}: DeckCategorySectionProps) => {
  const locale = useLocale();
  const headingId = useId();

  if (decks.length === 0) return null;

  const categoryStyle = {
    "--category-color": `var(--color-category-${category.key})`,
  } as CSSProperties;

  return (
    <section
      id={categorySectionId(category.key)}
      className="deck-section"
      style={categoryStyle}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="deck-section-title deck-section__title">
        {localize(category.title, locale)}
      </h2>
      {category.note && (
        <p className="deck-section__note">{localize(category.note, locale)}</p>
      )}
      <ul className="deck-section__list" role="list">
        {decks.map((deck) => (
          <li key={deck.id}>
            <DeckCard deck={deck} onSelect={onSelectDeck} />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default DeckCategorySection;
