import React, { useEffect, useState } from "react";
import availableModes from "../../static/modes";
import "./styles.scss";

import QuestionsMode from "./components/QuestionsMode";

const getLastGameProgress = () => {
  try {
    const gameProgress = JSON.parse(localStorage.getItem('gameProgress'));
    return gameProgress ?? {};
  } catch (error) {
    console.error(error);
    return {};
  }
}

const { savedMode, savedCounter } = getLastGameProgress();

const Questions = () => {
  const [questions, setQuestions] = useState(savedMode || []);
  const [isGameOngoing, setIsGameOngoing] = useState(false);
  const [questionsCounter, setQuestionsCounter] = useState(savedCounter || 0);
  const [doesPreviousSessionExist, setDoesPreviousSessionExist] = useState(false);

  const saveStateToLocalStorage = (mode, counter) => {
    if (mode === undefined || counter === undefined) return;

    const gameProgress = {
      savedMode: mode,
      savedCounter: counter
    }

    try {
      localStorage.setItem('gameProgress', JSON.stringify(gameProgress));
    } catch (error) {
      console.error(error);
      return;
    }
  };

  const handleQuestionsCounterIncrement = () => {
    setQuestionsCounter((previousQuestionsCounterValue) => previousQuestionsCounterValue + 1);
  };

  const switchToSelectedMode = (modeData) => {
    setQuestions(modeData);
    setQuestionsCounter(0);
    setIsGameOngoing(true);
  };

  const resumeGameFromLastSession = () => {
    if (savedMode && typeof savedCounter === 'number') {
      setQuestions(savedMode);
      setQuestionsCounter(savedCounter);
      setIsGameOngoing(savedCounter < savedMode.length);
    }
  };

  useEffect(() => {
    setDoesPreviousSessionExist(savedMode !== undefined && savedCounter !== undefined)
  }, []);

  useEffect(() => {
    if (questionsCounter > 0 && questionsCounter >= questions.length) {
      setIsGameOngoing(false);
      saveStateToLocalStorage([], 0);
      setDoesPreviousSessionExist(false);
      return;
    }

    saveStateToLocalStorage(questions, questionsCounter);
  }, [questionsCounter])

  return (
    <div className="questions">
      {isGameOngoing ? (
        <div className="questionsContainer">
          <div className="header">
            
            {/* TODO: Implement current mode title, eg change questions state <h3 id="current-mode-title"></h3> */}
            <div className="counter-header">
              <hr />
              <h2>
                <span className="counterNumber" key={questionsCounter}>
                  {questionsCounter + 1}
                </span>{" "}
                / {questions.length}
              </h2>{" "}
              <hr />
            </div>
          </div>
          <p className="questionsDisplay" key={questionsCounter}>
            {questions[questionsCounter]}
          </p>
          <button onClick={handleQuestionsCounterIncrement}>{questionsCounter >= questions.length - 1 ? 'Explore other modes' : 'Next question'}</button>
        </div>
      ) : (
        <div className="modes">
          {doesPreviousSessionExist ?
            <>
              <h4>Resume your last session</h4>
              <button onClick={resumeGameFromLastSession}>Resume session</button>
            </> :
            null
          }
          <h4>Choose a mode</h4>
          {availableModes.map((mode) => (
            <QuestionsMode switchToSelectedMode={switchToSelectedMode} key={mode.title} title={mode.title} description={mode.description} data={mode.data} tagType={mode.tagType} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Questions;
