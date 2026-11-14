import { useEffect, useState } from "react";
import { FiInfo } from "react-icons/fi";
import { useLeaveAnimation } from "./useLeaveAnimation";
import type { StatusNotice } from "./useStatusMessage";
import "./StatusMessage.scss";

const VISIBLE_MILLISECONDS = 4500;

interface StatusMessageProps {
  notice: StatusNotice | null;
  onDismissed: () => void;
}

/**
 * A small toast for this feature. The live region stays mounted so screen readers
 * announce every new notice; each notice slides in, waits, then slides out.
 */
export const StatusMessage = ({ notice, onDismissed }: StatusMessageProps) => {
  const [leavingNoticeId, setLeavingNoticeId] = useState<number | null>(null);
  const isLeaving = notice !== null && leavingNoticeId === notice.id;
  const handleAnimationEnd = useLeaveAnimation(isLeaving, onDismissed);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(
      () => setLeavingNoticeId(notice.id),
      VISIBLE_MILLISECONDS
    );
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div className="status-message" role="status" aria-live="polite">
      {notice && (
        <p
          key={notice.id}
          className="status-message__bubble"
          data-state={isLeaving ? "leaving" : "visible"}
          onAnimationEnd={handleAnimationEnd}
        >
          <FiInfo
            aria-hidden="true"
            size={18}
            className="status-message__icon"
          />
          <span>{notice.text}</span>
        </p>
      )}
    </div>
  );
};

export default StatusMessage;
