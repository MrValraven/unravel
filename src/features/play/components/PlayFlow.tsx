import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  useResumableGame,
  type ResumableGame,
} from "../../../components/useResumableGame";
import type { Deck } from "../../../content/types";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import {
  loadLastPlayOptions,
  saveLastPlayOptions,
} from "../../../storage/lastPlayOptions";
import { loadProgress, type PlayOptions } from "../../../storage/progress";
import type { PlaySession } from "../engine/types";
import { playCopy } from "../copy";
import { flowCopy } from "../flowCopy";
import {
  commitNewSession,
  createNewSession,
  normalizePlayOptions,
  resolveStartOptions,
  restoreSession,
  SETUP_SEARCH_PARAM,
  startNewSession,
} from "../playSession";
import { BoundariesCheckIn } from "../setup/BoundariesCheckIn";
import { PlaySetup } from "../setup/PlaySetup";
import { ReplaceSavedGameDialog } from "../setup/ReplaceSavedGameDialog";
import { isReplaceConfirmed } from "../setup/replaceConfirmation";
import { PlayScreen } from "./PlayScreen";
import "./PlayFlow.scss";

type PlayPhase =
  | { kind: "setup"; options: PlayOptions }
  | { kind: "check-in"; options: PlayOptions; isFromSetup: boolean }
  /** Another deck has the saved game: nothing is saved or counted until the player agrees. */
  | { kind: "confirm-replace" }
  /** `isUncommitted`: built during render, saved and counted by an effect once it shows. */
  | { kind: "playing"; session: PlaySession; isUncommitted: boolean };

/** Game options open with the running game's options, else the last-used ones. */
const getSetupOptions = (deck: Deck): PlayOptions => {
  const savedProgress = loadProgress();
  return savedProgress?.deckId === deck.id
    ? savedProgress.options
    : resolveStartOptions(deck, loadLastPlayOptions());
};

/**
 * Where a visit lands: Game options when asked for (or when the deck has no
 * cards, so the empty note shows), else the question about replacing another
 * deck's saved game, else the saved game of this deck, else a new game with
 * the last-used options. Adult decks pass the check-in first.
 */
const getEntryPhase = (
  deck: Deck,
  isSetupRequested: boolean,
  shouldConfirmReplace: boolean
): PlayPhase => {
  if (isSetupRequested || deck.cards.length === 0) {
    return { kind: "setup", options: getSetupOptions(deck) };
  }
  if (shouldConfirmReplace) return { kind: "confirm-replace" };
  const savedProgress = loadProgress();
  const restoredSession = savedProgress
    ? restoreSession(deck, savedProgress)
    : undefined;
  if (restoredSession) {
    return { kind: "playing", session: restoredSession, isUncommitted: false };
  }
  const options = resolveStartOptions(deck, loadLastPlayOptions());
  if (deck.isAdult) return { kind: "check-in", options, isFromSetup: false };
  return {
    kind: "playing",
    session: createNewSession(deck, options, Date.now()),
    isUncommitted: true,
  };
};

