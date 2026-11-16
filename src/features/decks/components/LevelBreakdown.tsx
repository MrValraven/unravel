import type { CSSProperties } from "react";
import type { Card, IntensityLevel } from "../../../content/types";
import { useCopy } from "../../../i18n/useCopy";
import { deckCopy } from "../copy";
import { countCardsByLevel, intensityLevels } from "../deckSummary";
import "./LevelBreakdown.scss";

interface LevelBreakdownProps {
  cards: Card[];
}

const levelCopyKeys: Record<IntensityLevel, "warm" | "deeper" | "allIn"> = {
  1: "warm",
  2: "deeper",
  3: "allIn",
};

/**
 * One bar split by each level's share of the deck, with a legend of labels and
 * counts. The legend carries the numbers, so the bar itself is hidden from
 * screen readers. Hidden when every card shares one level.
 */
export const LevelBreakdown = ({ cards }: LevelBreakdownProps) => {
  const copy = useCopy(deckCopy).levels;
  const counts = countCardsByLevel(cards);
  const usedLevels = intensityLevels.filter((level) => counts[level] > 0);

  if (usedLevels.length < 2) return null;

  return (
    <div className="level-breakdown" role="group" aria-label={copy.title}>
      <div className="level-breakdown__bar" aria-hidden="true">
        {usedLevels.map((level) => (
          <span
            key={level}
            className={`level-breakdown__segment level-breakdown__segment--level-${level}`}
            style={{ "--level-count": counts[level] } as CSSProperties}
          />
        ))}
      </div>
      <dl className="level-breakdown__legend">
        {intensityLevels.map((level) => (
          <div
            key={level}
            className={`level-breakdown__item${counts[level] === 0 ? " level-breakdown__item--empty" : ""}`}
          >
            <dt className="level-breakdown__label">
              <span
                className={`level-breakdown__swatch level-breakdown__segment--level-${level}`}
                aria-hidden="true"
              />
              {copy[levelCopyKeys[level]]}
            </dt>
            <dd className="level-breakdown__count">{counts[level]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default LevelBreakdown;
