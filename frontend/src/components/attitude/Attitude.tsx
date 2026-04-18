import React, { useEffect, useState, useRef, useCallback } from "react";
import "./attitude.css";
import StaggeredMenu from "../../components/staggeredmenu/StaggeredMenu";
import { useAuth } from "../../components/auth/AuthContext";

// ══════════════════════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════════════════════
interface AttitudeData {
  roll      : number;  // degrees  -180 to 180  ← MQTT
  pitch     : number;  // degrees  -90  to 90   ← MQTT
  yaw       : number;  // degrees  0    to 360  ← MQTT
  rollSP    : number;  // setpoint               ← MQTT
  pitchSP   : number;  //                        ← MQTT
  yawSP     : number;  //                        ← MQTT
  rollRate  : number;  // deg/s                  ← MQTT
  pitchRate : number;  //                        ← MQTT
  yawRate   : number;  //                        ← MQTT
}

type AxisStatus       = "STABLE" | "WARNING" | "CRITICAL";
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

// ══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const getStatus = (error: number, warn: number, crit: number): AxisStatus => {
  const abs = Math.abs(error);
  if (abs >= crit) return "CRITICAL";
  if (abs >= warn) return "WARNING";
  return "STABLE";
};

const INITIAL: AttitudeData = {
  roll: 0, pitch: 0, yaw: 0,
  rollSP: 0, pitchSP: 0, yawSP: 0,
  rollRate: 0, pitchRate: 0, yawRate: 0,
};

