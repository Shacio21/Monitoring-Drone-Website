import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

// ── Component ──────────────────────────────────────────────
const Profil: React.FC = () => {
  const { user, logout, login } = useAuth(); // ← tambah login
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);

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

      // ← Update context + localStorage dengan data terbaru dari backend
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
              <span>Konfigurasi MQTT & Device</span>
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
                <label><FiBattery size={12} /> Battery Topic</label>
                {editMode ? (
                  <input name="battery_topic" value={form.battery_topic} onChange={handleChange}
                    className="profil-input" placeholder="device/battery" />
                ) : (
                  <div className="profil-value profil-value--mono">
                    {user?.battery_topic ?? <span className="val-empty">Belum diset</span>}
                  </div>
                )}
              </div>

              {/* Water Topic */}
              <div className="profil-field">
                <label><FiDroplet size={12} /> Water Topic</label>
                {editMode ? (
                  <input name="water_topic" value={form.water_topic} onChange={handleChange}
                    className="profil-input" placeholder="device/water" />
                ) : (
                  <div className="profil-value profil-value--mono">
                    {user?.water_topic ?? <span className="val-empty">Belum diset</span>}
                  </div>
                )}
              </div>

              {/* Attitude Topic */}
              <div className="profil-field">
                <label><FiActivity size={12} /> Attitude Topic</label>
                {editMode ? (
                  <input name="attitude_topic" value={form.attitude_topic} onChange={handleChange}
                    className="profil-input" placeholder="device/attitude" />
                ) : (
                  <div className="profil-value profil-value--mono">
                    {user?.attitude_topic ?? <span className="val-empty">Belum diset</span>}
                  </div>
                )}
              </div>

              {/* GPS Topic */}
              <div className="profil-field">
                <label><FiMapPin size={12} /> GPS Topic</label>
                {editMode ? (
                  <input name="gps_topic" value={form.gps_topic} onChange={handleChange}
                    className="profil-input" placeholder="device/gps" />
                ) : (
                  <div className="profil-value profil-value--mono">
                    {user?.gps_topic ?? <span className="val-empty">Belum diset</span>}
                  </div>
                )}
              </div>

              {/* Video URL — full width */}
              <div className="profil-field profil-field--full">
                <label><FiVideo size={12} /> Video URL</label>
                {editMode ? (
                  <input name="video_url" value={form.video_url} onChange={handleChange}
                    className="profil-input" placeholder="rtsp://192.168.1.1:8554/stream" />
                ) : (
                  <div className="profil-value profil-value--mono profil-value--url">
                    {user?.video_url ?? <span className="val-empty">Belum diset</span>}
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Profil;