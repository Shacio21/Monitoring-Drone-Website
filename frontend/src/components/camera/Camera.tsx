import React, { useEffect, useRef, useState, useCallback } from "react";
import "./camera.css";
import StaggeredMenu from "../../components/staggeredmenu/StaggeredMenu";
import { useAuth } from "../../components/auth/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TelemetryOverlay {
  altitude:   number;
  speed:      number;
  battery:    number;
  roll:       number;
  pitch:      number;
  lat:        number;
  lng:        number;
  signalStrength: number;
  timestamp:  string;
}

// ─── Simulated telemetry for HUD overlay ─────────────────────────────────────
const generateTelemetry = (prev: TelemetryOverlay): TelemetryOverlay => {
  const fl = (v: number, r: number, min: number, max: number, d = 1) =>
    parseFloat(Math.max(min, Math.min(max, v + (Math.random() - 0.5) * r)).toFixed(d));

  return {
    altitude:  fl(prev.altitude,  1.5, 0, 120),
    speed:     fl(prev.speed,     2,   0, 80),
    battery:   Math.max(0, parseFloat((prev.battery - 0.01).toFixed(1))),
    roll:      fl(prev.roll,      0.6, -45, 45, 1),
    pitch:     fl(prev.pitch,     0.4, -30, 30, 1),
    lat:       parseFloat((prev.lat  + (Math.random() - 0.49) * 0.0002).toFixed(6)),
    lng:       parseFloat((prev.lng  + (Math.random() - 0.49) * 0.0002).toFixed(6)),
    signalStrength: fl(prev.signalStrength, 3, 60, 100, 0),
    timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
  };
};

const INITIAL_TELEMETRY: TelemetryOverlay = {
  altitude: 42.5, speed: 18.3, battery: 78.0,
  roll: 1.2, pitch: -0.8,
  lat: -6.9175, lng: 107.6191,
  signalStrength: 87,
  timestamp: "00:00:00",
};

// ─── Signal bars ──────────────────────────────────────────────────────────────
const SignalBars: React.FC<{ value: number }> = ({ value }) => (
  <div className="signal-bars">
    {[20, 40, 60, 80, 100].map((threshold, i) => (
      <div
        key={i}
        className="signal-bar"
        style={{
          height: `${40 + i * 15}%`,
          background: value >= threshold ? "#00ff88" : "rgba(255,255,255,0.1)",
          boxShadow: value >= threshold ? "0 0 4px #00ff88" : "none",
        }}
      />
    ))}
  </div>
);

// ─── Artificial horizon mini (inline SVG) ─────────────────────────────────────
const MiniHorizon: React.FC<{ roll: number; pitch: number }> = ({ roll, pitch }) => {
  const cx = 28, cy = 28, r = 24;
  const pitchOffset = (pitch / 30) * 10;

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="mini-horizon">
      <defs>
        <clipPath id="hCircle">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <g clipPath="url(#hCircle)">
        {/* Sky */}
        <rect x={-60} y={-60} width={180} height={180}
          fill="#0e3a5c" transform={`rotate(${roll}, ${cx}, ${cy})`} />
        {/* Ground */}
        <rect x={-60} y={cy + pitchOffset} width={180} height={60}
          fill="#3b2000" transform={`rotate(${roll}, ${cx}, ${cy})`} />
        {/* Horizon */}
        <line
          x1={-60} y1={cy + pitchOffset}
          x2={180} y2={cy + pitchOffset}
          stroke="rgba(255,255,255,0.8)" strokeWidth="1"
          transform={`rotate(${roll}, ${cx}, ${cy})`}
        />
      </g>
      {/* Aircraft reticle — fixed */}
      <line x1={8}  y1={cy} x2={20} y2={cy} stroke="#00ff88" strokeWidth="1.5" />
      <line x1={36} y1={cy} x2={48} y2={cy} stroke="#00ff88" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="2" fill="#00ff88" />
      {/* Border */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    </svg>
  );
};

