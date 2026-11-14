import { useEffect, useId, useRef } from "react";
import { FiLock } from "react-icons/fi";
import type { Deck } from "../../../content/types";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { useAgeConfirmed } from "../../../storage/ageGate";
import { deckCopy } from "../copy";
import { getSampleCards } from "../deckSummary";
import "./SampleCards.scss";

interface SampleCardsProps {
  deck: Deck;
  sampleCount: number;
  /** Opens the age gate. Adult decks show no samples until age is confirmed. */
  onRevealRequest: () => void;
  headingLevel?: "h2" | "h3";
}

export const SampleCards = ({
  deck,
  sampleCount,
  onRevealRequest,
  headingLevel = "h3",
}: SampleCardsProps) => {
  const Heading = headingLevel;
  const copy = useCopy(deckCopy);
  const locale = useLocale();
  const isAgeConfirmed = useAgeConfirmed();
  const headingId = useId();
  const isLocked = deck.isAdult && !isAgeConfirmed;
  const sampleCards = isLocked ? [] : getSampleCards(deck.cards, sampleCount);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wasLockedRef = useRef(isLocked);

  // Confirming age removes the reveal button that had focus, so focus moves to the samples.
  useEffect(() => {
    if (wasLockedRef.current && !isLocked) headingRef.current?.focus();
    wasLockedRef.current = isLocked;
  }, [isLocked]);

  if (!isLocked && sampleCards.length === 0) return null;

  return (
    <section className="sample-cards" aria-labelledby={headingId}>
      <Heading
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="sample-cards__title"
      >
        {copy.samples.title}
      </Heading>
      {isLocked ? (
        <div className="sample-cards__locked">
          <FiLock
            aria-hidden="true"
            size={20}
            className="sample-cards__lock-icon"
          />
          <p>{copy.samples.adultNotice}</p>
          <button
            type="button"
            className="button button--secondary"
            onClick={onRevealRequest}
          >
            {copy.samples.revealSamples}
          </button>
        </div>
      ) : (
        <ul className="sample-cards__list" role="list">
          {sampleCards.map((card) => (
            <li key={card.id} className="sample-cards__card">
              <span className="sample-cards__type">
                {copy.cardTypes[card.type]}
              </span>
              <p className="sample-cards__text">
                {localize(card.text, locale)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default SampleCards;
