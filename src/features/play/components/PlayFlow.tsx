import { useState } from "react";
import type { Deck } from "../../../content/types";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { loadProgress, type PlayOptions } from "../../../storage/progress";
import type { PlaySession } from "../engine/types";
import { restoreSession, startNewSession } from "../playSession";
import { BoundariesCheckIn } from "../setup/BoundariesCheckIn";
import { PlaySetup } from "../setup/PlaySetup";
import { PlayScreen } from "./PlayScreen";
import "./PlayFlow.scss";

type PlayPhase =
  | { kind: "setup"; options?: PlayOptions }
  | { kind: "check-in"; options: PlayOptions }
  | { kind: "playing"; session: PlaySession };

/** Picks up a saved game for this deck, or walks through setup (and the adult check-in) to a new one. */
export const PlayFlow = ({ deck }: { deck: Deck }) => {
  const locale = useLocale();
  useDocumentTitle(localize(deck.title, locale));
  const [phase, setPhase] = useState<PlayPhase>(() => {
    const savedProgress = loadProgress();
    const restoredSession = savedProgress
      ? restoreSession(deck, savedProgress)
      : undefined;
    return restoredSession
      ? { kind: "playing", session: restoredSession }
      : { kind: "setup" };
  });

  const showPhase = (nextPhase: PlayPhase) => {
    setPhase(nextPhase);
    window.scrollTo(0, 0);
  };

  const beginGame = (options: PlayOptions) =>
    showPhase({
      kind: "playing",
      session: startNewSession(deck, options, Date.now()),
    });

  const handleStart = (options: PlayOptions) => {
    if (deck.isAdult) showPhase({ kind: "check-in", options });
    else beginGame(options);
  };

  return (
    <div className="play-phase" key={phase.kind}>
      {phase.kind === "setup" && (
        <PlaySetup
          deck={deck}
          initialOptions={phase.options}
          onStart={handleStart}
        />
      )}
      {phase.kind === "check-in" && (
        <BoundariesCheckIn
          deck={deck}
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
