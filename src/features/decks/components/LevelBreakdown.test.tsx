import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeCard, mixedCards } from "../../play/engine/engine.testUtils";
import { LevelBreakdown } from "./LevelBreakdown";

describe("LevelBreakdown", () => {
  it("shows one bar segment per used level and a label with a count for each level", () => {
    const { container } = render(
      <LevelBreakdown
        cards={[...mixedCards, makeCard("a-010", 1), makeCard("a-011", 1)]}
      />
    );
    const group = screen.getByRole("group", { name: "Card levels" });
    expect(
      container.querySelectorAll(".level-breakdown__bar > *")
    ).toHaveLength(3);
    expect(within(group).getByText("Warm").nextSibling).toHaveTextContent("5");
    expect(within(group).getByText("Deeper").nextSibling).toHaveTextContent(
      "3"
    );
    expect(within(group).getByText("All in").nextSibling).toHaveTextContent(
      "3"
    );
  });

  it("leaves an unused level out of the bar but keeps it in the legend", () => {
    const { container } = render(
      <LevelBreakdown cards={[makeCard("a-001", 1), makeCard("a-002", 2)]} />
    );
    expect(
      container.querySelectorAll(".level-breakdown__bar > *")
    ).toHaveLength(2);
    expect(screen.getByText("All in").nextSibling).toHaveTextContent("0");
  });

  it("renders nothing when every card shares one level", () => {
    const { container } = render(
      <LevelBreakdown cards={[makeCard("a-001", 1), makeCard("a-002", 1)]} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
