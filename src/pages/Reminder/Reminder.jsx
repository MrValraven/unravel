import React from "react";
import "./styles.scss";

import { useNavigate } from "react-router-dom";

import ReminderImage from "../../assets/reminder.svg";

const Reminder = () => {
  let navigate = useNavigate();
  return (
    <div className="reminder">
      <img src={ReminderImage} alt="" />
      <h1>What is Unravel?</h1>
      <ul>
        <li>
          Unravel is a social game that helps people connect in an easy and carefree way.
        </li>
        <li>As the game unfolds, the questions and challenges allow users to gradually increase the level of familiarity and intimacy between them.</li>
        <li>Each mode is tailored to a specific situation and the game is meant to display the questions always in the same order, but feel free to play the game as you like and enjoy the blissful feeling of making new connections :)</li>
      </ul>
      <button onClick={() => navigate("/questions")}>Start game</button>
    </div>
  );
};

export default Reminder;
