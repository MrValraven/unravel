import type { CSSProperties } from "react";
import { DeckIcon } from "../../../components/DeckIcon";
import type { DeckIconName } from "../../../content/types";
import "./DeckEndCelebration.scss";

const SPARK_COUNT = 10;

/** Three cards settle into a straight stack with a soft burst of sparks. Reduced motion shows the stack at rest. */
export const DeckEndCelebration = ({ icon }: { icon: DeckIconName }) => (
  <div className="deck-end-celebration" aria-hidden="true">
    {Array.from({ length: SPARK_COUNT }, (_, sparkIndex) => (
      <span
        key={sparkIndex}
        className="deck-end-celebration__spark"
        style={
          {
            "--spark-angle": `${(360 / SPARK_COUNT) * sparkIndex}deg`,
          } as CSSProperties
        }
      />
    ))}
    <span className="deck-end-celebration__card deck-end-celebration__card--back" />
    <span className="deck-end-celebration__card deck-end-celebration__card--middle" />
    <span className="deck-end-celebration__card deck-end-celebration__card--front">
      <DeckIcon name={icon} size={34} />
    </span>
  </div>
);

export default DeckEndCelebration;
