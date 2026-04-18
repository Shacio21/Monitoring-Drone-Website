import React, { useEffect, useState, useRef, useCallback } from "react";
import "./gps.css";
import StaggeredMenu from "../../components/staggeredmenu/StaggeredMenu";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../components/auth/AuthContext";

// Fallback center sebelum data pertama diterima (Polman Bandung)
const DEFAULT_LAT = -6.9175;
const DEFAULT_LNG = 107.6191;

const MAX_TRAIL = 60;

// ══════════════════════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════════════════════
interface GPSData {
  latitude  : number;
  longitude : number;
  altitude  : number;   // meters    ← MQTT
  speed     : number;   // km/h      ← MQTT
  heading   : number;   // degrees   ← MQTT
  accuracy  : number;   // meters    ← MQTT
  satellites: number;              // ← MQTT
  fixType   : "3D Fix" | "2D Fix" | "No Fix";  // ← MQTT
  hdop      : number;              // ← MQTT
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

// ══════════════════════════════════════════════════════════════════════════════
//  INITIAL STATE
// ══════════════════════════════════════════════════════════════════════════════
const INITIAL: GPSData = {
  latitude  : DEFAULT_LAT,
  longitude : DEFAULT_LNG,
  altitude  : 0,
  speed     : 0,
  heading   : 0,
  accuracy  : 0,
  satellites: 0,
  fixType   : "No Fix",
  hdop      : 0,
};

// ══════════════════════════════════════════════════════════════════════════════
//  DRONE MARKER ICON
// ══════════════════════════════════════════════════════════════════════════════
const createDroneIcon = (heading: number) =>
  L.divIcon({
    className: "",
    html: `
      <div class="drone-marker" style="transform: rotate(${heading}deg)">
        <div class="drone-pulse"></div>
        <div class="drone-ring"></div>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="4" fill="#00ff88"/>
          <line x1="14" y1="4"  x2="14" y2="10" stroke="#00ff88" stroke-width="2" stroke-linecap="round"/>
          <line x1="14" y1="18" x2="14" y2="24" stroke="#00ff88" stroke-width="2" stroke-linecap="round"/>
          <line x1="4"  y1="14" x2="10" y2="14" stroke="#00ff88" stroke-width="2" stroke-linecap="round"/>
          <line x1="18" y1="14" x2="24" y2="14" stroke="#00ff88" stroke-width="2" stroke-linecap="round"/>
          <circle cx="5"  cy="5"  r="2.5" fill="none" stroke="#00ff88" stroke-width="1.5" opacity="0.6"/>
          <circle cx="23" cy="5"  r="2.5" fill="none" stroke="#00ff88" stroke-width="1.5" opacity="0.6"/>
          <circle cx="5"  cy="23" r="2.5" fill="none" stroke="#00ff88" stroke-width="1.5" opacity="0.6"/>
          <circle cx="23" cy="23" r="2.5" fill="none" stroke="#00ff88" stroke-width="1.5" opacity="0.6"/>
        </svg>
      </div>`,
    iconSize  : [40, 40],
    iconAnchor: [20, 20],
  });

// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const GPS: React.FC = () => {
  const { user } = useAuth();

  const MQTT_HOST    = user?.host ?? "";
  const MQTT_WS_PORT = user?.port ?? 8083;
  const MQTT_TOPIC   = user?.gps_topic ?? "";
  const mqttReady    = !!(MQTT_HOST && MQTT_WS_PORT && MQTT_TOPIC);

