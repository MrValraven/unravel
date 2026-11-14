import type { CardType } from "../../../content/types";
import { formatCopy } from "../../../i18n/localize";
import type { TurnInfo } from "../engine/selectors";

interface BadgeCopy {
  challenge: string;
  everyone: string;
}

/** The badge label for challenge and everyone cards. Plain questions have none. */
export const getCardBadgeLabel = (
  cardType: CardType,
  copy: BadgeCopy
): string | undefined => {
  if (cardType === "challenge") return copy.challenge;
  if (cardType === "everyone") return copy.everyone;
  return undefined;
};

interface TurnCopy {
  turn: string;
  challengeTurn: string;
  pairTurn: string;
  pairChallengeTurn: string;
  unnamedTurn: string;
  unnamedChallengeTurn: string;
}

const assertUnreachableTurn = (turn: never): never => {
  throw new Error(`Unknown turn kind: ${JSON.stringify(turn)}`);
};

/**
 * Whose turn it is on this card. A challenge is done, so its line names who takes it on.
 * Everyone cards have no line: their badge already says everyone answers.
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
    case "pair":
      return formatCopy(isChallenge ? copy.pairChallengeTurn : copy.pairTurn, {
        first: turn.first,
        second: turn.second,
      });
    case "everyone-unnamed":
      return isChallenge ? copy.unnamedChallengeTurn : copy.unnamedTurn;
    case "everyone":
      return undefined;
    default:
      return assertUnreachableTurn(turn);
  }
};
