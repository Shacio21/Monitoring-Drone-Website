import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "./navbar.css";
import logopolman from "../../assets/logo/logopolmannobackground.webp";

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src={logopolman} alt="Polman Logo" />
          <span>Drone Polman Bandung</span>
        </div>

        <ul className="navbar-menu">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li>Technology</li>
        <li>Contact</li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;