  const [data,        setData       ] = useState<GPSData>(INITIAL);
  const [loaded,      setLoaded     ] = useState(false);
  const [,            setTrail      ] = useState<[number, number][]>([[DEFAULT_LAT, DEFAULT_LNG]]);
  const [tracking,    setTracking   ] = useState(true);
  const [connStatus,  setConnStatus ] = useState<ConnectionStatus>("connecting");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const mapRef        = useRef<L.Map | null>(null);
  const markerRef     = useRef<L.Marker | null>(null);
  const polylineRef   = useRef<L.Polyline | null>(null);
  const mapDivRef     = useRef<HTMLDivElement>(null);
  const wsRef         = useRef<WebSocket | null>(null);
  const retryRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  // keep latest tracking flag accessible inside ws.onmessage without stale closure
  const trackingRef   = useRef(tracking);
  useEffect(() => { trackingRef.current = tracking; }, [tracking]);

  // ── Entrance ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  // ── Init Leaflet ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    const map = L.map(mapDivRef.current, {
      center          : [DEFAULT_LAT, DEFAULT_LNG],
      zoom            : 17,
      zoomControl     : false,
      attributionControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 20 }
    ).addTo(map);

    L.control.attribution({ position: "bottomright", prefix: "" })
      .addAttribution('© <a href="https://carto.com/">CARTO</a>')
      .addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    const polyline = L.polyline([[DEFAULT_LAT, DEFAULT_LNG]], {
      color    : "#00ff88",
      weight   : 2,
      opacity  : 0.7,
      dashArray: "4 6",
    }).addTo(map);

    const marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], {
      icon        : createDroneIcon(0),
      zIndexOffset: 1000,
    }).addTo(map);

    mapRef.current      = map;
    markerRef.current   = marker;
    polylineRef.current = polyline;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── MQTT WebSocket ────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (!mqttReady) return;
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    setConnStatus("connecting");

    const clientId = `gps-ui-${Math.random().toString(16).slice(2, 10)}`;
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

          const raw: GPSData = JSON.parse(new TextDecoder().decode(buf.slice(off)));

          // ── Update map ──
          const latlng: [number, number] = [raw.latitude, raw.longitude];

          if (markerRef.current) {
            markerRef.current.setLatLng(latlng);
            markerRef.current.setIcon(createDroneIcon(raw.heading));
          }

          setTrail(prev => {
            const updated = [...prev, latlng].slice(-MAX_TRAIL);
            polylineRef.current?.setLatLngs(updated);
            return updated;
          });

          if (trackingRef.current && mapRef.current) {
            mapRef.current.panTo(latlng, { animate: true, duration: 0.8 });
          }

          setData(raw);
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

  // ── Derived UI ────────────────────────────────────────────────────────────
  const hasData  = lastUpdated !== null;

  const fixColor =
    data.fixType === "3D Fix" ? "#00ff88" :
    data.fixType === "2D Fix" ? "#f0c040" : "#ff4466";

  const connColor =
    connStatus === "connected"  ? "#00ff88" :
    connStatus === "connecting" ? "#f0c040" :
    connStatus === "error"      ? "#ff4466" : "#888";

  const connLabel =
    connStatus === "connected"  ? "LIVE · MQTT" :
    connStatus === "connecting" ? "Connecting…"  :
    connStatus === "error"      ? "MQTT Error"   : "Disconnected";

  const speedBar = Math.min(100, (data.speed / 80) * 100);

  const dms = (val: number, pos: string, neg: string) => {
    const dir = val >= 0 ? pos : neg;
    const abs = Math.abs(val);
    const d   = Math.floor(abs);
    const m   = Math.floor((abs - d) * 60);
    const s   = ((abs - d) * 60 - m) * 60;
    return `${d}° ${m}' ${s.toFixed(2)}" ${dir}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!mqttReady) {
    return (
      <div className="gps-page">
        <StaggeredMenu />
        <main style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"80vh", gap:"1rem", textAlign:"center" }}>
          <span style={{ fontSize:"2.5rem" }}>⚙️</span>
          <h2 style={{ color:"#fff", margin:0 }}>MQTT Belum Dikonfigurasi</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", maxWidth:360 }}>
            Lengkapi <strong style={{ color:"#00d4ff" }}>Host</strong>,{" "}
            <strong style={{ color:"#00d4ff" }}>Port</strong>, dan{" "}
            <strong style={{ color:"#00d4ff" }}>GPS Topic</strong> di halaman Profil.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="gps-page">

      <div className="video-bg-wrapper">
        <video className="video-bg" src="/videos/drone-bg.mp4" autoPlay loop muted playsInline />
        <div className="video-overlay" />
        <div className="video-vignette" />
      </div>

      <StaggeredMenu />

      <main className="gps-content">

        {/* ── HEADER ── */}
        <header className={`page-header ${loaded ? "fade-in" : ""}`}>
          <div>
            <p className="page-eyebrow">UAV · Navigation Systems</p>
            <h1 className="page-title">GPS <span className="title-accent">Tracking</span></h1>
          </div>
          <div className="header-right">

            {/* MQTT badge */}
            <div className={`live-badge ${loaded ? "fade-in delay-1" : ""}`} title={`Topic: ${MQTT_TOPIC}`}>
              <span className="live-dot" style={{ background: connColor, boxShadow: `0 0 6px ${connColor}` }} />
              <span style={{ color: connColor }}>{connLabel}</span>
            </div>

            {/* Fix type */}
            <div
              className={`fix-chip ${loaded ? "fade-in delay-2" : ""}`}
              style={{ "--fix-color": fixColor } as React.CSSProperties}
            >
              {data.fixType}
            </div>

            {/* Map tracking toggle */}
            <button
              className={`track-btn ${tracking ? "active" : ""} ${loaded ? "fade-in delay-2" : ""}`}
              onClick={() => setTracking(t => !t)}
            >
              {tracking ? "⊙ Tracking ON" : "○ Tracking OFF"}
            </button>
          </div>
        </header>

        {/* Timestamp */}
        <p className="last-updated">
          {hasData
            ? `Last update: ${lastUpdated!.toLocaleTimeString()} · ${MQTT_TOPIC}`
            : `Waiting for GPS data… · ${MQTT_TOPIC}`}
        </p>

        {/* ── MAIN LAYOUT ── */}
        <div className="gps-grid">

          {/* ══ MAP ══ */}
          <div className={`card map-card ${loaded ? "fade-in delay-1" : ""}`}>
            <div className="map-topbar">
              <span className="map-label">Live Position Map</span>
              <span className="map-coords">
                {hasData
                  ? `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}`
                  : "Waiting for fix…"}
              </span>
            </div>

            <div ref={mapDivRef} className="leaflet-map" />

            {/* Map HUD overlay */}
            <div className="map-hud">
              <div className="hud-item">
                <span className="hud-label">HDG</span>
                <span className="hud-value">{hasData ? `${data.heading.toFixed(0)}°` : "—"}</span>
              </div>
              <div className="hud-item">
                <span className="hud-label">SAT</span>
                <span className="hud-value">{hasData ? data.satellites : "—"}</span>
              </div>
              <div className="hud-item">
                <span className="hud-label">ACC</span>
                <span className="hud-value">{hasData ? `±${data.accuracy}m` : "—"}</span>
              </div>
              <div className="hud-item">
                <span className="hud-label">HDOP</span>
                <span className="hud-value">{hasData ? data.hdop : "—"}</span>
              </div>
            </div>
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div className="right-panel">

            {/* Coordinates */}
            <div className={`card coord-card ${loaded ? "fade-in delay-1" : ""}`}>
              <p className="card-section-label">Coordinates</p>
              <div className="coord-row">
                <div className="coord-item">
                  <span className="coord-tag">LAT</span>
                  <span className="coord-dec">
                    {hasData ? `${data.latitude.toFixed(6)}°` : "—"}
                  </span>
                  <span className="coord-dms">
                    {hasData ? dms(data.latitude, "N", "S") : "—"}
                  </span>
                </div>
                <div className="coord-divider" />
                <div className="coord-item">
                  <span className="coord-tag">LNG</span>
                  <span className="coord-dec">
                    {hasData ? `${data.longitude.toFixed(6)}°` : "—"}
                  </span>
                  <span className="coord-dms">
                    {hasData ? dms(data.longitude, "E", "W") : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Altitude */}
            <div className={`card alt-card ${loaded ? "fade-in delay-2" : ""}`}>
              <p className="card-section-label">Altitude</p>
              <div className="alt-row">
                <div className="alt-big">
                  <span className="alt-value">
                    {hasData ? data.altitude.toFixed(1) : "—"}
                  </span>
                  <span className="alt-unit">m</span>
                </div>
                <div className="alt-bar-wrap">
                  <div
                    className="alt-bar-fill"
                    style={{
                      height: `${hasData ? Math.min(100, (data.altitude / 120) * 100) : 0}%`,
                      transition: "height 0.8s ease",
                    }}
                  />
                  <div className="alt-bar-markers">
                    {[120, 90, 60, 30, 0].map(v => (
                      <span key={v} className="alt-mark">{v}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="alt-feet">
                {hasData ? `${(data.altitude * 3.281).toFixed(1)} ft` : "— ft"}
              </div>
            </div>

            {/* Speed */}
            <div className={`card speed-card ${loaded ? "fade-in delay-2" : ""}`}>
              <p className="card-section-label">Ground Speed</p>
              <div className="speed-row">
                <div className="speed-big">
                  <span className="speed-value">
                    {hasData ? data.speed.toFixed(1) : "—"}
                  </span>
                  <span className="speed-unit">km/h</span>
                </div>
                <span className="speed-ms">
                  {hasData ? `${(data.speed / 3.6).toFixed(1)} m/s` : "— m/s"}
                </span>
              </div>
              <div className="speed-track">
                <div
                  className="speed-fill"
                  style={{
                    width: `${speedBar}%`,
                    background: data.speed > 60
                      ? "linear-gradient(90deg, #00ff88, #ff4466)"
                      : "linear-gradient(90deg, #00ff88, #00d4ff)",
                    transition: "width 0.8s ease",
                  }}
                />
                {[0, 20, 40, 60, 80].map(v => (
                  <span key={v} className="speed-tick" style={{ left: `${(v / 80) * 100}%` }}>{v}</span>
                ))}
              </div>
            </div>

            {/* Signal quality */}
            <div className={`card signal-card ${loaded ? "fade-in delay-3" : ""}`}>
              <p className="card-section-label">Signal Quality</p>
              <div className="signal-grid">
                <div className="sig-item">
                  <span className="sig-label">Satellites</span>
                  <div className="sat-bars">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className="sat-bar"
                        style={{
                          background   : i < data.satellites ? "#00ff88" : "rgba(255,255,255,0.08)",
                          boxShadow    : i < data.satellites ? "0 0 6px #00ff88" : "none",
                          height       : `${30 + i * 3}%`,
                          transition   : "background 0.4s ease, box-shadow 0.4s ease",
                        }}
                      />
                    ))}
                  </div>
                  <span className="sig-value">
                    {hasData ? `${data.satellites} / 16` : "— / 16"}
                  </span>
                </div>

                <div className="sig-divider" />

                <div className="sig-item">
                  <span className="sig-label">Fix Type</span>
                  <span className="sig-fix" style={{ color: fixColor }}>
                    {data.fixType}
                  </span>
                  <div className="sig-meta-row">
                    <span className="sig-meta-label">HDOP</span>
                    <span className="sig-meta-val">
                      {hasData ? data.hdop : "—"}
                    </span>
                  </div>
                  <div className="sig-meta-row">
                    <span className="sig-meta-label">Accuracy</span>
                    <span className="sig-meta-val">
                      {hasData ? `±${data.accuracy} m` : "—"}
                    </span>
                  </div>
                  <div className="sig-meta-row">
                    <span className="sig-meta-label">Heading</span>
                    <span className="sig-meta-val">
                      {hasData ? `${data.heading.toFixed(1)}°` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default GPS;