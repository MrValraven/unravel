import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { flushSync } from "react-dom";

interface CardGestureOptions {
  /** Changes whenever another card shows, so a drag or exit still running resets. */
  cardKey: string;
  /** False on the first card: a drag toward the previous card stretches and springs back. */
  canGoPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  /**
   * When set, a tap anywhere on the card calls this instead of turning it.
   * Pass-the-phone sets it while the card is covered, so a tap reveals the card.
   */
  onTap?: () => void;
}

export type SwipeDirection = "next" | "previous";
/** Mirrored on the stage as data-drag-phase, which picks the CSS transitions. */
type DragPhase = "idle" | "dragging" | "settling" | "leaving";

const TAP_MAX_TRAVEL = 10;
/** Movement before the gesture decides between a sideways drag and a vertical scroll. */
const INTENT_DISTANCE = 8;
/** A drag past this share of the card width turns the card on release. */
const COMMIT_DISTANCE_RATIO = 0.25;
/** Wide table-mode cards still turn after a comfortable thumb's reach. */
const COMMIT_DISTANCE_MAX = 140;
/** A flick at this speed (px per ms) in the drag direction turns the card at any distance. */
const COMMIT_VELOCITY = 0.5;
/** Pointer samples younger than this many ms set the release velocity. */
const VELOCITY_WINDOW = 100;
/** jsdom and hidden layouts report a zero width, so thresholds fall back to a phone card. */
const FALLBACK_CARD_WIDTH = 360;
/** Lower stretches less when dragging past the first card. */
const RUBBER_BAND_COEFFICIENT = 0.55;
/** Matches the settle transition in CardStage.scss. */
const SETTLE_DURATION = 260;
/** Starting slope of the exit easing in CardStage.scss, so the card leaves at the finger's speed. */
const EXIT_EASING_START_SLOPE = 2;
const EXIT_MIN_DURATION = 160;
const EXIT_MAX_DURATION = 320;
/** Slowest exit speed (px per ms) for a drag released almost at rest. */
const EXIT_MIN_SPEED = 1;

interface PointerSample {
  time: number;
  x: number;
}

interface DragGesture {
  pointerId: number;
  startX: number;
  startY: number;
  /** Where the card sat when the finger landed, in case it was still springing back. */
  baseOffset: number;
  offset: number;
  intent: "pending" | "horizontal";
  cardWidth: number;
  commitDistance: number;
  restingLeft: number;
  restingRight: number;
  cardHeight: number;
  samples: PointerSample[];
}

const isInteractiveTarget = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  target.closest("button, a, input, [role='timer'], .play-card__footer") !==
    null;

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Past the first card the pull gets heavier the further it goes, and never reaches the card width. */
const rubberBand = (distance: number, dimension: number): number =>
  (1 - 1 / ((distance * RUBBER_BAND_COEFFICIENT) / dimension + 1)) * dimension;

const readCurrentOffset = (element: HTMLElement): number => {
  const translate = window.getComputedStyle(element).translate;
  const offset = Number.parseFloat(translate);
  return Number.isFinite(offset) ? offset : 0;
};

const getReleaseVelocity = (samples: PointerSample[]): number => {
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (!first || !last) return 0;
  const elapsed = last.time - first.time;
  return elapsed > 0 ? (last.x - first.x) / elapsed : 0;
};

/**
 * Swipe right for the next card, left for the previous one, and tap the right
 * third for the next card (or anywhere, calling `onTap`, when it is set). The card follows the finger through CSS variables on
 * the stage (--drag-x in px, --drag-progress from 0 to 1 at the commit distance),
 * written once per frame, so dragging never re-renders React. React renders only
 * when the side under the card changes (`underlaySide`). The gesture element
 * needs `touch-action: pan-y` so vertical scrolling stays with the browser.
 */
