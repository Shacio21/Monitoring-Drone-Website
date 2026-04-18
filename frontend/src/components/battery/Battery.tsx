import React, { useEffect, useState, useRef, useCallback } from "react";
import "./battery.css";
import StaggeredMenu from "../../components/staggeredmenu/StaggeredMenu";
import { useAuth } from "../../components/auth/AuthContext";

// 2S LiPo → 6.0 V (kosong) – 8.4 V (penuh)
// Ganti CELL_COUNT ke 3 / 4 / 6 jika baterai berbeda
const CELL_COUNT = 2;
const CELL_MIN_V = 3.0;
const CELL_MAX_V = 4.2;
const PACK_MIN_V = CELL_MIN_V * CELL_COUNT;  // 6.0 V
const PACK_MAX_V = CELL_MAX_V * CELL_COUNT;  // 8.4 V

const CHARGING_THRESHOLD_A    = -0.005;
const DISCHARGING_THRESHOLD_A =  0.005;

// ══════════════════════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════════════════════
type BatteryStatus    = "Charging" | "Discharging" | "Idle";
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

/** Hanya field yang bisa dihitung secara valid dari INA219 */
interface BatteryData {
  // ─ Langsung dari sensor ─
  voltage : number;
  current : number;  // bisa negatif = charging
  power   : number;
  pwm     : number;
  // ─ Derivasi valid ─
  voltagePercent : number;   // % linear antara PACK_MIN_V dan PACK_MAX_V
  cellVoltage    : number;   // V per cell (rata-rata, INA219 tidak bisa per-cell)
  status         : BatteryStatus;
  // ─ Akumulasi sesi ─
  sessionMah   : number;   // mAh terpakai sejak halaman dibuka (coulomb counting)
  peakCurrentA : number;
  peakPowerW   : number;
}

interface MqttPayload {
  voltage : number;
  current : number;
  power   : number;
  pwm?    : number;
}

// ══════════════════════════════════════════════════════════════════════════════
//  INITIAL STATE
// ══════════════════════════════════════════════════════════════════════════════
const INITIAL: BatteryData = {
  voltage: 0, current: 0, power: 0, pwm: 0,
  voltagePercent: 0, cellVoltage: 0,
  status: "Idle",
  sessionMah: 0, peakCurrentA: 0, peakPowerW: 0,
};

// ══════════════════════════════════════════════════════════════════════════════
//  DERIVE
// ══════════════════════════════════════════════════════════════════════════════
let _lastTs = Date.now();

const deriveFromPayload = (p: MqttPayload, prev: BatteryData): BatteryData => {
  const { voltage, current, power, pwm = 0 } = p;

  const voltagePercent = Math.max(
    0, Math.min(100, ((voltage - PACK_MIN_V) / (PACK_MAX_V - PACK_MIN_V)) * 100)
  );
  const cellVoltage = voltage / CELL_COUNT;

  const status: BatteryStatus =
    current < CHARGING_THRESHOLD_A    ? "Charging"    :
    current > DISCHARGING_THRESHOLD_A ? "Discharging" : "Idle";

  // Coulomb counting
  const now     = Date.now();
  const dtH     = (now - _lastTs) / 3_600_000;
  _lastTs       = now;
  const addedMah = status === "Discharging" ? Math.abs(current) * 1000 * dtH : 0;

  return {
    voltage, current, power, pwm,
    voltagePercent, cellVoltage, status,
    sessionMah  : prev.sessionMah + addedMah,
    peakCurrentA: Math.max(prev.peakCurrentA, Math.abs(current)),
    peakPowerW  : Math.max(prev.peakPowerW, power),
  };
};

// ══════════════════════════════════════════════════════════════════════════════
//  SPARKLINE HELPER
// ══════════════════════════════════════════════════════════════════════════════
const MAX_HISTORY = 60;

function drawSparkline(
  canvas  : HTMLCanvasElement | null,
  history : number[],
  color   : string,
) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const max = Math.max(...history, 0.0001);
  const n   = (v: number) => v / max;
  const step = W / (history.length - 1);

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  // Convert "#rrggbb" → rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.28)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

  ctx.beginPath();
  ctx.moveTo(0, H - n(history[0]) * H);
  history.forEach((v, i) => ctx.lineTo(i * step, H - n(v) * H));
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, H - n(history[0]) * H);
  history.forEach((v, i) => ctx.lineTo(i * step, H - n(v) * H));
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
}

// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const Battery: React.FC = () => {
  const { user } = useAuth();

  // ── Ambil konfigurasi MQTT dari profil user ──
  const MQTT_HOST    = user?.host ?? "";
  const MQTT_WS_PORT = user?.port ?? 8083;
  const MQTT_TOPIC   = user?.battery_topic ?? "";

  const mqttReady = !!(MQTT_HOST && MQTT_WS_PORT && MQTT_TOPIC);

  const [data,        setData       ] = useState<BatteryData>(INITIAL);
  const [loaded,      setLoaded     ] = useState(false);
  const [connStatus,  setConnStatus ] = useState<ConnectionStatus>("connecting");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [voltHist,    setVoltHist   ] = useState<number[]>(Array(MAX_HISTORY).fill(0));
  const [currHist,    setCurrHist   ] = useState<number[]>(Array(MAX_HISTORY).fill(0));
  const [powerHist,   setPowerHist  ] = useState<number[]>(Array(MAX_HISTORY).fill(0));

  const voltRef  = useRef<HTMLCanvasElement>(null);
  const currRef  = useRef<HTMLCanvasElement>(null);
  const powerRef = useRef<HTMLCanvasElement>(null);
  const wsRef    = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // entrance
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);

  // sparklines
  useEffect(() => drawSparkline(voltRef.current,  voltHist,  "#00d4ff"), [voltHist]);
  useEffect(() => drawSparkline(currRef.current,  currHist,  "#00ff88"), [currHist]);
  useEffect(() => drawSparkline(powerRef.current, powerHist, "#f0c040"), [powerHist]);

  // ── MQTT WebSocket ──────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!mqttReady) return;
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    setConnStatus("connecting");

    const clientId = `ina219-${Math.random().toString(16).slice(2, 10)}`;
    let ws: WebSocket;
    try { ws = new WebSocket(`ws://${MQTT_HOST}:${MQTT_WS_PORT}/mqtt`, ["mqtt"]); }
    catch { setConnStatus("error"); return; }

    wsRef.current  = ws;
    ws.binaryType  = "arraybuffer";

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

      if (type === 2) {                        // CONNACK
        if (buf[3] !== 0x00) { setConnStatus("error"); return; }
        setConnStatus("connected");
        const enc  = new TextEncoder();
        const tb   = enc.encode(MQTT_TOPIC);
        const tl   = tb.length;
        ws.send(new Uint8Array([
          0x82, 2 + 2 + tl + 1,
          0x00, 0x01,
          (tl >> 8) & 0xff, tl & 0xff,
          ...tb, 0x00,
        ]).buffer);
        return;
      }

      if (type === 3) {                        // PUBLISH
        try {
          let off = 1, mult = 1, rem = 0, byte: number;
          do { byte = buf[off++]; rem += (byte & 0x7f) * mult; mult *= 128; } while (byte & 0x80);
          const tl = (buf[off] << 8) | buf[off + 1];
          off += 2 + tl;
          const raw: MqttPayload = JSON.parse(new TextDecoder().decode(buf.slice(off)));

          setData(prev => {
            const next = deriveFromPayload(raw, prev);
            setVoltHist (h => [...h.slice(-(MAX_HISTORY - 1)), next.voltage]);
            setCurrHist (h => [...h.slice(-(MAX_HISTORY - 1)), Math.abs(next.current) * 1000]);
            setPowerHist(h => [...h.slice(-(MAX_HISTORY - 1)), next.power * 1000]);
            setLastUpdated(new Date());
            return next;
          });
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
    if (!mqttReady) {
      setConnStatus("disconnected");
      return;
    }
    connect();
    return () => {
      retryRef.current && clearTimeout(retryRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect, mqttReady]);

  // ── UI helpers ──────────────────────────────────────────────────────────
  const pct     = data.voltagePercent;
  const hasData = lastUpdated !== null;

  const voltColor =
    pct > 60 ? "#00ff88" :
    pct > 30 ? "#f0c040" :
    pct > 10 ? "#ff9933" : "#ff4466";

  const statusColor =
    data.status === "Charging"    ? "#00d4ff" :
    data.status === "Discharging" ? "#00ff88" : "#888";

  const connColor =
    connStatus === "connected"  ? "#00ff88" :
    connStatus === "connecting" ? "#f0c040" :
    connStatus === "error"      ? "#ff4466" : "#888";

  const connLabel =
    connStatus === "connected"  ? "LIVE · MQTT" :
    connStatus === "connecting" ? "Connecting…"  :
    connStatus === "error"      ? "MQTT Error"   : "Disconnected";

  const voltLabel =
    pct > 75 ? "Normal"   :
    pct > 40 ? "Moderate" :
    pct > 15 ? "Low"      : hasData ? "Critical" : "—";

  const avgPower = powerHist.filter(v => v > 0);
  const avgPowerMw = avgPower.length
    ? avgPower.reduce((a, b) => a + b, 0) / avgPower.length
    : 0;

  // ── Render ──────────────────────────────────────────────────────────────
  if (!mqttReady) {
    return (
      <div className="battery-page">
        <div className="video-bg-wrapper">
          <video className="video-bg" src="/videos/drone-bg.mp4" autoPlay loop muted playsInline />
          <div className="video-overlay" />
          <div className="video-vignette" />
        </div>
        <StaggeredMenu />
        <main className="battery-content">
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: "60vh", gap: "1rem", textAlign: "center",
          }}>
            <span style={{ fontSize: "2.5rem" }}>⚙️</span>
            <h2 style={{ color: "#fff", margin: 0 }}>MQTT Belum Dikonfigurasi</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", maxWidth: 360 }}>
              Silakan lengkapi <strong style={{ color: "#00d4ff" }}>Host</strong>,{" "}
              <strong style={{ color: "#00d4ff" }}>Port</strong>, dan{" "}
              <strong style={{ color: "#00d4ff" }}>Battery Topic</strong> di halaman Profil terlebih dahulu.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="battery-page">

      <div className="video-bg-wrapper">
        <video className="video-bg" src="/videos/drone-bg.mp4" autoPlay loop muted playsInline />
        <div className="video-overlay" />
        <div className="video-vignette" />
      </div>

      <StaggeredMenu />

      <main className="battery-content">

        {/* ── HEADER ── */}
        <header className={`page-header ${loaded ? "fade-in" : ""}`}>
          <div>
            <p className="page-eyebrow">UAV · Power Systems · INA219</p>
            <h1 className="page-title">Battery <span className="title-accent">Monitor</span></h1>
          </div>
          <div className="header-right">
            <div className={`live-badge ${loaded ? "fade-in delay-1" : ""}`} title={`Topic: ${MQTT_TOPIC}`}>
              <span className="live-dot" style={{ background: connColor, boxShadow: `0 0 6px ${connColor}` }} />
              <span style={{ color: connColor }}>{connLabel}</span>
            </div>
            <div
              className={`status-chip ${loaded ? "fade-in delay-2" : ""}`}
              style={{ "--chip-color": statusColor } as React.CSSProperties}
            >
              {data.status}
            </div>
          </div>
        </header>

        <p className="last-updated">
          {hasData
            ? `Last update: ${lastUpdated!.toLocaleTimeString()} · ${MQTT_TOPIC}`
            : `Waiting for data… · ${MQTT_TOPIC}`}
        </p>

        {/* ── GRID ── */}
        <div className="battery-grid">

          {/* ══ 1. VOLTAGE GAUGE ══ */}
          <div className={`card card-gauge ${loaded ? "fade-in delay-1" : ""}`}>
            <div className="gauge-label">
              Pack Voltage
              <span className="gauge-cell-info">{CELL_COUNT}S LiPo · {PACK_MIN_V}V – {PACK_MAX_V}V</span>
            </div>

            <div className="gauge-wrap">
              <svg className="gauge-svg" viewBox="0 0 200 130">
                <path d="M 20 110 A 80 80 0 0 1 180 110"
                  fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" strokeLinecap="round" />
                <path d="M 20 110 A 80 80 0 0 1 180 110"
                  fill="none" stroke={voltColor} strokeWidth="14" strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (pct / 100) * 251.2}
                  style={{ filter: `drop-shadow(0 0 6px ${voltColor})`, transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease" }}
                />
                <circle
                  cx={100 + 80 * Math.cos(Math.PI - (pct / 100) * Math.PI)}
                  cy={110 - 80 * Math.sin((pct / 100) * Math.PI)}
                  r="5" fill={voltColor}
                  style={{ filter: `drop-shadow(0 0 8px ${voltColor})`, transition: "all 0.8s ease" }}
                />
              </svg>
              <div className="gauge-center">
                <span className="gauge-pct" style={{ color: voltColor }}>
                  {hasData ? data.voltage.toFixed(3) : "—"}
                </span>
                <span className="gauge-unit">V</span>
              </div>
            </div>

            <div className="gauge-meta">
              <div className="gauge-meta-item">
                <span className="gm-label">Per Cell</span>
                <span className="gm-value">{hasData ? `${data.cellVoltage.toFixed(3)} V` : "—"}</span>
              </div>
              <div className="gauge-meta-item">
                <span className="gm-label">Volt Level</span>
                <span className="gm-value" style={{ color: voltColor }}>
                  {hasData ? `${pct.toFixed(1)}%` : "—"}
                </span>
              </div>
              <div className="gauge-meta-item">
                <span className="gm-label">Condition</span>
                <span className="gm-value" style={{ color: voltColor }}>{voltLabel}</span>
              </div>
            </div>
          </div>

          {/* ══ 2. METRICS ══ */}
          <div className="metrics-col">

            {/* Voltage */}
            <div className={`card card-metric ${loaded ? "fade-in" : ""}`} style={{ animationDelay: "0.15s" }}>
              <div className="metric-icon">⚡</div>
              <div className="metric-body">
                <span className="metric-label">Voltage</span>
                <span className="metric-sub">Bus voltage · INA219</span>
              </div>
              <span className="metric-value" style={{ color: voltColor }}>
                {hasData ? `${data.voltage.toFixed(3)} V` : "—"}
              </span>
            </div>

            {/* Current */}
            <div className={`card card-metric ${loaded ? "fade-in" : ""}`} style={{ animationDelay: "0.23s" }}>
              <div className="metric-icon">〜</div>
              <div className="metric-body">
                <span className="metric-label">Current</span>
                <span className="metric-sub">{data.current < 0 ? "Charging" : "Load current"}</span>
              </div>
              <div className="metric-value-col">
                <span className="metric-value">
                  {hasData ? `${(Math.abs(data.current) * 1000).toFixed(3)} mA` : "—"}
                </span>
                <span className="metric-sub-value">{hasData ? `${data.current.toFixed(4)} A` : ""}</span>
              </div>
            </div>

            {/* Power */}
            <div className={`card card-metric ${loaded ? "fade-in" : ""}`} style={{ animationDelay: "0.31s" }}>
              <div className="metric-icon">◈</div>
              <div className="metric-body">
                <span className="metric-label">Power</span>
                <span className="metric-sub">Instant power draw</span>
              </div>
              <div className="metric-value-col">
                <span className="metric-value">
                  {hasData ? `${(data.power * 1000).toFixed(3)} mW` : "—"}
                </span>
                <span className="metric-sub-value">{hasData ? `${data.power.toFixed(6)} W` : ""}</span>
              </div>
            </div>

            {/* PWM */}
            <div className={`card card-metric ${loaded ? "fade-in" : ""}`} style={{ animationDelay: "0.39s" }}>
              <div className="metric-icon">▶</div>
              <div className="metric-body">
                <span className="metric-label">PWM</span>
                <span className="metric-sub">Motor throttle signal</span>
              </div>
              <div className="metric-value-col">
                <span className="metric-value">{hasData ? data.pwm : "—"}</span>
                {hasData && (
                  <div className="pwm-bar-wrap">
                    <div className="pwm-bar-fill" style={{
                      width: `${Math.min(100, (data.pwm / 255) * 100)}%`,
                      background: data.pwm > 0 ? "#00ff88" : "#333",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ══ 3. SPARKLINES ══ */}

          {/* Voltage */}
          <div className={`card card-spark ${loaded ? "fade-in delay-2" : ""}`}>
            <div className="spark-header">
              <span className="spark-title">Voltage History</span>
              <span className="spark-range" style={{ color: "#00d4ff" }}>
                {hasData ? `${data.voltage.toFixed(3)} V` : "—"}
              </span>
            </div>
            <canvas ref={voltRef} className="spark-canvas" width={600} height={90} />
            <div className="spark-footer">
              <span className="sf-label">Min&nbsp;
                <span style={{ color: "#00d4ff" }}>
                  {voltHist.some(v => v > 0)
                    ? `${Math.min(...voltHist.filter(v => v > 0)).toFixed(3)}V`
                    : "—"}
                </span>
              </span>
              <span className="sf-label">Max&nbsp;
                <span style={{ color: "#00d4ff" }}>
                  {voltHist.some(v => v > 0) ? `${Math.max(...voltHist).toFixed(3)}V` : "—"}
                </span>
              </span>
            </div>
          </div>

          {/* Current */}
          <div className={`card card-spark ${loaded ? "fade-in delay-2" : ""}`}>
            <div className="spark-header">
              <span className="spark-title">Current History</span>
              <span className="spark-range" style={{ color: "#00ff88" }}>
                {hasData ? `${(Math.abs(data.current) * 1000).toFixed(3)} mA` : "—"}
              </span>
            </div>
            <canvas ref={currRef} className="spark-canvas" width={600} height={90} />
            <div className="spark-footer">
              <span className="sf-label">Peak&nbsp;
                <span style={{ color: "#00ff88" }}>
                  {(data.peakCurrentA * 1000).toFixed(3)} mA
                </span>
              </span>
              <span className="sf-label">Used (sesi)&nbsp;
                <span style={{ color: "#00ff88" }}>
                  {data.sessionMah.toFixed(4)} mAh
                </span>
              </span>
            </div>
          </div>

          {/* Power */}
          <div className={`card card-spark ${loaded ? "fade-in delay-3" : ""}`}>
            <div className="spark-header">
              <span className="spark-title">Power History</span>
              <span className="spark-range" style={{ color: "#f0c040" }}>
                {hasData ? `${(data.power * 1000).toFixed(3)} mW` : "—"}
              </span>
            </div>
            <canvas ref={powerRef} className="spark-canvas" width={600} height={90} />
            <div className="spark-footer">
              <span className="sf-label">Peak&nbsp;
                <span style={{ color: "#f0c040" }}>
                  {(data.peakPowerW * 1000).toFixed(3)} mW
                </span>
              </span>
              <span className="sf-label">Avg&nbsp;
                <span style={{ color: "#f0c040" }}>
                  {avgPowerMw.toFixed(3)} mW
                </span>
              </span>
            </div>
          </div>

          {/* ══ 4. CELL VOLTAGE ══ */}
          <div className={`card card-cells ${loaded ? "fade-in delay-3" : ""}`}>
            <p className="card-section-label">Cell Voltage · {CELL_COUNT}S Pack</p>
            <div className="cells-grid">
              {Array.from({ length: CELL_COUNT }, (_, i) => {
                const vNum      = hasData ? data.cellVoltage : 0;
                const cellColor =
                  vNum > 3.8 ? "#00ff88" :
                  vNum > 3.5 ? "#f0c040" :
                  vNum > 0   ? "#ff4466" : "#333";
                const fillPct = Math.max(0, Math.min(100,
                  ((vNum - CELL_MIN_V) / (CELL_MAX_V - CELL_MIN_V)) * 100
                ));
                return (
                  <div className="cell-item" key={i}>
                    <div className="cell-bar-wrap">
                      <div className="cell-bar-fill" style={{
                        height: `${fillPct}%`,
                        background: cellColor,
                        boxShadow: `0 0 8px ${cellColor}`,
                        transition: "height 0.8s ease",
                      }} />
                    </div>
                    <span className="cell-label">C{i + 1}</span>
                    <span className="cell-volt" style={{ color: cellColor }}>
                      {hasData ? `${vNum.toFixed(3)}V` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="cells-note">
              ⚠ INA219 mengukur tegangan total pack — per-cell diasumsikan seimbang.
            </p>
          </div>

          {/* ══ 5. SESSION SUMMARY ══ */}
          <div className={`card card-session ${loaded ? "fade-in delay-3" : ""}`}>
            <p className="card-section-label">Session Summary</p>
            <div className="session-grid">
              <div className="session-item">
                <span className="si-icon">⏱</span>
                <span className="si-label">Consumed</span>
                <span className="si-value">{data.sessionMah.toFixed(4)} mAh</span>
                <span className="si-note">Coulomb counting sejak halaman dibuka</span>
              </div>
              <div className="session-item">
                <span className="si-icon">⬆</span>
                <span className="si-label">Peak Current</span>
                <span className="si-value" style={{ color: "#00ff88" }}>
                  {(data.peakCurrentA * 1000).toFixed(3)} mA
                </span>
                <span className="si-note">Tertinggi dalam sesi ini</span>
              </div>
              <div className="session-item">
                <span className="si-icon">◈</span>
                <span className="si-label">Peak Power</span>
                <span className="si-value" style={{ color: "#f0c040" }}>
                  {(data.peakPowerW * 1000).toFixed(3)} mW
                </span>
                <span className="si-note">Tertinggi dalam sesi ini</span>
              </div>
              <div className="session-item">
                <span className="si-icon">⚡</span>
                <span className="si-label">Sensor</span>
                <span className="si-value" style={{ color: "#00d4ff" }}>INA219</span>
                <span className="si-note">Topic: {MQTT_TOPIC}</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Battery;