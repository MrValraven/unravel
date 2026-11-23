import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router";
import { FiCalendar, FiGrid, FiPlay, FiShare2 } from "react-icons/fi";
import { AgeGateDialog } from "../../components/AgeGateDialog";
import { DeckIcon } from "../../components/DeckIcon";
import NotFoundPage from "../../components/NotFoundPage";
import { PageHeader } from "../../components/PageHeader";
import { getBuiltinDeck, isDeckInSeason } from "../../content/decks";
import type { Deck } from "../../content/types";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { formatCopy, localize } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useCopy } from "../../i18n/useCopy";
import { buildDeckShareUrl } from "../share/deckShareUrl";
import { ShareLinkDialog } from "../share/ShareLinkDialog";
import { shareLink, type ShareLinkOutcome } from "../share/shareLink";
import { ReplaceSavedGameDialog } from "../play/setup/ReplaceSavedGameDialog";
import { DeckBadges } from "./components/DeckBadges";
import { DeckBreadcrumbs } from "./components/DeckBreadcrumbs";
import { LevelBreakdown } from "./components/LevelBreakdown";
import { RelatedDecks } from "./components/RelatedDecks";
import { SampleCards } from "./components/SampleCards";
import { deckCopy } from "./copy";
import { formatSeasonWindow } from "./seasonLabel";
import { useDeckStart } from "./useDeckStart";
import "./DeckLandingPage.scss";
import { SiteFooter } from "../../components/SiteFooter";

const LANDING_SAMPLE_COUNT = 5;
const STATUS_VISIBLE_MILLISECONDS = 4000;

const DeckLanding = ({ deck }: { deck: Deck }) => {
  const copy = useCopy(deckCopy).landing;
  const locale = useLocale();
  const title = localize(deck.title, locale);
  useDocumentTitle(title);
  const { startDeck, runAfterAgeGate, ageGateProps, replaceDialogProps } =
    useDeckStart();
  const [shareOutcome, setShareOutcome] = useState<ShareLinkOutcome | null>(
    null
  );
  const shareUrl = buildDeckShareUrl(deck.id, window.location.origin);

  useEffect(() => {
    if (shareOutcome !== "copied") return;
    const timer = window.setTimeout(
      () => setShareOutcome(null),
      STATUS_VISIBLE_MILLISECONDS
    );
    return () => window.clearTimeout(timer);
  }, [shareOutcome]);

  // A second tap while the share sheet is open would be refused and fall to the
  // clipboard, so it is ignored until the first share settles.
  const isSharingRef = useRef(false);
  const handleShare = async () => {
    if (isSharingRef.current) return;
    isSharingRef.current = true;
    setShareOutcome(null);
    try {
      setShareOutcome(
        await shareLink({
          title,
          text: formatCopy(copy.shareText, { deck: title }),
          url: shareUrl,
        })
      );
    } finally {
      isSharingRef.current = false;
    }
  };

  const accentStyle = { "--deck-accent": deck.accent } as CSSProperties;
  // A shared link can arrive out of season, when the picker leaves the deck out.
  const seasonLine =
    deck.season && !isDeckInSeason(deck)
      ? formatSeasonWindow(deck.season, locale, copy)
      : undefined;

  return (
    <>
      <div className="page deck-landing" style={accentStyle}>
        <PageHeader backTo="/decks" backLabel={copy.backLabel} />
        <main className="deck-landing__main">
          <DeckBreadcrumbs deck={deck} />
          <div className="deck-landing__layout">
            <div className="deck-landing__info">
              <header className="deck-landing__hero">
                <span className="deck-landing__icon" aria-hidden="true">
                  <DeckIcon name={deck.icon} size={32} />
                </span>
                <p className="deck-landing__eyebrow">{copy.eyebrow}</p>
                <h1 className="deck-landing__title">{title}</h1>
                <p className="deck-landing__description">
                  {localize(deck.description, locale)}
                </p>
                <DeckBadges deck={deck} cardCount={deck.cards.length} />
                {seasonLine && (
                  <p className="deck-landing__season">
                    <FiCalendar aria-hidden="true" size={18} />
                    <span>
                      {seasonLine} {copy.seasonNote}
                    </span>
                  </p>
                )}
                <div className="deck-landing__actions">
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => startDeck(deck)}
                  >
                    <FiPlay aria-hidden="true" size={18} />
                    {copy.startDeck}
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => void handleShare()}
                  >
                    <FiShare2 aria-hidden="true" size={18} />
                    {copy.shareDeck}
                  </button>
                  <Link
                    to="/decks"
                    viewTransition
                    className="button button--secondary"
                  >
                    <FiGrid aria-hidden="true" size={18} />
                    {copy.browseDecks}
                  </Link>
                </div>
                <p className="deck-landing__status" role="status">
                  {shareOutcome === "copied" ? copy.linkCopied : ""}
                </p>
              </header>
              <LevelBreakdown cards={deck.cards} />
            </div>
            <div className="deck-landing__samples">
              <SampleCards
                deck={deck}
                sampleCount={LANDING_SAMPLE_COUNT}
                headingLevel="h2"
                onRevealRequest={() => runAfterAgeGate(deck, () => undefined)}
              />
            </div>
          </div>
          <RelatedDecks deck={deck} />
        </main>
        <AgeGateDialog {...ageGateProps} />
        <ReplaceSavedGameDialog {...replaceDialogProps} />
        <ShareLinkDialog
          isOpen={shareOutcome === "unavailable"}
          url={shareUrl}
          onClose={() => setShareOutcome(null)}
        />
      </div>
      <SiteFooter />
    </>
  );
};

/** Standalone page per builtin deck, for search and sharing. Unknown ids get the not-found page. */
const DeckLandingPage = () => {
  const { deckId = "" } = useParams();
  const deck = getBuiltinDeck(deckId);
  if (!deck) return <NotFoundPage />;
  return <DeckLanding key={deck.id} deck={deck} />;
};

export default DeckLandingPage;