// ══════════════════════════════════════════════════════════════════════════════
//  ADI CANVAS DRAW
// ══════════════════════════════════════════════════════════════════════════════
const drawADI = (canvas: HTMLCanvasElement, roll: number, pitch: number) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  const CX = W / 2, CY = H / 2;
  const R  = Math.min(W, H) / 2 - 4;

  ctx.clearRect(0, 0, W, H);

  // Clip to circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.clip();

  // Sky + ground rotate with roll/pitch
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate((roll * Math.PI) / 180);

  const pitchOffset = (pitch / 90) * R * 1.4;

  // Sky
  const skyGrad = ctx.createLinearGradient(0, -R * 2, 0, pitchOffset);
  skyGrad.addColorStop(0, "#0a2a4a");
  skyGrad.addColorStop(1, "#0e4a7a");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-R * 2, -R * 2, R * 4, R * 2 + pitchOffset + 2);

  // Ground
  const gndGrad = ctx.createLinearGradient(0, pitchOffset, 0, R * 2);
  gndGrad.addColorStop(0, "#4a3000");
  gndGrad.addColorStop(1, "#2a1800");
  ctx.fillStyle = gndGrad;
  ctx.fillRect(-R * 2, pitchOffset, R * 4, R * 2);

  // Horizon line
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-R * 2, pitchOffset);
  ctx.lineTo(R * 2, pitchOffset);
  ctx.stroke();

  // Pitch ladder
  for (let deg = -80; deg <= 80; deg += 10) {
    if (deg === 0) continue;
    const y        = pitchOffset - (deg / 90) * R * 1.4;
    const isLong   = deg % 30 === 0;
    const len      = isLong ? R * 0.45 : R * 0.28;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth   = isLong ? 1.2 : 0.8;
    ctx.beginPath();
    ctx.moveTo(-len, y);
    ctx.lineTo( len, y);
    ctx.stroke();
    if (isLong) {
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = `bold ${R * 0.09}px 'JetBrains Mono', monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`${Math.abs(deg)}`, -len - 4, y + 4);
      ctx.textAlign = "left";
      ctx.fillText(`${Math.abs(deg)}`,  len + 4, y + 4);
    }
  }
  ctx.restore();

  // Aircraft symbol (fixed)
  const acColor = "#00ff88";
  ctx.strokeStyle = acColor;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = acColor;
  ctx.shadowBlur  = 8;

  ctx.beginPath(); ctx.moveTo(CX - R * 0.18, CY); ctx.lineTo(CX - R * 0.5, CY); ctx.lineTo(CX - R * 0.5, CY + R * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CX + R * 0.18, CY); ctx.lineTo(CX + R * 0.5, CY); ctx.lineTo(CX + R * 0.5, CY + R * 0.1); ctx.stroke();

  ctx.fillStyle = acColor;
  ctx.beginPath();
  ctx.arc(CX, CY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Roll arc
  ctx.save();
  ctx.translate(CX, CY);

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, R - 8, (-160 * Math.PI) / 180, (-20 * Math.PI) / 180);
  ctx.stroke();

  [60,45,30,20,10,-10,-20,-30,-45,-60].forEach(deg => {
    const angle   = ((-90 + deg) * Math.PI) / 180;
    const isMajor = Math.abs(deg) % 30 === 0 || Math.abs(deg) === 45;
    const len = isMajor ? 10 : 6;
    const r   = R - 8;
    ctx.strokeStyle = isMajor ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)";
    ctx.lineWidth   = isMajor ? 1.5 : 0.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r,          Math.sin(angle) * r);
    ctx.lineTo(Math.cos(angle) * (r - len),  Math.sin(angle) * (r - len));
    ctx.stroke();
  });

  ctx.save();
  ctx.rotate((roll * Math.PI) / 180);
  const rollIndColor = Math.abs(roll) > 20 ? "#f0c040" : "#00ff88";
  ctx.fillStyle  = rollIndColor;
  ctx.shadowColor = rollIndColor;
  ctx.shadowBlur  = 6;
  const tp = R - 8;
  ctx.beginPath();
  ctx.moveTo(0, -tp);
  ctx.lineTo(-6, -tp + 12);
  ctx.lineTo( 6, -tp + 12);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.restore();

  ctx.restore(); // un-clip

  // Border
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(CX, CY, R + 1, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,255,136,0.12)";
  ctx.lineWidth = 3;
  ctx.stroke();
};

// ══════════════════════════════════════════════════════════════════════════════
//  GAUGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
interface GaugeProps {
  value    : number;
  min      : number;
  max      : number;
  label    : string;
  unit     : string;
  color    : string;
  setpoint : number;
}

const Gauge: React.FC<GaugeProps> = ({ value, min, max, label, unit, color, setpoint }) => {
  const range    = max - min;
  const pct      = (value - min) / range;
  const spPct    = (setpoint - min) / range;
  const ARC      = 240;
  const startDeg = 270 - ARC / 2;

  const toXY = (p: number, r: number) => {
    const deg = startDeg + p * ARC;
    const rad = (deg * Math.PI) / 180;
    return { x: 60 + r * Math.cos(rad), y: 60 + r * Math.sin(rad) };
  };

  const arcPath = (p: number, r: number) => {
    if (p <= 0) return "";
    const c   = Math.min(p, 0.9999);
    const end = toXY(c, r);
    const lg  = c * ARC > 180 ? 1 : 0;
    const s   = toXY(0, r);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${lg} 1 ${end.x} ${end.y}`;
  };

  const needleEnd = toXY(pct, 36);
  const spPos     = toXY(spPct, 42);

  return (
    <svg viewBox="0 0 120 120" className="gauge-svg">
      <path d={arcPath(1, 44)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round" />
      <path d={arcPath(1, 44)} fill="none" stroke="rgba(255,68,102,0.12)" strokeWidth="8" strokeLinecap="round" />
      <path d={arcPath(Math.abs(pct), 44)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "all 0.4s ease" }} />
      <circle cx={spPos.x} cy={spPos.y} r="3" fill="#ffffff88" />
      <line x1="60" y1="60" x2={needleEnd.x} y2={needleEnd.y}
        stroke={color} strokeWidth="1.5" strokeLinecap="round"
        style={{ transition: "all 0.4s ease", filter: `drop-shadow(0 0 3px ${color})` }} />
      <circle cx="60" cy="60" r="4" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <text x="60" y="78" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="13" fontWeight="600" fill="#fff">
        {value.toFixed(1)}
      </text>
      <text x="60" y="90" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="8" fill="rgba(255,255,255,0.4)">
        {unit}
      </text>
      <text x="60" y="108" textAnchor="middle" fontFamily="'Syne', sans-serif" fontSize="9" fontWeight="700" letterSpacing="2" fill="rgba(255,255,255,0.7)">
        {label}
      </text>
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const Attitude: React.FC = () => {
  const { user } = useAuth();

  const MQTT_HOST    = user?.host ?? "";
  const MQTT_WS_PORT = user?.port ?? 8083;
  const MQTT_TOPIC   = user?.attitude_topic ?? "";
  const mqttReady    = !!(MQTT_HOST && MQTT_WS_PORT && MQTT_TOPIC);

  const [data,        setData       ] = useState<AttitudeData>(INITIAL);
  const [loaded,      setLoaded     ] = useState(false);
  const [connStatus,  setConnStatus ] = useState<ConnectionStatus>("connecting");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const adiRef    = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const dataRef   = useRef<AttitudeData>(INITIAL);
  const wsRef     = useRef<WebSocket | null>(null);
  const retryRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // entrance
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);

  // keep dataRef in sync for rAF loop
  useEffect(() => { dataRef.current = data; }, [data]);

  // ADI 60fps render loop
  useEffect(() => {
    const loop = () => {
      if (adiRef.current) drawADI(adiRef.current, dataRef.current.roll, dataRef.current.pitch);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ── MQTT WebSocket ──────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!mqttReady) return;
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    setConnStatus("connecting");

    const clientId = `att-ui-${Math.random().toString(16).slice(2, 10)}`;
    let ws: WebSocket;
    try { ws = new WebSocket(`ws://${MQTT_HOST}:${MQTT_WS_PORT}/mqtt`, ["mqtt"]); }
    catch { setConnStatus("error"); return; }

    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    // CONNECT packet
    ws.onopen = () => {
      const enc  = new TextEncoder();
      const cId  = enc.encode(clientId);
      const name = enc.encode("MQTT");
      const vh   = [0x00, 0x04, ...name, 0x04, 0x02, 0x00, 0x3c];
      const pl   = [(cId.length >> 8) & 0xff, cId.length & 0xff, ...cId];
      ws.send(new Uint8Array([0x10, vh.length + pl.length, ...vh, ...pl]).buffer);
    };

    ws.onmessage = (event) => {
      const buf  = new Uint8Array(event.data as ArrayBuffer);
      const type = (buf[0] >> 4) & 0x0f;

      // CONNACK → subscribe
      if (type === 2) {
        if (buf[3] !== 0x00) { setConnStatus("error"); return; }
        setConnStatus("connected");
        const enc = new TextEncoder();
        const tb  = enc.encode(MQTT_TOPIC);
        const tl  = tb.length;
        ws.send(new Uint8Array([
          0x82, 2 + 2 + tl + 1,
          0x00, 0x01,
          (tl >> 8) & 0xff, tl & 0xff,
          ...tb, 0x00,
        ]).buffer);
        return;
      }

      // PUBLISH
      if (type === 3) {
        try {
          let off = 1, mult = 1, rem = 0, byte: number;
          do { byte = buf[off++]; rem += (byte & 0x7f) * mult; mult *= 128; } while (byte & 0x80);
          const tl = (buf[off] << 8) | buf[off + 1];
          off += 2 + tl;

          const raw: AttitudeData = JSON.parse(new TextDecoder().decode(buf.slice(off)));

          // Normalise yaw ke 0-360
          const yaw = ((raw.yaw % 360) + 360) % 360;
          setData({ ...raw, yaw });
          setLastUpdated(new Date());
        } catch (e) { console.warn("MQTT parse error:", e); }
      }
    };

    ws.onerror = () => setConnStatus("error");
    ws.onclose = () => {
      setConnStatus("disconnected");
      retryRef.current = setTimeout(connect, 5000);
    };
  }, [mqttReady, MQTT_HOST, MQTT_WS_PORT, MQTT_TOPIC]);

  useEffect(() => {
    if (!mqttReady) { setConnStatus("disconnected"); return; }
    connect();
    return () => {
      retryRef.current && clearTimeout(retryRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect, mqttReady]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const hasData = lastUpdated !== null;

  const rollError  = parseFloat((data.roll  - data.rollSP ).toFixed(2));
  const pitchError = parseFloat((data.pitch - data.pitchSP).toFixed(2));
  const yawError   = parseFloat((((data.yaw - data.yawSP + 180) % 360) - 180).toFixed(2));

  const rollStatus  = getStatus(rollError,  5, 15);
  const pitchStatus = getStatus(pitchError, 5, 15);
  const yawStatus   = getStatus(yawError,   5, 20);

  const overallStatus =
    [rollStatus, pitchStatus, yawStatus].includes("CRITICAL") ? "CRITICAL" :
    [rollStatus, pitchStatus, yawStatus].includes("WARNING")  ? "WARNING"  : "STABLE";

  const statusColor = (s: AxisStatus) =>
    s === "STABLE" ? "#00ff88" : s === "WARNING" ? "#f0c040" : "#ff4466";
  const statusIcon  = (s: AxisStatus) =>
    s === "STABLE" ? "✦" : s === "WARNING" ? "⚠" : "✖";
  const gaugeColor  = (err: number, warn: number, crit: number) =>
    statusColor(getStatus(err, warn, crit));

  const connColor =
    connStatus === "connected"  ? "#00ff88" :
    connStatus === "connecting" ? "#f0c040" :
    connStatus === "error"      ? "#ff4466" : "#888";

  const connLabel =
    connStatus === "connected"  ? "LIVE · MQTT" :
    connStatus === "connecting" ? "Connecting…"  :
    connStatus === "error"      ? "MQTT Error"   : "Disconnected";

  // ── Render ──────────────────────────────────────────────────────────────
  if (!mqttReady) {
    return (
      <div className="attitude-page">
        <StaggeredMenu />
        <main style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"80vh", gap:"1rem", textAlign:"center" }}>
          <span style={{ fontSize:"2.5rem" }}>⚙️</span>
          <h2 style={{ color:"#fff", margin:0 }}>MQTT Belum Dikonfigurasi</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", maxWidth:360 }}>
            Lengkapi <strong style={{ color:"#00d4ff" }}>Host</strong>,{" "}
            <strong style={{ color:"#00d4ff" }}>Port</strong>, dan{" "}
            <strong style={{ color:"#00d4ff" }}>Attitude Topic</strong> di halaman Profil.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="attitude-page">

      <div className="video-bg-wrapper">
        <video className="video-bg" src="/videos/drone-bg.mp4" autoPlay loop muted playsInline />
        <div className="video-overlay" />
        <div className="video-vignette" />
      </div>

      <StaggeredMenu />

      <main className="attitude-content">

        {/* ── HEADER ── */}
        <header className={`page-header ${loaded ? "fade-in" : ""}`}>
          <div>
            <p className="page-eyebrow">UAV · Flight Control</p>
            <h1 className="page-title">Attitude <span className="title-accent">Monitor</span></h1>
          </div>
          <div className="header-right">
            {/* MQTT badge */}
            <div className={`live-badge ${loaded ? "fade-in delay-1" : ""}`} title={`Topic: ${MQTT_TOPIC}`}>
              <span className="live-dot" style={{ background: connColor, boxShadow: `0 0 6px ${connColor}` }} />
              <span style={{ color: connColor }}>{connLabel}</span>
            </div>

            {/* Overall flight status */}
            <div
              className={`overall-status ${loaded ? "fade-in delay-1" : ""}`}
              style={{ "--sc": statusColor(overallStatus) } as React.CSSProperties}
            >
              <span className="os-icon">{statusIcon(overallStatus)}</span>
              <span className="os-label">{overallStatus}</span>
            </div>
          </div>
        </header>

        {/* Timestamp */}
        <p className="last-updated">
          {hasData
            ? `Last update: ${lastUpdated!.toLocaleTimeString()} · ${MQTT_TOPIC}`
            : `Waiting for data… · ${MQTT_TOPIC}`}
        </p>

        {/* ── MAIN GRID ── */}
        <div className="attitude-grid">

          {/* ══ ADI ══ */}
          <div className={`card adi-card ${loaded ? "fade-in delay-1" : ""}`}>
            <p className="card-section-label">Artificial Horizon (ADI)</p>
            <div className="adi-wrap">
              <canvas ref={adiRef} className="adi-canvas" width={320} height={320} />

              {/* HUD overlays */}
              <div className="adi-left-hud">
                <div className="hud-axis">
                  <span className="hud-axis-label">ROLL</span>
                  <span className="hud-axis-val" style={{ color: statusColor(rollStatus) }}>
                    {hasData ? `${data.roll >= 0 ? "+" : ""}${data.roll.toFixed(1)}°` : "—"}
                  </span>
                </div>
                <div className="hud-axis">
                  <span className="hud-axis-label">PITCH</span>
                  <span className="hud-axis-val" style={{ color: statusColor(pitchStatus) }}>
                    {hasData ? `${data.pitch >= 0 ? "+" : ""}${data.pitch.toFixed(1)}°` : "—"}
                  </span>
                </div>
              </div>

              <div className="adi-right-hud">
                <div className="hud-axis">
                  <span className="hud-axis-label">YAW</span>
                  <span className="hud-axis-val" style={{ color: statusColor(yawStatus) }}>
                    {hasData ? `${data.yaw.toFixed(1)}°` : "—"}
                  </span>
                </div>
                <div className="hud-axis">
                  <span className="hud-axis-label">HDNG</span>
                  <span className="hud-axis-val" style={{ color: "#00b4ff" }}>
                    {hasData ? `${Math.round(data.yaw).toString().padStart(3, "0")}°` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Compass strip */}
            <div className="compass-strip">
              {["N","NE","E","SE","S","SW","W","NW"].map((dir, i) => {
                const deg  = i * 45;
                const diff = ((data.yaw - deg + 540) % 360) - 180;
                const opacity = Math.max(0, 1 - Math.abs(diff) / 90);
                const scale   = Math.max(0.7, 1 - Math.abs(diff) / 120);
                return (
                  <span key={dir} className="compass-dir"
                    style={{ opacity, transform: `scale(${scale})`, color: dir === "N" ? "#ff6680" : "#fff" }}>
                    {dir}
                  </span>
                );
              })}
              <div className="compass-cursor" />
            </div>
          </div>

          {/* ══ GAUGES ══ */}
          <div className="gauges-col">
            <p className="card-section-label" style={{ marginBottom: "0.8rem" }}>Axis Gauges</p>
            <div className={`card gauge-card ${loaded ? "fade-in delay-1" : ""}`}>
              <Gauge value={data.roll}  min={-45} max={45}  label="ROLL"  unit="degrees"
                color={gaugeColor(rollError,  5, 15)} setpoint={data.rollSP} />
            </div>
            <div className={`card gauge-card ${loaded ? "fade-in delay-2" : ""}`}>
              <Gauge value={data.pitch} min={-30} max={30}  label="PITCH" unit="degrees"
                color={gaugeColor(pitchError, 5, 15)} setpoint={data.pitchSP} />
            </div>
            <div className={`card gauge-card ${loaded ? "fade-in delay-3" : ""}`}>
              <Gauge value={data.yaw}   min={0}   max={360} label="YAW"   unit="degrees"
                color={gaugeColor(yawError,   5, 20)} setpoint={data.yawSP} />
            </div>
          </div>

          {/* ══ STATUS TABLE ══ */}
          <div className={`card status-table-card ${loaded ? "fade-in delay-2" : ""}`}>
            <p className="card-section-label">Axis Status Detail</p>

            <div className="axis-table">
              {/* Header */}
              <div className="axis-row axis-header">
                <span>AXIS</span>
                <span>VALUE</span>
                <span>SETPOINT</span>
                <span>ERROR</span>
                <span>RATE</span>
                <span>STATUS</span>
              </div>

              {[
                {
                  name: "ROLL",
                  value: data.roll,  sp: data.rollSP,
                  error: rollError,  rate: data.rollRate,
                  status: rollStatus,
                },
                {
                  name: "PITCH",
                  value: data.pitch, sp: data.pitchSP,
                  error: pitchError, rate: data.pitchRate,
                  status: pitchStatus,
                },
                {
                  name: "YAW",
                  value: data.yaw,   sp: data.yawSP,
                  error: yawError,   rate: data.yawRate,
                  status: yawStatus,
                },
              ].map(({ name, value, sp, error, rate, status }) => (
                <div key={name} className={`axis-row axis-data ${status.toLowerCase()}`}>
                  <span className="ax-name">{name}</span>
                  <span className="ax-val">
                    {value >= 0 && name !== "YAW" ? "+" : ""}
                    {hasData ? `${value.toFixed(1)}°` : "—"}
                  </span>
                  <span className="ax-sp">{hasData ? `${sp}°` : "—"}</span>
                  <span className="ax-err" style={{ color: statusColor(status) }}>
                    {hasData ? `${error >= 0 ? "+" : ""}${error.toFixed(2)}°` : "—"}
                  </span>
                  <span className="ax-rate">
                    {hasData ? `${rate >= 0 ? "+" : ""}${rate.toFixed(1)}°/s` : "—"}
                  </span>
                  <span className={`ax-status badge-${status.toLowerCase()}`}>
                    <span className="badge-icon">{statusIcon(status)}</span>
                    {status}
                  </span>
                </div>
              ))}
            </div>

            {/* Rate bars */}
            <div className="rate-bars">
              <p className="card-section-label" style={{ marginTop: "1.2rem" }}>Angular Rate (°/s)</p>
              {[
                { label: "Roll Rate",  value: data.rollRate,  max: 30, color: gaugeColor(rollError,  5, 15) },
                { label: "Pitch Rate", value: data.pitchRate, max: 30, color: gaugeColor(pitchError, 5, 15) },
                { label: "Yaw Rate",   value: data.yawRate,   max: 30, color: gaugeColor(yawError,   5, 20) },
              ].map(({ label, value, max, color }) => (
                <div className="rate-row" key={label}>
                  <span className="rate-label">{label}</span>
                  <div className="rate-track">
                    <div className="rate-fill" style={{
                      width: `${Math.min(100, (Math.abs(value) / max) * 100)}%`,
                      background: color,
                      boxShadow: `0 0 8px ${color}55`,
                    }} />
                  </div>
                  <span className="rate-val" style={{ color }}>
                    {hasData ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}` : "—"}
                  </span>
                </div>
              ))}
            </div>

            {/* MQTT info footer */}
            <div className="mqtt-info-footer">
              <span className="mif-item">
                <span className="mif-dot" style={{ background: connColor }} />
                {connLabel}
              </span>
              <span className="mif-item">Topic: <code>{MQTT_TOPIC}</code></span>
              {hasData && (
                <span className="mif-item">
                  Updated: {lastUpdated!.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Attitude;