import type { Locale, LocalizedText } from "../content/types";

export const localize = (text: LocalizedText, locale: Locale): string =>
  text[locale] || text.en;

/** Replaces `{name}` placeholders. Unknown placeholders are left as they are. */
export const formatCopy = (
  template: string,
  values: Record<string, string | number>
): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );

export interface PluralForms {
  one: string;
  other: string;
}

export const pluralize = (count: number, forms: PluralForms): string =>
  formatCopy(count === 1 ? forms.one : forms.other, { count });
