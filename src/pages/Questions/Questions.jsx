import React, { useEffect, useState } from "react";
import "./styles.scss";

import questionsData from "../../data/questions.json";
import tunasData from "../../data/tunas.json";
import thirtysixData from "../../data/thirtysix.json";
import datingexpansionData from "../../data/datingexpansion.json";
import spicyData from "../../data/spicy.json";

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

  const switchToTunas = () => {
    setEndOfQuestions(false);
    setQuestionsCounter(0);
    setQuestions(tunasData);
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

  const switchToSpicy = () => {
    setEndOfQuestions(false);
    setQuestionsCounter(0);
    setQuestions(spicyData);
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
            <p className="modeDescription">
              Unravel. A series of questions designed to help you make new
              friends and develop better connections.
            </p>
          </div>
          <div>
            <button onClick={switchToDating}>Play First Date pack</button>
            <p className="modeDescription">
              A series of questions designed to deepen your bond and create
              meaningful conversations with your date.
            </p>
          </div>
          <div className="mode">
            <button onClick={switchToSpicy}>
              Play Flames of Desire
              <div className="newModeTag">
                <p>New</p>
              </div>
            </button>
            <p className="modeDescription">
              Experience intense connections with daring questions, igniting
              desires and deepening bonds.
            </p>
          </div>
          <div className="mode">
            <button onClick={switchToTunas}>
              Play Portuguese Tunas Edition
            </button>
            <p className="modeDescription">
              A series of questions that highlight the academic spirit of each
              Tuna and the great moments and adventures that come from being
              part of one.
            </p>
          </div>
          <div>
            <button onClick={switchTo36}>
              Play NYTimes' 36 Questions to fall in love
            </button>
            <p className="modeDescription">
              A series of personal questions used by the psychologist Arthur
              Aron to explore the idea of fostering closeness through mutual
              vulnerability.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
