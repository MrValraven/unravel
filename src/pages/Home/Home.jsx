import React from "react";
import "./styles.scss";
import { useNavigate } from "react-router-dom";

import HeroImage from "../../assets/conversation.svg";

const Home = () => {
  let navigate = useNavigate();
  return (
    <div className="home">
      <div className="hero">
        <div className="hero__copy">
          <h1>Unravel</h1>
          <p className="hero__tagline">
            The uncomplicated way of making new friends
          </p>
          <button onClick={() => navigate("/reminder")}>Get started</button>
        </div>
        <div className="hero__art">
          <img src={HeroImage} alt="" />
        </div>
      </div>
      <footer>
        Made with ✨ by{" "}
        <a
          href="https://tiagocostadev.com"
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
