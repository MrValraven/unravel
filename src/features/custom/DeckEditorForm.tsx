import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
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
import { clearProgress, loadProgress } from "../../storage/progress";
import { CardListEditor } from "./CardListEditor";
import { DeckTitleField } from "./DeckTitleField";
import { DiscardChangesDialog } from "./DiscardChangesDialog";
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
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { cardListRef, addCardButtonRef, requestFocus } = useEditorFocus();
  const { notice, showStatus, dismissStatus } = useStatusMessage();

  const validation = model.validateDraft(draft);
  const isChanged = model.isDraftChanged(initialDraft, draft);
  useUnsavedChangesGuard(isChanged);

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
    const storedDeck = existingDeck
      ? getCustomDeck(existingDeck.id)
      : undefined;
    if (!storedDeck && !canCreateCustomDeck()) {
      showStatus(formatCopy(copy.deckLimit, { max: MAX_CUSTOM_DECKS }));
      return;
    }
    const previousDeck = storedDeck ?? existingDeck;
    const now = Date.now();
    const savedDeck = model.draftToCustomDeck(draft, {
      deckId: existingDeck?.id ?? createCustomDeckId(),
      createdAt: existingDeck?.createdAt ?? now,
      updatedAt: now,
      previousCardIds: previousDeck?.cards.map((card) => card.id),
    });
    saveCustomDeck(savedDeck);
    // A saved game of this deck no longer matches once cards were added or removed.
    const isSavedGameOfThisDeck = loadProgress()?.deckId === savedDeck.id;
    if (
      previousDeck &&
      isSavedGameOfThisDeck &&
      hasCardListChanged(previousDeck.cards, savedDeck.cards)
    ) {
      clearProgress();
    }
    void navigate(DECKS_PATH, { state: createSavedDeckState(savedDeck.title) });
  };

  const requestLeave = () => {
    if (isChanged) setIsDiscardDialogOpen(true);
    else void navigate(DECKS_PATH);
  };

  // The header back link is a router Link; cancelling its click keeps the edits on screen.
  const handleHeaderClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (
      !isChanged ||
      !(event.target instanceof Element) ||
      !event.target.closest("a")
    )
      return;
    // Modified or non-primary clicks open a new tab and leave this draft open, so let them through.
    const isPlainClick =
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey;
    if (!isPlainClick) return;
    event.preventDefault();
    setIsDiscardDialogOpen(true);
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
      <div onClickCapture={handleHeaderClickCapture}>
        <PageHeader
          backTo={DECKS_PATH}
          backLabel={editorCopy.backLabel}
          title={existingDeck ? editorCopy.editTitle : editorCopy.newTitle}
        />
      </div>
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
              onClick={requestLeave}
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
        isOpen={isDiscardDialogOpen}
        onKeepEditing={() => setIsDiscardDialogOpen(false)}
        onDiscard={() => void navigate(DECKS_PATH)}
      />
      <StatusMessage notice={notice} onDismissed={dismissStatus} />
    </div>
  );
};

export default DeckEditorForm;
