import { useState, type CSSProperties, type FormEvent } from "react";
import { FiInfo, FiPlay } from "react-icons/fi";
import { DeckIcon } from "../../../components/DeckIcon";
import { PageHeader } from "../../../components/PageHeader";
import type { Deck } from "../../../content/types";
import { formatCopy, localize, pluralize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { useProgress, type PlayOptions } from "../../../storage/progress";
import { playCopy } from "../copy";
import { flowCopy } from "../flowCopy";
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
import { useStickyFooterHeight } from "./useStickyFooterHeight";
import "./PlaySetup.scss";

/** Random turns and pass-the-phone need a group: their switches show with this many names. */
const GROUP_OPTIONS_MINIMUM_NAMES = 3;

interface PlaySetupProps {
  deck: Deck;
  /** The running game's or the last-used options; the defaults when missing. */
  initialOptions?: PlayOptions;
  onStart: (options: PlayOptions) => void;
}

/**
 * Game options: optional names, start level, shuffle and table mode, plus random turns and
 * pass-the-phone once three names are in. Starting saves them for next time.
 */
export const PlaySetup = ({
  deck,
  initialOptions,
  onStart,
}: PlaySetupProps) => {
  const copy = useCopy(playCopy);
  const flow = useCopy(flowCopy).setup;
  const locale = useLocale();
  const otherSavedGame = useOtherSavedGame(deck.id);
  const savedProgress = useProgress();
  const hasSavedGameOfThisDeck = savedProgress?.deckId === deck.id;
  const titleRef = useFocusOnMount<HTMLHeadingElement>();
  const actionsRef = useStickyFooterHeight<HTMLDivElement>();
  const [options, setOptions] = useState<PlayOptions>(
    initialOptions ?? defaultPlayOptions
  );
  const isCustomDeck = isCustomDeckId(deck.id);
  const playableCardCount = countCardsFromLevel(deck, options.startLevel);
  const canStart = playableCardCount > 0;
  const canUseGroupOptions =
    options.players.filter((name) => name.trim().length > 0).length >=
    GROUP_OPTIONS_MINIMUM_NAMES;
  const [hasSwitchedOtherOff, setHasSwitchedOtherOff] = useState(false);

  const updateOptions = (patch: Partial<PlayOptions>) =>
    setOptions((previous) => ({ ...previous, ...patch }));

  // Table mode shows the card across the table, which pass-the-phone keeps private:
  // turning one on turns the other off, and the note says why.
  const handlePassThePhoneChange = (isPassThePhone: boolean) => {
    const turnsTableModeOff = isPassThePhone && options.isTableMode;
    updateOptions(
      turnsTableModeOff
        ? { isPassThePhone, isTableMode: false }
        : { isPassThePhone }
    );
    if (turnsTableModeOff) setHasSwitchedOtherOff(true);
  };
  const handleTableModeChange = (isTableMode: boolean) => {
    const turnsPassThePhoneOff = isTableMode && options.isPassThePhone;
    updateOptions(
      turnsPassThePhoneOff
        ? { isTableMode, isPassThePhone: false }
        : { isTableMode }
    );
    if (turnsPassThePhoneOff && canUseGroupOptions)
      setHasSwitchedOtherOff(true);
  };

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
        <p className="play-setup__eyebrow">{flow.eyebrow}</p>
        <h1 ref={titleRef} className="play-setup__title" tabIndex={-1}>
          {localize(deck.title, locale)}
        </h1>
        <p className="play-setup__intro">{flow.intro}</p>
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
      {hasSavedGameOfThisDeck && deck.cards.length > 0 && (
        <p className="play-setup__note">
          <FiInfo aria-hidden="true" size={18} />
          {flow.restartsSavedGame}
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
            {canUseGroupOptions && (
              <SetupSwitch
                title={copy.setup.randomTurnsTitle}
                hint={copy.setup.randomTurnsHint}
                isOn={options.isRandomTurns}
                onChange={(isRandomTurns) => updateOptions({ isRandomTurns })}
              />
            )}
            {canUseGroupOptions && (
              <SetupSwitch
                title={copy.setup.passThePhoneTitle}
                hint={copy.setup.passThePhoneHint}
                isOn={options.isPassThePhone}
                onChange={handlePassThePhoneChange}
              />
            )}
            <SetupSwitch
              title={copy.setup.tableModeTitle}
              hint={copy.setup.tableModeHint}
              isOn={options.isTableMode}
              onChange={handleTableModeChange}
            />
          </div>
          {canUseGroupOptions && (
            // Present before the note fills it, so screen readers announce the change.
            <div className="play-setup__switch-status" role="status">
              {hasSwitchedOtherOff && (
                <p className="play-setup__note">
                  <FiInfo aria-hidden="true" size={18} />
                  {copy.setup.exclusiveNote}
                </p>
              )}
            </div>
          )}
        </section>
        <div ref={actionsRef} className="play-setup__actions">
          <button
            type="submit"
            className="button button--primary"
            disabled={!canStart}
          >
            <FiPlay aria-hidden="true" size={20} />
            {copy.setup.startDeck}
          </button>
        </div>
      </form>
    </main>
  );
};

export default PlaySetup;
