import React, { useEffect, useState } from "react";
import "./styles.scss";

import questionsData from "../../data/questions.json";
import thirtysixData from "../../data/thirtysix.json";
import datingexpansionData from "../../data/datingexpansion.json";

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [endOfQuestions, setEndOfQuestions] = useState(false);
  const [questionsCounter, setQuestionsCounter] = useState(0);

  const handleIncrement = () => {
    if (questionsCounter >= questions.length - 1) {
      setEndOfQuestions(true);
      return;
    }

    setQuestionsCounter((previousValue) => {
      return previousValue + 1;
    });
  };

  const resetQuestions = () => {
    setEndOfQuestions(false);
    setQuestionsCounter(0);
  };

  const switchTo36 = () => {
    setEndOfQuestions(false);
    setQuestionsCounter(0);
    setQuestions(thirtysixData);
  };

  const switchToDating = () => {
    setEndOfQuestions(false);
    setQuestionsCounter(0);
    setQuestions(datingexpansionData);
  };

  useEffect(() => {
    setQuestions(questionsData);
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
            {questions[0]?.question
              ? questions[questionsCounter]?.question
              : questions[questionsCounter]}
          </p>
          <button onClick={handleIncrement}>Next question</button>
        </div>
      ) : (
        <div>
          <p>No more questions</p>
          <button onClick={resetQuestions}>Reset questions</button>
          <button onClick={switchTo36}>
            Play 36 Questions to fall in love
          </button>
          <button onClick={switchToDating}>Play Dating Expansion pack</button>
        </div>
      )}
    </div>
  );
};

export default Questions;
