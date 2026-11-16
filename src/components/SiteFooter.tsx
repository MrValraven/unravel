import { Link } from "react-router";
import { FiHeart } from "react-icons/fi";
import { useCopy } from "../i18n/useCopy";
import { siteCopy } from "./siteCopy";
import "./SiteFooter.scss";

const AUTHOR_URL = "https://tiagocostadev.com";
const AUTHOR_NAME = "Tiago Costa";

interface SiteFooterProps {
  className?: string;
}

/** Links to the main places, a one-line privacy note and the made-by credit. */
export const SiteFooter = ({ className }: SiteFooterProps) => {
  const copy = useCopy(siteCopy).footer;
  const links = [
    { to: "/decks", label: copy.decks },
    { to: "/finder", label: copy.finder },
    { to: "/custom/new", label: copy.createDeck },
    { to: "/about", label: copy.about },
  ];

  return (
    <footer className={className ? `site-footer ${className}` : "site-footer"}>
      <nav className="site-footer__nav" aria-label={copy.navLabel}>
        <ul className="site-footer__links">
          {links.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="site-footer__link" viewTransition>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="site-footer__privacy">{copy.privacy}</p>
      <p className="site-footer__credit">
        {copy.madeWith}{" "}
        <FiHeart className="site-footer__heart" aria-hidden="true" size={16} />
        <span className="visually-hidden">{copy.love}</span> {copy.by}{" "}
        <a
          href={AUTHOR_URL}
          rel="noopener noreferrer"
          target="_blank"
          className="site-footer__author"
        >
          {AUTHOR_NAME}
        </a>
      </p>
    </footer>
  );
};
