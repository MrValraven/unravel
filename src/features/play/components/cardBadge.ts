import type { CardType, IntensityLevel } from "../../../content/types";
import { formatCopy } from "../../../i18n/localize";
import type { TurnInfo } from "../engine/selectors";

interface BadgeCopy {
  challenge: string;
  everyone: string;
  vote: string;
  hotSeat: string;
}

/** The badge label for every card type but the plain question, which has none. */
export const getCardBadgeLabel = (
  cardType: CardType,
  copy: BadgeCopy
): string | undefined => {
  switch (cardType) {
    case "challenge":
      return copy.challenge;
    case "everyone":
      return copy.everyone;
    case "vote":
      return copy.vote;
    case "hot-seat":
      return copy.hotSeat;
    case "question":
      return undefined;
  }
};

interface TypeCopy extends BadgeCopy {
  question: string;
}

/** The chip label every card wears, questions included. */
export const getCardTypeLabel = (cardType: CardType, copy: TypeCopy): string =>
  getCardBadgeLabel(cardType, copy) ?? copy.question;

interface LevelTitle {
  title: string;
}

interface LevelsCopy {
  warm: LevelTitle;
  deeper: LevelTitle;
  allIn: LevelTitle;
}

/** The level names from game setup: Warm, Deeper and All in. */
export const getLevelLabel = (
  level: IntensityLevel,
  levels: LevelsCopy
): string => {
  if (level === 3) return levels.allIn.title;
  if (level === 2) return levels.deeper.title;
  return levels.warm.title;
};

interface TurnCopy {
  turn: string;
  challengeTurn: string;
  soloTurn: string;
  pairTurn: string;
  pairChallengeTurn: string;
  unnamedTurn: string;
  unnamedChallengeTurn: string;
  voteTurn: string;
  hotSeatTurn: string;
  hotSeatUnnamedTurn: string;
}

const assertUnreachableTurn = (turn: never): never => {
  throw new Error(`Unknown turn kind: ${JSON.stringify(turn)}`);
};

/**
 * Whose turn it is on this card. A challenge is done, so its line names who takes it on.
 * With pass-the-phone the answerer reads the card first, so the line names only them.
 * Everyone cards have no line: their badge already says everyone answers. Vote cards say
 * everyone votes, and hot-seat cards name who sits in it (the card text never does).
 */
export const getTurnLine = (
  cardType: CardType,
  turn: TurnInfo,
  copy: TurnCopy
): string | undefined => {
  const isChallenge = cardType === "challenge";
  switch (turn.kind) {
    case "rotation":
      return formatCopy(isChallenge ? copy.challengeTurn : copy.turn, {
        asker: turn.asker,
        answerer: turn.answerer,
      });
    case "solo":
      return formatCopy(copy.soloTurn, { answerer: turn.answerer });
    case "pair":
      return formatCopy(isChallenge ? copy.pairChallengeTurn : copy.pairTurn, {
        first: turn.first,
        second: turn.second,
      });
    case "everyone-unnamed":
      return isChallenge ? copy.unnamedChallengeTurn : copy.unnamedTurn;
    case "everyone":
      return undefined;
    case "vote":
      return copy.voteTurn;
    case "hot-seat":
      return formatCopy(copy.hotSeatTurn, { player: turn.player });
    case "hot-seat-unnamed":
      return copy.hotSeatUnnamedTurn;
    default:
      return assertUnreachableTurn(turn);
  }
};
