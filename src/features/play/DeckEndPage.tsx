import { useMemo, type CSSProperties } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { FiExternalLink } from "react-icons/fi";
import NotFoundPage from "../../components/NotFoundPage";
import { PageHeader } from "../../components/PageHeader";
import { getBuiltinDeck } from "../../content/decks";
import { resolveDeck } from "../../content/resolveDeck";
import { FAVOURITES_DECK_ID } from "../../content/types";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { formatCopy, localize } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useCopy } from "../../i18n/useCopy";
import { useCustomDecks } from "../../storage/customDecks";
import {
  MIN_FAVOURITES_FOR_DECK,
  useFavouriteIds,
} from "../../storage/favourites";
import { useStats } from "../../storage/stats";
import { buildSuggestQuestionUrl } from "../share/suggestQuestionUrl";
import { DeckEndActions } from "./components/DeckEndActions";
import { DeckEndCelebration } from "./components/DeckEndCelebration";
import { DeckEndSummary } from "./components/DeckEndSummary";
import { playCopy } from "./copy";
import { pickSuggestedDeck, readDeckEndState } from "./deckEnd";
import { defaultPlayOptions, startNewSession } from "./playSession";
import "./DeckEndPage.scss";

/** The celebration after the last card, with what happened and where to go next. */
const DeckEndPage = () => {
  const { deckId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const copy = useCopy(playCopy);
  const locale = useLocale();
  const favouriteIds = useFavouriteIds();
  const customDecks = useCustomDecks();
  const stats = useStats();
  useDocumentTitle(copy.end.documentTitle);

  const deck = useMemo(
    () => resolveDeck(deckId, { favouriteIds, customDecks }),
    [deckId, favouriteIds, customDecks]
  );
  // Stars on cards that no longer exist do not count, the same rule as the deck picker.
  const hasFavouritesDeck = useMemo(() => {
    const favouritesDeck = resolveDeck(FAVOURITES_DECK_ID, {
      favouriteIds,
      customDecks,
    });
    return (favouritesDeck?.cards.length ?? 0) >= MIN_FAVOURITES_FOR_DECK;
  }, [favouriteIds, customDecks]);
  // Missing after a refresh: the celebration then shows the deck name only.
  const endState = readDeckEndState(location.state);
  // The finished game carries its deck, so the screen still shows after the
  // last star is removed or the custom deck is deleted. Play again needs the cards.
  const shownDeck =
    deck ?? (endState?.deck?.id === deckId ? endState.deck : undefined);

  if (!shownDeck) return <NotFoundPage />;

  const deckTitle = localize(shownDeck.title, locale);
  const suggestedDeck = pickSuggestedDeck(shownDeck, stats.decksFinished);
  // Suggestions go to the people who write the builtin decks, so custom deck titles stay on this device.
  const isBuiltinDeck = getBuiltinDeck(shownDeck.id) !== undefined;

  const handlePlayAgain = deck
    ? () => {
        const options = {
          ...(endState?.options ?? defaultPlayOptions),
          isShuffled: true,
        };
        startNewSession(deck, options, Date.now());
        // Replace keeps Back pointing at the page before the first game.
        void navigate(`/play/${encodeURIComponent(deck.id)}`, {
          replace: true,
        });
      }
    : undefined;

  return (
    <main
      className="page deck-end"
      style={{ "--deck-accent": shownDeck.accent } as CSSProperties}
    >
      <PageHeader backTo="/decks" backLabel={copy.backToDecks} />
      <DeckEndCelebration icon={shownDeck.icon} />
      <h1 className="deck-end__title">
        {formatCopy(copy.end.title, { deck: deckTitle })}
      </h1>
      <p className="deck-end__subtitle">{copy.end.subtitle}</p>
      {endState && <DeckEndSummary endState={endState} />}
      <DeckEndActions
        suggestedDeck={suggestedDeck}
        hasFavourites={hasFavouritesDeck && shownDeck.id !== FAVOURITES_DECK_ID}
        onPlayAgain={handlePlayAgain}
      />
      {isBuiltinDeck && (
        <aside className="deck-end__suggest">
          <h2 className="deck-end__suggest-title">{copy.end.suggestTitle}</h2>
          <p>{formatCopy(copy.end.suggestBody, { deck: deckTitle })}</p>
          <a
            href={buildSuggestQuestionUrl(deckTitle)}
            target="_blank"
            rel="noopener noreferrer"
            className="button button--secondary"
          >
            {copy.end.suggestQuestion}
            <span className="visually-hidden"> {copy.end.opensInNewTab}</span>
            <FiExternalLink aria-hidden="true" size={18} />
          </a>
        </aside>
      )}
    </main>
  );
};

export default DeckEndPage;
