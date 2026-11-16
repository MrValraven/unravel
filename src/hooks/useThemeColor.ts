import { useEffect } from "react";

const HEX_PATTERN = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;

const parseHex = (hex: string): [number, number, number] | undefined => {
  const value = hex.trim();
  if (!HEX_PATTERN.test(value)) return undefined;
  const digits =
    value.length === 4
      ? [...value.slice(1)].map((digit) => digit + digit).join("")
      : value.slice(1);
  return [0, 2, 4].map((start) =>
    Number.parseInt(digits.slice(start, start + 2), 16)
  ) as [number, number, number];
};

/**
 * Mixes `amount` (0 to 1) of `tint` into `base`, like CSS color-mix in sRGB.
 * Returns `base` unchanged when either colour is not a hex colour.
 */
export function mixHexColors(
  tint: string,
  base: string,
  amount: number
): string {
  const tintChannels = parseHex(tint);
  const baseChannels = parseHex(base);
  if (!tintChannels || !baseChannels) return base;
  const weight = Math.min(Math.max(amount, 0), 1);
  return `#${baseChannels
    .map((channel, index) =>
      Math.round(
        channel + ((tintChannels[index] ?? channel) - channel) * weight
      )
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

/**
 * Tints the browser chrome (`<meta name="theme-color">`) with `tint` while mounted.
 * The theme sets the meta to the page background, and any later write (a theme
 * switch) becomes the new base the tint mixes into. Unmounting puts the base back.
 */
export function useTintedThemeColor(tint: string, amount: number): void {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    if (!meta) return;
    let baseColor = meta.content;
    let appliedColor = "";

    const apply = () => {
      appliedColor = mixHexColors(tint, baseColor, amount);
      if (meta.content !== appliedColor) meta.content = appliedColor;
    };

    apply();
    const observer =
      typeof MutationObserver === "function"
        ? new MutationObserver(() => {
            if (meta.content === appliedColor) return;
            baseColor = meta.content;
            apply();
          })
        : undefined;
    observer?.observe(meta, { attributes: true, attributeFilter: ["content"] });

    return () => {
      observer?.disconnect();
      if (meta.content === appliedColor) meta.content = baseColor;
    };
  }, [tint, amount]);
}
