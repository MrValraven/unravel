import { describe, expect, it } from "vitest";
import { playCopy } from "../copy";
import {
  getCardBadgeLabel,
  getCardTypeLabel,
  getLevelLabel,
  getTurnLine,
} from "./cardBadge";

const englishCard = playCopy.en.card;
const portugueseCard = playCopy.pt.card;

describe("getCardBadgeLabel", () => {
  it("labels challenge and everyone cards only", () => {
    expect(getCardBadgeLabel("challenge", englishCard)).toBe("Challenge");
    expect(getCardBadgeLabel("everyone", englishCard)).toBe("Everyone answers");
    expect(getCardBadgeLabel("question", englishCard)).toBeUndefined();
  });
});

describe("getCardTypeLabel", () => {
  it("names every card type, questions included", () => {
    expect(getCardTypeLabel("question", englishCard)).toBe("Question");
    expect(getCardTypeLabel("challenge", englishCard)).toBe("Challenge");
    expect(getCardTypeLabel("everyone", portugueseCard)).toBe(
      "Todos respondem"
    );
  });
});

describe("getLevelLabel", () => {
  it("uses the setup level names", () => {
    const levels = playCopy.en.setup.levels;
    expect(getLevelLabel(1, levels)).toBe("Warm");
    expect(getLevelLabel(2, levels)).toBe("Deeper");
    expect(getLevelLabel(3, levels)).toBe("All in");
    expect(getLevelLabel(2, playCopy.pt.setup.levels)).toBe("Mais fundo");
  });
});

describe("getTurnLine", () => {
  const rotation = { kind: "rotation", asker: "Eva", answerer: "Ana" } as const;
  const pair = { kind: "pair", first: "Ana", second: "Rui" } as const;
  const unnamed = { kind: "everyone-unnamed" } as const;

  it("names who asks and who answers in a rotation", () => {
    expect(getTurnLine("question", rotation, englishCard)).toBe(
      "Eva asks, Ana answers"
    );
    expect(getTurnLine("challenge", rotation, englishCard)).toBe(
      "Ana's turn, Eva reads it out"
    );
  });

  it("names who goes first with two players", () => {
    expect(getTurnLine("question", pair, englishCard)).toBe(
      "Ana answers first, then Rui"
    );
    expect(getTurnLine("challenge", pair, englishCard)).toBe(
      "Ana goes first, then Rui"
    );
    expect(getTurnLine("question", pair, portugueseCard)).toBe(
      "Ana responde primeiro, depois Rui"
    );
    expect(getTurnLine("challenge", pair, portugueseCard)).toBe(
      "Ana começa, depois Rui"
    );
  });

  it("tells everyone to take a turn when nobody is named", () => {
    expect(getTurnLine("question", unnamed, englishCard)).toBe(
      "Everyone answers, one at a time"
    );
    expect(getTurnLine("challenge", unnamed, englishCard)).toBe(
      "Everyone takes a turn"
    );
    expect(getTurnLine("question", unnamed, portugueseCard)).toBe(
      "Toda a gente responde, à vez"
    );
  });

  it("leaves everyone cards to their badge", () => {
    expect(
      getTurnLine("everyone", { kind: "everyone" }, englishCard)
    ).toBeUndefined();
  });
});
