import { useState, type CSSProperties, type FormEvent } from "react";
import { FiInfo, FiPlay, FiZap } from "react-icons/fi";
import { DeckIcon } from "../../../components/DeckIcon";
import { PageHeader } from "../../../components/PageHeader";
import type { Deck } from "../../../content/types";
import { formatCopy, localize, pluralize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import type { PlayOptions } from "../../../storage/progress";
import { playCopy } from "../copy";
import {
  countCardsFromLevel,
  defaultPlayOptions,
  isCustomDeckId,
} from "../playSession";
import { PlayerNamesField } from "./PlayerNamesField";
import { SetupSwitch } from "./SetupSwitch";
import { StartLevelPicker } from "./StartLevelPicker";
import { useFocusOnMount } from "./useFocusOnMount";
import { useOtherSavedGame } from "./useOtherSavedGame";
import "./PlaySetup.scss";

interface PlaySetupProps {
  deck: Deck;
  /** Options to show again when the player comes back from the check-in. */
  initialOptions?: PlayOptions;
  onStart: (options: PlayOptions) => void;
}

/** Optional names, start level, shuffle and table mode, with a quick start that keeps the defaults. */
export const PlaySetup = ({
  deck,
  initialOptions,
  onStart,
}: PlaySetupProps) => {
  const copy = useCopy(playCopy);
  const locale = useLocale();
  const otherSavedGame = useOtherSavedGame(deck.id);
  const titleRef = useFocusOnMount<HTMLHeadingElement>();
  const [options, setOptions] = useState<PlayOptions>(
    initialOptions ?? defaultPlayOptions
  );
  const isCustomDeck = isCustomDeckId(deck.id);
  const playableCardCount = countCardsFromLevel(deck, options.startLevel);
  const canStart = playableCardCount > 0;

  const updateOptions = (patch: Partial<PlayOptions>) =>
    setOptions((previous) => ({ ...previous, ...patch }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canStart) onStart(options);
  };

  return (
    <main
      className="page play-setup"
      style={{ "--deck-accent": deck.accent } as CSSProperties}
    >
      <PageHeader backTo="/decks" backLabel={copy.backToDecks} />
      <header className="play-setup__hero">
        <span className="play-setup__icon" aria-hidden="true">
          <DeckIcon name={deck.icon} size={30} />
        </span>
        <h1 ref={titleRef} className="play-setup__title" tabIndex={-1}>
          {localize(deck.title, locale)}
        </h1>
        <p className="play-setup__intro">{copy.setup.intro}</p>
        <p className="play-setup__count">
          {pluralize(deck.cards.length, copy.setup.cardCount)}
        </p>
      </header>

      {deck.cards.length === 0 && (
        <p className="play-setup__note" role="status">
          <FiInfo aria-hidden="true" size={18} />
          {copy.setup.emptyDeck}
        </p>
      )}
      {otherSavedGame.kind === "saved" && (
        <p className="play-setup__note">
          <FiInfo aria-hidden="true" size={18} />
          {otherSavedGame.deckTitle
            ? formatCopy(copy.setup.replacesSavedGame, {
                deck: otherSavedGame.deckTitle,
              })
            : copy.setup.replacesSavedGameUntitled}
        </p>
      )}

      <form className="play-setup__form" onSubmit={handleSubmit}>
        <section className="play-setup__section">
          <PlayerNamesField
            initialNames={options.players}
            onNamesChange={(players) => updateOptions({ players })}
          />
        </section>
        {!isCustomDeck && (
          <section className="play-setup__section">
            <StartLevelPicker
              deck={deck}
              startLevel={options.startLevel}
              onChange={(startLevel) => updateOptions({ startLevel })}
            />
          </section>
        )}
        <section className="play-setup__section">
          <h2 className="play-setup__section-title">
            {copy.setup.optionsTitle}
          </h2>
          <div className="play-setup__switches">
            <SetupSwitch
              title={copy.setup.shuffleTitle}
              hint={copy.setup.shuffleHint}
              isOn={options.isShuffled}
              onChange={(isShuffled) => updateOptions({ isShuffled })}
            />
            <SetupSwitch
              title={copy.setup.tableModeTitle}
              hint={copy.setup.tableModeHint}
              isOn={options.isTableMode}
              onChange={(isTableMode) => updateOptions({ isTableMode })}
            />
          </div>
        </section>
        <div className="play-setup__actions">
          <button
            type="submit"
            className="button button--primary"
            disabled={!canStart}
          >
            <FiPlay aria-hidden="true" size={20} />
            {copy.setup.startDeck}
          </button>
          <button
            type="button"
            className="button button--secondary"
            disabled={deck.cards.length === 0}
            onClick={() => onStart(defaultPlayOptions)}
          >
            <FiZap aria-hidden="true" size={20} />
            {copy.setup.quickStart}
          </button>
        </div>
      </form>
    </main>
  );
};

export default PlaySetup;
