import {
  useEffect,
  useId,
  useRef,
  useState,
  type AnimationEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { useCopy } from "../i18n/useCopy";
import { sharedCopy } from "./copy";
import { isTopDialog, popDialog, pushDialog, trapTabKey } from "./dialogStack";
import "./Dialog.scss";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Rendered as the heading and wired to aria-labelledby. */
  title: string;
  description?: string;
  /** "sheet" slides up from the bottom on phones and centres on wider screens. */
  variant?: "center" | "sheet";
  /** Element to focus on open. Defaults to the dialog panel itself. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  children?: ReactNode;
  footer?: ReactNode;
}

type DialogPhase = "open" | "closing" | "closed";

/** Unmounts even when animationend never fires (hidden tab, test runner). */
const EXIT_FALLBACK_MILLISECONDS = 400;

export const Dialog = ({
  isOpen,
  onClose,
  title,
  description,
  variant = "center",
  initialFocusRef,
  children,
  footer,
}: DialogProps) => {
  const copy = useCopy(sharedCopy).dialog;
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const latestInitialFocusRef = useRef(initialFocusRef);
  const [phase, setPhase] = useState<DialogPhase>(isOpen ? "open" : "closed");

  // Adjust the phase while rendering so the panel mounts in the same commit.
  if (isOpen && phase !== "open") setPhase("open");
  if (!isOpen && phase === "open") setPhase("closing");

  useEffect(() => {
    onCloseRef.current = onClose;
    latestInitialFocusRef.current = initialFocusRef;
  });

  useEffect(() => {
    if (!isOpen) return;
    const dialogId = Symbol("dialog");
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    pushDialog(dialogId);
    // preventScroll keeps the sheet at its top: focusing a footer button must not scroll the title away.
    (latestInitialFocusRef.current?.current ?? panelRef.current)?.focus({
      preventScroll: true,
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel || !isTopDialog(dialogId)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      } else if (event.key === "Tab") {
        trapTabKey(event, panel);
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      const panel = panelRef.current;
      if (!panel || !isTopDialog(dialogId)) return;
      if (event.target instanceof Node && !panel.contains(event.target)) {
        panel.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      popDialog(dialogId);
      if (opener?.isConnected) opener.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (phase !== "closing") return;
    const timer = window.setTimeout(
      () => setPhase("closed"),
      EXIT_FALLBACK_MILLISECONDS
    );
    return () => window.clearTimeout(timer);
  }, [phase]);

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && phase === "closing")
      setPhase("closed");
  };

  if (phase === "closed") return null;

  return createPortal(
    <div
      className={`dialog dialog--${variant}`}
      data-state={phase}
      inert={phase === "closing"}
    >
      <div className="dialog__backdrop" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        className="dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onAnimationEnd={handleAnimationEnd}
      >
        <div className="dialog__header">
          <h2 id={titleId} className="dialog__title">
            {title}
          </h2>
          <button
            type="button"
            className="icon-button dialog__close"
            aria-label={copy.close}
            onClick={onClose}
          >
            <FiX aria-hidden="true" size={22} />
          </button>
        </div>
        {/* Only this part scrolls, so the title, close button and footer actions stay in view. */}
        {(description || children) && (
          <div
            className={`dialog__content${description ? " dialog__content--described" : ""}`}
          >
            {description && (
              <p id={descriptionId} className="dialog__description">
                {description}
              </p>
            )}
            {children && <div className="dialog__body">{children}</div>}
          </div>
        )}
        {footer && <div className="dialog__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Dialog;
