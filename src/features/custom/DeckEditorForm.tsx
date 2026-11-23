import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { FiCheck } from "react-icons/fi";
import { PageHeader } from "../../components/PageHeader";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import {
  MAX_CUSTOM_DECKS,
  canCreateCustomDeck,
  createCustomDeckId,
  getCustomDeck,
  saveCustomDeck,
  type CustomDeck,
} from "../../storage/customDecks";
import {
  NEW_DECK_DRAFT_KEY,
  clearCustomDeckDraft,
  loadCustomDeckDraft,
  saveCustomDeckDraft,
} from "../../storage/customDeckDraft";
import { clearProgress, loadProgress } from "../../storage/progress";
import { CardListEditor } from "./CardListEditor";
import { DeckTitleField } from "./DeckTitleField";
import { DiscardChangesDialog } from "./DiscardChangesDialog";
import { RestoreDraftDialog } from "./RestoreDraftDialog";
import { StatusMessage } from "./StatusMessage";
import { customCopy } from "./copy";
import { MAX_CARDS, hasCardListChanged, type TextProblem } from "./deckRules";
import * as model from "./editorModel";
import { createSavedDeckState } from "./navigationState";
import { useEditorFocus } from "./useEditorFocus";
import { useStatusMessage } from "./useStatusMessage";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";
import "./DeckEditorForm.scss";

const DECKS_PATH = "/custom";
const noProblems: Record<string, TextProblem> = {};
/** Typing pauses this long before the draft is written, so each keystroke does not hit storage. */
const DRAFT_SAVE_DELAY_MILLISECONDS = 600;

/** The autosaved draft of this deck when it differs from the deck as it was opened. */
const findOfferedDraft = (
  deckKey: string,
  initialDraft: model.DeckDraft
): model.DeckDraft | undefined => {
  const storedDraft = loadCustomDeckDraft(deckKey);
  if (!storedDraft) return undefined;
  const offeredDraft = { title: storedDraft.title, cards: storedDraft.cards };
  return model.isDraftChanged(initialDraft, offeredDraft)
    ? offeredDraft
    : undefined;
};

/** Clears the stored draft only when it is this deck's, so another deck's edits stay. */
const clearDraftOf = (deckKey: string) => {
  if (loadCustomDeckDraft(deckKey)) clearCustomDeckDraft();
};

