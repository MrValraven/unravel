import React, { useEffect, useState } from "react";
import "./styles.scss";

import questionsData from "../../data/questions.json";

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
          <p key={questionsCounter}>{questions[questionsCounter]}</p>
          <button onClick={handleIncrement}>Next question</button>
        </div>
      ) : (
        <div>
          <p>No more questions</p>
          <button onClick={resetQuestions}>Reset questions</button>
        </div>
      )}
    </div>
  );
};

export default Questions;
