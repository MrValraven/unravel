import { useEffect, useMemo, useRef, useState } from "react";
import { FiFeather } from "react-icons/fi";
import { PageHeader } from "../../components/PageHeader";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import {
  canCreateCustomDeck,
  deleteCustomDeck,
  useCustomDecks,
  type CustomDeck,
} from "../../storage/customDecks";
import { clearProgress, loadProgress } from "../../storage/progress";
import { CreateDeckAction } from "./CreateDeckAction";
import { CustomDeckListItem } from "./CustomDeckListItem";
import { DeleteDeckDialog } from "./DeleteDeckDialog";
import { LongLinkDialog } from "./LongLinkDialog";
import { StatusMessage } from "./StatusMessage";
import { customCopy } from "./copy";
import { useSavedDeckNotice } from "./useSavedDeckNotice";
import { useShareDeck } from "./useShareDeck";
import { useStatusMessage } from "./useStatusMessage";
import "./CustomDecksPage.scss";

const CustomDecksPage = () => {
  const copy = useCopy(customCopy);
  const listCopy = copy.list;
  useDocumentTitle(listCopy.title);

  const customDecks = useCustomDecks();
  // Read after subscribing above, so the page re-renders when the count changes.
  const canCreate = canCreateCustomDeck();
  const newestFirstDecks = useMemo(
    () =>
      [...customDecks].sort(
        (first, second) => second.updatedAt - first.updatedAt
      ),
    [customDecks]
  );

  const { notice, showStatus, dismissStatus } = useStatusMessage();
  const { requestShare, pendingLongLink, confirmLongLink, cancelLongLink } =
    useShareDeck(showStatus);
  useSavedDeckNotice(showStatus);

  const [deckPendingDelete, setDeckPendingDelete] = useState<CustomDeck | null>(
    null
  );
  const [leavingDeckId, setLeavingDeckId] = useState<string | null>(null);
  const createAreaRef = useRef<HTMLDivElement>(null);
  const [shouldFocusCreate, setShouldFocusCreate] = useState(false);

  // After the commit: at the deck limit the create button becomes a link, so the
  // element only exists once React has rendered the shorter list.
  useEffect(() => {
    if (!shouldFocusCreate) return;
    createAreaRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    setShouldFocusCreate(false);
  }, [shouldFocusCreate]);

  const confirmDelete = () => {
    if (!deckPendingDelete) return;
    setLeavingDeckId(deckPendingDelete.id);
    setDeckPendingDelete(null);
  };

  const handleDeckLeft = (deck: CustomDeck) => {
    deleteCustomDeck(deck.id);
    // A saved game of a deleted deck can never resume, so drop it with the deck.
    if (loadProgress()?.deckId === deck.id) clearProgress();
    setLeavingDeckId(null);
    showStatus(formatCopy(copy.status.deletedDeck, { title: deck.title }));
    // The deleted item held focus; hand it to the create action.
    setShouldFocusCreate(true);
  };

  const hasDecks = newestFirstDecks.length > 0;

  return (
    <div className="page custom-decks">
      <PageHeader
        backTo="/decks"
        backLabel={listCopy.backLabel}
        title={listCopy.title}
      />
      <main className="custom-decks__main">
        <div className="custom-decks__intro" ref={createAreaRef}>
          <p className="custom-decks__lead">{listCopy.intro}</p>
          <CreateDeckAction
            canCreate={canCreate}
            hasDecks={hasDecks}
            onLimitReached={showStatus}
          />
        </div>

        {hasDecks ? (
          <ul
            className="custom-decks__list"
            role="list"
            aria-label={listCopy.deckListLabel}
          >
            {newestFirstDecks.map((deck) => (
              <CustomDeckListItem
                key={deck.id}
                deck={deck}
                isLeaving={deck.id === leavingDeckId}
                onLeft={handleDeckLeft}
                onShare={requestShare}
                onDelete={setDeckPendingDelete}
              />
            ))}
          </ul>
        ) : (
          <section className="custom-decks__empty">
            <span className="custom-decks__empty-mark" aria-hidden="true">
              <FiFeather size={36} />
            </span>
            <h2 className="custom-decks__empty-title">{listCopy.emptyTitle}</h2>
            <p className="custom-decks__empty-body">{listCopy.emptyBody}</p>
          </section>
        )}
      </main>

      <DeleteDeckDialog
        deck={deckPendingDelete}
        onConfirm={confirmDelete}
        onCancel={() => setDeckPendingDelete(null)}
      />
      <LongLinkDialog
        pendingLongLink={pendingLongLink}
        onConfirm={confirmLongLink}
        onCancel={cancelLongLink}
      />
      <StatusMessage notice={notice} onDismissed={dismissStatus} />
    </div>
  );
};

export default CustomDecksPage;
