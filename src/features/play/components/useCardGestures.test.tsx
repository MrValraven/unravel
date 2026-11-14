import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeCard, makeDeck, makeOptions } from "../engine/engine.testUtils";
import { createSession } from "../engine/playReducer";
import { PlayScreen } from "./PlayScreen";

vi.mock("../../share/shareCard", () => ({
  shareCardImage: vi.fn(() => Promise.resolve("downloaded")),
}));

const threeCards = [
  makeCard("first-date-001", 1),
  makeCard("first-date-002", 1, "challenge"),
  makeCard("first-date-003", 1, "everyone"),
];

const renderPlayScreen = () => {
  const deck = makeDeck(threeCards);
  const session = createSession(deck, makeOptions({}), 0, () => 0);
  render(
    <MemoryRouter initialEntries={[`/play/${deck.id}`]}>
      <Routes>
        <Route
          path="/play/:deckId"
          element={<PlayScreen deck={deck} initialSession={session} />}
        />
        <Route path="/play/:deckId/done" element={<p>End screen</p>} />
      </Routes>
    </MemoryRouter>
  );
  return screen.getByRole("group", { name: "Current card" });
};

interface DragStep {
  x: number;
  y?: number;
  /** Milliseconds since the previous step. */
  elapsed: number;
}

let clock = 0;

/** The drag position and phase live on the stage, which also holds the card underneath. */
const stageOf = (cardRegion: HTMLElement): HTMLElement => {
  const stage = cardRegion.parentElement;
  if (!stage) throw new Error("The card region has no stage around it");
  return stage;
};

const touch = { pointerId: 1, isPrimary: true, pointerType: "touch" };

/** Presses and drags slowly to `toX` without letting go. */
const holdDrag = (element: HTMLElement, fromX: number, toX: number) => {
  fireEvent.pointerDown(element, { ...touch, clientX: fromX, clientY: 200 });
  for (let stepIndex = 1; stepIndex <= 10; stepIndex += 1) {
    clock += 200;
    fireEvent.pointerMove(element, {
      ...touch,
      clientX: fromX + ((toX - fromX) * stepIndex) / 10,
      clientY: 200,
    });
  }
};

const cardTexts = (text: string) =>
  screen.queryAllByText(text, { selector: "p" });
const underlay = () => document.querySelector(".card-stage__underlay");

/** Presses at the first step, moves through the rest and lets go at the last one. */
const drag = (element: HTMLElement, steps: DragStep[]) => {
  const pointer = { pointerId: 1, isPrimary: true, pointerType: "touch" };
  const [first, ...rest] = steps;
  if (!first) return;
  fireEvent.pointerDown(element, {
    ...pointer,
    clientX: first.x,
    clientY: first.y ?? 200,
  });
  for (const step of rest) {
    clock += step.elapsed;
    fireEvent.pointerMove(element, {
      ...pointer,
      clientX: step.x,
      clientY: step.y ?? 200,
    });
  }
  const last = rest[rest.length - 1] ?? first;
  fireEvent.pointerUp(element, {
    ...pointer,
    clientX: last.x,
    clientY: last.y ?? 200,
  });
};

/** A slow, steady drag, so only the distance decides. */
const slowDrag = (element: HTMLElement, fromX: number, toX: number) => {
  const stepCount = 10;
  const steps: DragStep[] = [{ x: fromX, elapsed: 0 }];
  for (let stepIndex = 1; stepIndex <= stepCount; stepIndex += 1) {
    steps.push({
      x: fromX + ((toX - fromX) * stepIndex) / stepCount,
      elapsed: 200,
    });
  }
  drag(element, steps);
};

const finishAnimations = () => {
  act(() => {
    vi.advanceTimersByTime(1000);
  });
};

