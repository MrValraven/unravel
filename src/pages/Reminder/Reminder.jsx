import React from "react";
import "./styles.scss";

import { useNavigate } from "react-router-dom";

import ReminderImage from "../../assets/reminder.svg";

const Reminder = () => {
  let navigate = useNavigate();
  return (
    <div className="reminder">
      <img src={ReminderImage} alt="" />
      <h1>Reminder</h1>
      <ul>
        <li>
          Start off with a compliment about their work, their energy or a
          platonic physical compliment.
        </li>
        <li>Keep things light and playful.</li>
        <li>Steer conversation toward emotions.</li>
      </ul>
      <button onClick={() => navigate("/questions")}>Start game</button>
    </div>
  );
};

export default Reminder;
