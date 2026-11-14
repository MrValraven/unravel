import type { IconType } from "react-icons";
import { useNavigate } from "react-router";
import {
  FiArrowRight,
  FiMessageCircle,
  FiShield,
  FiSkipForward,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import introArtUrl from "../../assets/reminder.svg";
import { PageHeader } from "../../components/PageHeader";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useCopy } from "../../i18n/useCopy";
import { updateSettings } from "../../storage/settings";
import { introCopy } from "./copy";
import "./IntroPage.scss";

type CardKindKey = keyof (typeof introCopy)["en"]["cardKinds"];

const cardKindIcons: Record<CardKindKey, IconType> = {
  questions: FiMessageCircle,
  challenges: FiZap,
  everyone: FiUsers,
  levels: FiTrendingUp,
  skip: FiSkipForward,
  pass: FiShield,
};

const cardKindOrder: CardKindKey[] = [
  "questions",
  "challenges",
  "everyone",
  "levels",
  "skip",
  "pass",
];

const IntroPage = () => {
  const copy = useCopy(introCopy);
  const navigate = useNavigate();
  useDocumentTitle(copy.documentTitle);

  const handleStartPlaying = () => {
    updateSettings({ hasSeenIntro: true });
    void navigate("/decks");
  };

  return (
    <main className="page intro">
      <PageHeader backTo="/" backLabel={copy.backToHome} />

      <div className="intro__art" aria-hidden="true">
        <img src={introArtUrl} alt="" width={500} height={500} />
      </div>

      <h1 className="intro__title">{copy.title}</h1>
      <ul className="intro__points">
        {copy.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <section className="intro__cards" aria-labelledby="intro-cards-title">
        <h2 id="intro-cards-title" className="intro__section-title">
          {copy.cardsTitle}
        </h2>
        <ul className="intro__kinds">
          {cardKindOrder.map((kindKey) => {
            const KindIcon = cardKindIcons[kindKey];
            const kind = copy.cardKinds[kindKey];
            return (
              <li key={kindKey} className="intro__kind">
                <span className="intro__kind-icon" aria-hidden="true">
                  <KindIcon size={20} />
                </span>
                <div>
                  <h3 className="intro__kind-title">{kind.title}</h3>
                  <p className="intro__kind-body">{kind.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="intro__cta">
        <button
          type="button"
          className="button button--primary intro__start"
          onClick={handleStartPlaying}
        >
          {copy.startPlaying}
          <FiArrowRight aria-hidden="true" size={20} />
        </button>
      </div>
    </main>
  );
};

export default IntroPage;
