import { useId, type CSSProperties } from "react";
import { FiArrowLeft, FiPlay, FiShield } from "react-icons/fi";
import { PageHeader } from "../../../components/PageHeader";
import type { Deck } from "../../../content/types";
import { useHaptics } from "../../../hooks/useHaptics";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import { CountdownTimer } from "../components/CountdownTimer";
import { useFocusOnMount } from "./useFocusOnMount";
import "./PlaySetup.scss";
import "./BoundariesCheckIn.scss";

interface BoundariesCheckInProps {
  deck: Deck;
  onContinue: () => void;
  onBack: () => void;
}

const CHECK_IN_SECONDS = 30;

/** Adult decks open with three prompts to talk through and an optional 30 second timer. */
export const BoundariesCheckIn = ({
  deck,
  onContinue,
  onBack,
}: BoundariesCheckInProps) => {
  const copy = useCopy(playCopy);
  const locale = useLocale();
  const haptics = useHaptics();
  const timerTitleId = useId();
  const titleRef = useFocusOnMount<HTMLHeadingElement>();

  return (
    <main
      className="page play-setup check-in"
      style={{ "--deck-accent": deck.accent } as CSSProperties}
    >
      <PageHeader
        backTo="/decks"
        backLabel={copy.backToDecks}
        title={localize(deck.title, locale)}
      />
      <header className="play-setup__hero">
        <span className="play-setup__icon" aria-hidden="true">
          <FiShield size={30} />
        </span>
        <h2 ref={titleRef} className="play-setup__title" tabIndex={-1}>
          {copy.checkIn.title}
        </h2>
        <p className="play-setup__intro">{copy.checkIn.intro}</p>
      </header>

      {/* The timer leads, so its controls stay clear of the sticky Start bar. */}
      <section className="check-in__timer" aria-labelledby={timerTitleId}>
        <h3 id={timerTitleId} className="play-setup__section-title">
          {copy.checkIn.timerTitle}
        </h3>
        <p className="play-setup__section-hint">{copy.checkIn.timerHint}</p>
        <CountdownTimer
          totalSeconds={CHECK_IN_SECONDS}
          onFinish={haptics.success}
        />
      </section>

      <ol className="check-in__prompts">
        {copy.checkIn.prompts.map((prompt, promptIndex) => (
          <li
            key={prompt}
            className="check-in__prompt"
            style={{ "--prompt-index": promptIndex } as CSSProperties}
          >
            {prompt}
          </li>
        ))}
      </ol>

      <p className="play-setup__note">
        <FiShield aria-hidden="true" size={18} />
        {copy.checkIn.passNote}
      </p>

      <div className="play-setup__actions">
        <button
          type="button"
          className="button button--primary"
          onClick={onContinue}
        >
          <FiPlay aria-hidden="true" size={20} />
          {copy.checkIn.startDeck}
        </button>
        <button type="button" className="button button--quiet" onClick={onBack}>
          <FiArrowLeft aria-hidden="true" size={20} />
          {copy.checkIn.backToSetup}
        </button>
      </div>
    </main>
  );
};

export default BoundariesCheckIn;
