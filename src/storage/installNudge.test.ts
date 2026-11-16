import { beforeEach, describe, expect, it } from "vitest";
import {
  dismissInstallNudge,
  installNudgeStore,
  isInstallNudgeDismissed,
} from "./installNudge";

describe("install nudge dismissals", () => {
  beforeEach(() => window.localStorage.clear());

  it("remembers a dismissal per placement", () => {
    dismissInstallNudge("deck-end");
    expect(isInstallNudgeDismissed("deck-end")).toBe(true);
    expect(isInstallNudgeDismissed("home")).toBe(false);
  });

  it("stores each placement once", () => {
    dismissInstallNudge("home");
    dismissInstallNudge("home");
    expect(installNudgeStore.get()).toEqual(["home"]);
  });

  it("drops unknown placements from a stored list", () => {
    window.localStorage.setItem(
      "unravel:v2:installNudgeDismissed",
      JSON.stringify(["home", "elsewhere", 3])
    );
    expect(installNudgeStore.get()).toEqual(["home"]);
  });
});
