// Safari and iOS start blob downloads asynchronously, so an immediate revoke breaks them.
const OBJECT_URL_REVOKE_DELAY_MILLISECONDS = 30000;

/** Saves the blob on the device as a file with the given name. */
export const downloadBlob = (blob: Blob, fileName: string): void => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(
    () => URL.revokeObjectURL(objectUrl),
    OBJECT_URL_REVOKE_DELAY_MILLISECONDS
  );
};
