import { Link } from "react-router";
import { FiChevronRight, FiCompass } from "react-icons/fi";
import { useCopy } from "../../../i18n/useCopy";
import { deckCopy } from "../copy";
import "./FinderEntry.scss";

/** Entry point to the three-question deck finder. */
export const FinderEntry = () => {
  const copy = useCopy(deckCopy).finderEntry;

  return (
    <Link to="/finder" className="finder-entry">
      <span className="finder-entry__icon" aria-hidden="true">
        <FiCompass size={22} />
      </span>
      <span className="finder-entry__body">
        <span className="finder-entry__title">{copy.title}</span>
        <span className="finder-entry__text">{copy.body}</span>
      </span>
      <FiChevronRight
        className="finder-entry__chevron"
        aria-hidden="true"
        size={20}
      />
    </Link>
  );
};

export default FinderEntry;
