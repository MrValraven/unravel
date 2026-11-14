import { useMemo, useState } from "react";
import { Link } from "react-router";
import { FiSettings } from "react-icons/fi";
import { PageHeader } from "../../components/PageHeader";
import { ResumeCard } from "../../components/ResumeCard";
import {
  deckCategories,
  getBuiltinDeck,
  getVisibleDecks,
} from "../../content/decks";
import type { DeckSources } from "../../content/resolveDeck";
import type { Deck } from "../../content/types";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useCopy } from "../../i18n/useCopy";
import { useCustomDecks } from "../../storage/customDecks";
import { useFavouriteIds } from "../../storage/favourites";
import { DeckCategorySection } from "./components/DeckCategorySection";
import { DeckPreviewSheet } from "./components/DeckPreviewSheet";
import { FinderEntry } from "./components/FinderEntry";
import { YourDecksSection } from "./components/YourDecksSection";
import { deckCopy } from "./copy";
import InstallPrompt from "./install/InstallPrompt";
import "./DeckPickerPage.scss";

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
  const [previewDeck, setPreviewDeck] = useState<Deck | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openPreview = (deck: Deck) => {
    setPreviewDeck(deck);
    setIsPreviewOpen(true);
  };

  return (
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
        <YourDecksSection sources={sources} onSelectDeck={openPreview} />
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
  );
};

export default DeckPickerPage;
