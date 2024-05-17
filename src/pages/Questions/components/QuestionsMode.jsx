import React from 'react'
import './styles.scss';

const QuestionsMode = ({ title, description, data, isNew }) => {
  return (
    <div className="mode">
      <button onClick={() => switchToMode(data)}>
        {{ title }}
        {isNew ? <div className="newModeTag">
          <p>New</p>
        </div> : null}
      </button>
      <p className="modeDescription">
        {{ description }}
      </p>
    </div>
  )
}

export default QuestionsMode