import React, { useEffect, useState } from "react";
import "./styles.scss";

import questionsData from "../../data/questions.json";
import tunasData from "../../data/tunas.json";
import firstDateData from "../../data/firstDate.json";
import advancedDating from "../../data/advancedDating.json";
import spicyData from "../../data/spicy.json";
import polyamoryData from "../../data/polyamory.json";
import silly from '../../data/silly.json';
import neurospicy from '../../data/neurospicy.json';
import queer from '../../data/queer.json';

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

  const switchToMode = (modeData) => {
    resetQuestions();
    setQuestions(modeData);
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
            {questions[questionsCounter]}
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
            <button onClick={() => switchToMode(firstDateData)}>
              Play First Date pack
            </button>
            <p className="modeDescription">
              A series of questions designed to deepen your bond and create
              meaningful conversations with your date.
            </p>
          </div>
          <div className="mode">
            <button onClick={() => switchToMode(advancedDating)}>
              Beyond the Surface
            </button>
            <p className="modeDescription">
              Take your romance to the next level through heartfelt inquiries
              that reveal genuine affection and understanding.
            </p>
          </div>
          <div className="mode">
            <button onClick={() => switchToMode(queer)}>
              Queer Vibes
              <div className="newModeTag">
                <p>New</p>
              </div>
            </button>
            <p className="modeDescription">
              A vibrant set of casual questions for lighthearted and engaging LGBTQ+ conversations."
            </p>
          </div>
          <div className="mode">
            <button onClick={() => switchToMode(silly)}>
              Silly Goose Pack
              <div className="newModeTag">
                <p>New</p>
              </div>
            </button>
            <p className="modeDescription">
              Unleash laughter and fun with whimsical questions that promise lighthearted moments and quirky connections.
            </p>
          </div>
          <div className="mode">
            <button onClick={() => switchToMode(neurospicy)}>
              Neurospicy Delight
              <div className="newModeTag">
                <p>New</p>
              </div>
            </button>
            <p className="modeDescription">
              Explore the magic of neurodiversity with a collection of whimsical and inclusive questions designed to foster laughter, connection, and understanding among individuals with diverse minds.
            </p>
          </div>
          <div className="mode">
            <button onClick={() => switchToMode(spicyData)}>
              Play Flames of Desire
            </button>
            <p className="modeDescription">
              Experience intense connections with daring questions, igniting
              desires and deepening bonds.
            </p>
          </div>
          <div className="mode">
            <button onClick={() => switchToMode(polyamoryData)}>
              Play Polyamorous Passions
            </button>
            <p className="modeDescription">
              Embrace boundless love and explore the dynamics of polyamory in
              this captivating game mode.
            </p>
          </div>
          <div className="mode">
            <button onClick={() => switchToMode(tunasData)}>
              Play Portuguese Tunas Edition
            </button>
            <p className="modeDescription">
              A series of questions that highlight the academic spirit of each
              Tuna and the great moments and adventures that come from being
              part of one.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
