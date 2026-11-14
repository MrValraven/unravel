import type { Locale } from "../content/types";
import { useLocale } from "./LocaleContext";

/** A feature's copy: the pt bundle must have exactly the en bundle's shape. */
export type CopyBundle<Shape> = Record<Locale, Shape>;

export const defineCopy = <Shape>(bundle: CopyBundle<Shape>) => bundle;

export const useCopy = <Shape>(bundle: CopyBundle<Shape>): Shape =>
  bundle[useLocale()];
