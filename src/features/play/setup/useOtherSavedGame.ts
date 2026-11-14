import { useMemo } from "react";
import { resolveDeck } from "../../../content/resolveDeck";
import { localize } from "../../../i18n/localize";
import { useLocale } from "../../../i18n/LocaleContext";
import { useCustomDecks } from "../../../storage/customDecks";
import { useFavouriteIds } from "../../../storage/favourites";
import { useProgress } from "../../../storage/progress";

export type OtherSavedGame =
  { kind: "none" } | { kind: "saved"; deckTitle: string | undefined };

/** The saved game a new start would replace: there is one save slot for every deck. */
export function useOtherSavedGame(currentDeckId: string): OtherSavedGame {
  const savedProgress = useProgress();
  const favouriteIds = useFavouriteIds();
  const customDecks = useCustomDecks();
  const locale = useLocale();

  return useMemo((): OtherSavedGame => {
    if (!savedProgress || savedProgress.deckId === currentDeckId)
      return { kind: "none" };
    const savedDeck = resolveDeck(savedProgress.deckId, {
      favouriteIds,
      customDecks,
    });
    return {
      kind: "saved",
      deckTitle: savedDeck ? localize(savedDeck.title, locale) : undefined,
    };
  }, [savedProgress, currentDeckId, favouriteIds, customDecks, locale]);
}
