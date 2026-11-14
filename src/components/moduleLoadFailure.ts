import { isDocumentUnloading } from "./documentUnload";

// Messages browsers use when a lazy route chunk is gone, usually after a deploy
// replaced the files a stale tab still points at (Safari, Chrome, Firefox).
const MODULE_LOAD_FAILURE_PATTERN =
  /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module/i;

/** True when the error says a lazy module could not be fetched, so a reload picks up the new files. */
export const isModuleLoadFailure = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return MODULE_LOAD_FAILURE_PATTERN.test(message);
};

/** True for a lazy module the browser dropped because the page itself is going away. */
export const isModuleLoadFailureDuringUnload = (error: unknown): boolean =>
  isDocumentUnloading() && isModuleLoadFailure(error);

interface RootErrorInfo {
  componentStack?: string;
}

/**
 * The root's onCaughtError: logs like React's default handler, with the component stack,
 * and stays quiet for a lazy chunk the browser dropped while the page unloads.
 */
export const reportCaughtRootError = (
  error: unknown,
  errorInfo: RootErrorInfo
) => {
  if (isModuleLoadFailureDuringUnload(error)) return;
  if (errorInfo.componentStack) {
    console.error(error, errorInfo.componentStack);
    return;
  }
  console.error(error);
};

/**
 * The root's onUncaughtError: reports the error globally like React's default handler,
 * with a warning that carries the component stack, and stays quiet for a lazy chunk the
 * browser dropped while the page unloads.
 */
export const reportUncaughtRootError = (
  error: unknown,
  errorInfo: RootErrorInfo
) => {
  if (isModuleLoadFailureDuringUnload(error)) return;
  if (typeof globalThis.reportError === "function") {
    globalThis.reportError(error);
  } else {
    console.error(error);
  }
  console.warn(
    "An error occurred in one of your React components. Consider adding an error boundary to handle it.",
    errorInfo.componentStack ?? ""
  );
};
