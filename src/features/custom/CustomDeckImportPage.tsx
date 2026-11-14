import { useMemo } from "react";
import { useLocation } from "react-router";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { formatCopy } from "../../i18n/localize";
import { useCopy } from "../../i18n/useCopy";
import { ImportedDeckPreview } from "./ImportedDeckPreview";
import { UnavailableNotice } from "./UnavailableNotice";
import {
  decodeDeckFromHash,
  type DecodeResult,
  type InvalidDeckDetail,
} from "./codec";
import { customCopy } from "./copy";
import { CARD_TEXT_MAX_LENGTH, MAX_CARDS, TITLE_MAX_LENGTH } from "./deckRules";

type ImportErrorCopy = (typeof customCopy)["en"]["importer"]["errors"];
type DecodeFailure = Extract<DecodeResult, { isDecoded: false }>;

/** Names the exact reason a share link did not open. */
const describeDecodeFailure = (
  failure: DecodeFailure,
  errorCopy: ImportErrorCopy
): string => {
  switch (failure.reason) {
    case "missing":
      return errorCopy.missing;
    case "corrupt":
      return errorCopy.corrupt;
    case "too-large":
      return failure.detail === "payload"
        ? errorCopy.tooLargePayload
        : formatCopy(errorCopy.tooLargeCardCount, { max: MAX_CARDS });
    case "invalid-deck": {
      const cardNumber = failure.cardNumber ?? 1;
      const detailMessages: Record<InvalidDeckDetail, string> = {
        version: errorCopy.version,
        "title-empty": errorCopy.titleEmpty,
        "title-too-long": formatCopy(errorCopy.titleTooLong, {
          max: TITLE_MAX_LENGTH,
        }),
        "no-cards": errorCopy.noCards,
        "card-type": formatCopy(errorCopy.cardType, { number: cardNumber }),
        "card-empty": formatCopy(errorCopy.cardEmpty, { number: cardNumber }),
        "card-too-long": formatCopy(errorCopy.cardTooLong, {
          number: cardNumber,
          max: CARD_TEXT_MAX_LENGTH,
        }),
      };
      return detailMessages[failure.detail];
    }
  }
};

/** /custom/import#d=<payload>: the deck travels in the hash, so it never reaches a server. */
const CustomDeckImportPage = () => {
  const importerCopy = useCopy(customCopy).importer;
  useDocumentTitle(importerCopy.title);
  const { hash } = useLocation();
  const result = useMemo(() => decodeDeckFromHash(hash), [hash]);

  if (!result.isDecoded) {
    return (
      <UnavailableNotice
        pageTitle={importerCopy.title}
        backLabel={importerCopy.backLabel}
        title={importerCopy.errorTitle}
        actionLabel={importerCopy.goToDecks}
      >
        <p>{describeDecodeFailure(result, importerCopy.errors)}</p>
      </UnavailableNotice>
    );
  }

  return <ImportedDeckPreview deck={result.deck} />;
};

export default CustomDeckImportPage;
