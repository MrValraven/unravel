import type { CSSProperties } from "react";
import { Link } from "react-router";
import { FiArrowRight, FiChevronDown } from "react-icons/fi";
import qrSvg from "../../assets/qr.svg?raw";
import { DeckIcon } from "../../components/DeckIcon";
import { getVisibleDecks } from "../../content/decks";
import { localize, pluralize } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useCopy } from "../../i18n/useCopy";
import { homeCopy } from "./copy";
import { faqItems } from "./faq";
import "./HomeLanding.scss";

const SHELF_DECK_COUNT = 6;
const SITE_HOST = "unravel.tiagocostadev.com";

/**
 * What a first-time visitor on the website needs before playing: how it works,
 * a few decks, the phone hand-off, the privacy promise and an FAQ. Hidden in
 * the installed app, where players already know all of this.
 */
export const HomeLanding = () => {
  const copy = useCopy(homeCopy).landing;
  const locale = useLocale();
  const shelfDecks = getVisibleDecks()
    .filter((deck) => !deck.isAdult)
    .slice(0, SHELF_DECK_COUNT);

  return (
    <div className="home-landing">
      <section className="landing-steps" aria-labelledby="landing-steps-title">
        <h2 id="landing-steps-title" className="landing__title">
          {copy.steps.title}
        </h2>
        <ol className="landing-steps__list">
          {copy.steps.items.map((step, index) => (
            <li key={step.title} className="landing-steps__step">
              <span className="landing-steps__number" aria-hidden="true">
                {index + 1}
              </span>
              <h3 className="landing-steps__title">{step.title}</h3>
              <p className="landing-steps__body">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-shelf" aria-labelledby="landing-shelf-title">
        <div className="landing-shelf__head">
          <h2 id="landing-shelf-title" className="landing__title">
            {copy.shelf.title}
          </h2>
          <Link to="/decks" className="landing-shelf__all" viewTransition>
            {copy.shelf.seeAll}
            <FiArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
        <ul className="landing-shelf__list">
          {shelfDecks.map((deck) => (
            <li key={deck.id}>
              <Link
                to={`/decks/${encodeURIComponent(deck.id)}`}
                className="landing-shelf__deck"
                style={{ "--deck-accent": deck.accent } as CSSProperties}
                viewTransition
              >
                <DeckIcon name={deck.icon} size={22} />
                <span className="landing-shelf__name">
                  {localize(deck.title, locale)}
                </span>
                <span className="landing-shelf__count">
                  {pluralize(deck.cards.length, copy.shelf.cardCount)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="landing-pair">
        <section
          className="landing-phone"
          aria-labelledby="landing-phone-title"
        >
          <div
            className="landing-phone__code"
            role="img"
            aria-label={copy.phone.qrLabel}
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="landing-phone__copy">
            <h2 id="landing-phone-title" className="landing__title">
              {copy.phone.title}
            </h2>
            <p className="landing__body">{copy.phone.body}</p>
            <p className="landing-phone__host">{SITE_HOST}</p>
          </div>
        </section>

        <section
          className="landing-privacy"
          aria-labelledby="landing-privacy-title"
        >
          <h2 id="landing-privacy-title" className="landing__title">
            {copy.privacy.title}
          </h2>
          <p className="landing__body">{copy.privacy.body}</p>
          <ul className="landing-privacy__points">
            {copy.privacy.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="landing-faq" aria-labelledby="landing-faq-title">
        <h2 id="landing-faq-title" className="landing__title">
          {copy.faq.title}
        </h2>
        <div className="landing-faq__list">
          {faqItems.map((item) => (
            <details key={item.question.en} className="landing-faq__item">
              <summary className="landing-faq__question">
                <span>{localize(item.question, locale)}</span>
                <FiChevronDown
                  aria-hidden="true"
                  size={20}
                  className="landing-faq__chevron"
                />
              </summary>
              <p className="landing-faq__answer">
                {localize(item.answer, locale)}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};
