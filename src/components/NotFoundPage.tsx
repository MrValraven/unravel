import { useEffect } from "react";
import { Link } from "react-router";
import { FiArrowLeft, FiCompass } from "react-icons/fi";
import { useCopy } from "../i18n/useCopy";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { sharedCopy } from "./copy";
import "./NotFoundPage.scss";

/** Tells crawlers to skip this page while it shows, and puts the page's own robots value back after. */
const useNoIndex = () => {
  useEffect(() => {
    const robotsMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="robots"]'
    );
    if (!robotsMeta) return;
    const previousContent = robotsMeta.content;
    robotsMeta.content = "noindex";
    return () => {
      robotsMeta.content = previousContent;
    };
  }, []);
};

const NotFoundPage = () => {
  const copy = useCopy(sharedCopy).notFound;
  useDocumentTitle(copy.documentTitle);
  useNoIndex();

  return (
    <main className="page not-found">
      <div className="not-found__mark" aria-hidden="true">
        <FiCompass size={44} />
      </div>
      <h1 className="not-found__title">{copy.title}</h1>
      <p className="not-found__body">{copy.body}</p>
      <Link
        to="/decks"
        className="button button--primary not-found__link"
        viewTransition
      >
        <FiArrowLeft aria-hidden="true" size={20} />
        {copy.backToDecks}
      </Link>
    </main>
  );
};

export default NotFoundPage;
