import { createStore, useStore } from "./createStore";

/** One-time hints the app shows until the player has seen them. */
export type CoachMark = "playGestureHint";
const coachMarkNames: readonly CoachMark[] = ["playGestureHint"];

export type CoachMarks = Record<CoachMark, boolean>;

const defaultCoachMarks: CoachMarks = { playGestureHint: false };

const isCoachMarks = (raw: unknown): raw is CoachMarks =>
  typeof raw === "object" &&
  raw !== null &&
  !Array.isArray(raw) &&
  coachMarkNames.every(
    (name) => typeof (raw as Record<string, unknown>)[name] === "boolean"
  );

/** Keeps each valid flag; a missing or broken one reads as not seen. */
const normalizeCoachMarks = (raw: unknown): CoachMarks | undefined => {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return undefined;
  }
  const candidate = raw as Record<string, unknown>;
  return Object.fromEntries(
    coachMarkNames.map((name) => [name, candidate[name] === true])
  ) as CoachMarks;
};

export const coachMarksStore = createStore<CoachMarks>(
  "coachMarks",
  defaultCoachMarks,
  isCoachMarks,
  normalizeCoachMarks
);

export function hasSeenCoachMark(name: CoachMark): boolean {
  return coachMarksStore.get()[name];
}

export function markCoachMarkSeen(name: CoachMark): void {
  if (hasSeenCoachMark(name)) return;
  coachMarksStore.set((previous) => ({ ...previous, [name]: true }));
}

export function useCoachMarks(): CoachMarks {
  return useStore(coachMarksStore);
}
