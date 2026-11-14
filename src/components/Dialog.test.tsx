import { useRef, useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./Dialog";

interface DialogHarnessProps {
  shouldFocusConfirm?: boolean;
}

const DialogHarness = ({ shouldFocusConfirm = false }: DialogHarnessProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open dialog
      </button>
      <button type="button">Outside button</button>
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Test dialog"
        description="A dialog used by the tests"
        initialFocusRef={shouldFocusConfirm ? confirmButtonRef : undefined}
        footer={
          <>
            <button type="button">Cancel action</button>
            <button ref={confirmButtonRef} type="button">
              Confirm action
            </button>
          </>
        }
      >
        <p>Body text</p>
      </Dialog>
    </>
  );
};

const NestedDialogHarness = () => {
  const [isOuterOpen, setIsOuterOpen] = useState(false);
  const [isInnerOpen, setIsInnerOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setIsOuterOpen(true)}>
        Open outer dialog
      </button>
      <Dialog
        isOpen={isOuterOpen}
        onClose={() => setIsOuterOpen(false)}
        title="Outer dialog"
      >
        <button type="button" onClick={() => setIsInnerOpen(true)}>
          Open inner dialog
        </button>
      </Dialog>
      <Dialog
        isOpen={isInnerOpen}
        onClose={() => setIsInnerOpen(false)}
        title="Inner dialog"
      >
        <p>Inner body</p>
      </Dialog>
    </>
  );
};

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Open dialog" }));
  return screen.getByRole("dialog", { name: "Test dialog" });
};

const waitForDialogToClose = () =>
  waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

describe("Dialog", () => {
  // jsdom has no layout, so every element reports zero client rects; the
  // focus trap skips invisible elements, so give each element one rect here.
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
      new DOMRect(0, 0, 10, 10),
    ] as unknown as DOMRectList);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("labels itself with its title and description and takes focus on open", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    const dialog = await openDialog(user);

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("A dialog used by the tests");
    expect(dialog).toHaveFocus();
  });

  it("focuses the initial focus element when one is given", async () => {
    const user = userEvent.setup();
    render(<DialogHarness shouldFocusConfirm />);

    await openDialog(user);

    expect(
      screen.getByRole("button", { name: "Confirm action" })
    ).toHaveFocus();
  });

  it("keeps Tab and Shift+Tab cycling inside the dialog", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await openDialog(user);

    const closeButton = screen.getByRole("button", { name: "Close dialog" });
    const cancelButton = screen.getByRole("button", { name: "Cancel action" });
    const confirmButton = screen.getByRole("button", {
      name: "Confirm action",
    });

    await user.tab();
    expect(closeButton).toHaveFocus();
    await user.tab();
    expect(cancelButton).toHaveFocus();
    await user.tab();
    expect(confirmButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirmButton).toHaveFocus();
  });

  it("pulls focus back into the dialog when something outside takes it", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const dialog = await openDialog(user);

    act(() => {
      screen.getByRole("button", { name: "Outside button" }).focus();
    });

    expect(dialog).toHaveFocus();
  });

  it("closes only the topmost dialog on Escape when dialogs are nested", async () => {
    const user = userEvent.setup();
    render(<NestedDialogHarness />);
    await user.click(screen.getByRole("button", { name: "Open outer dialog" }));
    await user.click(screen.getByRole("button", { name: "Open inner dialog" }));
    expect(screen.getByRole("dialog", { name: "Inner dialog" })).toHaveFocus();

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Inner dialog" })
      ).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole("dialog", { name: "Outer dialog" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open inner dialog" })
    ).toHaveFocus();
  });

  it("closes on Escape and returns focus to the button that opened it", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await openDialog(user);

    await user.keyboard("{Escape}");

    await waitForDialogToClose();
    expect(screen.getByRole("button", { name: "Open dialog" })).toHaveFocus();
  });

  it("closes when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await openDialog(user);

    const backdrop = document.querySelector<HTMLElement>(".dialog__backdrop");
    expect(backdrop).not.toBeNull();
    if (backdrop) await user.click(backdrop);

    await waitForDialogToClose();
    expect(screen.getByRole("button", { name: "Open dialog" })).toHaveFocus();
  });

  it("locks page scroll while open and restores it after closing", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await openDialog(user);

    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Close dialog" }));

    await waitForDialogToClose();
    expect(document.body.style.overflow).toBe("");
  });
});