export const DeckEditorForm = ({
  existingDeck,
}: {
  existingDeck?: CustomDeck;
}) => {
  const copy = useCopy(customCopy);
  const editorCopy = copy.editor;
  const navigate = useNavigate();
  const [initialDraft] = useState(() =>
    existingDeck ? model.draftFromDeck(existingDeck) : model.createEmptyDraft()
  );
  const [draft, dispatch] = useReducer(model.draftReducer, initialDraft);
  const [hasTriedSave, setHasTriedSave] = useState(false);
  const deckKey = existingDeck?.id ?? NEW_DECK_DRAFT_KEY;
  const [offeredDraft, setOfferedDraft] = useState(() =>
    findOfferedDraft(deckKey, initialDraft)
  );
  // Set once the editor is on its way out, so a pending autosave cannot bring the draft back.
  const isAutosaveStoppedRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { cardListRef, addCardButtonRef, requestFocus } = useEditorFocus();
  const { notice, showStatus, dismissStatus } = useStatusMessage();
  // A new deck keeps one id across retries, so saving again after a block never makes a second deck.
  const newDeckIdRef = useRef<string | null>(null);

  const validation = model.validateDraft(draft);
  const isChanged = model.isDraftChanged(initialDraft, draft);
  const guard = useUnsavedChangesGuard(isChanged);

  useEffect(() => {
    // While the restore offer is open the stored draft is the player's to decide on.
    if (offeredDraft || isAutosaveStoppedRef.current) return;
    if (!isChanged) {
      clearDraftOf(deckKey);
      return;
    }
    let isPending = true;
    const writeDraft = () => {
      if (!isPending || isAutosaveStoppedRef.current) return;
      isPending = false;
      window.clearTimeout(timeout);
      saveCustomDeckDraft({
        deckKey,
        title: draft.title,
        cards: draft.cards,
        savedAt: Date.now(),
      });
    };
    const timeout = window.setTimeout(
      writeDraft,
      DRAFT_SAVE_DELAY_MILLISECONDS
    );
    // A phone may close a hidden tab before the timer fires, so the pending draft is written now.
    const writeDraftWhenHidden = () => {
      if (document.visibilityState === "hidden") writeDraft();
    };
    document.addEventListener("visibilitychange", writeDraftWhenHidden);
    window.addEventListener("pagehide", writeDraft);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", writeDraftWhenHidden);
      window.removeEventListener("pagehide", writeDraft);
    };
  }, [draft, isChanged, deckKey, offeredDraft]);

  useEffect(() => {
    if (!existingDeck) titleInputRef.current?.focus();
    // Only on arrival: a new deck starts in its title field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const focusFirstProblem = () => {
    if (validation.titleProblem) {
      titleInputRef.current?.focus();
      return;
    }
    if (validation.deckProblem) {
      addCardButtonRef.current?.focus();
      return;
    }
    const firstProblemCard = draft.cards.find(
      (card) => validation.cardProblems[card.key]
    );
    if (firstProblemCard)
      requestFocus({ cardKey: firstProblemCard.key, target: "text" });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasTriedSave(true);
    if (!validation.isValid) {
      focusFirstProblem();
      return;
    }
    // After a blocked save the new deck sits in memory under its kept id, so a retry replaces it.
    const knownDeckId = existingDeck?.id ?? newDeckIdRef.current;
    const storedDeck = knownDeckId ? getCustomDeck(knownDeckId) : undefined;
    if (!storedDeck && !canCreateCustomDeck()) {
      showStatus(formatCopy(copy.deckLimit, { max: MAX_CUSTOM_DECKS }));
      return;
    }
    const previousDeck = storedDeck ?? existingDeck;
    const now = Date.now();
    newDeckIdRef.current ??= createCustomDeckId();
    const savedDeck = model.draftToCustomDeck(draft, {
      deckId: existingDeck?.id ?? newDeckIdRef.current,
      createdAt: existingDeck?.createdAt ?? now,
      updatedAt: now,
      previousCardIds: previousDeck?.cards.map((card) => card.id),
    });
    const saveResult = saveCustomDeck(savedDeck);
    if (saveResult === "deck-limit") {
      showStatus(formatCopy(copy.deckLimit, { max: MAX_CUSTOM_DECKS }));
      return;
    }
    if (saveResult === "storage-blocked") {
      showStatus(copy.status.saveBlocked);
      return;
    }
    // A saved game of this deck no longer matches once cards were added or removed.
    const isSavedGameOfThisDeck = loadProgress()?.deckId === savedDeck.id;
    if (
      previousDeck &&
      isSavedGameOfThisDeck &&
      hasCardListChanged(previousDeck.cards, savedDeck.cards)
    ) {
      clearProgress();
    }
    // The deck is saved, so these edits are no longer unsaved: leave without asking.
    isAutosaveStoppedRef.current = true;
    clearDraftOf(deckKey);
    guard.allowNextNavigation();
    void navigate(DECKS_PATH, {
      state: createSavedDeckState(savedDeck.title),
      viewTransition: true,
    });
  };

  const restoreOfferedDraft = () => {
    if (!offeredDraft) return;
    dispatch({
      type: "restore",
      draft: model.rekeyRestoredDraft(
        offeredDraft,
        existingDeck?.cards.map((card) => card.id) ?? []
      ),
    });
    setOfferedDraft(undefined);
  };

  const discardOfferedDraft = () => {
    clearDraftOf(deckKey);
    setOfferedDraft(undefined);
  };

  const discardChangesAndLeave = () => {
    isAutosaveStoppedRef.current = true;
    clearDraftOf(deckKey);
    guard.leave();
  };

  let deckProblemMessage: string | undefined;
  if (hasTriedSave && validation.deckProblem === "no-cards") {
    deckProblemMessage = editorCopy.problems.noCards;
  } else if (hasTriedSave && validation.deckProblem === "too-many-cards") {
    deckProblemMessage = formatCopy(editorCopy.problems.tooManyCards, {
      max: MAX_CARDS,
    });
  }

  return (
    <div className="page deck-editor">
      <PageHeader
        backTo={DECKS_PATH}
        backLabel={editorCopy.backLabel}
        title={existingDeck ? editorCopy.editTitle : editorCopy.newTitle}
      />
      <main className="deck-editor__main">
        <form className="deck-editor__form" noValidate onSubmit={handleSubmit}>
          <p className="deck-editor__intro">{editorCopy.intro}</p>
          <DeckTitleField
            value={draft.title}
            onChange={(title) => dispatch({ type: "set-title", title })}
            problem={hasTriedSave ? validation.titleProblem : undefined}
            inputRef={titleInputRef}
          />
          <CardListEditor
            cards={draft.cards}
            cardProblems={hasTriedSave ? validation.cardProblems : noProblems}
            deckProblemMessage={deckProblemMessage}
            dispatch={dispatch}
            requestFocus={requestFocus}
            cardListRef={cardListRef}
            addCardButtonRef={addCardButtonRef}
          />
          {/* Sticky to the bottom of the page column, so Save stays in reach while a long
              deck scrolls and rests at the bottom of the screen when the deck is short. */}
          <div className="deck-editor__footer">
            <button
              type="button"
              className="button button--quiet deck-editor__cancel"
              onClick={() =>
                void navigate(DECKS_PATH, { viewTransition: true })
              }
            >
              {editorCopy.cancel}
            </button>
            <button
              type="submit"
              className="button button--primary deck-editor__save"
            >
              <FiCheck aria-hidden="true" size={20} />
              {editorCopy.save}
            </button>
          </div>
        </form>
      </main>

      <DiscardChangesDialog
        isOpen={guard.isBlocked}
        onKeepEditing={guard.stay}
        onDiscard={discardChangesAndLeave}
      />
      <RestoreDraftDialog
        isOpen={offeredDraft !== undefined}
        onRestore={restoreOfferedDraft}
        onDiscard={discardOfferedDraft}
      />
      <StatusMessage notice={notice} onDismissed={dismissStatus} />
    </div>
  );
};

export default DeckEditorForm;
