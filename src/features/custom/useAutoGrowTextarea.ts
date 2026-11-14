import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Grows a textarea with its text, so the whole card stays readable without a scrollbar
 * or a resize handle. Recalculates when the text changes and when the window resizes
 * (a narrower card wraps into more lines).
 */
export const useAutoGrowTextarea = (value: string) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fitToContent = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  useLayoutEffect(fitToContent, [value, fitToContent]);

  useEffect(() => {
    window.addEventListener("resize", fitToContent);
    // Young Serif loads after first paint and wraps differently from the fallback face.
    void document.fonts?.ready.then(fitToContent);
    return () => window.removeEventListener("resize", fitToContent);
  }, [fitToContent]);

  return textareaRef;
};
