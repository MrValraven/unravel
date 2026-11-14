import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AgeGateDialog } from "../../components/AgeGateDialog";
import NotFoundPage from "../../components/NotFoundPage";
import { PageHeader } from "../../components/PageHeader";
import { resolveDeck } from "../../content/resolveDeck";
import { localize } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useCopy } from "../../i18n/useCopy";
import { useAgeConfirmed } from "../../storage/ageGate";
import { useCustomDecks } from "../../storage/customDecks";
import { useFavouriteIds } from "../../storage/favourites";
import { PlayFlow } from "./components/PlayFlow";
import { playCopy } from "./copy";

/**
 * Resolves the deck once per visit and pins it: favourites and custom decks
 * change while you play (unstarring a card, editing in another tab), and the
 * running game keeps the cards it started with.
 */
const PlayDeckRoute = ({ deckId }: { deckId: string }) => {
  const copy = useCopy(playCopy);
  const locale = useLocale();
  const navigate = useNavigate();
  const favouriteIds = useFavouriteIds();
  const customDecks = useCustomDecks();
  const isAgeConfirmed = useAgeConfirmed();
  const [deck] = useState(() =>
    resolveDeck(deckId, { favouriteIds, customDecks })
  );

  if (!deck) return <NotFoundPage />;
  const isAgeGateOpen = deck.isAdult && !isAgeConfirmed;

  return (
    <>
      {isAgeGateOpen ? (
        <main className="page">
          <PageHeader backTo="/decks" backLabel={copy.backToDecks} />
        </main>
      ) : (
        <PlayFlow deck={deck} />
      )}
      {deck.isAdult && (
        <AgeGateDialog
          isOpen={isAgeGateOpen}
          deckTitle={localize(deck.title, locale)}
          onConfirm={() => undefined}
          onCancel={() => void navigate("/decks")}
        />
      )}
    </>
  );
};

const PlayPage = () => {
  const { deckId = "" } = useParams();
  return <PlayDeckRoute key={deckId} deckId={deckId} />;
};

export default PlayPage;
