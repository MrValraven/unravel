import React, { useEffect, useState } from "react";
import availableModes from "../../static/modes";
import "./styles.scss";

import QuestionsMode from "./components/QuestionsMode";

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [endOfQuestions, setEndOfQuestions] = useState(true);
  const [questionsCounter, setQuestionsCounter] = useState(0);
  const [doesPreviousSessionExist, setDoesPreviousSessionExist] = useState(false);

  const saveStateToLocalStorage = (mode, counter) => {
    localStorage.setItem('mode', JSON.stringify(mode));
    localStorage.setItem('questionsCounter', JSON.stringify(counter));
  };

  const handleIncrement = () => {
    if (questionsCounter >= questions.length - 1) {
      setEndOfQuestions(true);
      saveStateToLocalStorage([], 0);
      return;
    }

    setQuestionsCounter((previousValue) => {
      const newCounterValue = previousValue + 1;
      saveStateToLocalStorage(questions, newCounterValue);
      return newCounterValue;
    });
  };

  const resetQuestions = () => {
    setEndOfQuestions(false);
    setQuestionsCounter(0);
    saveStateToLocalStorage([], 0);
  };

  const switchToMode = (modeData) => {
    resetQuestions();
    setQuestions(modeData);
    saveStateToLocalStorage(modeData, 0);
  };

  const resumeGame = () => {
    const savedMode = JSON.parse(localStorage.getItem('mode'));
    const savedCounter = JSON.parse(localStorage.getItem('questionsCounter'));

    if (savedMode && typeof savedCounter === 'number') {
      setQuestions(savedMode);
      setQuestionsCounter(savedCounter);
      setEndOfQuestions(savedCounter > savedMode.length - 1);
    }
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('mode');
    const savedCounter = localStorage.getItem('questionsCounter');
    setDoesPreviousSessionExist(savedMode !== null && savedCounter !== null)
    setQuestions([]);
  }, []);

  return (
    <div className="questions">
      {!endOfQuestions ? (
        <div className="questionsContainer">
          <div className="header">
            <hr />
            <h2>
              <span className="counterNumber" key={questionsCounter}>
                {questionsCounter + 1}
              </span>{" "}
              / {questions.length}
            </h2>{" "}
            <hr />
          </div>
          <p className="questionsDisplay" key={questionsCounter}>
            {questions[questionsCounter]}
          </p>
          <button onClick={handleIncrement}>{questionsCounter >= questions.length - 1 ? 'Explore other modes' : 'Next question'}</button>
        </div>
      ) : (
        <div className="modes">
          {doesPreviousSessionExist ?
            <>
              <h4>Resume your last session</h4>
              <button onClick={resumeGame}>Resume session</button>
            </> :
            null
          }
          <h4>Choose a mode</h4>
          {availableModes.map((mode) => (
            <QuestionsMode switchToMode={switchToMode} key={mode.title} title={mode.title} description={mode.description} data={mode.data} tagType={mode.tagType} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Questions;
