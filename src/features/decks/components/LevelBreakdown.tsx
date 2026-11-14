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

/** How many cards sit at each intensity level. Hidden when every card shares one level. */
export const LevelBreakdown = ({ cards }: LevelBreakdownProps) => {
  const copy = useCopy(deckCopy).levels;
  const counts = countCardsByLevel(cards);
  const usedLevelCount = intensityLevels.filter(
    (level) => counts[level] > 0
  ).length;

  if (usedLevelCount < 2) return null;

  return (
    <div className="level-breakdown" role="group" aria-label={copy.title}>
      <dl className="level-breakdown__list">
        {intensityLevels.map((level) => (
          <div
            key={level}
            className={`level-breakdown__item${counts[level] === 0 ? " level-breakdown__item--empty" : ""}`}
          >
            <dt className="level-breakdown__label">
              <span className="level-breakdown__meter" aria-hidden="true">
                {intensityLevels.map((step) => (
                  <span
                    key={step}
                    className={`level-breakdown__pip${step <= level ? " level-breakdown__pip--filled" : ""}`}
                  />
                ))}
              </span>
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
