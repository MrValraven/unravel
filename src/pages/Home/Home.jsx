import React from "react";
import "./styles.scss";
import { useNavigate } from "react-router-dom";

import HeroImage from "../../assets/conversation.svg";

const Home = () => {
  let navigate = useNavigate();
  return (
    <div className="home">
      <div className="header">
        <h1>Questionr</h1>
        <p>The uncomplicated way of meeting someone new</p>
      </div>
      <img src={HeroImage} alt="" />
      <button onClick={() => navigate("/reminder")}>Get started</button>
    </div>
  );
};

export default Home;
