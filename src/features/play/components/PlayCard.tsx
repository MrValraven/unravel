import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  FiMessageCircle,
  FiTarget,
  FiThermometer,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import type { Card, CardType } from "../../../content/types";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCopy } from "../../../i18n/useCopy";
import { playCopy } from "../copy";
import type { TurnInfo } from "../engine/selectors";
import { getCardTypeLabel, getLevelLabel, getTurnLine } from "./cardBadge";
import { RevealCover } from "./RevealCover";
import type { CardMotion } from "./usePlaySession";
import "./PlayCard.scss";

interface PlayCardProps {
  card: Card;
  turn: TurnInfo;
  isTableMode: boolean;
  /** How the card arrives. Leave it out for a preview, which never animates in. */
  motion?: CardMotion;
  /** The still copy under a dragged card, which never animates in. CardStage hides it from screen readers. */
  isPreview?: boolean;
  /** Timer, favourite and share controls along the bottom edge. */
  footer: ReactNode;
  /**
   * Pass-the-phone: hides the text, the turn line and the footer behind "Pass the phone
   * to {name}". Without `onReveal` (previews) the cover is a still picture.
   */
  cover?: { name: string; onReveal?: () => void };
}

const typeIcons: Record<CardType, IconType> = {
  question: FiMessageCircle,
  challenge: FiZap,
  everyone: FiUsers,
  vote: FiTarget,
  "hot-seat": FiThermometer,
};

const LEVEL_STEPS = [1, 2, 3] as const;

/** Past this many characters a card counts as long, and small screens set it a step smaller. */
const LONG_CARD_CHARACTERS = 110;

/**
 * One physical-looking card in the deck's accent: a type chip and a level chip,
 * whose turn it is, then the card text. Table mode prints it twice, one copy upside down.
 * With a pass-the-phone cover, the chips stay and the rest waits for the reveal.
 */
export const PlayCard = ({
  card,
  turn,
  isTableMode,
  motion,
  isPreview = false,
  footer,
  cover,
}: PlayCardProps) => {
  const playText = useCopy(playCopy);
  const copy = playText.card;
  const locale = useLocale();
  const typeLabel = getCardTypeLabel(card.type, copy);
  const TypeIcon = typeIcons[card.type];
  const levelLabel = getLevelLabel(card.level, playText.setup.levels);
  const turnLine = getTurnLine(card.type, turn, copy);
  // A covered card never puts its text in the page, not even its length.
  const cardText = cover ? "" : localize(card.text, locale);

  const renderFace = (isAcrossTable: boolean) => (
    <div
      className={`play-card__face${isAcrossTable ? " play-card__face--across" : ""}`}
      aria-hidden={isAcrossTable || undefined}
    >
      <div className="play-card__meta">
        <div className="play-card__chips">
          <span className="play-card__chip play-card__chip--type">
            <TypeIcon aria-hidden="true" size={14} />
            {typeLabel}
          </span>
          <span
            className="play-card__chip play-card__chip--level"
            data-level={card.level}
          >
            <span className="play-card__level-steps" aria-hidden="true">
              {LEVEL_STEPS.map((step) => (
                <span
                  key={step}
                  className="play-card__level-step"
                  data-filled={step <= card.level}
                />
              ))}
            </span>
            {levelLabel}
          </span>
        </div>
        {!cover && turnLine && <p className="play-card__turn">{turnLine}</p>}
      </div>
      {cover ? (
        <RevealCover
          name={cover.name}
          // The turned copy is a picture of the cover: one reveal button, on the readable face.
          onReveal={isAcrossTable ? undefined : cover.onReveal}
        />
      ) : (
        <p className="play-card__text">{cardText}</p>
      )}
    </div>
  );

  const classNames = [
    "play-card",
    `play-card--${card.type}`,
    motion && !isPreview ? `play-card--enter-${motion}` : "",
    isTableMode ? "play-card--table" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={classNames}
      data-text-length={
        cardText.length > LONG_CARD_CHARACTERS ? "long" : "regular"
      }
    >
      {isTableMode && renderFace(true)}
      {isTableMode && <span className="play-card__fold" aria-hidden="true" />}
      {renderFace(false)}
      <div className="play-card__footer">{!cover && footer}</div>
    </article>
  );
};

export default PlayCard;
