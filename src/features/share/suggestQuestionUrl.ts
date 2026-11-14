const NEW_ISSUE_URL = "https://github.com/MrValraven/unravel/issues/new";

/** Link that opens a prefilled GitHub issue for a question idea. */
export const buildSuggestQuestionUrl = (deckTitle?: string): string => {
  const trimmedDeckTitle = deckTitle?.trim();
  const title = trimmedDeckTitle
    ? `Question idea for ${trimmedDeckTitle}`
    : "Question idea";
  const body = [
    "Question text:",
    "",
    "",
    "Which deck does it fit?",
    trimmedDeckTitle ?? "",
  ].join("\n");
  const searchParams = new URLSearchParams({ title, body });
  return `${NEW_ISSUE_URL}?${searchParams.toString()}`;
};