/** Picks up a saved game for this deck, or starts a new one, with Game options on request. */
export const PlayFlow = ({ deck }: { deck: Deck }) => {
  const copy = useCopy(playCopy);
  const flow = useCopy(flowCopy);
  const locale = useLocale();
  useDocumentTitle(localize(deck.title, locale));
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSetupRequested = searchParams.get(SETUP_SEARCH_PARAM) === "1";
  const resumableGame = useResumableGame();
  // Frozen on the way in: the start that replaces the save must not ask again.
  const [replacedGame] = useState<ResumableGame | undefined>(() =>
    resumableGame &&
    resumableGame.deck.id !== deck.id &&
    !isReplaceConfirmed(location.state)
      ? resumableGame
      : undefined
  );
  const [phase, setPhase] = useState<PlayPhase>(() =>
    getEntryPhase(deck, isSetupRequested, replacedGame !== undefined)
  );

  // The agreement covers this visit only. Left on the history entry, it would
  // let Back or Forward replace a newer save without asking. A layout effect, so it
  // runs before the play screen's own effect writes ?card=N: this navigation carries
  // the search from the render it belongs to, and the later write is then the last
  // one. As a plain effect it ran second and wiped the card number.
  const isConfirmedVisit = isReplaceConfirmed(location.state);
  useLayoutEffect(() => {
    if (!isConfirmedVisit) return;
    void navigate(
      {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
      { replace: true, state: null }
    );
  }, [
    isConfirmedVisit,
    location.pathname,
    location.search,
    location.hash,
    navigate,
  ]);
  const [handledSetupRequest, setHandledSetupRequest] =
    useState(isSetupRequested);
  const committedSessionRef = useRef<PlaySession | null>(null);

  // The play menu links to ?setup=1 on this same route, and Back removes it
  // again, so the phase follows the param. Adjusted during render, so the old
  // phase never commits with the new URL.
  if (isSetupRequested !== handledSetupRequest) {
    setHandledSetupRequest(isSetupRequested);
    if (isSetupRequested) {
      setPhase({ kind: "setup", options: getSetupOptions(deck) });
    } else if (phase.kind !== "playing") {
      setPhase(getEntryPhase(deck, false, false));
    }
  }

  // A game started without setup is built during render; it is counted and
  // saved here, once, so a repeated render never counts twice.
  useEffect(() => {
    if (phase.kind !== "playing" || !phase.isUncommitted) return;
    if (committedSessionRef.current === phase.session) return;
    committedSessionRef.current = phase.session;
    commitNewSession(deck, phase.session, Date.now());
  }, [deck, phase]);

  const showPhase = (nextPhase: PlayPhase) => {
    setPhase(nextPhase);
    window.scrollTo(0, 0);
  };

  const beginGame = (options: PlayOptions) => {
    showPhase({
      kind: "playing",
      session: startNewSession(deck, options, Date.now()),
      isUncommitted: false,
    });
    // The play screen pauses its ?card=N sync while setup=1 is in the URL,
    // so the started game drops it, replacing the Game options entry.
    if (isSetupRequested) {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.delete(SETUP_SEARCH_PARAM);
          return next;
        },
        { replace: true }
      );
    }
  };

  const handleSetupStart = (options: PlayOptions) => {
    // Names are tidied, but the chosen level is kept as chosen: a custom deck
    // plays from level 1 without changing what the next builtin deck uses.
    saveLastPlayOptions({
      ...options,
      players: normalizePlayOptions(deck, options).players,
    });
    if (deck.isAdult)
      showPhase({ kind: "check-in", options, isFromSetup: true });
    else beginGame(options);
  };

  return (
    <div className="play-phase" key={phase.kind}>
      {phase.kind === "confirm-replace" && (
        <ReplaceSavedGameDialog
          isOpen
          newDeckTitle={localize(deck.title, locale)}
          savedGame={replacedGame}
          onStart={() => showPhase(getEntryPhase(deck, false, false))}
          onKeep={() => {
            if (!replacedGame) return;
            void navigate(`/play/${encodeURIComponent(replacedGame.deck.id)}`, {
              replace: true,
              viewTransition: true,
            });
          }}
        />
      )}
      {phase.kind === "setup" && (
        <PlaySetup
          deck={deck}
          initialOptions={phase.options}
          onStart={handleSetupStart}
        />
      )}
      {phase.kind === "check-in" && (
        <BoundariesCheckIn
          deck={deck}
          returnLabel={
            phase.isFromSetup
              ? copy.checkIn.backToSetup
              : flow.checkIn.gameOptions
          }
          onContinue={() => beginGame(phase.options)}
          onBack={() => showPhase({ kind: "setup", options: phase.options })}
        />
      )}
      {phase.kind === "playing" && (
        <PlayScreen deck={deck} initialSession={phase.session} />
      )}
    </div>
  );
};

export default PlayFlow;
