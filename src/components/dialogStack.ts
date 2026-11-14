// Shared bookkeeping for open dialogs: only the topmost dialog answers Escape
// and traps focus, and the page behind stays locked until the last one closes.

const openDialogIds: symbol[] = [];
let previousBodyOverflow = "";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export const pushDialog = (dialogId: symbol): void => {
  if (openDialogIds.length === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // The app root sits beside the dialog portal, so marking it inert keeps
    // focus and screen readers inside the dialog.
    document.getElementById("root")?.setAttribute("inert", "");
  }
  openDialogIds.push(dialogId);
};

export const popDialog = (dialogId: symbol): void => {
  const index = openDialogIds.indexOf(dialogId);
  if (index !== -1) openDialogIds.splice(index, 1);
  if (openDialogIds.length === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.getElementById("root")?.removeAttribute("inert");
  }
};

export const isTopDialog = (dialogId: symbol): boolean =>
  openDialogIds[openDialogIds.length - 1] === dialogId;

export const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
  Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(
    (element) =>
      !element.closest("[inert]") && element.getClientRects().length > 0
  );

/** Keeps Tab and Shift+Tab cycling inside the container. */
export const trapTabKey = (
  event: KeyboardEvent,
  container: HTMLElement
): void => {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  if (!firstElement || !lastElement) {
    event.preventDefault();
    container.focus();
    return;
  }
  const activeElement = document.activeElement;
  const isAtStart =
    activeElement === firstElement || activeElement === container;
  const isOutside =
    !(activeElement instanceof Node) || !container.contains(activeElement);
  if (event.shiftKey && (isAtStart || isOutside)) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && (activeElement === lastElement || isOutside)) {
    event.preventDefault();
    firstElement.focus();
  }
};
