import React, { useEffect, useState } from "react";
import "./dashboard.css";
import StaggeredMenu from "../../components/staggeredmenu/StaggeredMenu";
import videoBg from "../../assets/video/videobackground1.mp4";

const Dashboard: React.FC = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard-page">
      {/* ── VIDEO BACKGROUND ── */}
      <div className="video-bg-wrapper">
        <video
          className="video-bg"
          src={videoBg}  
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Multi-layer overlay agar teks tetap terbaca */}
        <div className="video-overlay" />
        <div className="video-vignette" />
      </div>

      <StaggeredMenu />

      <div className="dashboard-content">

        {/* ── HERO ── */}
        <section className={`dashboard-hero ${loaded ? "fade-in" : ""}`}>
          <div className="hero-eyebrow">Agriculture Drone · Polman Bandung</div>
          <h1>
            UAV Mission
            <br />
            <span className="hero-accent">Control Center</span>
          </h1>
          <p>
            Real-time monitoring of flight stability, energy systems,
            and payload conditions — all in one place.
          </p>
        </section>

        {/* ── DIVIDER LINE ── */}
        <div className={`section-divider ${loaded ? "fade-in delay-1" : ""}`} />

        {/* ── INFO CARDS ── */}
        <section className={`info-section ${loaded ? "fade-in delay-2" : ""}`}>
          {[
            { icon: "🎯", title: "System Purpose",       desc: "Centralized monitoring to ensure drone flight stability and operational safety during agricultural missions." },
            { icon: "🧭", title: "Flight Stability",     desc: "Roll, Pitch, and Yaw continuously compared against setpoints to determine real-time stability status." },
            { icon: "🔋", title: "Energy Management",    desc: "Battery level and voltage tracking to prevent unexpected mission interruption mid-flight." },
            { icon: "💧", title: "Payload Monitoring",   desc: "Track pesticide tank capacity to optimize spraying efficiency and mission planning." },
            { icon: "📡", title: "Position Tracking",    desc: "GPS-based location tracking for accurate field navigation and mission documentation." },
          ].map(({ icon, title, desc }) => (
            <div className="dashboard-card" key={title}>
              <div className="card-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </section>

        {/* ── STATUS ── */}
        <section className={`status-section ${loaded ? "fade-in delay-3" : ""}`}>
          <h2 className="status-title">System Status</h2>
          <div className="status-indicators">
            {["Dashboard Ready", "Telemetry Ready", "Mission Standby"].map((label) => (
              <div className="status-box active" key={label}>
                <span className="status-dot" />
                {label}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;