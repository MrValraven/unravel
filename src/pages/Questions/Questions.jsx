import React, { useEffect, useState } from "react";
import "./styles.scss";

import questionsData from "../../data/questions.json";
import thirtysixData from "../../data/thirtysix.json";
import datingexpansionData from "../../data/datingexpansion.json";

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [endOfQuestions, setEndOfQuestions] = useState(true);
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
        <div className="modes">
          <p>Choose a mode</p>
          <div>
            <button onClick={resetQuestions}>Play Unravel</button>
            <p>
              Unravel. A series of questions designed to help you make new
              friends and develop better connections.
            </p>
          </div>
          <div>
            <button onClick={switchTo36}>
              Play NYTimes' 36 Questions to fall in love
            </button>
            <p>
              A series of personal questions used by the psychologist Arthur
              Aron to explore the idea of fostering closeness through mutual
              vulnerability.
            </p>
          </div>
          <div>
            <button onClick={switchToDating}>Play Dating Expansion pack</button>
            <p>
              A series of questions designed to deepen your bond and create
              meaningful conversations with your date.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
