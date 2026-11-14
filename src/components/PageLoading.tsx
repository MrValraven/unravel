import { useCopy } from "../i18n/useCopy";
import { sharedCopy } from "./copy";

/** Suspense fallback for lazy pages. Fades in after a short delay so fast loads show nothing. */
export const PageLoading = () => {
  const copy = useCopy(sharedCopy).loading;
  return (
    <div className="page-loading" role="status">
      <span className="page-loading__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="visually-hidden">{copy.label}</span>
    </div>
  );
};

export default PageLoading;
