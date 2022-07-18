import React from "react";
import "./styles.scss";
import { useNavigate } from "react-router-dom";

import HeroImage from "../../assets/conversation.svg";

const Home = () => {
  let navigate = useNavigate();
  return (
    <div className="home">
      {/* <p>
        Start off with a compliment about their work, their energy or a
        platonical physical compliment
      </p>
      <p>What does this remind me of? Para saltar entre tópicos</p>
      <p>Steer conversation toward emotions</p> */}
      <h1>Questionr</h1>
      <p>The uncomplicated way of meeting someone new</p>
      <img src={HeroImage} alt="" />
      <button onClick={() => navigate("/questions")}>Get started</button>
    </div>
  );
};

export default Home;
