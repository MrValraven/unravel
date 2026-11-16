import "./Wordmark.scss";

/**
 * The drawn thread that comes loose from the final "l" and trails back under
 * the word. Kept in sync with the copy in scripts/og-template.html.
 */
export const WORDMARK_THREAD_PATH =
  "M382 -2 C383 20 374 33 361 30 C348 27 351 11 364 14 C379 18 377 42 348 47 C310 53 282 40 242 45 C202 50 174 61 132 56 C100 52 80 61 52 58";

interface WordmarkProps {
  className?: string;
}

/**
 * "Unravel" set in Young Serif, with a thread unravelling from its last letter.
 * The word stays real text, so it reads, scales and translates as text; the
 * thread is decoration only.
 */
export const Wordmark = ({ className }: WordmarkProps) => (
  <span className={className ? `wordmark ${className}` : "wordmark"}>
    <span className="wordmark__word">
      Unrave<span className="wordmark__loose">l</span>
    </span>
    <svg
      className="wordmark__thread"
      viewBox="0 0 400 64"
      aria-hidden="true"
      focusable="false"
    >
      <path d={WORDMARK_THREAD_PATH} pathLength={1} />
    </svg>
  </span>
);
