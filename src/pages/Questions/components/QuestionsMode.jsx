import React from 'react'
import './styles.scss';

const QuestionsMode = ({ title, description, data, tagType, switchToMode }) => {
  return (
    <div className="mode">
      <button onClick={() => switchToMode(data)}>
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