describe("card swipes", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clock = 0;
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "requestAnimationFrame",
        "cancelAnimationFrame",
      ],
    });
    vi.spyOn(performance, "now").mockImplementation(() => clock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("goes to the next card on a swipe to the right, after the card leaves to the right", () => {
    const cardRegion = renderPlayScreen();
    slowDrag(cardRegion, 100, 260);
    expect(stageOf(cardRegion)).toHaveAttribute("data-drag-phase", "leaving");
    expect(
      Number(stageOf(cardRegion).style.getPropertyValue("--drag-x"))
    ).toBeGreaterThan(160);
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();

    finishAnimations();
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
    expect(stageOf(cardRegion)).not.toHaveAttribute("data-drag-phase");
    expect(stageOf(cardRegion).style.getPropertyValue("--drag-x")).toBe("");
  });

  it("goes back a card on a swipe to the left", () => {
    const cardRegion = renderPlayScreen();
    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();

    slowDrag(cardRegion, 300, 140);
    expect(
      Number(stageOf(cardRegion).style.getPropertyValue("--drag-x"))
    ).toBeLessThan(-160);
    finishAnimations();
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
  });

  it("springs back without moving on after a short, slow drag", () => {
    const cardRegion = renderPlayScreen();
    slowDrag(cardRegion, 100, 160);
    expect(stageOf(cardRegion)).toHaveAttribute("data-drag-phase", "settling");
    expect(stageOf(cardRegion).style.getPropertyValue("--drag-x")).toBe("0.0");

    finishAnimations();
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
    expect(stageOf(cardRegion)).not.toHaveAttribute("data-drag-phase");
  });

  it("turns the card on a short, fast flick", () => {
    const cardRegion = renderPlayScreen();
    drag(cardRegion, [
      { x: 100, elapsed: 0 },
      { x: 115, elapsed: 16 },
      { x: 140, elapsed: 16 },
    ]);
    finishAnimations();
    expect(screen.getByText("Card 2 of 3")).toBeInTheDocument();
  });

  it("springs back when a far drag is flicked back toward the centre", () => {
    const cardRegion = renderPlayScreen();
    drag(cardRegion, [
      { x: 100, elapsed: 0 },
      { x: 200, elapsed: 300 },
      { x: 300, elapsed: 300 },
      { x: 260, elapsed: 16 },
    ]);
    finishAnimations();
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
  });

  it("stretches and springs back when dragging toward previous on the first card", () => {
    const cardRegion = renderPlayScreen();
    const pointer = { pointerId: 1, isPrimary: true, pointerType: "touch" };
    fireEvent.pointerDown(cardRegion, {
      ...pointer,
      clientX: 300,
      clientY: 200,
    });
    clock += 200;
    fireEvent.pointerMove(cardRegion, {
      ...pointer,
      clientX: 290,
      clientY: 200,
    });
    clock += 200;
    fireEvent.pointerMove(cardRegion, {
      ...pointer,
      clientX: 100,
      clientY: 200,
    });
    act(() => {
      vi.advanceTimersByTime(20);
    });
    const stretchedOffset = Number(
      stageOf(cardRegion).style.getPropertyValue("--drag-x")
    );
    expect(stretchedOffset).toBeLessThan(0);
    expect(stretchedOffset).toBeGreaterThan(-100);

    fireEvent.pointerUp(cardRegion, { ...pointer, clientX: 100, clientY: 200 });
    expect(stageOf(cardRegion)).toHaveAttribute("data-drag-phase", "settling");
    finishAnimations();
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
  });

  it("leaves a vertical drag to the page", () => {
    const cardRegion = renderPlayScreen();
    drag(cardRegion, [
      { x: 100, y: 200, elapsed: 0 },
      { x: 104, y: 260, elapsed: 16 },
      { x: 300, y: 300, elapsed: 16 },
    ]);
    finishAnimations();
    expect(stageOf(cardRegion)).not.toHaveAttribute("data-drag-phase");
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
  });

  it("ignores drags that start on the card's buttons", () => {
    renderPlayScreen();
    slowDrag(
      screen.getByRole("button", { name: "Save card to favourites" }),
      100,
      300
    );
    finishAnimations();
    expect(screen.getByText("Card 1 of 3")).toBeInTheDocument();
  });

  it("shows the real next card under a card dragged right", () => {
    const cardRegion = renderPlayScreen();
    expect(underlay()).toBeNull();
    holdDrag(cardRegion, 100, 160);
    const [nextText] = cardTexts("first-date-002");
    expect(nextText?.closest(".card-stage__underlay")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(underlay()).toHaveAttribute("inert");
    expect(
      underlay()?.querySelector("button, a, input, [tabindex]")
    ).toBeNull();
    expect(
      screen.getByText("first-date-001", { selector: "p" })
    ).toBeInTheDocument();
  });

  it("shows the real previous card under a card dragged left, and swaps when the drag turns", () => {
    const cardRegion = renderPlayScreen();
    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    holdDrag(cardRegion, 300, 240);
    expect(
      cardTexts("first-date-001")[0]?.closest(".card-stage__underlay")
    ).not.toBeNull();
    expect(cardTexts("first-date-003")).toHaveLength(0);

    clock += 200;
    fireEvent.pointerMove(cardRegion, { ...touch, clientX: 360, clientY: 200 });
    expect(cardTexts("first-date-001")).toHaveLength(0);
    expect(
      cardTexts("first-date-003")[0]?.closest(".card-stage__underlay")
    ).not.toBeNull();
  });

  it("leaves one current card with the new text after a swipe", () => {
    const cardRegion = renderPlayScreen();
    slowDrag(cardRegion, 100, 260);
    expect(underlay()).not.toBeNull();
    finishAnimations();

    expect(underlay()).toBeNull();
    const nextTexts = cardTexts("first-date-002");
    expect(nextTexts).toHaveLength(1);
    expect(nextTexts[0]?.closest("[aria-hidden='true']")).toBeNull();
    expect(cardTexts("first-date-001")).toHaveLength(0);
    expect(document.querySelectorAll(".play-card")).toHaveLength(1);
    expect(stageOf(cardRegion)).toHaveAttribute("data-swipe-arrival", "true");

    // A card brought in by the keyboard deals in as usual.
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(stageOf(cardRegion)).not.toHaveAttribute("data-swipe-arrival");
  });

  it("shows the plain stack on the first card dragged left", () => {
    const cardRegion = renderPlayScreen();
    holdDrag(cardRegion, 300, 200);
    expect(underlay()).toBeNull();
  });

  it("says it is the last card under the last card dragged right", () => {
    const cardRegion = renderPlayScreen();
    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    fireEvent.click(screen.getByRole("button", { name: "Next card" }));
    holdDrag(cardRegion, 100, 160);
    expect(
      screen.getByText("Last card").closest(".card-stage__underlay")
    ).toHaveAttribute("aria-hidden", "true");
  });
});
