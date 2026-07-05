import React from "react";

const TAG_LABEL = { new: "New", beta: "Beta" };

const QuestionsMode = ({ mode, onSelect }) => {
  const { title, description, tagType, nsfw, file, data } = mode;
  const titleId = `mode-${file}-title`;
  const descId = `mode-${file}-desc`;
  const tagLabel = TAG_LABEL[tagType];
  const questionCount = data?.length ?? 0;
  const countLabel = `${questionCount} ${
    questionCount === 1 ? "question" : "questions"
  }`;

  // The whole card is one button. Its accessible name is pinned to the title
  // (via aria-labelledby) so it reads as just "Unravel" rather than the title
  // plus the whole description; the description and any 18+/tag context are
  // exposed through aria-describedby instead.
  return (
    <button
      type="button"
      className="card"
      onClick={() => onSelect(mode)}
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <span className="card__top">
        <span id={titleId} className="card__title">
          {title}
        </span>
        {tagLabel && (
          <span className={`tag tag--${tagType}`} aria-hidden="true">
            {tagLabel}
          </span>
        )}
      </span>

      <span id={descId} className="card__desc">
        {description}
        {tagLabel && (
          <span className="visually-hidden"> · {tagLabel} mode.</span>
        )}
        {nsfw && <span className="visually-hidden"> · Adults only, 18 plus.</span>}
        <span className="visually-hidden"> · {countLabel}.</span>
      </span>

      <span className="card__footer">
        <span className="card__count" aria-hidden="true">
          {countLabel}
        </span>
        {nsfw && (
          <span className="card__age" aria-hidden="true">
            18+
          </span>
        )}
        <span className="card__start" aria-hidden="true">
          Start →
        </span>
      </span>
    </button>
  );
};

export default QuestionsMode;
