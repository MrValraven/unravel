import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Locale } from "../content/types";

const LocaleContext = createContext<Locale>("en");

export const LocaleProvider = ({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) => {
  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-PT" : "en";
  }, [locale]);
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
};

export const useLocale = (): Locale => useContext(LocaleContext);
