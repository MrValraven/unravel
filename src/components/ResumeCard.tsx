import { useId, type CSSProperties } from "react";
import { Link } from "react-router";
import { FiPlay } from "react-icons/fi";
import { formatCopy, localize } from "../i18n/localize";
import { useLocale } from "../i18n/LocaleContext";
import { useCopy } from "../i18n/useCopy";
import { DeckIcon } from "./DeckIcon";
import { resumeCardCopy } from "./resumeCardCopy";
import { useResumableGame } from "./useResumableGame";
import "./ResumeCard.scss";

interface ResumeCardProps {
  className?: string;
}

/** One tap back into the saved game. Renders nothing when there is no game left to continue. */
export const ResumeCard = ({ className }: ResumeCardProps) => {
  const copy = useCopy(resumeCardCopy);
  const locale = useLocale();
  const headingId = useId();
  const game = useResumableGame();

  if (!game) return null;
  const { deck, currentCardNumber, totalCardCount } = game;
  const progressPercent = Math.round(
    (currentCardNumber / totalCardCount) * 100
  );
  const accentStyle = { "--deck-accent": deck.accent } as CSSProperties;
  const sectionClassName = className
    ? `resume-card ${className}`
    : "resume-card";

  return (
    <section
      className={sectionClassName}
      style={accentStyle}
      aria-labelledby={headingId}
    >
      <div className="resume-card__layout">
        <span className="resume-card__icon" aria-hidden="true">
          <DeckIcon name={deck.icon} size={22} />
        </span>
        <div className="resume-card__body">
          <h2 id={headingId} className="resume-card__heading">
            {copy.heading}
          </h2>
          <p className="resume-card__deck-title">
            {localize(deck.title, locale)}
          </p>
          <p className="resume-card__progress">
            {formatCopy(copy.progress, {
              current: currentCardNumber,
              total: totalCardCount,
            })}
          </p>
          <div className="resume-card__track" aria-hidden="true">
            <div
              className="resume-card__fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <Link
          to={`/play/${encodeURIComponent(deck.id)}`}
          className="button button--primary resume-card__continue"
          viewTransition
        >
          <FiPlay aria-hidden="true" size={18} />
          {copy.continueDeck}
        </Link>
      </div>
    </section>
  );
};

export default ResumeCard;
