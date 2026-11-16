import type { ReactNode } from "react";
import { Link } from "react-router";
import { FiAlertCircle, FiArrowLeft } from "react-icons/fi";
import { PageHeader } from "../../components/PageHeader";
import "./UnavailableNotice.scss";

interface UnavailableNoticeProps {
  /** The page header title. */
  pageTitle: string;
  backLabel: string;
  title: string;
  children: ReactNode;
  actionLabel: string;
}

/** A full-page explanation shown when a deck cannot be edited or a link cannot be imported. */
export const UnavailableNotice = ({
  pageTitle,
  backLabel,
  title,
  children,
  actionLabel,
}: UnavailableNoticeProps) => (
  <div className="page">
    <PageHeader backTo="/custom" backLabel={backLabel} title={pageTitle} />
    <main className="unavailable-notice">
      <span className="unavailable-notice__mark" aria-hidden="true">
        <FiAlertCircle size={36} />
      </span>
      <h2 className="unavailable-notice__title">{title}</h2>
      <div className="unavailable-notice__body">{children}</div>
      <Link to="/custom" className="button button--primary" viewTransition>
        <FiArrowLeft aria-hidden="true" size={20} />
        {actionLabel}
      </Link>
    </main>
  </div>
);

export default UnavailableNotice;
