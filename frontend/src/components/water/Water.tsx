import React, { useEffect, useState, useRef, useCallback } from "react";
import "./water.css";
import StaggeredMenu from "../../components/staggeredmenu/StaggeredMenu";
import { useAuth } from "../../components/auth/AuthContext";

const SPRAY_RATIO_M2_PER_L = 320; // m² per liter — sesuaikan dengan drone

// ══════════════════════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════════════════════
type SprayStatus    = "Spraying" | "Standby" | "Empty" | "Refilling";
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

/**
 * Hanya field yang dikirim sensor load cell via MQTT.
 * Tidak ada pressure / nozzleCount — dihapus dari interface.
 */
interface WaterData {
  currentL    : number;      // L sisa air (dari load cell)
  maxL        : number;      // L kapasitas tangki
  flowRate    : number;      // L/min (dihitung ESP atau dari load cell delta)
  sessionUsed : number;      // L terpakai sesi ini
  sprayStatus : SprayStatus; // status dari ESP
}

interface MqttPayload {
  currentL    : number;
  maxL        : number;
  flowRate    : number;
  sessionUsed : number;
  sprayStatus : SprayStatus;
}

// ══════════════════════════════════════════════════════════════════════════════
//  INITIAL STATE
// ══════════════════════════════════════════════════════════════════════════════
const INITIAL: WaterData = {
  currentL    : 0,
  maxL        : 10,
  flowRate    : 0,
  sessionUsed : 0,
  sprayStatus : "Standby",
};

const HISTORY_MAX = 60;

