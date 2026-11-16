import { Navigate } from "react-router";
import { useResumableGame } from "./useResumableGame";

/**
 * /continue, the "Continue game" home screen shortcut: opens the saved game on the
 * card it stopped at, or the deck list when there is nothing to continue.
 */
const ContinueRedirect = () => {
  const game = useResumableGame();
  const target = game ? `/play/${encodeURIComponent(game.deck.id)}` : "/decks";
  return <Navigate to={target} replace />;
};

export default ContinueRedirect;