// ─── Battery bar ─────────────────────────────────────────────────────────────
const BatteryBar: React.FC<{ value: number }> = ({ value }) => {
  const color = value > 50 ? "#00ff88" : value > 25 ? "#f0c040" : "#ff4466";
  return (
    <div className="hud-battery-bar">
      <div
        className="hud-battery-fill"
        style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}55` }}
      />
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const Camera: React.FC = () => {
  const { user } = useAuth();
  const videoUrl   = user?.video_url ?? "";
  const streamReady = !!videoUrl;

  const [loaded,     setLoaded]     = useState(false);
  const [isFullscreen, setFullscreen] = useState(false);
  const [telemetry,  setTelemetry]  = useState<TelemetryOverlay>(INITIAL_TELEMETRY);
  const [streamOk,   setStreamOk]   = useState(true);
  const [showHud,    setShowHud]    = useState(true);
  const [recording,  setRecording]  = useState(false);
  const [recTime,    setRecTime]    = useState(0);
  const [imgError,   setImgError]   = useState(false);

  // Reset error state whenever URL changes
  useEffect(() => { setImgError(false); setStreamOk(true); }, [videoUrl]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Entrance ──
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  // ── Telemetry feed ──
  useEffect(() => {
    const iv = setInterval(() => {
      setTelemetry(prev => generateTelemetry(prev));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Recording timer ──
  useEffect(() => {
    if (recording) {
      recTimerRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    } else {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      setRecTime(0);
    }
    return () => { if (recTimerRef.current) clearInterval(recTimerRef.current); };
  }, [recording]);

  // ── Fullscreen API ──
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await wrapperRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === "h" || e.key === "H") setShowHud(v => !v);
      if (e.key === "r" || e.key === "R") setRecording(v => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFullscreen]);

  // ── Format record time ──
  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const battColor = telemetry.battery > 50 ? "#00ff88" : telemetry.battery > 25 ? "#f0c040" : "#ff4466";

  if (!streamReady) {
    return (
      <div className="camera-page">
        <StaggeredMenu />
        <main style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"80vh", gap:"1rem", textAlign:"center" }}>
          <span style={{ fontSize:"2.5rem" }}>⚙️</span>
          <h2 style={{ color:"#fff", margin:0 }}>Video URL Belum Dikonfigurasi</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", maxWidth:360 }}>
            Lengkapi <strong style={{ color:"#00d4ff" }}>Video URL</strong> di halaman Profil.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="camera-page">
      {/* Video BG — behind everything */}
      <div className="video-bg-wrapper">
        <video className="video-bg" src="/videos/drone-bg.mp4" autoPlay loop muted playsInline />
        <div className="video-overlay" />
        <div className="video-vignette" />
      </div>

      <StaggeredMenu />

      <main className="camera-content">

        {/* ── HEADER ── */}
        <header className={`page-header ${loaded ? "fade-in" : ""}`}>
          <div>
            <p className="page-eyebrow">UAV · Imaging Systems</p>
            <h1 className="page-title">Camera <span className="title-accent">Feed</span></h1>
          </div>
          <div className="header-right">
            <div className={`live-badge ${loaded ? "fade-in delay-1" : ""} ${!streamOk ? "error" : ""}`}>
              <span className="live-dot" />
              {streamOk ? "LIVE STREAM" : "NO SIGNAL"}
            </div>
            {recording && (
              <div className="rec-badge fade-in">
                <span className="rec-dot" />
                REC {fmtTime(recTime)}
              </div>
            )}
          </div>
        </header>

        {/* ── VIEWER ── */}
        <div
          ref={wrapperRef}
          className={`camera-wrapper ${loaded ? "fade-in delay-1" : ""} ${isFullscreen ? "is-fullscreen" : ""}`}
        >
          {/* ── STREAM ── */}
          <div className="stream-container">
            {!imgError ? (
              <img
                className="stream-img"
                src={videoUrl}
                alt="Drone Camera Feed"
                onError={() => { setImgError(true); setStreamOk(false); }}
                onLoad={() => { setImgError(false); setStreamOk(true); }}
              />
            ) : (
              /* No signal placeholder */
              <div className="no-signal">
                <div className="no-signal-inner">
                  <div className="no-signal-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <rect x="4"  y="14" width="44" height="30" rx="3"
                        stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                      <polygon points="48,20 60,12 60,42 48,34"
                        stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
                      <line x1="8" y1="8" x2="56" y2="56"
                        stroke="rgba(255,68,102,0.6)" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="no-signal-title">NO VIDEO SIGNAL</p>
                  <p className="no-signal-sub">
                    Attempting to connect to<br />
                    <code>{videoUrl}</code>
                  </p>
                  <button
                    className="retry-btn"
                    onClick={() => { setImgError(false); setStreamOk(true); }}
                  >
                    ⟳ Retry Connection
                  </button>
                </div>
              </div>
            )}

            {/* ── HUD OVERLAY ── */}
            {showHud && streamOk && !imgError && (
              <div className="hud-overlay">

                {/* ── Corner brackets ── */}
                <div className="corner tl" />
                <div className="corner tr" />
                <div className="corner bl" />
                <div className="corner br" />

                {/* ── Crosshair center ── */}
                <div className="crosshair">
                  <div className="ch-h" />
                  <div className="ch-v" />
                  <div className="ch-center" />
                </div>

                {/* ── TOP BAR ── */}
                <div className="hud-top">
                  <div className="hud-top-left">
                    <span className="hud-tag">ALT</span>
                    <span className="hud-val">{telemetry.altitude.toFixed(1)}<em>m</em></span>
                  </div>
                  <div className="hud-top-center">
                    <span className="hud-timestamp">{telemetry.timestamp}</span>
                    {recording && <span className="hud-rec">● REC</span>}
                  </div>
                  <div className="hud-top-right">
                    <span className="hud-tag">SPD</span>
                    <span className="hud-val">{telemetry.speed.toFixed(1)}<em>km/h</em></span>
                  </div>
                </div>

                {/* ── LEFT PANEL ── */}
                <div className="hud-left">
                  <MiniHorizon roll={telemetry.roll} pitch={telemetry.pitch} />
                  <div className="hud-attitude">
                    <div className="att-row">
                      <span>R</span>
                      <span style={{ color: Math.abs(telemetry.roll) > 10 ? "#f0c040" : "#00ff88" }}>
                        {telemetry.roll >= 0 ? "+" : ""}{telemetry.roll.toFixed(1)}°
                      </span>
                    </div>
                    <div className="att-row">
                      <span>P</span>
                      <span style={{ color: Math.abs(telemetry.pitch) > 10 ? "#f0c040" : "#00ff88" }}>
                        {telemetry.pitch >= 0 ? "+" : ""}{telemetry.pitch.toFixed(1)}°
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="hud-right">
                  {/* Battery */}
                  <div className="hud-batt-wrap">
                    <div className="hud-batt-icon" style={{ borderColor: battColor }}>
                      <div
                        className="hud-batt-level"
                        style={{ height: `${telemetry.battery}%`, background: battColor }}
                      />
                      <div className="hud-batt-tip" style={{ background: battColor }} />
                    </div>
                    <span className="hud-batt-pct" style={{ color: battColor }}>
                      {telemetry.battery.toFixed(0)}%
                    </span>
                  </div>
                  <BatteryBar value={telemetry.battery} />

                  {/* Signal */}
                  <div className="hud-signal-wrap">
                    <SignalBars value={telemetry.signalStrength} />
                    <span className="hud-signal-val">{telemetry.signalStrength}%</span>
                  </div>
                </div>

                {/* ── BOTTOM BAR ── */}
                <div className="hud-bottom">
                  <div className="hud-bottom-left">
                    <span className="hud-coord">
                      {telemetry.lat.toFixed(5)}, {telemetry.lng.toFixed(5)}
                    </span>
                  </div>
                  <div className="hud-bottom-center">
                    <div className="hud-compass-mini">
                      {["N","NE","E","SE","S","SW","W","NW"].map((d) => (
                        <span key={d} className={`cm-dir ${d === "N" ? "north" : ""}`}>{d}</span>
                      ))}
                    </div>
                  </div>
                  <div className="hud-bottom-right">
                    <span className="hud-res">1080p · 30fps</span>
                  </div>
                </div>

                {/* ── Scan line animation ── */}
                <div className="scan-line" />

              </div>
            )}

            {/* ── CONTROLS BAR (over stream) ── */}
            <div className={`controls-bar ${isFullscreen ? "fullscreen-controls" : ""}`}>
              {/* Left controls */}
              <div className="ctrl-group">
                <button
                  className={`cam-btn ${recording ? "recording" : ""}`}
                  onClick={() => setRecording(v => !v)}
                  title="Toggle Recording (R)"
                >
                  {recording ? (
                    <><span className="btn-icon">⏹</span><span>Stop</span></>
                  ) : (
                    <><span className="btn-icon">⏺</span><span>Record</span></>
                  )}
                </button>

                <button
                  className={`cam-btn ${showHud ? "active" : ""}`}
                  onClick={() => setShowHud(v => !v)}
                  title="Toggle HUD (H)"
                >
                  <span className="btn-icon">⊞</span>
                  <span>HUD</span>
                </button>
              </div>

              {/* Center — source info */}
              <div className="ctrl-source">
                <span className="source-dot" style={{ background: streamOk && !imgError ? "#00ff88" : "#ff4466" }} />
                <span className="source-url">localhost:3000/video</span>
              </div>

              {/* Right controls */}
              <div className="ctrl-group">
                <button
                  className="cam-btn"
                  onClick={toggleFullscreen}
                  title="Toggle Fullscreen (F)"
                >
                  <span className="btn-icon">{isFullscreen ? "⛶" : "⛶"}</span>
                  <span>{isFullscreen ? "Exit" : "Fullscreen"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── INFO STRIP ── */}
        <div className={`info-strip ${loaded ? "fade-in delay-2" : ""}`}>
          <div className="info-item">
            <span className="info-label">Source</span>
            <span className="info-val">MJPEG Stream</span>
          </div>
          <div className="info-sep" />
          <div className="info-item">
            <span className="info-label">Endpoint</span>
            <span className="info-val mono">{videoUrl}</span>
          </div>
          <div className="info-sep" />
          <div className="info-item">
            <span className="info-label">Aspect Ratio</span>
            <span className="info-val">16 : 9</span>
          </div>
          <div className="info-sep" />
          <div className="info-item">
            <span className="info-label">Shortcuts</span>
            <span className="info-val mono">F · Fullscreen &nbsp;|&nbsp; H · Toggle HUD &nbsp;|&nbsp; R · Record</span>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Camera;