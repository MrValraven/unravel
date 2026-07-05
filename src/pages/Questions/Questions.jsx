import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import availableModes, { modeCategories } from "../../static/modes";
import "./styles.scss";

import QuestionsMode from "./components/QuestionsMode";
import AgeGate from "./components/AgeGate";
import InstallPrompt from "./components/InstallPrompt";
import {
  saveGameProgress,
  clearGameProgress,
  getResumableSession,
  isAgeConfirmed,
  confirmAge,
} from "./gameProgress";

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [currentTitle, setCurrentTitle] = useState("");
  const [questionsCounter, setQuestionsCounter] = useState(0);
  const [isGameOngoing, setIsGameOngoing] = useState(false);
  const [savedSession, setSavedSession] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);

  // Read any resumable session once, on mount, instead of at module load.
  useEffect(() => {
    setSavedSession(getResumableSession());
  }, []);

  const startMode = (mode) => {
    setQuestions(mode.data);
    setCurrentTitle(mode.title);
    setQuestionsCounter(0);
    setIsGameOngoing(true);
  };

  const switchToSelectedMode = (mode) => {
    if (mode.nsfw && !isAgeConfirmed()) {
      setPendingMode(mode);
      return;
    }
    startMode(mode);
  };

  const handleAgeConfirm = () => {
    confirmAge();
    if (pendingMode) startMode(pendingMode);
    setPendingMode(null);
  };

  const handleAgeCancel = () => setPendingMode(null);

  const resumeGameFromLastSession = () => {
    if (!savedSession) return;
    setQuestions(savedSession.savedMode);
    setCurrentTitle(savedSession.savedTitle);
    setQuestionsCounter(savedSession.savedCounter);
    setIsGameOngoing(true);
  };

  // Leave the pack but keep progress, so it reappears under "Resume".
  const returnToModeSelection = () => {
    setIsGameOngoing(false);
    if (questions.length > 0 && questionsCounter < questions.length) {
      setSavedSession({
        savedMode: questions,
        savedCounter: questionsCounter,
        savedTitle: currentTitle,
      });
    }
  };

  const handleQuestionsCounterIncrement = () =>
    setQuestionsCounter((previous) => previous + 1);

  const handleQuestionsCounterDecrement = () =>
    setQuestionsCounter((previous) => previous - 1);

  useEffect(() => {
    if (!isGameOngoing) return;

    if (questionsCounter >= questions.length) {
      setIsGameOngoing(false);
      clearGameProgress();
      setSavedSession(null);
      return;
    }

    saveGameProgress(questions, questionsCounter, currentTitle);
  }, [questionsCounter, isGameOngoing, questions, currentTitle]);

  const isLastQuestion = questionsCounter >= questions.length - 1;
  const progress =
    questions.length > 0
      ? Math.min(((questionsCounter + 1) / questions.length) * 100, 100)
      : 0;

  return (
    <div className="questions">
      {pendingMode && (
        <AgeGate
          title={pendingMode.title}
          onConfirm={handleAgeConfirm}
          onCancel={handleAgeCancel}
        />
      )}

      {isGameOngoing ? (
        <div className="questionsContainer">
          <div className="header">
            {currentTitle && (
              <h3 className="currentModeTitle">{currentTitle}</h3>
            )}
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
            <div
              className="progressBar"
              role="progressbar"
              aria-valuenow={questionsCounter + 1}
              aria-valuemin={1}
              aria-valuemax={questions.length}
            >
              <div className="progressFill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <p className="questionsDisplay" key={questionsCounter}>
            {questions[questionsCounter]}
          </p>

          <div className="actions">
            <div className="actions__primary">
              {questionsCounter > 0 && (
                <button
                  className="secondaryButton"
                  onClick={handleQuestionsCounterDecrement}
                >
                  Previous question
                </button>
              )}
              <button onClick={handleQuestionsCounterIncrement}>
                {isLastQuestion ? "Explore other modes" : "Next question"}
              </button>
            </div>
            <button className="linkButton" onClick={returnToModeSelection}>
              Back to modes
            </button>
          </div>
        </div>
      ) : (
        <div className="modes">
          <nav className="topNav">
            <Link to="/">← Home</Link>
            <InstallPrompt />
          </nav>

          {savedSession && (
            <div className="resume">
              <div className="resume__body">
                <p className="resume__label">Resume your last session</p>
                {savedSession.savedTitle && (
                  <p className="resume__title">
                    {savedSession.savedTitle}
                    {savedSession.savedMode?.length > 0 && (
                      <span className="resume__meta">
                        {" · "}question {savedSession.savedCounter + 1} of{" "}
                        {savedSession.savedMode.length}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <button onClick={resumeGameFromLastSession}>Resume session</button>
            </div>
          )}

          <header className="modesHeader">
            <h1 className="modesTitle">Choose a mode</h1>
            <p className="modesSubtitle">
              Pick a deck of questions to get the conversation going.
            </p>
          </header>

          {modeCategories.map((category) => {
            const modesInCategory = availableModes.filter(
              (mode) => mode.category === category.key
            );
            if (modesInCategory.length === 0) return null;

            return (
              <section
                key={category.key}
                className={`modeSection modeSection--${category.key}`}
              >
                <div className="modeSection__head">
                  <h2 className="modeSection__title">{category.title}</h2>
                  <span className="modeSection__count">
                    {modesInCategory.length}
                  </span>
                </div>
                {category.note && (
                  <p className="modeSection__note">{category.note}</p>
                )}
                <div className="modeGrid">
                  {modesInCategory.map((mode) => (
                    <QuestionsMode
                      key={mode.title}
                      mode={mode}
                      onSelect={switchToSelectedMode}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Questions;
