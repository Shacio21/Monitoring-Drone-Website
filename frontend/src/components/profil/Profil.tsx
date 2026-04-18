import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  FiUser, FiMail, FiServer, FiWifi, FiBattery,
  FiDroplet, FiActivity, FiMapPin, FiVideo, FiEdit2,
  FiSave, FiX, FiLogOut, FiShield,
} from "react-icons/fi";
import { useAuth } from "../../components/auth/AuthContext";
import StaggeredMenu from "../../components/staggeredmenu/StaggeredMenu";
import "./profil.css";

// ── Types ──────────────────────────────────────────────────
interface ProfileForm {
  username: string;
  email: string;
  host: string;
  port: string;
  battery_topic: string;
  water_topic: string;
  attitude_topic: string;
  gps_topic: string;
  video_url: string;
}

// ── Topic Info Data ────────────────────────────────────────
type TopicInfoType = "json" | "url";

interface TopicInfo {
  title: string;
  description: string;
  type: TopicInfoType;
  content: string;
}

const TOPIC_INFO: Record<string, TopicInfo> = {
  battery_topic: {
    title: "Battery Topic — Format JSON",
    description: "Payload yang dikirim broker MQTT ke topic ini harus mengikuti struktur berikut:",
    type: "json",
    content: JSON.stringify(
      { voltage: 6.816, current: 0.034, power: 0.231744, pwm: 41 },
      null, 2
    ),
  },
  water_topic: {
    title: "Water Topic — Format JSON",
    description: "Payload yang dikirim broker MQTT ke topic ini harus mengikuti struktur berikut:",
    type: "json",
    content: JSON.stringify(
      { currentL: 0, maxL: 10, flowRate: 0, sessionUsed: 10, sprayStatus: "Empty" },
      null, 2
    ),
  },
  attitude_topic: {
    title: "Attitude Topic — Format JSON",
    description: "Payload yang dikirim broker MQTT ke topic ini harus mengikuti struktur berikut:",
    type: "json",
    content: JSON.stringify(
      { roll: 19.7, pitch: -23.1, yaw: 116.9, rollSP: 0, pitchSP: 0, yawSP: 0, rollRate: 8.2, pitchRate: -5, yawRate: -7.9 },
      null, 2
    ),
  },
  gps_topic: {
    title: "GPS Topic — Format JSON",
    description: "Payload yang dikirim broker MQTT ke topic ini harus mengikuti struktur berikut:",
    type: "json",
    content: JSON.stringify(
      { latitude: -6.919024, longitude: 107.6175, altitude: 26.4999, speed: 15.5, heading: 50.5, accuracy: 1.7, satellites: 14, fixType: "3D Fix", hdop: 1 },
      null, 2
    ),
  },
  video_url: {
    title: "Video URL — Contoh Format",
    description: "Masukkan URL stream video dari perangkat. Format yang didukung:",
    type: "url",
    content: [
      "http://127.0.0.1:3000/video",
      "rtsp://192.168.1.1:8554/stream",
      "http://192.168.1.1:8080/?action=stream",
    ].join("\n"),
  },
};

// ── Info Icon ──────────────────────────────────────────────
function InfoIcon() {
  return (
    <svg className="topic-info-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Copy Button ────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      className={`copy-btn ${copied ? "copied" : ""}`}
      onClick={handleCopy}
      aria-label="Salin ke clipboard"
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d="M2 5.5L4.5 8L9 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tersalin!
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Salin
        </>
      )}
    </button>
  );
}

// ── Info Modal ─────────────────────────────────────────────
interface InfoModalProps {
  info: TopicInfo;
  onClose: () => void;
}

