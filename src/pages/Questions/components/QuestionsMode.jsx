import React from "react";
import "./styles.scss";

const QuestionsMode = ({ mode, onSelect }) => {
  const { title, description, tagType } = mode;

  return (
    <div className="mode">
      <button onClick={() => onSelect(mode)}>
        {title}
        {tagType ? (
          <div className={`modeTag ${tagType === "new" ? "new" : "beta"}`}>
            <p>{tagType === "new" ? "New" : "Beta"}</p>
          </div>
        ) : null}
      </button>
      <p className="modeDescription">{description}</p>
    </div>
  );
};

export default QuestionsMode;
