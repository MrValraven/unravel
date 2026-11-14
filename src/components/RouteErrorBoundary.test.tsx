import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { LocaleProvider } from "../i18n/LocaleContext";
import { isModuleLoadFailure } from "./moduleLoadFailure";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

const ThrowingScreen = ({ message }: { message: string }) => {
  throw new Error(message);
};

const renderWithFailingRoute = (message: string, locale: "en" | "pt" = "en") =>
  render(
    <LocaleProvider locale={locale}>
      <MemoryRouter initialEntries={["/decks"]}>
        <RouteErrorBoundary>
          <Routes>
            <Route path="/" element={<p>Home screen</p>} />
            <Route
              path="/decks"
              element={<ThrowingScreen message={message} />}
            />
          </Routes>
        </RouteErrorBoundary>
      </MemoryRouter>
    </LocaleProvider>
  );

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    // React reports caught render errors to the console; keep the test output readable.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it("asks for a reload when a route chunk failed to load after an update", () => {
    renderWithFailingRoute("Importing a module script failed.");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "A newer version of Unravel is available",
      })
    ).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "Reload Unravel" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Back to home" })
    ).not.toBeInTheDocument();
  });

  it("shows the update message in Portuguese", () => {
    renderWithFailingRoute(
      "Failed to fetch dynamically imported module: https://example.test/assets/DeckPickerPage.js",
      "pt"
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Há uma versão mais recente do Unravel",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Recarregar o Unravel" })
    ).toBeInTheDocument();
  });

  it("names an unexpected problem for other errors and leads back home", async () => {
    const user = userEvent.setup();
    renderWithFailingRoute("Cannot read properties of undefined");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "This screen hit an unexpected problem",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reload Unravel" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Back to home" }));
    expect(screen.getByText("Home screen")).toBeInTheDocument();
  });

  it("stays silent about a module load failure while the page is unloading", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    renderWithFailingRoute("Importing a module script failed.");
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(
      consoleErrorSpy.mock.calls.some(
        ([firstArgument]) => firstArgument === "A route failed to render"
      )
    ).toBe(false);

    // A page restored from the back-forward cache is live again, so failures show normally.
    act(() => {
      window.dispatchEvent(new Event("pageshow"));
    });
    renderWithFailingRoute("Importing a module script failed.");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "A newer version of Unravel is available",
      })
    ).toBeInTheDocument();
  });

  it("recognises each browser's module load failure message", () => {
    expect(
      isModuleLoadFailure(new TypeError("Importing a module script failed."))
    ).toBe(true);
    expect(
      isModuleLoadFailure(
        new TypeError("Failed to fetch dynamically imported module: /a.js")
      )
    ).toBe(true);
    expect(
      isModuleLoadFailure(
        new TypeError("error loading dynamically imported module: /a.js")
      )
    ).toBe(true);
    expect(isModuleLoadFailure(new Error("Something else broke"))).toBe(false);
  });
});
