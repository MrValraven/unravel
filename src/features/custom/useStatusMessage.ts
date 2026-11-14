import { useCallback, useRef, useState } from "react";

export interface StatusNotice {
  /** Unique per notice so a repeated message still animates in again. */
  id: number;
  text: string;
}

/** State for the feature's StatusMessage: show a short notice, clear it once it has left. */
export const useStatusMessage = () => {
  const [notice, setNotice] = useState<StatusNotice | null>(null);
  const noticeCounterRef = useRef(0);

  const showStatus = useCallback((text: string) => {
    noticeCounterRef.current += 1;
    setNotice({ id: noticeCounterRef.current, text });
  }, []);

  const dismissStatus = useCallback(() => setNotice(null), []);

  return { notice, showStatus, dismissStatus };
};
