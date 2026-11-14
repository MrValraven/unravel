import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDocumentUnloading } from "./documentUnload";
import {
  isModuleLoadFailure,
  isModuleLoadFailureDuringUnload,
  reportCaughtRootError,
  reportUncaughtRootError,
} from "./moduleLoadFailure";

const COMPONENT_STACK = "\n    at PlayPage\n    at RouteErrorCatcher";
const unloadFailure = new TypeError("Importing a module script failed.");

describe("root error reporting", () => {
  beforeEach(() => {
    window.dispatchEvent(new Event("pageshow"));
  });
  afterEach(() => {
    window.dispatchEvent(new Event("pageshow"));
    vi.restoreAllMocks();
  });

  it("follows the page lifecycle: pagehide and beforeunload start unloading, pageshow ends it", () => {
    expect(isDocumentUnloading()).toBe(false);
    window.dispatchEvent(new Event("pagehide"));
    expect(isDocumentUnloading()).toBe(true);
    window.dispatchEvent(new Event("pageshow"));
    expect(isDocumentUnloading()).toBe(false);
    window.dispatchEvent(new Event("beforeunload"));
    expect(isDocumentUnloading()).toBe(true);
  });

  it("matches a module load failure only while the page unloads", () => {
    expect(isModuleLoadFailure(unloadFailure)).toBe(true);
    expect(isModuleLoadFailureDuringUnload(unloadFailure)).toBe(false);
    window.dispatchEvent(new Event("pagehide"));
    expect(isModuleLoadFailureDuringUnload(unloadFailure)).toBe(true);
    expect(
      isModuleLoadFailureDuringUnload(new Error("Something else broke"))
    ).toBe(false);
  });

  it("logs a caught error with its component stack", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const renderError = new Error("Cannot read properties of undefined");
    reportCaughtRootError(renderError, { componentStack: COMPONENT_STACK });
    expect(consoleErrorSpy).toHaveBeenCalledWith(renderError, COMPONENT_STACK);
  });

  it("still logs a caught module load failure while the page is live", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    reportCaughtRootError(unloadFailure, {});
    expect(consoleErrorSpy).toHaveBeenCalledWith(unloadFailure);
  });

  it("logs other caught errors during unload", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    window.dispatchEvent(new Event("pagehide"));
    const renderError = new Error("Cannot read properties of undefined");
    reportCaughtRootError(renderError, { componentStack: COMPONENT_STACK });
    expect(consoleErrorSpy).toHaveBeenCalledWith(renderError, COMPONENT_STACK);
  });

  it("stays quiet about a module load failure while the page unloads", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const reportErrorSpy = vi.fn();
    vi.stubGlobal("reportError", reportErrorSpy);
    window.dispatchEvent(new Event("pagehide"));

    reportCaughtRootError(unloadFailure, { componentStack: COMPONENT_STACK });
    reportUncaughtRootError(unloadFailure, { componentStack: COMPONENT_STACK });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(reportErrorSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("reports an uncaught error globally and warns with the component stack", () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const reportErrorSpy = vi.fn();
    vi.stubGlobal("reportError", reportErrorSpy);
    const renderError = new Error("Cannot read properties of undefined");

    reportUncaughtRootError(renderError, { componentStack: COMPONENT_STACK });

    expect(reportErrorSpy).toHaveBeenCalledWith(renderError);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.any(String),
      COMPONENT_STACK
    );
    vi.unstubAllGlobals();
  });
});
