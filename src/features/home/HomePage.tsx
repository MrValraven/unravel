import { Link } from "react-router";
import { FiArrowRight, FiHeart, FiSettings } from "react-icons/fi";
import heroImageUrl from "../../assets/conversation.svg";
import { getVisibleDecks } from "../../content/decks";
import { ResumeCard } from "../../components/ResumeCard";
import { useResumableGame } from "../../components/useResumableGame";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { pluralize } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { useSettings } from "../../storage/settings";
import { DailyCard } from "./DailyCard";
import { homeCopy } from "./copy";
import "./HomePage.scss";

const AUTHOR_URL = "https://tiagocostadev.com";
const AUTHOR_NAME = "Tiago Costa";

const HomePage = () => {
  const copy = useCopy(homeCopy);
  const [settings] = useSettings();
  useDocumentTitle("");

  const hasSeenIntro = settings.hasSeenIntro;
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
          >
            <FiSettings aria-hidden="true" size={22} />
          </Link>
        </div>

        <section className="home__hero" aria-labelledby="home-title">
          <div className="home__copy">
            <h1 id="home-title" className="home__title">
              {copy.title}
            </h1>
            <p className="home__tagline">{copy.tagline}</p>
            <div className="home__actions">
              <Link
                to={hasSeenIntro ? "/decks" : "/about"}
                className={`button ${hasResumableGame ? "button--secondary" : "button--primary"} home__start`}
              >
                {copy.getStarted}
                <FiArrowRight aria-hidden="true" size={20} />
              </Link>
              {hasSeenIntro && (
                <Link to="/about" className="button button--quiet">
                  {copy.howItWorks}
                </Link>
              )}
            </div>
            <p className="home__deck-count">
              {pluralize(deckCount, copy.deckCount)}
            </p>
            <ResumeCard className="home__resume" />
          </div>
          <div className="home__art">
            <img src={heroImageUrl} alt="" width={750} height={500} />
          </div>
        </section>

        <div className="home__today">
          <DailyCard />
        </div>
      </main>

      <footer className="home__footer">
        {copy.footer.madeWith}{" "}
        <FiHeart className="home__heart" aria-hidden="true" size={16} />
        <span className="visually-hidden">{copy.footer.love}</span>{" "}
        {copy.footer.by}{" "}
        <a href={AUTHOR_URL} rel="noopener noreferrer" target="_blank">
          {AUTHOR_NAME}
        </a>
      </footer>
    </>
  );
};

export default HomePage;
