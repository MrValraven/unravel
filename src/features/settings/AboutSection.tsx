import { useState } from "react";
import {
  FiChevronRight,
  FiExternalLink,
  FiGift,
  FiLock,
  FiMessageSquare,
} from "react-icons/fi";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import InstallPrompt from "../decks/install/InstallPrompt";
import { buildSuggestQuestionUrl } from "../share/suggestQuestionUrl";
import { settingsCopy } from "./copy";
import { WhatsNewDialog } from "./WhatsNewDialog";
import { releases } from "./whatsNew";
import "./AboutSection.scss";

/** What's new, suggest a question, install, privacy and the version. */
export const AboutSection = () => {
  const copy = useCopy(settingsCopy).about;
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

  return (
    <section
      className="settings__section about-section"
      aria-labelledby="about-title"
    >
      <h2 id="about-title" className="settings__section-title">
        {copy.title}
      </h2>
      <div className="about-section__links">
        <button
          type="button"
          className="about-section__row"
          onClick={() => setIsWhatsNewOpen(true)}
        >
          <FiGift
            aria-hidden="true"
            size={20}
            className="about-section__row-icon"
          />
          <span className="about-section__row-label">{copy.whatsNew}</span>
          <FiChevronRight aria-hidden="true" size={20} />
        </button>
        <a
          className="about-section__row"
          href={buildSuggestQuestionUrl()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FiMessageSquare
            aria-hidden="true"
            size={20}
            className="about-section__row-icon"
          />
          <span className="about-section__row-label">
            {copy.suggestQuestion}
            <span className="visually-hidden"> {copy.opensInNewTab}</span>
          </span>
          <FiExternalLink aria-hidden="true" size={18} />
        </a>
        <InstallPrompt variant="row" className="about-section__row" />
      </div>
      <p className="about-section__privacy">
        <FiLock aria-hidden="true" size={16} />
        {copy.privacy}
      </p>
      <p className="about-section__version">
        {formatCopy(copy.version, { version: __APP_VERSION__ })}
      </p>

      <WhatsNewDialog
        isOpen={isWhatsNewOpen}
        onClose={() => setIsWhatsNewOpen(false)}
        releaseList={releases}
      />
    </section>
  );
};
