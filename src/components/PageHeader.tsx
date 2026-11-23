import type { MouseEventHandler, ReactNode } from "react";
import { Link } from "react-router";
import { FiArrowLeft } from "react-icons/fi";
import { useCopy } from "../i18n/useCopy";
import { sharedCopy } from "./copy";
import "./PageHeader.scss";

export interface PageHeaderProps {
  /** Route the back link goes to. No back link when absent. */
  backTo?: string;
  /** Accessible name of the back link, e.g. "Back to decks". Defaults to "Back". */
  backLabel?: string;
  /** The back link replaces the current history entry instead of adding one. */
  isBackReplace?: boolean;
  /** Runs on a click of the back link; it can preventDefault to handle the way back itself. */
  onBackClick?: MouseEventHandler<HTMLAnchorElement>;
  /** Page title, rendered as the page's h1. */
  title?: string;
  /** Buttons shown at the end of the bar. */
  actions?: ReactNode;
}

export const PageHeader = ({
  backTo,
  backLabel,
  isBackReplace = false,
  onBackClick,
  title,
  actions,
}: PageHeaderProps) => {
  const copy = useCopy(sharedCopy).pageHeader;
  const label = backLabel ?? copy.back;
  // With a title beside it, the back link shrinks to its icon to give the title room.
  const isBackLabelVisible = !title;

  return (
    <header className={`page-header${title ? "" : " page-header--untitled"}`}>
      <div className="page-header__start">
        {backTo && (
          <Link
            to={backTo}
            replace={isBackReplace}
            onClick={onBackClick}
            viewTransition
            className={`page-header__back${isBackLabelVisible ? " page-header__back--labelled" : ""}`}
            aria-label={isBackLabelVisible ? undefined : label}
          >
            <FiArrowLeft aria-hidden="true" size={22} />
            {isBackLabelVisible && (
              <span className="page-header__back-label">{label}</span>
            )}
          </Link>
        )}
      </div>
      {title && <h1 className="page-header__title">{title}</h1>}
      <div className="page-header__actions">{actions}</div>
    </header>
  );
};

export default PageHeader;
