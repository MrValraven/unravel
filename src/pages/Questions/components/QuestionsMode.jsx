import React from 'react'
import './styles.scss';

const QuestionsMode = ({ title, description, data, tagType, switchToSelectedMode }) => {
  return (
    <div className="mode">
      <button onClick={() => switchToSelectedMode(data)}>
        {title}
        {tagType ? <div className={`modeTag ${tagType === 'new' ? 'new' : 'beta'}`}>
          <p>{tagType === 'new' ? 'New' : 'Beta'}</p>
        </div> : null}
      </button>
      <p className="modeDescription">
        {description}
      </p>
    </div>
  )
}

export default QuestionsMode