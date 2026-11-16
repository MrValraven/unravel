import { FiX } from "react-icons/fi";
import {
  dismissLanguageSuggestion,
  useLanguageSuggestionDismissed,
} from "../storage/languageSuggestion";
import { useSettings } from "../storage/settings";
import { languageSuggestionCopy as copy } from "./siteCopy";
import "./LanguageSuggestion.scss";

interface LanguageSuggestionProps {
  className?: string;
}

const prefersPortuguese = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return (navigator.language || "").toLowerCase().startsWith("pt");
};

/**
 * English stays the default for everyone. When the browser asks for Portuguese,
 * this offers the switch once; either answer hides it for good on this device.
 */
export const LanguageSuggestion = ({ className }: LanguageSuggestionProps) => {
  const [settings, updateSettings] = useSettings();
  const isDismissed = useLanguageSuggestionDismissed();

  if (isDismissed || settings.locale !== "en" || !prefersPortuguese()) {
    return null;
  }

  const handleAccept = () => {
    dismissLanguageSuggestion();
    updateSettings({ locale: "pt" });
  };

  return (
    <section
      className={
        className ? `language-suggestion ${className}` : "language-suggestion"
      }
      lang={copy.lang}
      aria-label={copy.label}
    >
      <p className="language-suggestion__prompt">{copy.prompt}</p>
      <div className="language-suggestion__actions">
        <button
          type="button"
          className="button button--secondary language-suggestion__accept"
          onClick={handleAccept}
        >
          {copy.accept}
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={copy.dismiss}
          onClick={dismissLanguageSuggestion}
        >
          <FiX aria-hidden="true" size={20} />
        </button>
      </div>
    </section>
  );
};
