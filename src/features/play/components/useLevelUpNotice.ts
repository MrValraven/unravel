import { useEffect, useState } from "react";
import type { IntensityLevel } from "../../../content/types";
import { formatCopy } from "../../../i18n/localize";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import { getLevelLabel } from "./cardBadge";

const NOTICE_VISIBLE_MILLISECONDS = 2400;

interface LevelUpNotice {
  level: IntensityLevel;
  /** Tells two rises to the same level apart, so the timer starts again. */
  id: number;
}

/** A short "Level 2: Deeper" line for the moment the deck goes a level up. */
export function useLevelUpNotice() {
  const copy = useCopy(playCopy);
  const [notice, setNotice] = useState<LevelUpNotice | null>(null);

  useEffect(() => {
    if (notice === null) return;
    const timer = window.setTimeout(
      () => setNotice(null),
      NOTICE_VISIBLE_MILLISECONDS
    );
    return () => window.clearTimeout(timer);
  }, [notice]);

  const show = (level: IntensityLevel) =>
    setNotice((previous) => ({ level, id: (previous?.id ?? 0) + 1 }));

  const message =
    notice === null
      ? null
      : formatCopy(copy.card.levelUp, {
          number: notice.level,
          level: getLevelLabel(notice.level, copy.setup.levels),
        });

  return { message, show };
}
