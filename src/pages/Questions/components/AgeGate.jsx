import React from "react";
import "./styles.scss";

const AgeGate = ({ title, onConfirm, onCancel }) => {
  return (
    <div
      className="ageGate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ageGateTitle"
    >
      <div className="ageGateCard">
        <h3 id="ageGateTitle">Adult content ahead</h3>
        <p>
          “{title}” contains explicit, adult-oriented questions. You need to be
          18 or older to continue.
        </p>
        <div className="ageGateActions">
          <button onClick={onConfirm}>I'm 18 or older</button>
          <button className="secondaryButton" onClick={onCancel}>
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgeGate;
