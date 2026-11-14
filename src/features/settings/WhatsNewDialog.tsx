import { Dialog } from "../../components/Dialog";
import { formatCopy, localize } from "../../i18n/localize";
import { useLocale } from "../../i18n/LocaleContext";
import { useCopy } from "../../i18n/useCopy";
import { settingsCopy } from "./copy";
import type { Release } from "./whatsNew";
import "./WhatsNewDialog.scss";

interface WhatsNewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Newest first. */
  releaseList: Release[];
}

/** Release notes in a sheet, shared by the update gate and the Settings entry. */
export const WhatsNewDialog = ({
  isOpen,
  onClose,
  releaseList,
}: WhatsNewDialogProps) => {
  const copy = useCopy(settingsCopy).whatsNew;
  const locale = useLocale();
  const dateFormat = new Intl.DateTimeFormat(
    locale === "pt" ? "pt-PT" : "en-GB",
    {
      dateStyle: "long",
    }
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={copy.title}
      variant="sheet"
      footer={
        <button
          type="button"
          className="button button--primary whats-new__close"
          onClick={onClose}
        >
          {copy.close}
        </button>
      }
    >
      <div className="whats-new">
        {releaseList.map((release) => (
          <section key={release.version} className="whats-new__release">
            <h3 className="whats-new__version">
              {formatCopy(copy.versionHeading, { version: release.version })}
            </h3>
            <p className="whats-new__date">
              <time dateTime={release.date}>
                {dateFormat.format(new Date(`${release.date}T12:00:00`))}
              </time>
            </p>
            <ul className="whats-new__items">
              {release.items.map((item) => (
                <li key={item.en}>{localize(item, locale)}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
};
