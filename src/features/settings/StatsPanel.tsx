import { useRef, useState, type CSSProperties } from "react";
import { FiRotateCcw } from "react-icons/fi";
import { Dialog } from "../../components/Dialog";
import { DeckIcon } from "../../components/DeckIcon";
import { resolveDeck } from "../../content/resolveDeck";
import { localize } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useCopy } from "../../i18n/useCopy";
import { useCustomDecks } from "../../storage/customDecks";
import { useFavouriteIds } from "../../storage/favourites";
import { resetStats, useStats } from "../../storage/stats";
import { settingsCopy } from "./copy";
import { summarizeStats } from "./statsSummary";
import "./StatsPanel.scss";

/** "Your nights": local play counts with a confirmed reset. */
export const StatsPanel = () => {
  const copy = useCopy(settingsCopy).stats;
  const locale = useLocale();
  const stats = useStats();
  const favouriteIds = useFavouriteIds();
  const customDecks = useCustomDecks();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const keepButtonRef = useRef<HTMLButtonElement>(null);

  const summary = summarizeStats(stats, (deckId) =>
    resolveDeck(deckId, { favouriteIds, customDecks })
  );
  const numberFormat = new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en");
  const counters = [
    { key: "cardsSeen", label: copy.cardsSeen, value: summary.cardsSeen },
    {
      key: "decksFinished",
      label: copy.decksFinished,
      value: summary.decksFinished,
    },
    {
      key: "minutesPlayed",
      label: copy.minutesPlayed,
      value: summary.minutesPlayed,
    },
  ];
  const mostPlayedDeck = summary.mostPlayedDeck;

  const handleConfirmReset = () => {
    resetStats();
    setIsResetDialogOpen(false);
  };

  return (
    <section
      className="settings__section stats-panel"
      aria-labelledby="stats-title"
    >
      <h2 id="stats-title" className="settings__section-title">
        {copy.title}
      </h2>
      <dl className="stats-panel__counters">
        {counters.map((counter) => (
          <div key={counter.key} className="stats-panel__counter">
            <dt className="stats-panel__counter-label">{counter.label}</dt>
            <dd className="stats-panel__counter-value">
              {numberFormat.format(counter.value)}
            </dd>
          </div>
        ))}
      </dl>
      {mostPlayedDeck && (
        <div
          className="stats-panel__most-played"
          style={{ "--deck-accent": mostPlayedDeck.accent } as CSSProperties}
        >
          <span className="stats-panel__deck-icon" aria-hidden="true">
            <DeckIcon name={mostPlayedDeck.icon} size={20} />
          </span>
          <span className="stats-panel__most-played-text">
            <span className="stats-panel__counter-label">
              {copy.mostPlayed}
            </span>
            <span className="stats-panel__deck-title">
              {localize(mostPlayedDeck.title, locale)}
            </span>
          </span>
        </div>
      )}
      {!summary.hasAnyPlay && (
        <p className="stats-panel__empty">{copy.emptyHint}</p>
      )}
      <button
        type="button"
        className="button button--quiet stats-panel__reset"
        aria-disabled={!summary.hasAnyPlay}
        onClick={() => {
          // aria-disabled keeps the button focusable, so focus has a home after a reset.
          if (summary.hasAnyPlay) setIsResetDialogOpen(true);
        }}
      >
        <FiRotateCcw aria-hidden="true" size={18} />
        {copy.reset}
      </button>

      <Dialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        title={copy.resetDialog.title}
        description={copy.resetDialog.description}
        initialFocusRef={keepButtonRef}
        footer={
          <>
            <button
              ref={keepButtonRef}
              type="button"
              className="button button--secondary"
              onClick={() => setIsResetDialogOpen(false)}
            >
              {copy.resetDialog.cancel}
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={handleConfirmReset}
            >
              {copy.resetDialog.confirm}
            </button>
          </>
        }
      />
    </section>
  );
};
