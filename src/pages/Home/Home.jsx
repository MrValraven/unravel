import React from "react";
import "./styles.scss";
import { useNavigate } from "react-router-dom";

import HeroImage from "../../assets/conversation.svg";

const Home = () => {
  let navigate = useNavigate();
  return (
    <div className="home">
      <div className="header">
        <h1>Unravel</h1>
        <p>The uncomplicated way of making new friends</p>
      </div>
      <img src={HeroImage} alt="" />
      <button onClick={() => navigate("/reminder")}>Get started</button>
      <footer>
        Made with ✨ by{" "}
        <a
          href="https:\\tiagocostadev.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          Tiago Costa
        </a>
      </footer>
    </div>
  );
};

export default Home;
