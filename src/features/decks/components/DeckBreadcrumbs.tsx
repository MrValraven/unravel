import { Link } from "react-router";
import { FiChevronRight } from "react-icons/fi";
import { deckCategories } from "../../../content/decks";
import type { Deck } from "../../../content/types";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { deckCopy } from "../copy";
import { categorySectionId } from "../deckSummary";
import "./DeckBreadcrumbs.scss";

/**
 * Decks › Category › Deck. The prerendered page carries the matching
 * BreadcrumbList JSON-LD (scripts/prerender-decks.ts), with the same links.
 */
export const DeckBreadcrumbs = ({ deck }: { deck: Deck }) => {
  const copy = useCopy(deckCopy).landing;
  const locale = useLocale();
  const category = deckCategories.find((entry) => entry.key === deck.category);

  return (
    <nav className="deck-breadcrumbs" aria-label={copy.breadcrumbLabel}>
      <ol className="deck-breadcrumbs__list">
        <li className="deck-breadcrumbs__item">
          <Link to="/decks" viewTransition className="deck-breadcrumbs__link">
            {copy.breadcrumbDecks}
          </Link>
        </li>
        {category && (
          <li className="deck-breadcrumbs__item">
            <FiChevronRight
              aria-hidden="true"
              size={16}
              className="deck-breadcrumbs__separator"
            />
            <Link
              to={`/decks#${categorySectionId(category.key)}`}
              viewTransition
              className="deck-breadcrumbs__link"
            >
              {localize(category.title, locale)}
            </Link>
          </li>
        )}
        <li className="deck-breadcrumbs__item">
          <FiChevronRight
            aria-hidden="true"
            size={16}
            className="deck-breadcrumbs__separator"
          />
          <span aria-current="page" className="deck-breadcrumbs__current">
            {localize(deck.title, locale)}
          </span>
        </li>
      </ol>
    </nav>
  );
};

export default DeckBreadcrumbs;
