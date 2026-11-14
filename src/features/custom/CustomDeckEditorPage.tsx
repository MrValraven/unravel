import { useState } from "react";
import { useParams } from "react-router";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import {
  MAX_CUSTOM_DECKS,
  canCreateCustomDeck,
  getCustomDeck,
} from "../../storage/customDecks";
import { DeckEditorForm } from "./DeckEditorForm";
import { UnavailableNotice } from "./UnavailableNotice";
import { customCopy } from "./copy";

const readArrival = (customId: string | undefined) => ({
  customId,
  existingDeck: customId ? getCustomDeck(customId) : undefined,
  canCreate: canCreateCustomDeck(),
});

/** /custom/new and /custom/:customId/edit */
const CustomDeckEditorPage = () => {
  const { customId } = useParams();
  const copy = useCopy(customCopy);
  const editorCopy = copy.editor;
  // Read on arrival and kept: a delete in another tab leaves the open draft alone (saving
  // stores it again), and saving the deck that reaches the limit keeps the form on screen
  // while the router moves on to /custom.
  const [arrival, setArrival] = useState(() => readArrival(customId));
  if (arrival.customId !== customId) setArrival(readArrival(customId));
  const { existingDeck, canCreate } = arrival;

  useDocumentTitle(
    existingDeck
      ? formatCopy(editorCopy.editDocumentTitle, { title: existingDeck.title })
      : customId
        ? editorCopy.notFoundTitle
        : editorCopy.newTitle
  );

  if (customId && !existingDeck) {
    return (
      <UnavailableNotice
        pageTitle={editorCopy.editTitle}
        backLabel={editorCopy.backLabel}
        title={editorCopy.notFoundTitle}
        actionLabel={editorCopy.goToDecks}
      >
        <p>{editorCopy.notFoundBody}</p>
      </UnavailableNotice>
    );
  }

  if (!customId && !canCreate) {
    return (
      <UnavailableNotice
        pageTitle={editorCopy.newTitle}
        backLabel={editorCopy.backLabel}
        title={editorCopy.limitTitle}
        actionLabel={editorCopy.goToDecks}
      >
        <p>{formatCopy(copy.deckLimit, { max: MAX_CUSTOM_DECKS })}</p>
      </UnavailableNotice>
    );
  }

  // A fresh form per deck, so switching routes never carries a draft across.
  return <DeckEditorForm key={customId ?? "new"} existingDeck={existingDeck} />;
};

export default CustomDeckEditorPage;
