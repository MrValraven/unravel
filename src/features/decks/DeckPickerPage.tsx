import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { FiSettings } from "react-icons/fi";
import { PageHeader } from "../../components/PageHeader";
import { ResumeCard } from "../../components/ResumeCard";
import {
  deckCategories,
  getBuiltinDeck,
  getVisibleDecks,
} from "../../content/decks";
import { resolveDeck, type DeckSources } from "../../content/resolveDeck";
import { FAVOURITES_DECK_ID, type Deck } from "../../content/types";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useCopy } from "../../i18n/useCopy";
import { useCustomDecks } from "../../storage/customDecks";
import { useFavouriteIds } from "../../storage/favourites";
import { DeckCategorySection } from "./components/DeckCategorySection";
import { DeckPreviewSheet } from "./components/DeckPreviewSheet";
import { FinderEntry } from "./components/FinderEntry";
import { MakeOwnDeckRow } from "./components/MakeOwnDeckRow";
import { YourDecksSection } from "./components/YourDecksSection";
import { deckCopy } from "./copy";
import InstallPrompt from "./install/InstallPrompt";
import "./DeckPickerPage.scss";
import { SiteFooter } from "../../components/SiteFooter";

/**
 * Deck pages link to a category with a fragment (/decks#decks-dating). App
 * scrolls to the top on every new path after this page's effects run, so the
 * jump waits a frame.
 */
const useScrollToHash = () => {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return undefined;
    const frame = requestAnimationFrame(() => {
      document
        .getElementById(decodeURIComponent(hash.slice(1)))
        ?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);
};

const DeckPickerPage = () => {
  const copy = useCopy(deckCopy).picker;
  useDocumentTitle(copy.documentTitle);
  const favouriteIds = useFavouriteIds();
  const customDecks = useCustomDecks();
  const sources: DeckSources = useMemo(
    () => ({ favouriteIds, customDecks }),
    [favouriteIds, customDecks]
  );
  const visibleDecks = useMemo(() => getVisibleDecks(), []);
  // Until the player has starred a card or made a deck, "Your decks" would be
  // an empty placeholder, so a compact row below the catalogue stands in for it.
  const hasOwnDecks =
    customDecks.length > 0 ||
    resolveDeck(FAVOURITES_DECK_ID, sources) !== undefined;
  useScrollToHash();
  const [previewDeck, setPreviewDeck] = useState<Deck | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openPreview = (deck: Deck) => {
    setPreviewDeck(deck);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <div className="page deck-picker">
        <PageHeader
          backTo="/"
          backLabel={copy.backLabel}
          title={copy.title}
          actions={
            <>
              <InstallPrompt />
              <Link
                to="/settings"
                viewTransition
                className="icon-button"
                aria-label={copy.settings}
              >
                <FiSettings aria-hidden="true" size={22} />
              </Link>
            </>
          }
        />
        <main className="deck-picker__main">
          <p className="deck-picker__intro">{copy.intro}</p>
          <ResumeCard />
          <FinderEntry />
          {hasOwnDecks && (
            <YourDecksSection sources={sources} onSelectDeck={openPreview} />
          )}
          {deckCategories.map((category) => (
            <DeckCategorySection
              key={category.key}
              category={category}
              decks={visibleDecks.filter(
                (deck) => deck.category === category.key
              )}
              onSelectDeck={openPreview}
            />
          ))}
          {!hasOwnDecks && <MakeOwnDeckRow />}
        </main>
        <DeckPreviewSheet
          deck={previewDeck}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          hasDeckPage={
            previewDeck !== null && getBuiltinDeck(previewDeck.id) !== undefined
          }
        />
      </div>
      <SiteFooter />
    </>
  );
};

export default DeckPickerPage;
