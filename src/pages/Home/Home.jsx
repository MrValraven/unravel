import React from "react";
import "./styles.scss";
import { useNavigate } from "react-router-dom";
import { FiRefreshCw } from "react-icons/fi";

import HeroImage from "../../assets/conversation.svg";
import { useAppUpdate } from "./useAppUpdate";

const Home = () => {
  let navigate = useNavigate();
  const { updateAvailable, applyUpdate } = useAppUpdate();
  return (
    <div className="home">
      <div className="hero">
        <div className="hero__copy">
          <h1>Unravel</h1>
          <p className="hero__tagline">
            The uncomplicated way of making new friends
          </p>
          <button onClick={() => navigate("/reminder")}>Get started</button>
          {updateAvailable && (
            <button
              type="button"
              className="hero__update"
              onClick={applyUpdate}
            >
              <FiRefreshCw aria-hidden="true" /> New version available
            </button>
          )}
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
