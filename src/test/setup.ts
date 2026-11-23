import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom does not implement scrolling; stub it so app code can call it without
// "Not implemented" noise, while tests can still assert on the calls.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
Element.prototype.scrollTo =
  vi.fn() as unknown as typeof Element.prototype.scrollTo;
Element.prototype.scrollIntoView =
  vi.fn() as unknown as typeof Element.prototype.scrollIntoView;

// jsdom has no View Transitions API. React Router warns when a navigation asks
// for `viewTransition` and `document.startViewTransition` is missing.
Object.defineProperty(document, "startViewTransition", {
  configurable: true,
  writable: true,
  value: (
    update?:
      (() => void | Promise<void>) | { update?: () => void | Promise<void> }
  ) => {
    const cb = typeof update === "function" ? update : update?.update;
    // Run the update synchronously so navigations settle the same way they do
    // without a transition (the real API defers it, tests should not).
    const done = Promise.resolve(cb?.());
    return {
      finished: done,
      ready: Promise.resolve(),
      updateCallbackDone: done,
      skipTransition: () => {},
    };
  },
});
