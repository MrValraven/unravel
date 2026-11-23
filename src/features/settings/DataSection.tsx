import { useRef, useState, type ChangeEvent } from "react";
import { FiDownload, FiUpload } from "react-icons/fi";
import { Dialog } from "../../components/Dialog";
import { formatCopy, pluralize } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import {
  MAX_BACKUP_FILE_CHARACTERS,
  applyBackup,
  buildBackupFileName,
  createBackup,
  readBackup,
  type BackupFile,
  type BackupMergeReport,
} from "../../storage/backup";
import { MAX_CUSTOM_DECKS } from "../../storage/customDecks";
import { downloadBlob } from "../share/downloadBlob";
import { settingsCopy } from "./copy";
import "./DataSection.scss";

type DataCopy = (typeof settingsCopy)["en"]["data"];

interface BackupPreview {
  backup: BackupFile;
  deckCount: number;
  favouriteCount: number;
}

/** What an import did, one plain sentence per fact, skipped decks last. */
const describeReport = (
  copy: DataCopy,
  report: BackupMergeReport
): string[] => {
  const result = copy.result;
  const parts = [
    report.decksAdded > 0 && pluralize(report.decksAdded, result.decksAdded),
    report.decksUpdated > 0 &&
      pluralize(report.decksUpdated, result.decksUpdated),
    report.favouritesAdded > 0 &&
      pluralize(report.favouritesAdded, result.favouritesAdded),
  ].filter((part): part is string => part !== false);
  const lines: string[] = [];
  if (parts.length > 0) {
    lines.push(formatCopy(result.imported, { parts: parts.join(", ") }));
  } else if (report.decksSkipped === 0) {
    lines.push(result.nothingNew);
  }
  if (report.decksSkipped > 0) {
    lines.push(
      formatCopy(pluralize(report.decksSkipped, result.decksSkipped), {
        max: MAX_CUSTOM_DECKS,
      })
    );
  }
  return lines;
};

/** "Your data": export everything worth keeping to a file, or merge a file back in. */
export const DataSection = () => {
  const copy = useCopy(settingsCopy).data;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [statusLines, setStatusLines] = useState<string[]>([]);
  const [problem, setProblem] = useState("");

  const clearMessages = () => {
    setStatusLines([]);
    setProblem("");
  };

  const handleExport = () => {
    clearMessages();
    const now = new Date();
    const fileName = buildBackupFileName(now);
    try {
      const blob = new Blob([JSON.stringify(createBackup(now), null, 2)], {
        type: "application/json",
      });
      downloadBlob(blob, fileName);
      setStatusLines([formatCopy(copy.exported, { fileName })]);
    } catch {
      setProblem(copy.exportFailed);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Cleared so choosing the same file again still fires a change.
    input.value = "";
    if (!file) return;
    clearMessages();
    if (file.size > MAX_BACKUP_FILE_CHARACTERS) {
      setProblem(copy.problems["too-large"]);
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setProblem(copy.problems["read-failed"]);
      return;
    }
    const result = readBackup(text);
    if (!result.isValid) {
      setProblem(copy.problems[result.problem]);
      return;
    }
    setPreview({
      backup: result.backup,
      deckCount: result.deckCount,
      favouriteCount: result.favouriteCount,
    });
    setIsPreviewOpen(true);
  };

  const handleConfirmImport = () => {
    setIsPreviewOpen(false);
    if (!preview) return;
    const { report, isSaved } = applyBackup(preview.backup);
    if (!isSaved) {
      setProblem(copy.problems["storage-blocked"]);
      return;
    }
    setStatusLines(describeReport(copy, report));
  };

  return (
    <section
      className="settings__section data-section"
      aria-labelledby="data-title"
    >
      <h2 id="data-title" className="settings__section-title">
        {copy.title}
      </h2>
      <p className="data-section__description">{copy.description}</p>
      <div className="data-section__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={handleExport}
        >
          <FiDownload aria-hidden="true" size={18} />
          {copy.export}
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => fileInputRef.current?.click()}
        >
          <FiUpload aria-hidden="true" size={18} />
          {copy.import}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          tabIndex={-1}
          aria-label={copy.importFileLabel}
          onChange={(event) => void handleFileChange(event)}
        />
      </div>
      <div className="data-section__status" role="status">
        {statusLines.map((line) => (
          <p key={line} className="data-section__message">
            {line}
          </p>
        ))}
      </div>
      {/* Kept mounted and empty, so the alert is in place before a problem lands in it. */}
      <p className="data-section__message data-section__problem" role="alert">
        {problem}
      </p>

      <Dialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={copy.preview.title}
        description={
          preview
            ? formatCopy(copy.preview.found, {
                decks: pluralize(preview.deckCount, copy.deckCount),
                favourites: pluralize(
                  preview.favouriteCount,
                  copy.favouriteCount
                ),
              })
            : undefined
        }
        initialFocusRef={cancelButtonRef}
        footer={
          <>
            <button
              ref={cancelButtonRef}
              type="button"
              className="button button--secondary"
              onClick={() => setIsPreviewOpen(false)}
            >
              {copy.preview.cancel}
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={handleConfirmImport}
            >
              {copy.preview.confirm}
            </button>
          </>
        }
      >
        <p className="data-section__note">{copy.preview.note}</p>
      </Dialog>
    </section>
  );
};