function InfoModal({ info, onClose }: InfoModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      className="info-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={info.title}
    >
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal__header">
          <div>
            <p className="info-modal__badge">
              {info.type === "json" ? "JSON PAYLOAD" : "URL FORMAT"}
            </p>
            <h3 className="info-modal__title">{info.title}</h3>
          </div>
          <button
            type="button"
            className="info-modal__close"
            onClick={onClose}
            aria-label="Tutup"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <p className="info-modal__desc">{info.description}</p>

        <div className="info-modal__code-wrap">
          <div className="info-modal__code-header">
            <span className="info-modal__code-lang">
              {info.type === "json" ? "JSON" : "URL"}
            </span>
            <CopyButton text={info.content} />
          </div>
          {info.type === "json" ? (
            <pre className="info-modal__code info-modal__code--json">
              {info.content.split("\n").map((line, i) => {
                const keyMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.*)/);
                if (keyMatch) {
                  return (
                    <span key={i}>
                      {keyMatch[1]}
                      <span className="json-key">&quot;{keyMatch[2]}&quot;</span>
                      <span className="json-colon">{keyMatch[3]}</span>
                      <span className={
                        /^"/.test(keyMatch[4].trim()) ? "json-string" :
                        /^(true|false|null)/.test(keyMatch[4].trim()) ? "json-bool" :
                        "json-number"
                      }>{keyMatch[4]}</span>
                      {"\n"}
                    </span>
                  );
                }
                return <span key={i}>{line}{"\n"}</span>;
              })}
            </pre>
          ) : (
            <div className="info-modal__code info-modal__code--url">
              {info.content.split("\n").map((url, i) => {
                const schemeEnd = url.indexOf("://") + 3;
                return (
                  <span key={i} className="url-line">
                    <span className="url-scheme">{url.slice(0, schemeEnd)}</span>
                    <span className="url-rest">{url.slice(schemeEnd)}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <p className="info-modal__note">
          <strong>⚠ Penting:</strong> Pastikan perangkat mengirimkan payload sesuai format di atas agar data terbaca dengan benar oleh dashboard.
        </p>
      </div>
    </div>,
    document.body
  );
}

// ── Topic Label with Info Button ───────────────────────────
interface TopicLabelProps {
  children: React.ReactNode;
  fieldName: string;
  onInfo: (fieldName: string) => void;
}

function TopicLabel({ children, fieldName, onInfo }: TopicLabelProps) {
  return (
    <label className="topic-label-wrap">
      {children}
      <button
        type="button"
        className="topic-info-btn"
        onClick={() => onInfo(fieldName)}
        aria-label={`Info format ${fieldName}`}
      >
        <InfoIcon />
      </button>
    </label>
  );
}

// ── Component ──────────────────────────────────────────────
const Profil: React.FC = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    username: user?.username ?? "",
    email: user?.email ?? "",
    host: user?.host ?? "",
    port: user?.port?.toString() ?? "",
    battery_topic: user?.battery_topic ?? "",
    water_topic: user?.water_topic ?? "",
    attitude_topic: user?.attitude_topic ?? "",
    gps_topic: user?.gps_topic ?? "",
    video_url: user?.video_url ?? "",
  });

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setAlert(null);
    try {
      const res = await fetch(`http://localhost:8000/users/${user?.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          host: form.host || null,
          port: form.port ? Number(form.port) : null,
          battery_topic: form.battery_topic || null,
          water_topic: form.water_topic || null,
          attitude_topic: form.attitude_topic || null,
          gps_topic: form.gps_topic || null,
          video_url: form.video_url || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setAlert({ type: "error", message: err.detail ?? "Gagal menyimpan perubahan" });
        return;
      }

      const updated = await res.json();
      login({
        id: updated.id,
        user_id: updated.id,
        username: updated.username,
        email: updated.email,
        host: updated.host,
        port: updated.port,
        battery_topic: updated.battery_topic,
        water_topic: updated.water_topic,
        attitude_topic: updated.attitude_topic,
        gps_topic: updated.gps_topic,
        video_url: updated.video_url,
      });

      setAlert({ type: "success", message: "Profil berhasil diperbarui" });
      setEditMode(false);
    } catch {
      setAlert({ type: "error", message: "Tidak dapat terhubung ke server" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCancel = () => {
    setForm({
      username: user?.username ?? "",
      email: user?.email ?? "",
      host: user?.host ?? "",
      port: user?.port?.toString() ?? "",
      battery_topic: user?.battery_topic ?? "",
      water_topic: user?.water_topic ?? "",
      attitude_topic: user?.attitude_topic ?? "",
      gps_topic: user?.gps_topic ?? "",
      video_url: user?.video_url ?? "",
    });
    setAlert(null);
    setEditMode(false);
  };

  // ── Derived ──
  const initials = (user?.username ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const mqttConnected = !!(user?.host && user?.port);

  return (
    <div className="profil-page">
      {/* ── GRID BACKGROUND ── */}
      <div className="profil-grid-bg" />

      <StaggeredMenu />

      <div className="profil-content">

        {/* ── ALERT ── */}
        {alert && (
          <div className={`profil-alert profil-alert--${alert.type} ${loaded ? "fade-in" : ""}`}>
            <span>{alert.type === "success" ? "✓" : "✕"}</span>
            {alert.message}
          </div>
        )}

        {/* ── HERO HEADER ── */}
        <header className={`profil-header ${loaded ? "fade-in" : ""}`}>
          <div className="profil-avatar-wrap">
            <div className="profil-avatar">
              <span className="avatar-initials">{initials}</span>
              <span className="avatar-ring" />
            </div>
            <div className={`avatar-status ${mqttConnected ? "online" : "offline"}`} />
          </div>

          <div className="profil-hero-info">
            <p className="profil-eyebrow">UAV Operator</p>
            <h1 className="profil-name">{user?.username ?? "—"}</h1>
            <p className="profil-email">
              <FiMail size={13} />
              {user?.email ?? "—"}
            </p>
          </div>

          <div className="profil-header-actions">
            {!editMode ? (
              <>
                <button className="btn-edit" onClick={() => setEditMode(true)}>
                  <FiEdit2 size={14} /> Edit Profil
                </button>
                <button className="btn-logout" onClick={handleLogout}>
                  <FiLogOut size={14} /> Logout
                </button>
              </>
            ) : (
              <>
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <span className="profil-spinner" />
                    : <><FiSave size={14} /> Simpan</>}
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  <FiX size={14} /> Batal
                </button>
              </>
            )}
          </div>
        </header>

        {/* ── DIVIDER ── */}
        <div className={`profil-divider ${loaded ? "fade-in delay-1" : ""}`} />

        {/* ── SECTIONS ── */}
        <div className={`profil-sections ${loaded ? "fade-in delay-2" : ""}`}>

          {/* ── ACCOUNT SECTION ── */}
          <section className="profil-section">
            <div className="section-heading">
              <FiShield className="section-icon" />
              <span>Informasi Akun</span>
            </div>

            <div className="profil-fields-grid">
              <div className="profil-field">
                <label><FiUser size={12} /> Username</label>
                {editMode ? (
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="profil-input"
                    placeholder="username"
                  />
                ) : (
                  <div className="profil-value">{user?.username ?? <span className="val-empty">—</span>}</div>
                )}
              </div>

              <div className="profil-field">
                <label><FiMail size={12} /> Email</label>
                {editMode ? (
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="profil-input"
                    placeholder="email@example.com"
                  />
                ) : (
                  <div className="profil-value">{user?.email ?? <span className="val-empty">—</span>}</div>
                )}
              </div>

              <div className="profil-field profil-field--full">
                <label>User ID</label>
                <div className="profil-value profil-value--mono">
                  #{user?.user_id ?? "—"}
                </div>
              </div>
            </div>
          </section>

          {/* ── DEVICE SECTION ── */}
          <section className="profil-section">
            <div className="section-heading">
              <FiServer className="section-icon" />
              <span>Konfigurasi MQTT &amp; Device</span>
              <span className={`section-badge ${mqttConnected ? "badge-on" : "badge-off"}`}>
                {mqttConnected ? "Terkonfigurasi" : "Belum Dikonfigurasi"}
              </span>
            </div>

            <div className="profil-fields-grid">
              {/* Host */}
              <div className="profil-field">
                <label><FiWifi size={12} /> Host</label>
                {editMode ? (
                  <input name="host" value={form.host} onChange={handleChange}
                    className="profil-input" placeholder="192.168.1.1" />
                ) : (
                  <div className="profil-value profil-value--mono">
                    {user?.host ?? <span className="val-empty">Belum diset</span>}
                  </div>
                )}
              </div>

              {/* Port */}
              <div className="profil-field">
                <label><FiServer size={12} /> Port</label>
                {editMode ? (
                  <input name="port" value={form.port} onChange={handleChange}
                    className="profil-input" placeholder="1883" />
                ) : (
                  <div className="profil-value profil-value--mono">
                    {user?.port ?? <span className="val-empty">Belum diset</span>}
                  </div>
                )}
              </div>

              {/* Battery Topic */}
              <div className="profil-field">
                {editMode ? (
                  <>
                    <TopicLabel fieldName="battery_topic" onInfo={setActiveModal}>
                      <FiBattery size={12} /> Battery Topic
                    </TopicLabel>
                    <input name="battery_topic" value={form.battery_topic} onChange={handleChange}
                      className="profil-input" placeholder="device/battery" />
                  </>
                ) : (
                  <>
                    <label className="topic-label-wrap">
                      <FiBattery size={12} /> Battery Topic
                      <button type="button" className="topic-info-btn" onClick={() => setActiveModal("battery_topic")} aria-label="Info format battery topic">
                        <InfoIcon />
                      </button>
                    </label>
                    <div className="profil-value profil-value--mono">
                      {user?.battery_topic ?? <span className="val-empty">Belum diset</span>}
                    </div>
                  </>
                )}
              </div>

              {/* Water Topic */}
              <div className="profil-field">
                {editMode ? (
                  <>
                    <TopicLabel fieldName="water_topic" onInfo={setActiveModal}>
                      <FiDroplet size={12} /> Water Topic
                    </TopicLabel>
                    <input name="water_topic" value={form.water_topic} onChange={handleChange}
                      className="profil-input" placeholder="device/water" />
                  </>
                ) : (
                  <>
                    <label className="topic-label-wrap">
                      <FiDroplet size={12} /> Water Topic
                      <button type="button" className="topic-info-btn" onClick={() => setActiveModal("water_topic")} aria-label="Info format water topic">
                        <InfoIcon />
                      </button>
                    </label>
                    <div className="profil-value profil-value--mono">
                      {user?.water_topic ?? <span className="val-empty">Belum diset</span>}
                    </div>
                  </>
                )}
              </div>

              {/* Attitude Topic */}
              <div className="profil-field">
                {editMode ? (
                  <>
                    <TopicLabel fieldName="attitude_topic" onInfo={setActiveModal}>
                      <FiActivity size={12} /> Attitude Topic
                    </TopicLabel>
                    <input name="attitude_topic" value={form.attitude_topic} onChange={handleChange}
                      className="profil-input" placeholder="device/attitude" />
                  </>
                ) : (
                  <>
                    <label className="topic-label-wrap">
                      <FiActivity size={12} /> Attitude Topic
                      <button type="button" className="topic-info-btn" onClick={() => setActiveModal("attitude_topic")} aria-label="Info format attitude topic">
                        <InfoIcon />
                      </button>
                    </label>
                    <div className="profil-value profil-value--mono">
                      {user?.attitude_topic ?? <span className="val-empty">Belum diset</span>}
                    </div>
                  </>
                )}
              </div>

              {/* GPS Topic */}
              <div className="profil-field">
                {editMode ? (
                  <>
                    <TopicLabel fieldName="gps_topic" onInfo={setActiveModal}>
                      <FiMapPin size={12} /> GPS Topic
                    </TopicLabel>
                    <input name="gps_topic" value={form.gps_topic} onChange={handleChange}
                      className="profil-input" placeholder="device/gps" />
                  </>
                ) : (
                  <>
                    <label className="topic-label-wrap">
                      <FiMapPin size={12} /> GPS Topic
                      <button type="button" className="topic-info-btn" onClick={() => setActiveModal("gps_topic")} aria-label="Info format gps topic">
                        <InfoIcon />
                      </button>
                    </label>
                    <div className="profil-value profil-value--mono">
                      {user?.gps_topic ?? <span className="val-empty">Belum diset</span>}
                    </div>
                  </>
                )}
              </div>

              {/* Video URL — full width */}
              <div className="profil-field profil-field--full">
                {editMode ? (
                  <>
                    <TopicLabel fieldName="video_url" onInfo={setActiveModal}>
                      <FiVideo size={12} /> Video URL
                    </TopicLabel>
                    <input name="video_url" value={form.video_url} onChange={handleChange}
                      className="profil-input" placeholder="rtsp://192.168.1.1:8554/stream" />
                  </>
                ) : (
                  <>
                    <label className="topic-label-wrap">
                      <FiVideo size={12} /> Video URL
                      <button type="button" className="topic-info-btn" onClick={() => setActiveModal("video_url")} aria-label="Info format video url">
                        <InfoIcon />
                      </button>
                    </label>
                    <div className="profil-value profil-value--mono profil-value--url">
                      {user?.video_url ?? <span className="val-empty">Belum diset</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* ── INFO MODAL ── */}
      {activeModal && TOPIC_INFO[activeModal] && (
        <InfoModal
          info={TOPIC_INFO[activeModal]}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default Profil;