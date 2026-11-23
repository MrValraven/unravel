import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { FiArrowRight, FiSettings } from "react-icons/fi";
import { getVisibleDecks } from "../../content/decks";
import { LanguageSuggestion } from "../../components/LanguageSuggestion";
import { ResumeCard } from "../../components/ResumeCard";
import { SiteFooter } from "../../components/SiteFooter";
import { useResumableGame } from "../../components/useResumableGame";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { pluralize } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { FinderEntry } from "../decks/components/FinderEntry";
import { SeasonStrip } from "../decks/components/SeasonStrip";
import { InstallNudge } from "../decks/install/InstallNudge";
import { DailyCard } from "./DailyCard";
import { HeroFan } from "./HeroFan";
import { HomeLanding } from "./HomeLanding";
import { Wordmark } from "./Wordmark";
import { homeCopy } from "./copy";
import "./HomePage.scss";

/** The card of the day's anchor; the PWA shortcut opens /#today. */
const TODAY_ID = "today";

/**
 * Brings the card of the day into view for /#today: on arrival, on a hash-only
 * change while already on Home, and on a repeat of the same /#today (a tapped
 * reminder calls router.navigate("/#today"), which gives the location a new
 * key even when the hash is unchanged). It waits a frame because the app
 * scrolls new pages to the top after this page's own effects run.
 */
const useScrollToToday = () => {
  const { hash, key } = useLocation();
  useEffect(() => {
    if (hash !== `#${TODAY_ID}`) return;
    const frame = requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      document.getElementById(TODAY_ID)?.scrollIntoView({
        block: "start",
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, key]);
};

const HomePage = () => {
  const copy = useCopy(homeCopy);
  useDocumentTitle(copy.documentTitle, { isFullTitle: true });
  useScrollToToday();

  const deckCount = getVisibleDecks().length;
  // A saved game takes the lead: Continue becomes the one primary action.
  const hasResumableGame = useResumableGame() !== undefined;

  return (
    <>
      <main className="home">
        <div className="home__bar">
          <Link
            to="/settings"
            className="icon-button"
            aria-label={copy.openSettings}
            viewTransition
          >
            <FiSettings aria-hidden="true" size={22} />
          </Link>
        </div>

        <LanguageSuggestion className="home__language" />

        <section className="home__hero" aria-labelledby="home-title">
          <div className="home__copy">
            <h1 id="home-title" className="home__title">
              <Wordmark />
            </h1>
            <p className="home__tagline">{copy.tagline}</p>
            <ResumeCard className="home__resume" />
            <div className="home__actions">
              <Link
                to="/decks"
                className={`button ${hasResumableGame ? "button--secondary" : "button--primary"} home__start`}
                viewTransition
              >
                {copy.getStarted}
                <FiArrowRight aria-hidden="true" size={20} />
              </Link>
              <Link to="/about" className="button button--quiet" viewTransition>
                {copy.whatIsUnravel}
              </Link>
            </div>
            <div className="home__finder">
              <FinderEntry />
            </div>
            <p className="home__deck-count">
              {pluralize(deckCount, copy.deckCount)}
            </p>
          </div>
          <div className="home__art">
            <HeroFan />
          </div>
        </section>

        <div className="home__season">
          <SeasonStrip />
        </div>

        <div className="home__today">
          <DailyCard id={TODAY_ID} />
        </div>

        <div className="home__install">
          <InstallNudge placement="home" />
        </div>

        <HomeLanding />
      </main>

      <SiteFooter className="home__footer" />
    </>
  );
};

export default HomePage;
