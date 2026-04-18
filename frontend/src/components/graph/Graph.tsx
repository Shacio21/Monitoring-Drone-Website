import React, { useEffect, useRef, useState, useCallback } from "react";
import "./graph.css";
import StaggeredMenu from "../../components/staggeredmenu/StaggeredMenu";
import { useAuth } from "../../components/auth/AuthContext";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend
);

const MAX_POINTS   = 80;

// ══════════════════════════════════════════════════════════════════════════════
//  COLORS
// ══════════════════════════════════════════════════════════════════════════════
const COLORS = {
  roll      : { line: "#00ff88", fill: "rgba(0,255,136,0.07)",  glow: "rgba(0,255,136,0.5)"  },
  pitch     : { line: "#00d4ff", fill: "rgba(0,212,255,0.07)",  glow: "rgba(0,212,255,0.5)"  },
  yaw       : { line: "#ff7b54", fill: "rgba(255,123,84,0.07)", glow: "rgba(255,123,84,0.5)" },
  rollRate  : { line: "#a78bfa", fill: "rgba(167,139,250,0.07)", glow: "rgba(167,139,250,0.5)" },
  pitchRate : { line: "#34d399", fill: "rgba(52,211,153,0.07)",  glow: "rgba(52,211,153,0.5)"  },
  yawRate   : { line: "#fbbf24", fill: "rgba(251,191,36,0.07)",  glow: "rgba(251,191,36,0.5)"  },
};

type AxisKey = "roll" | "pitch" | "yaw" | "rollRate" | "pitchRate" | "yawRate";
type ChartMode = "combined" | "split";
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

// ══════════════════════════════════════════════════════════════════════════════
//  MQTT PAYLOAD
// ══════════════════════════════════════════════════════════════════════════════
interface AttitudePayload {
  roll      : number;
  pitch     : number;
  yaw       : number;
  rollSP    : number;
  pitchSP   : number;
  yawSP     : number;
  rollRate  : number;
  pitchRate : number;
  yawRate   : number;
}

// ══════════════════════════════════════════════════════════════════════════════
//  MINI SPARKLINE
// ══════════════════════════════════════════════════════════════════════════════
interface SparkProps { data: number[]; color: string; }
const Spark: React.FC<SparkProps> = ({ data, color }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    if (data.length < 2) return;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const toY   = (v: number) => H - ((v - min) / range) * (H - 4) - 2;
    const step  = W / (data.length - 1);
    const grad  = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, color.replace(")", ", 0.35)").replace("rgb", "rgba"));
    grad.addColorStop(1, color.replace(")", ", 0)").replace("rgb", "rgba"));
    ctx.beginPath();
    ctx.moveTo(0, toY(data[0]));
    data.forEach((v, i) => ctx.lineTo(i * step, toY(v)));
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, toY(data[0]));
    data.forEach((v, i) => ctx.lineTo(i * step, toY(v)));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 4;
    ctx.stroke();
  }, [data, color]);
  return <canvas ref={ref} width={100} height={36} className="spark-mini" />;
};

// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const Graph: React.FC = () => {
  const { user } = useAuth();

  const MQTT_HOST    = user?.host ?? "";
  const MQTT_WS_PORT = user?.port ?? 8083;
  const MQTT_TOPIC   = user?.attitude_topic ?? "";
  const mqttReady    = !!(MQTT_HOST && MQTT_WS_PORT && MQTT_TOPIC);

  const [loaded,      setLoaded     ] = useState(false);
  const [paused,      setPaused     ] = useState(false);
  const [mode,        setMode       ] = useState<ChartMode>("combined");
  const [connStatus,  setConnStatus ] = useState<ConnectionStatus>("connecting");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [msgCount,    setMsgCount   ] = useState(0);

  // Latest display values
  const [vals, setVals] = useState<AttitudePayload>({
    roll: 0, pitch: 0, yaw: 0,
    rollSP: 0, pitchSP: 0, yawSP: 0,
    rollRate: 0, pitchRate: 0, yawRate: 0,
  });

  // Scrolling history buffers (mutated directly for chart perf)
  const history = useRef<Record<AxisKey, number[]>>({
    roll      : Array(MAX_POINTS).fill(0),
    pitch     : Array(MAX_POINTS).fill(0),
    yaw       : Array(MAX_POINTS).fill(0),
    rollRate  : Array(MAX_POINTS).fill(0),
    pitchRate : Array(MAX_POINTS).fill(0),
    yawRate   : Array(MAX_POINTS).fill(0),
  });
  const labels = useRef<string[]>(Array(MAX_POINTS).fill(""));

  // Visibility toggles
  const [visible, setVisible] = useState<Record<AxisKey, boolean>>({
    roll: true, pitch: true, yaw: true,
    rollRate: false, pitchRate: false, yawRate: false,
  });

  // Chart canvas refs
  const combinedRef  = useRef<HTMLCanvasElement>(null);
  const rollRef      = useRef<HTMLCanvasElement>(null);
  const pitchRef     = useRef<HTMLCanvasElement>(null);
  const yawRef       = useRef<HTMLCanvasElement>(null);
  const rateRef      = useRef<HTMLCanvasElement>(null);

  // Chart instances
  const chartMain    = useRef<Chart | null>(null);
  const chartRoll    = useRef<Chart | null>(null);
  const chartPitch   = useRef<Chart | null>(null);
  const chartYaw     = useRef<Chart | null>(null);
  const chartRate    = useRef<Chart | null>(null);

  // MQTT refs
  const wsRef        = useRef<WebSocket | null>(null);
  const retryRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef    = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const makeLabel = () =>
    new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // ── Build Chart.js instance ─────────────────────────────────────────────
  const buildChart = (
    canvas   : HTMLCanvasElement,
    datasets : { key: AxisKey; label: string }[],
    yMin     : number,
    yMax     : number,
    yTitle   : string,
  ): Chart =>
    new Chart(canvas, {
      type: "line",
      data: {
        labels: [...labels.current],
        datasets: datasets.map(({ key, label }) => ({
          label,
          data            : [...history.current[key]],
          borderColor     : COLORS[key].line,
          backgroundColor : COLORS[key].fill,
          borderWidth     : 1.8,
          pointRadius     : 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: COLORS[key].line,
          fill   : true,
          tension: 0.35,
        })),
      },
      options: {
        responsive        : true,
        maintainAspectRatio: false,
        animation         : false,
        interaction       : { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(5,8,12,0.92)",
            borderColor    : "rgba(255,255,255,0.1)",
            borderWidth    : 1,
            titleColor     : "rgba(255,255,255,0.6)",
            bodyColor      : "#fff",
            titleFont      : { family: "'JetBrains Mono', monospace", size: 10 },
            bodyFont       : { family: "'JetBrains Mono', monospace", size: 12 },
            padding        : 10,
            callbacks      : {
              label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(2)}°`,
            },
          },
        },
        scales: {
          x: {
            display: true,
            ticks: {
              color       : "rgba(255,255,255,0.2)",
              font        : { family: "'JetBrains Mono', monospace", size: 9 },
              maxTicksLimit: 10,
              maxRotation : 0,
            },
            grid: { color: "rgba(255,255,255,0.04)" },
          },
          y: {
            min: yMin, max: yMax,
            display: true,
            ticks: {
              color        : "rgba(255,255,255,0.3)",
              font         : { family: "'JetBrains Mono', monospace", size: 9 },
              maxTicksLimit: 7,
              callback     : (v) => `${v}°`,
            },
            grid : { color: "rgba(255,255,255,0.05)" },
            title: {
              display: true,
              text   : yTitle,
              color  : "rgba(255,255,255,0.25)",
              font   : { family: "'JetBrains Mono', monospace", size: 9, weight: 600 },
              padding: { bottom: 4 },
            },
          },
        },
      },
    });

  // ── Init charts ─────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => setLoaded(true), 80);

    if (combinedRef.current) {
      chartMain.current = buildChart(
        combinedRef.current,
        [
          { key: "roll",  label: "Roll"  },
          { key: "pitch", label: "Pitch" },
          { key: "yaw",   label: "Yaw"   },
        ],
        -200, 360, "degrees"
      );
    }
    if (rollRef.current) {
      chartRoll.current  = buildChart(rollRef.current,  [{ key: "roll",  label: "Roll"  }], -45,  45,  "Roll (°)");
    }
    if (pitchRef.current) {
      chartPitch.current = buildChart(pitchRef.current, [{ key: "pitch", label: "Pitch" }], -30,  30,  "Pitch (°)");
    }
    if (yawRef.current) {
      chartYaw.current   = buildChart(yawRef.current,   [{ key: "yaw",   label: "Yaw"   }],   0, 360, "Yaw (°)");
    }
    if (rateRef.current) {
      chartRate.current  = buildChart(
        rateRef.current,
        [
          { key: "rollRate",  label: "Roll Rate"  },
          { key: "pitchRate", label: "Pitch Rate" },
          { key: "yawRate",   label: "Yaw Rate"   },
        ],
        -50, 50, "deg/s"
      );
    }

    return () => {
      chartMain.current?.destroy();
      chartRoll.current?.destroy();
      chartPitch.current?.destroy();
      chartYaw.current?.destroy();
      chartRate.current?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Push data into charts ────────────────────────────────────────────────
  const pushToCharts = useCallback((payload: AttitudePayload) => {
    if (pausedRef.current) return;

    const lbl = makeLabel();
    labels.current.push(lbl);
    if (labels.current.length > MAX_POINTS) labels.current.shift();

    const keys: AxisKey[] = ["roll", "pitch", "yaw", "rollRate", "pitchRate", "yawRate"];
    const srcMap: Record<AxisKey, number> = {
      roll      : payload.roll,
      pitch     : payload.pitch,
      yaw       : payload.yaw,
      rollRate  : payload.rollRate,
      pitchRate : payload.pitchRate,
      yawRate   : payload.yawRate,
    };

    keys.forEach(k => {
      history.current[k].push(srcMap[k]);
      if (history.current[k].length > MAX_POINTS) history.current[k].shift();
    });

    const updateChart = (chart: Chart | null, chartKeys: AxisKey[]) => {
      if (!chart) return;
      chart.data.labels = [...labels.current];
      chartKeys.forEach((k, i) => {
        if (chart.data.datasets[i]) {
          chart.data.datasets[i].data = [...history.current[k]];
        }
      });
      chart.update("none");
    };

    updateChart(chartMain.current,  ["roll", "pitch", "yaw"]);
    updateChart(chartRoll.current,  ["roll"]);
    updateChart(chartPitch.current, ["pitch"]);
    updateChart(chartYaw.current,   ["yaw"]);
    updateChart(chartRate.current,  ["rollRate", "pitchRate", "yawRate"]);

    setVals(payload);
    setLastUpdated(new Date());
    setMsgCount(n => n + 1);
  }, []);

  // ── Visibility sync to combined chart ────────────────────────────────────
  useEffect(() => {
    if (!chartMain.current) return;
    ["roll", "pitch", "yaw"].forEach((k, i) => {
      const meta = chartMain.current!.getDatasetMeta(i);
      meta.hidden = !visible[k as AxisKey];
    });
    chartMain.current.update("none");
  }, [visible]);

  // ── MQTT WebSocket ────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!mqttReady) return;
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    setConnStatus("connecting");

    const clientId = `graph-ui-${Math.random().toString(16).slice(2, 10)}`;
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

          const raw: AttitudePayload = JSON.parse(new TextDecoder().decode(buf.slice(off)));
          pushToCharts(raw);
        } catch (e) { console.warn("MQTT parse error:", e); }
      }
    };

    ws.onerror = () => setConnStatus("error");
    ws.onclose = () => {
      setConnStatus("disconnected");
      retryRef.current = setTimeout(connect, 5000);
    };
  }, [pushToCharts, mqttReady, MQTT_HOST, MQTT_WS_PORT, MQTT_TOPIC]);

  useEffect(() => {
    if (!mqttReady) { setConnStatus("disconnected"); return; }
    connect();
    return () => {
      retryRef.current && clearTimeout(retryRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect, mqttReady]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clearData = () => {
    (["roll","pitch","yaw","rollRate","pitchRate","yawRate"] as AxisKey[]).forEach(k => {
      history.current[k] = Array(MAX_POINTS).fill(0);
    });
    labels.current = Array(MAX_POINTS).fill("");
    setMsgCount(0);
  };

  const stat = (key: AxisKey) => {
    const d   = history.current[key];
    const min = Math.min(...d).toFixed(1);
    const max = Math.max(...d).toFixed(1);
    const avg = (d.reduce((a, b) => a + b, 0) / d.length).toFixed(2);
    return { min, max, avg };
  };

  const connColor =
    connStatus === "connected"  ? "#00ff88" :
    connStatus === "connecting" ? "#f0c040" :
    connStatus === "error"      ? "#ff4466" : "#888";

  const connLabel =
    connStatus === "connected"  ? "LIVE · MQTT" :
    connStatus === "connecting" ? "Connecting…"  :
    connStatus === "error"      ? "MQTT Error"   : "Disconnected";

  const hasData = lastUpdated !== null;

  // Stat card definitions — attitude angles + rates
  const angleInfo = [
    { key: "roll"  as AxisKey, label: "Roll",  unit: "°", sign: true  },
    { key: "pitch" as AxisKey, label: "Pitch", unit: "°", sign: true  },
    { key: "yaw"   as AxisKey, label: "Yaw",   unit: "°", sign: false },
  ];
  const rateInfo = [
    { key: "rollRate"  as AxisKey, label: "Roll Rate",  unit: "°/s", sign: true },
    { key: "pitchRate" as AxisKey, label: "Pitch Rate", unit: "°/s", sign: true },
    { key: "yawRate"   as AxisKey, label: "Yaw Rate",   unit: "°/s", sign: true },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  if (!mqttReady) {
    return (
      <div className="graph-page">
        <div className="video-bg-wrapper">
          <video className="video-bg" src="/videos/drone-bg.mp4" autoPlay loop muted playsInline />
          <div className="video-overlay" />
          <div className="video-vignette" />
        </div>
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
    <div className="graph-page">

      <div className="video-bg-wrapper">
        <video className="video-bg" src="/videos/drone-bg.mp4" autoPlay loop muted playsInline />
        <div className="video-overlay" />
        <div className="video-vignette" />
      </div>

      <StaggeredMenu />

      <main className="graph-content">

        {/* ── HEADER ── */}
        <header className={`page-header ${loaded ? "fade-in" : ""}`}>
          <div>
            <p className="page-eyebrow">UAV · Telemetry Data · {MQTT_TOPIC}</p>
            <h1 className="page-title">Realtime <span className="title-accent">Graph</span></h1>
          </div>
          <div className="header-right">

            {/* MQTT badge */}
            <div className={`live-badge ${loaded ? "fade-in delay-1" : ""}`} title={`Topic: ${MQTT_TOPIC}`}>
              <span className="live-dot" style={{
                background : connColor,
                boxShadow  : `0 0 6px ${connColor}`,
                animation  : connStatus === "connected" && !paused ? undefined : "none",
              }} />
              <span style={{ color: connColor }}>{paused ? "PAUSED" : connLabel}</span>
            </div>

            {/* Message counter */}
            <div className={`fps-badge ${loaded ? "fade-in delay-1" : ""}`}>
              {hasData ? `${msgCount} msg` : "0 msg"}
            </div>

            {/* Mode toggle */}
            <div className={`mode-toggle ${loaded ? "fade-in delay-2" : ""}`}>
              <button className={mode === "combined" ? "active" : ""} onClick={() => setMode("combined")}>
                Combined
              </button>
              <button className={mode === "split" ? "active" : ""} onClick={() => setMode("split")}>
                Split
              </button>
            </div>

            {/* Pause / Clear */}
            <button
              className={`ctrl-btn ${loaded ? "fade-in delay-2" : ""} ${paused ? "resume" : "pause"}`}
              onClick={() => setPaused(p => !p)}
            >
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button className={`ctrl-btn clear ${loaded ? "fade-in delay-2" : ""}`} onClick={clearData}>
              ⟳ Clear
            </button>
          </div>
        </header>

        {/* Timestamp */}
        <p className="last-updated">
          {hasData
            ? `Last update: ${lastUpdated!.toLocaleTimeString()} · ${MQTT_TOPIC}`
            : `Waiting for data… · ${MQTT_TOPIC}`}
        </p>

        {/* ── ATTITUDE STAT CARDS ── */}
        <div className={`stat-row ${loaded ? "fade-in delay-1" : ""}`}>
          {angleInfo.map(({ key, label, unit, sign }) => {
            const s   = stat(key);
            const v   = vals[key as keyof AttitudePayload] as number;
            return (
              <div className="stat-card" key={key}>
                <div className="sc-header">
                  <span className="sc-dot" style={{ background: COLORS[key].line, boxShadow: `0 0 8px ${COLORS[key].line}` }} />
                  <span className="sc-label">{label}</span>
                  <button
                    className={`sc-toggle ${visible[key] ? "on" : "off"}`}
                    onClick={() => setVisible(prev => ({ ...prev, [key]: !prev[key] }))}
                  >
                    {visible[key] ? "●" : "○"}
                  </button>
                </div>
                <div className="sc-val" style={{ color: COLORS[key].line }}>
                  {hasData
                    ? `${sign && v >= 0 ? "+" : ""}${v.toFixed(2)}${unit}`
                    : `—${unit}`}
                </div>
                <Spark data={[...history.current[key]]} color={COLORS[key].line} />
                <div className="sc-stats">
                  <div className="sc-stat"><span>MIN</span><span>{s.min}°</span></div>
                  <div className="sc-stat"><span>AVG</span><span>{s.avg}°</span></div>
                  <div className="sc-stat"><span>MAX</span><span>{s.max}°</span></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── RATE STAT CARDS ── */}
        <div className={`stat-row ${loaded ? "fade-in delay-1" : ""}`} style={{ marginTop: "0.6rem" }}>
          {rateInfo.map(({ key, label, unit }) => {
            const s = stat(key);
            const v = vals[key as keyof AttitudePayload] as number;
            return (
              <div className="stat-card stat-card--rate" key={key}>
                <div className="sc-header">
                  <span className="sc-dot" style={{ background: COLORS[key].line, boxShadow: `0 0 8px ${COLORS[key].line}` }} />
                  <span className="sc-label">{label}</span>
                  <button
                    className={`sc-toggle ${visible[key] ? "on" : "off"}`}
                    onClick={() => setVisible(prev => ({ ...prev, [key]: !prev[key] }))}
                  >
                    {visible[key] ? "●" : "○"}
                  </button>
                </div>
                <div className="sc-val" style={{ color: COLORS[key].line }}>
                  {hasData ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}${unit}` : `—${unit}`}
                </div>
                <Spark data={[...history.current[key]]} color={COLORS[key].line} />
                <div className="sc-stats">
                  <div className="sc-stat"><span>MIN</span><span>{s.min}</span></div>
                  <div className="sc-stat"><span>AVG</span><span>{s.avg}</span></div>
                  <div className="sc-stat"><span>MAX</span><span>{s.max}</span></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── COMBINED CHART ── */}
        <div
          className={`card chart-card ${loaded ? "fade-in delay-2" : ""}`}
          style={{ display: mode === "combined" ? "flex" : "none" }}
        >
          <div className="chart-header">
            <span className="chart-title">Roll · Pitch · Yaw — Attitude</span>
            <div className="chart-legend">
              {angleInfo.map(({ key, label }) => (
                <div
                  key={key}
                  className="legend-item"
                  onClick={() => setVisible(v => ({ ...v, [key]: !v[key] }))}
                  style={{ opacity: visible[key] ? 1 : 0.35, cursor: "pointer" }}
                >
                  <span className="legend-dot" style={{ background: COLORS[key].line, boxShadow: `0 0 6px ${COLORS[key].line}` }} />
                  <span className="legend-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-area">
            <canvas ref={combinedRef} />
          </div>
          <div className="chart-footer">
            <span>← {MAX_POINTS} samples</span>
            <span style={{ color: connColor }}>{connLabel}</span>
          </div>
        </div>

        {/* ── SPLIT CHARTS ── */}
        {mode === "split" && (
          <div className={`split-grid ${loaded ? "fade-in delay-2" : ""}`}>

            {/* Attitude split: Roll, Pitch, Yaw */}
            {[
              { ref: rollRef,  key: "roll"  as AxisKey, label: "Roll",  valKey: "roll"  },
              { ref: pitchRef, key: "pitch" as AxisKey, label: "Pitch", valKey: "pitch" },
              { ref: yawRef,   key: "yaw"   as AxisKey, label: "Yaw",   valKey: "yaw"   },
            ].map(({ ref, key, label, valKey }) => {
              const v = vals[valKey as keyof AttitudePayload] as number;
              return (
                <div className="card split-card" key={key}>
                  <div className="chart-header">
                    <span className="split-title" style={{ color: COLORS[key].line }}>
                      <span className="split-dot" style={{ background: COLORS[key].line, boxShadow: `0 0 8px ${COLORS[key].line}` }} />
                      {label}
                    </span>
                    <span className="split-val" style={{ color: COLORS[key].line }}>
                      {hasData
                        ? `${key !== "yaw" && v >= 0 ? "+" : ""}${v.toFixed(2)}°`
                        : "—"}
                    </span>
                  </div>
                  <div className="split-chart-area"><canvas ref={ref} /></div>
                </div>
              );
            })}

            {/* Angular rates combined chart */}
            <div className="card split-card split-card--wide" style={{ gridColumn: "1 / -1" }}>
              <div className="chart-header">
                <span className="split-title" style={{ color: "#fff" }}>
                  <span className="split-dot" style={{ background: "#a78bfa", boxShadow: "0 0 8px #a78bfa" }} />
                  Angular Rates (°/s)
                </span>
                <div className="chart-legend">
                  {rateInfo.map(({ key, label }) => (
                    <div key={key} className="legend-item" style={{ opacity: 1 }}>
                      <span className="legend-dot" style={{ background: COLORS[key].line, boxShadow: `0 0 6px ${COLORS[key].line}` }} />
                      <span className="legend-label">{label}</span>
                      <span className="legend-val" style={{ color: COLORS[key].line, marginLeft: 4, fontSize: "0.75rem" }}>
                        {hasData
                          ? `${(vals[key as keyof AttitudePayload] as number) >= 0 ? "+" : ""}${(vals[key as keyof AttitudePayload] as number).toFixed(1)}`
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="split-chart-area"><canvas ref={rateRef} /></div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default Graph;