// ══════════════════════════════════════════════════════════════════════════════
//  SPARKLINE HELPER
// ══════════════════════════════════════════════════════════════════════════════
function drawSparkline(
  canvas  : HTMLCanvasElement | null,
  history : number[],
  maxVal  : number,
  color   : string,
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

  const step = W / (history.length - 1);
  const toY  = (v: number) => H - (Math.max(0, v) / (maxVal || 1)) * H;

  ctx.beginPath();
  ctx.moveTo(0, toY(history[0]));
  history.forEach((v, i) => ctx.lineTo(i * step, toY(v)));
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, toY(history[0]));
  history.forEach((v, i) => ctx.lineTo(i * step, toY(v)));
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const Water: React.FC = () => {
  const { user } = useAuth();

  const MQTT_HOST    = user?.host ?? "";
  const MQTT_WS_PORT = user?.port ?? 8083;
  const MQTT_TOPIC   = user?.water_topic ?? "";
  const mqttReady    = !!(MQTT_HOST && MQTT_WS_PORT && MQTT_TOPIC);

  const [data,        setData       ] = useState<WaterData>(INITIAL);
  const [loaded,      setLoaded     ] = useState(false);
  const [connStatus,  setConnStatus ] = useState<ConnectionStatus>("connecting");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [levelHistory, setLevelHistory] = useState<number[]>(Array(HISTORY_MAX).fill(0));
  const [flowHistory,  setFlowHistory ] = useState<number[]>(Array(HISTORY_MAX).fill(0));

  const levelCanvasRef = useRef<HTMLCanvasElement>(null);
  const flowCanvasRef  = useRef<HTMLCanvasElement>(null);
  const wsRef          = useRef<WebSocket | null>(null);
  const retryRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

  // entrance
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  // sparklines
  useEffect(() => {
    drawSparkline(levelCanvasRef.current, levelHistory, data.maxL || 10, "#00b4ff");
  }, [levelHistory, data.maxL]);

  useEffect(() => {
    const maxFlow = Math.max(...flowHistory, 1);
    drawSparkline(flowCanvasRef.current, flowHistory, maxFlow, "#00ff88");
  }, [flowHistory]);

  // ── MQTT WebSocket ──────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!mqttReady) return;
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    setConnStatus("connecting");

    const clientId = `water-ui-${Math.random().toString(16).slice(2, 10)}`;
    let ws: WebSocket;
    try { ws = new WebSocket(`ws://${MQTT_HOST}:${MQTT_WS_PORT}/mqtt`, ["mqtt"]); }
    catch { setConnStatus("error"); return; }

    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

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

          const raw: MqttPayload = JSON.parse(new TextDecoder().decode(buf.slice(off)));

          setData(raw);
          setLevelHistory(h => [...h.slice(-(HISTORY_MAX - 1)), raw.currentL]);
          setFlowHistory (h => [...h.slice(-(HISTORY_MAX - 1)), raw.flowRate]);
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

  // ── Derived UI values ───────────────────────────────────────────────────
  const hasData  = lastUpdated !== null;
  const pct      = data.maxL > 0 ? (data.currentL / data.maxL) * 100 : 0;
  const timeLeft = data.flowRate > 0
    ? Math.floor(data.currentL / data.flowRate)
    : 0;

  const levelColor =
    pct > 50 ? "#00b4ff" :
    pct > 25 ? "#f0c040" : "#ff4466";

  const statusColor: Record<SprayStatus, string> = {
    Spraying : "#00ff88",
    Standby  : "#00b4ff",
    Empty    : "#ff4466",
    Refilling: "#f0c040",
  };

  const connColor =
    connStatus === "connected"  ? "#00ff88" :
    connStatus === "connecting" ? "#f0c040" :
    connStatus === "error"      ? "#ff4466" : "#888";

  const connLabel =
    connStatus === "connected"  ? "LIVE · MQTT" :
    connStatus === "connecting" ? "Connecting…"  :
    connStatus === "error"      ? "MQTT Error"   : "Disconnected";

  const waveBottom = `${100 - pct}%`;

  const areaRemaining = data.currentL * SPRAY_RATIO_M2_PER_L;
  const areaCovered   = data.sessionUsed * SPRAY_RATIO_M2_PER_L;

  // ── Render ──────────────────────────────────────────────────────────────
  if (!mqttReady) {
    return (
      <div className="water-page">
        <StaggeredMenu />
        <main style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"80vh", gap:"1rem", textAlign:"center" }}>
          <span style={{ fontSize:"2.5rem" }}>⚙️</span>
          <h2 style={{ color:"#fff", margin:0 }}>MQTT Belum Dikonfigurasi</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", maxWidth:360 }}>
            Lengkapi <strong style={{ color:"#00d4ff" }}>Host</strong>,{" "}
            <strong style={{ color:"#00d4ff" }}>Port</strong>, dan{" "}
            <strong style={{ color:"#00d4ff" }}>Water Topic</strong> di halaman Profil.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="water-page">

      <div className="video-bg-wrapper">
        <video className="video-bg" src="/videos/drone-bg.mp4" autoPlay loop muted playsInline />
        <div className="video-overlay" />
        <div className="video-vignette" />
      </div>

      <StaggeredMenu />

      <main className="water-content">

        {/* ── HEADER ── */}
        <header className={`page-header ${loaded ? "fade-in" : ""}`}>
          <div>
            <p className="page-eyebrow">UAV · Payload Systems · Load Cell</p>
            <h1 className="page-title">Water Level <span className="title-accent">Monitor</span></h1>
          </div>
          <div className="header-right">
            {/* MQTT badge */}
            <div className={`live-badge ${loaded ? "fade-in delay-1" : ""}`} title={`Topic: ${MQTT_TOPIC}`}>
              <span className="live-dot" style={{ background: connColor, boxShadow: `0 0 6px ${connColor}` }} />
              <span style={{ color: connColor }}>{connLabel}</span>
            </div>

            {hasData && (
              <div
                className={`status-chip ${loaded ? "fade-in delay-2" : ""}`}
                style={{ "--chip-color": statusColor[data.sprayStatus] } as React.CSSProperties}
              >
                <span className="status-chip-dot" style={{ background: statusColor[data.sprayStatus] }} />
                {data.sprayStatus}
              </div>
            )}
          </div>
        </header>

        {/* Timestamp */}
        <p className="last-updated">
          {hasData
            ? `Last update: ${lastUpdated!.toLocaleTimeString()} · ${MQTT_TOPIC}`
            : `Waiting for data… · ${MQTT_TOPIC}`}
        </p>

        {/* ── MAIN GRID ── */}
        <div className="water-grid">

          {/* ══ TANK VISUALIZER ══ */}
          <div className={`card tank-card ${loaded ? "fade-in delay-1" : ""}`}>
            <p className="card-section-label">Tank Level · Load Cell</p>

            <div className="tank-wrap">
              <div className="tank-pct-badge" style={{ color: levelColor }}>
                {hasData ? `${pct.toFixed(1)}%` : "—"}
              </div>

              <div className="tank-outer">
                {/* Ruler */}
                <div className="tank-ruler">
                  {[data.maxL, data.maxL * 0.8, data.maxL * 0.6, data.maxL * 0.4, data.maxL * 0.2, 0]
                    .map(v => (
                      <div key={v} className="ruler-row">
                        <span className="ruler-label">{v.toFixed(0)}L</span>
                        <span className="ruler-tick" />
                      </div>
                    ))}
                </div>

                {/* Tank body */}
                <div className="tank-body">
                  <div className="tank-danger-line" />

                  {/* Water fill */}
                  <div
                    className="tank-fill"
                    style={{
                      top: waveBottom,
                      background: `linear-gradient(to bottom, ${levelColor}55, ${levelColor}22)`,
                    }}
                  >
                    <svg className="wave-svg" viewBox="0 0 200 20" preserveAspectRatio="none">
                      <path
                        className="wave-path wave-1"
                        d="M0,10 C30,0 70,20 100,10 C130,0 170,20 200,10 L200,20 L0,20 Z"
                        fill={`${levelColor}66`}
                      />
                      <path
                        className="wave-path wave-2"
                        d="M0,12 C40,2 80,22 120,12 C160,2 180,18 200,12 L200,20 L0,20 Z"
                        fill={`${levelColor}44`}
                      />
                    </svg>

                    {data.sprayStatus === "Spraying" && (
                      <div className="bubbles">
                        {[1,2,3,4,5].map(i => (
                          <span key={i} className={`bubble b${i}`} style={{ background: `${levelColor}88` }} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Center label */}
                  <div className="tank-center-label">
                    <span className="tank-liters" style={{ color: levelColor }}>
                      {hasData ? data.currentL.toFixed(2) : "—"}
                    </span>
                    <span className="tank-liters-unit">L</span>
                    <span className="tank-max-label">of {data.maxL}L</span>
                  </div>

                  {pct <= 25 && hasData && (
                    <div className="tank-warning">⚠ LOW LEVEL</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div className="right-panel">

            {/* Key Metrics — hanya data yang ada di payload */}
            <div className={`card metrics-card ${loaded ? "fade-in delay-1" : ""}`}>
              <p className="card-section-label">Key Metrics</p>
              <div className="metrics-grid">
                {[
                  {
                    label  : "Remaining",
                    value  : hasData ? `${data.currentL.toFixed(2)} L` : "—",
                    sub    : `of ${data.maxL} L capacity`,
                    accent : levelColor,
                  },
                  {
                    label  : "Tank Level",
                    value  : hasData ? `${pct.toFixed(1)}%` : "—",
                    sub    : "dari kapasitas penuh",
                    accent : levelColor,
                  },
                  {
                    label  : "Flow Rate",
                    value  : hasData ? `${data.flowRate.toFixed(2)} L/min` : "—",
                    sub    : "laju semprotan saat ini",
                    accent : "#00ff88",
                  },
                  {
                    label  : "Used (session)",
                    value  : hasData ? `${data.sessionUsed.toFixed(2)} L` : "—",
                    sub    : "terpakai sesi ini",
                    accent : "#f0c040",
                  },
                  {
                    label  : "Status",
                    value  : hasData ? data.sprayStatus : "—",
                    sub    : "dari ESP / firmware",
                    accent : hasData ? statusColor[data.sprayStatus] : "#888",
                  },
                  {
                    label  : "Sensor",
                    value  : "Load Cell",
                    sub    : `topic: ${MQTT_TOPIC}`,
                    accent : "#00b4ff",
                  },
                ].map(({ label, value, sub, accent }) => (
                  <div className="metric-tile" key={label}>
                    <span className="mt-label">{label}</span>
                    <span className="mt-value" style={{ color: accent }}>{value}</span>
                    <span className="mt-sub">{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time estimate — hanya tampil saat spraying */}
            <div className={`card time-card ${loaded ? "fade-in delay-2" : ""}`}>
              <p className="card-section-label">Estimated Spray Time Remaining</p>
              <div className="time-display">
                <div className="time-big">
                  <span
                    className="time-value"
                    style={{ color: timeLeft < 5 ? "#ff4466" : "#fff" }}
                  >
                    {data.sprayStatus === "Spraying" && data.flowRate > 0
                      ? `${Math.floor(timeLeft / 60) > 0 ? `${Math.floor(timeLeft / 60)}h ` : ""}${timeLeft % 60}m`
                      : "—"}
                  </span>
                  {data.sprayStatus === "Spraying" && data.flowRate > 0 && (
                    <span className="time-unit">@ {data.flowRate.toFixed(2)} L/min</span>
                  )}
                </div>
                {data.sprayStatus !== "Spraying" && (
                  <p className="time-idle">
                    {data.sprayStatus === "Empty"
                      ? "⚠ Tangki kosong — isi ulang sebelum terbang"
                      : data.sprayStatus === "Refilling"
                      ? "🔄 Sedang mengisi ulang tangki…"
                      : "Sistem standby — semprotan tidak aktif"}
                  </p>
                )}
              </div>

              {/* Session progress */}
              <div className="session-bar-wrap">
                <div className="session-bar-label">
                  <span>Session Used</span>
                  <span>
                    {data.maxL > 0
                      ? `${((data.sessionUsed / data.maxL) * 100).toFixed(1)}%`
                      : "—"}
                  </span>
                </div>
                <div className="session-track">
                  <div
                    className="session-fill"
                    style={{ width: `${Math.min(100, (data.sessionUsed / data.maxL) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Level history sparkline */}
            <div className={`card spark-card ${loaded ? "fade-in delay-2" : ""}`}>
              <div className="spark-header">
                <span className="card-section-label" style={{ margin: 0 }}>Level History</span>
                <span className="spark-range">Last {HISTORY_MAX} readings</span>
              </div>
              <canvas ref={levelCanvasRef} className="spark-canvas" width={600} height={90} />
              <div className="spark-footer">
                <span>
                  {levelHistory.some(v => v > 0)
                    ? `Min ${Math.min(...levelHistory.filter(v => v > 0)).toFixed(2)}L`
                    : "—"}
                </span>
                <span style={{ color: levelColor, fontWeight: 600 }}>
                  {hasData ? `${data.currentL.toFixed(2)}L` : "—"}
                </span>
              </div>
            </div>

            {/* Flow rate history sparkline */}
            <div className={`card spark-card ${loaded ? "fade-in delay-2" : ""}`}>
              <div className="spark-header">
                <span className="card-section-label" style={{ margin: 0 }}>Flow Rate History</span>
                <span className="spark-range" style={{ color: "#00ff88" }}>
                  {hasData ? `${data.flowRate.toFixed(2)} L/min` : "—"}
                </span>
              </div>
              <canvas ref={flowCanvasRef} className="spark-canvas" width={600} height={90} />
              <div className="spark-footer">
                <span>
                  Peak&nbsp;
                  <span style={{ color: "#00ff88" }}>
                    {flowHistory.some(v => v > 0)
                      ? `${Math.max(...flowHistory).toFixed(2)} L/min`
                      : "—"}
                  </span>
                </span>
                <span style={{ color: "#00ff88" }}>
                  Avg&nbsp;
                  {(() => {
                    const active = flowHistory.filter(v => v > 0);
                    return active.length
                      ? `${(active.reduce((a, b) => a + b, 0) / active.length).toFixed(2)} L/min`
                      : "—";
                  })()}
                </span>
              </div>
            </div>

            {/* Coverage estimate */}
            <div className={`card coverage-card ${loaded ? "fade-in delay-3" : ""}`}>
              <p className="card-section-label">Field Coverage Estimate</p>
              <div className="coverage-row">
                <div className="cov-item">
                  <span className="cov-icon">🌾</span>
                  <span className="cov-value">
                    {hasData ? `${areaRemaining.toFixed(0)} m²` : "—"}
                  </span>
                  <span className="cov-label">Area Remaining</span>
                </div>
                <div className="cov-divider" />
                <div className="cov-item">
                  <span className="cov-icon">✅</span>
                  <span className="cov-value">
                    {hasData ? `${areaCovered.toFixed(0)} m²` : "—"}
                  </span>
                  <span className="cov-label">Area Covered</span>
                </div>
                <div className="cov-divider" />
                <div className="cov-item">
                  <span className="cov-icon">💧</span>
                  <span className="cov-value">{SPRAY_RATIO_M2_PER_L} m²/L</span>
                  <span className="cov-label">Spray Ratio</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Water;