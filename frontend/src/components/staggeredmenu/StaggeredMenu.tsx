import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiActivity, FiBattery, FiDroplet, FiMapPin, FiCrosshair, FiUser } from "react-icons/fi";
import { AiOutlineLineChart } from "react-icons/ai";
import "./staggeredmenu.css";

const menuItems = [
  { icon: <FiActivity />, label: "Attitude Monitoring", path: "/attitude" },
  { icon: <FiBattery />, label: "Battery Monitoring", path: "/battery" },
  { icon: <FiDroplet />, label: "Water Level Monitoring", path: "/water" },
  { icon: <FiMapPin />, label: "GPS Monitoring", path: "/gps" },
  { icon: <AiOutlineLineChart />, label: "Realtime Graph", path: "/graph" },
  { icon: <FiCrosshair />, label: "Flight Camera", path: "/camera" },
  { icon: <FiUser />, label: "Profile", path: "/profil" }
];

const StaggeredMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <aside className={`staggered-menu ${isOpen ? "open" : "closed"}`}>
      
      {/* Header */}
      <div className="menu-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="menu-logo">
          <span className="logo-hex">✦</span>
          <span className="menu-title">UAV Control</span>
        </div>
        <button className="menu-toggle-btn" aria-label="Toggle menu">
          <span className={`hamburger ${isOpen ? "is-open" : ""}`}>
            <span /><span /><span />
          </span>
        </button>
      </div>

      {/* Nav items */}
      <nav className="menu-items-wrapper">
        {menuItems.map(({ icon, label, path }, index) => (
          <div
            key={label}
            className="menu-item"
            style={{ animationDelay: `${index * 0.08}s` }}
            onClick={() => navigate(path)}
          >
            <span className="item-icon">{icon}</span>
            <span className="item-label">{label}</span>
            <span className="item-arrow">›</span>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="menu-footer">
        <span className="footer-dot" />
        <span className="footer-text">System Online</span>
      </div>

    </aside>
  );
};

export default StaggeredMenu;