export function useCardGestures({
  cardKey,
  canGoPrevious,
  onNext,
  onPrevious,
  onTap,
}: CardGestureOptions) {
  const elementRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [underlaySide, setUnderlaySide] = useState<SwipeDirection | null>(null);
  const underlaySideRef = useRef<SwipeDirection | null>(null);
  const isSwipeTurnPendingRef = useRef(false);
  const gestureRef = useRef<DragGesture | null>(null);
  const phaseRef = useRef<DragPhase>("idle");
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const latestRef = useRef({ canGoPrevious, onNext, onPrevious, onTap });

  useEffect(() => {
    latestRef.current = { canGoPrevious, onNext, onPrevious, onTap };
  });

  const cancelScheduled = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    frameRef.current = null;
    timerRef.current = null;
  };

  const setPhase = (phase: DragPhase) => {
    phaseRef.current = phase;
    const stage = stageRef.current;
    if (!stage) return;
    if (phase === "idle") delete stage.dataset.dragPhase;
    else stage.dataset.dragPhase = phase;
  };

  const showUnderlay = (side: SwipeDirection | null) => {
    if (underlaySideRef.current === side) return;
    underlaySideRef.current = side;
    setUnderlaySide(side);
  };

  const writeOffset = (offset: number, progress: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--drag-x", offset.toFixed(1));
    stage.style.setProperty(
      "--drag-progress",
      Math.min(progress, 1).toFixed(3)
    );
  };

  const resetPosition = () => {
    cancelScheduled();
    gestureRef.current = null;
    setPhase("idle");
    showUnderlay(null);
    stageRef.current?.style.removeProperty("--drag-x");
    stageRef.current?.style.removeProperty("--drag-progress");
    stageRef.current?.style.removeProperty("--exit-duration");
  };

  const springBack = () => {
    cancelScheduled();
    gestureRef.current = null;
    setPhase("settling");
    writeOffset(0, 0);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (phaseRef.current === "settling") resetPosition();
    }, SETTLE_DURATION);
  };

  const turnCard = (direction: SwipeDirection) => {
    const { onNext: goNext, onPrevious: goPrevious } = latestRef.current;
    // The card that arrives is already on screen as the underlay, so it skips its entry animation.
    isSwipeTurnPendingRef.current = true;
    if (stageRef.current) stageRef.current.dataset.swipeArrival = "true";
    flushSync(() => {
      showUnderlay(null);
      if (direction === "next") goNext();
      else goPrevious();
    });
    // A new card resets the stage in the layout effect below. Still here means nothing moved.
    if (phaseRef.current === "leaving") {
      isSwipeTurnPendingRef.current = false;
      springBack();
    }
  };

  const leave = (
    gesture: DragGesture,
    direction: SwipeDirection,
    velocity: number
  ) => {
    cancelScheduled();
    gestureRef.current = null;
    if (prefersReducedMotion()) {
      setPhase("leaving");
      turnCard(direction);
      return;
    }
    const rotationRoom = gesture.cardHeight * 0.2 + 16;
    const targetOffset =
      direction === "next"
        ? window.innerWidth - gesture.restingLeft + rotationRoom
        : -gesture.restingRight - rotationRoom;
    const remainingDistance = Math.abs(targetOffset - gesture.offset);
    const exitSpeed = Math.max(Math.abs(velocity), EXIT_MIN_SPEED);
    const exitDuration = Math.min(
      Math.max(
        (EXIT_EASING_START_SLOPE * remainingDistance) / exitSpeed,
        EXIT_MIN_DURATION
      ),
      EXIT_MAX_DURATION
    );
    stageRef.current?.style.setProperty(
      "--exit-duration",
      `${Math.round(exitDuration)}ms`
    );
    setPhase("leaving");
    writeOffset(targetOffset, 1);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      turnCard(direction);
    }, exitDuration);
  };

  // Another card on screen (swipe, button or keyboard) starts from the centre, with
  // nothing pending. Layout timing keeps the old card's offset from painting over the new one.
  useLayoutEffect(() => {
    resetPosition();
    // Only a card that arrived by swipe keeps its entry animation switched off.
    if (isSwipeTurnPendingRef.current) isSwipeTurnPendingRef.current = false;
    else if (stageRef.current) delete stageRef.current.dataset.swipeArrival;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the card changes
  }, [cardKey]);

  useEffect(() => cancelScheduled, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    if (isInteractiveTarget(event.target) || phaseRef.current === "leaving")
      return;
    const element = event.currentTarget;
    const baseOffset =
      phaseRef.current === "settling" ? readCurrentOffset(element) : 0;
    const bounds = element.getBoundingClientRect();
    const cardWidth = bounds.width > 0 ? bounds.width : FALLBACK_CARD_WIDTH;
    cancelScheduled();
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseOffset,
      offset: baseOffset,
      intent: "pending",
      cardWidth,
      commitDistance: Math.min(
        cardWidth * COMMIT_DISTANCE_RATIO,
        COMMIT_DISTANCE_MAX
      ),
      restingLeft: bounds.left - baseOffset,
      restingRight: bounds.left - baseOffset + cardWidth,
      cardHeight: bounds.height,
      samples: [{ time: performance.now(), x: event.clientX }],
    };
    if (baseOffset !== 0) {
      setPhase("dragging");
      writeOffset(
        baseOffset,
        Math.abs(baseOffset) / gestureRef.current.commitDistance
      );
    }
    if (typeof element.setPointerCapture === "function")
      element.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const horizontalTravel = event.clientX - gesture.startX;
    const verticalTravel = event.clientY - gesture.startY;

    if (gesture.intent === "pending") {
      if (Math.hypot(horizontalTravel, verticalTravel) < INTENT_DISTANCE)
        return;
      if (Math.abs(verticalTravel) >= Math.abs(horizontalTravel)) {
        // A vertical drag belongs to the page, so the card lets go.
        const element = event.currentTarget;
        gestureRef.current = null;
        if (element.hasPointerCapture?.(event.pointerId)) {
          element.releasePointerCapture(event.pointerId);
        }
        if (gesture.baseOffset !== 0) springBack();
        return;
      }
      gesture.intent = "horizontal";
      setPhase("dragging");
    }

    const now = performance.now();
    gesture.samples.push({ time: now, x: event.clientX });
    while (
      gesture.samples.length > 2 &&
      now - (gesture.samples[0]?.time ?? now) > VELOCITY_WINDOW
    ) {
      gesture.samples.shift();
    }

    const rawOffset = gesture.baseOffset + horizontalTravel;
    const isPastFirstCard = rawOffset < 0 && !latestRef.current.canGoPrevious;
    gesture.offset = isPastFirstCard
      ? -rubberBand(-rawOffset, gesture.cardWidth)
      : rawOffset;
    if (gesture.offset !== 0)
      showUnderlay(gesture.offset > 0 ? "next" : "previous");

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const current = gestureRef.current;
        if (current)
          writeOffset(
            current.offset,
            Math.abs(current.offset) / current.commitDistance
          );
      });
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const horizontalTravel = event.clientX - gesture.startX;
    const verticalTravel = event.clientY - gesture.startY;
    const isTap =
      Math.abs(horizontalTravel) <= TAP_MAX_TRAVEL &&
      Math.abs(verticalTravel) <= TAP_MAX_TRAVEL;

    if (gesture.intent === "horizontal") {
      const now = performance.now();
      const samples = [
        ...gesture.samples.filter(
          (sample) => now - sample.time <= VELOCITY_WINDOW
        ),
        { time: now, x: event.clientX },
      ];
      const velocity = getReleaseVelocity(samples);
      const direction: SwipeDirection =
        gesture.offset > 0 ? "next" : "previous";
      const directionSign = direction === "next" ? 1 : -1;
      const isFlick = velocity * directionSign >= COMMIT_VELOCITY;
      const isFlickBack = velocity * directionSign <= -COMMIT_VELOCITY;
      const isFarEnough = Math.abs(gesture.offset) >= gesture.commitDistance;
      const canTurn = direction === "next" || latestRef.current.canGoPrevious;
      if (canTurn && !isFlickBack && (isFlick || isFarEnough)) {
        leave(gesture, direction, velocity);
        return;
      }
      springBack();
    } else if (gesture.baseOffset !== 0) {
      springBack();
    } else {
      gestureRef.current = null;
    }

    if (!isTap) return;
    if (latestRef.current.onTap) {
      latestRef.current.onTap();
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX >= bounds.left + (bounds.width * 2) / 3)
      latestRef.current.onNext();
  };

  const onPointerCancel = () => {
    if (!gestureRef.current) return;
    springBack();
  };

  return {
    ref: elementRef,
    stageRef,
    underlaySide,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onLostPointerCapture: onPointerCancel,
    },
  };
}
