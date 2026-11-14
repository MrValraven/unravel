import { useState } from "react";
import "./StatusToast.scss";

interface StatusToastProps {
  message: string | null;
}

/**
 * A short status pill at the top of the screen. The pill keeps the last message while
 * it fades out; the live text empties when hidden, so a repeated message is read again.
 */
export const StatusToast = ({ message }: StatusToastProps) => {
  const [shownMessage, setShownMessage] = useState(message);
  if (message !== null && message !== shownMessage) setShownMessage(message);
  const isVisible = message !== null;

  return (
    <div className="status-toast" data-visible={isVisible}>
      <span className="visually-hidden" role="status">
        {message ?? ""}
      </span>
      <span className="status-toast__pill" aria-hidden="true">
        {isVisible ? message : shownMessage}
      </span>
    </div>
  );
};

export default StatusToast;
