import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { Card, Deck, IntensityLevel } from "../../../content/types";
import { useHaptics } from "../../../hooks/useHaptics";
import { getFavouriteIds } from "../../../storage/favourites";
import { clearProgress, saveProgress } from "../../../storage/progress";
import {
  recordCardSeen,
  recordDeckFinish,
  recordDeckStart,
} from "../../../storage/stats";
import { createRestartAction, playReducer } from "../engine/playReducer";
import {
  getCurrentCardId,
  isSessionFinished,
  sessionToProgress,
} from "../engine/selectors";
import type { PlaySession } from "../engine/types";
import { toDeckEndSnapshot, type DeckEndState } from "../deckEnd";
import { getCountedPlayMilliseconds } from "../playSession";

export type CardMotion = "forward" | "backward";
export type StepAction = "next" | "previous" | "skip" | "hide" | "pass";

export interface PlaySessionControls {
  session: PlaySession;
  currentCard: Card | undefined;
  motion: CardMotion;
  perform: (action: StepAction) => void;
  restart: () => void;
  /** Call when the player stars a card, so the end screen can count this game's favourites. */
  noteFavouriteAdded: (cardId: string) => void;
}

interface PlaySessionHooks {
  /** Called when a forward move lands on a card a level higher than the one before it. */
  onLevelUp?: (level: IntensityLevel) => void;
}

/**
 * Holds the running game. Every action saves progress straight away, and the
 * finishing action clears it, records the stats and moves to the end screen.
 * Side effects run in event handlers so React's double rendering never counts twice.
 */
export function usePlaySession(
  deck: Deck,
  initialSession: PlaySession,
  { onLevelUp }: PlaySessionHooks = {}
): PlaySessionControls {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const haptics = useHaptics();
  const [session, setSession] = useState(initialSession);
  const [motion, setMotion] = useState<CardMotion>("forward");
  const sessionRef = useRef(initialSession);
  const favouritedCardIdsRef = useRef(new Set<string>());
  const cardsById = useMemo(
    () => new Map(deck.cards.map((card) => [card.id, card])),
    [deck]
  );

  const getCardLevel = (
    someSession: PlaySession
  ): IntensityLevel | undefined => {
    const cardId = getCurrentCardId(someSession);
    return cardId === undefined ? undefined : cardsById.get(cardId)?.level;
  };

  const commit = (nextSession: PlaySession, nextMotion: CardMotion) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    setMotion(nextMotion);
  };

  const finish = (finishedSession: PlaySession) => {
    const millisecondsPlayed = getCountedPlayMilliseconds(
      finishedSession,
      Date.now()
    );
    clearProgress();
    recordDeckFinish(deck.id, millisecondsPlayed);
    haptics.success();
    const favouriteIds = new Set(getFavouriteIds());
    const endState: DeckEndState = {
      cardsPlayed: finishedSession.order.length,
      millisecondsPlayed,
      favouritesSavedCount: [...favouritedCardIdsRef.current].filter((cardId) =>
        favouriteIds.has(cardId)
      ).length,
      options: finishedSession.options,
      deck: toDeckEndSnapshot(deck),
    };
    void navigate(`/play/${encodeURIComponent(deck.id)}/done`, {
      replace: true,
      state: endState,
    });
  };

  const perform = (action: StepAction) => {
    const previousSession = sessionRef.current;
    const nextSession = playReducer(previousSession, { type: action });
    if (nextSession === previousSession) return;
    commit(nextSession, action === "previous" ? "backward" : "forward");
    if (action === "next") recordCardSeen();
    if (isSessionFinished(nextSession)) {
      finish(nextSession);
      return;
    }
    const previousLevel = getCardLevel(previousSession);
    const nextLevel = getCardLevel(nextSession);
    const isLevelUp =
      action !== "previous" &&
      previousLevel !== undefined &&
      nextLevel !== undefined &&
      nextLevel > previousLevel;
    if (isLevelUp) {
      haptics.levelUp();
      onLevelUp?.(nextLevel);
    } else if (action === "next") {
      haptics.tap();
    }
    saveProgress(sessionToProgress(nextSession, Date.now()));
  };

  const restart = () => {
    const previousSession = sessionRef.current;
    // A restart is a new game: new order, starter and turn seed, and its clock starts again too.
    const nextSession = {
      ...playReducer(
        previousSession,
        createRestartAction(deck.cards, previousSession.options)
      ),
      startedAt: Date.now(),
    };
    commit(nextSession, "forward");
    clearProgress();
    recordDeckStart(deck.id);
    if (!isSessionFinished(nextSession)) {
      saveProgress(sessionToProgress(nextSession, Date.now()));
    }
  };

  const noteFavouriteAdded = (cardId: string) => {
    favouritedCardIdsRef.current.add(cardId);
  };

  // Keeps ?card=N (1-based) in step with the position. Replace keeps one
  // history entry for the whole game, so Back leaves the game. The param is
  // written for linking and history only: on load, saved progress decides the card.
  const cardNumber = String(session.position + 1);
  const cardParam = searchParams.get("card");
  const isFinished = isSessionFinished(session);
  // ?setup=1 asks for game setup again, and the play flow takes over from here.
  const isLeavingForSetup = searchParams.has("setup");
  useEffect(() => {
    if (isFinished || isLeavingForSetup || cardParam === cardNumber) return;
    setSearchParams({ card: cardNumber }, { replace: true });
  }, [cardNumber, cardParam, isFinished, isLeavingForSetup, setSearchParams]);

  const currentCardId = getCurrentCardId(session);
  return {
    session,
    currentCard:
      currentCardId === undefined ? undefined : cardsById.get(currentCardId),
    motion,
    perform,
    restart,
    noteFavouriteAdded,
  };
}
