import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./register.css";

// ── Types ──────────────────────────────────────────────────
interface AccountForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface DeviceForm {
  host: string;
  port: string;
  battery_topic: string;
  water_topic: string;
  attitude_topic: string;
  gps_topic: string;
  video_url: string;
}

interface RegisterResponse {
  message: string;
  user_id: number;
  username: string;
  email: string;
  host?: string;
  port?: number;
  battery_topic?: string;
  water_topic?: string;
  attitude_topic?: string;
  gps_topic?: string;
  video_url?: string;
}

type StrengthLevel = "weak" | "fair" | "good" | "strong" | "";

// ── Topic Tooltip Data ─────────────────────────────────────
const TOPIC_TOOLTIPS: Record<string, { title: string; json: string }> = {
  battery_topic: {
    title: "Contoh format JSON payload:",
    json: JSON.stringify(
      { voltage: 6.816, current: 0.034, power: 0.231744, pwm: 41 },
      null, 2
    ),
  },
  water_topic: {
    title: "Contoh format JSON payload:",
    json: JSON.stringify(
      { currentL: 0, maxL: 10, flowRate: 0, sessionUsed: 10, sprayStatus: "Empty" },
      null, 2
    ),
  },
  attitude_topic: {
    title: "Contoh format JSON payload:",
    json: JSON.stringify(
      { roll: 19.7, pitch: -23.1, yaw: 116.9, rollSP: 0, pitchSP: 0, yawSP: 0, rollRate: 8.2, pitchRate: -5, yawRate: -7.9 },
      null, 2
    ),
  },
  gps_topic: {
    title: "Contoh format JSON payload:",
    json: JSON.stringify(
      { latitude: -6.919024, longitude: 107.6175, altitude: 26.4999, speed: 15.5, heading: 50.5, accuracy: 1.7, satellites: 14, fixType: "3D Fix", hdop: 1 },
      null, 2
    ),
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

// ── Tooltip Wrapper ────────────────────────────────────────
interface TopicLabelProps {
  htmlFor: string;
  fieldName: string;
  children: React.ReactNode;
}

function TopicLabel({ htmlFor, fieldName, children }: TopicLabelProps) {
  const [visible, setVisible] = useState(false);
  const tooltip = TOPIC_TOOLTIPS[fieldName];
  if (!tooltip) return <label htmlFor={htmlFor}>{children}</label>;

  return (
    <label htmlFor={htmlFor} className="topic-label-wrap">
      {children}
      <span
        className="topic-info-btn"
        tabIndex={0}
        role="button"
        aria-label={`Info format ${fieldName}`}
        onClick={(e) => { e.preventDefault(); setVisible((v) => !v); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setVisible((v) => !v); }}
        onBlur={() => setVisible(false)}
      >
        <InfoIcon />
        {visible && (
          <div className="topic-tooltip" role="tooltip">
            <p className="topic-tooltip__title">{tooltip.title}</p>
            <pre className="topic-tooltip__json">{tooltip.json}</pre>
          </div>
        )}
      </span>
    </label>
  );
}

// ── Helpers ────────────────────────────────────────────────
function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return "";
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels: StrengthLevel[] = ["weak", "fair", "good", "strong"];
  return levels[score - 1] ?? "weak";
}

const strengthLabel: Record<StrengthLevel, string> = {
  weak: "Lemah", fair: "Cukup", good: "Bagus", strong: "Kuat", "": "",
};

// ── Step Check Icon ────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M2 5.5L4.5 8L9 3" stroke="#03050a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);

  const [account, setAccount] = useState<AccountForm>({
    username: "", email: "", password: "", confirmPassword: "",
  });

  const [device, setDevice] = useState<DeviceForm>({
    host: "", port: "", battery_topic: "", water_topic: "",
    attitude_topic: "", gps_topic: "", video_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [accountErrors, setAccountErrors] = useState<Partial<AccountForm>>({});
  const [deviceErrors, setDeviceErrors] = useState<Partial<DeviceForm>>({});

  const strength = getPasswordStrength(account.password);
  const strengthSteps: StrengthLevel[] = ["weak", "fair", "good", "strong"];

  const validateAccount = (): boolean => {
    const err: Partial<AccountForm> = {};
    if (!account.username.trim()) err.username = "Username wajib diisi";
    else if (account.username.length < 3) err.username = "Minimal 3 karakter";
    if (!account.email.trim()) err.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) err.email = "Format email tidak valid";
    if (!account.password) err.password = "Password wajib diisi";
    else if (account.password.length < 6) err.password = "Minimal 6 karakter";
    if (!account.confirmPassword) err.confirmPassword = "Konfirmasi password wajib diisi";
    else if (account.password !== account.confirmPassword) err.confirmPassword = "Password tidak cocok";
    setAccountErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateDevice = (): boolean => {
    const err: Partial<DeviceForm> = {};
    if (device.port && isNaN(Number(device.port))) err.port = "Port harus berupa angka";
    else if (device.port && (Number(device.port) < 1 || Number(device.port) > 65535))
      err.port = "Port harus antara 1–65535";
    setDeviceErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleAccountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccount((prev) => ({ ...prev, [name]: value }));
    if (accountErrors[name as keyof AccountForm])
      setAccountErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDeviceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDevice((prev) => ({ ...prev, [name]: value }));
    if (deviceErrors[name as keyof DeviceForm])
      setDeviceErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleNextStep = () => {
    setAlert(null);
    if (validateAccount()) setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAlert(null);
    if (!validateDevice()) return;
    if (!agreed) {
      setAlert({ type: "error", message: "Kamu harus menyetujui syarat & ketentuan" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: account.username,
          email: account.email,
          password: account.password,
          host: device.host || null,
          port: device.port ? Number(device.port) : null,
          battery_topic: device.battery_topic || null,
          water_topic: device.water_topic || null,
          attitude_topic: device.attitude_topic || null,
          gps_topic: device.gps_topic || null,
          video_url: device.video_url || null,
        }),
      });

      const data: RegisterResponse | { detail: string } = await res.json();

      if (!res.ok) {
        setAlert({
          type: "error",
          message: (data as { detail: string }).detail ?? "Registrasi gagal",
        });
        return;
      }

      const user = data as RegisterResponse;
      setAlert({ type: "success", message: `Akun ${user.username} berhasil dibuat!` });
      setTimeout(() => navigate("/login"), 1200);

    } catch {
      setAlert({ type: "error", message: "Tidak dapat terhubung ke server" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        {/* ── Logo ── */}
        <a href="/" className="register-logo">
          <div className="register-logo__icon"><span>✦</span></div>
          <span className="register-logo__name">UAV Control</span>
        </a>

        {/* ── Heading ── */}
        <div className="register-eyebrow">Agriculture Drone · Polman Bandung</div>
        <h1 className="register-heading">Create Account</h1>
        <p className="register-subtext">
          Sudah punya akun? <a href="/login">Sign in</a>
        </p>

        {/* ── Step Indicator ── */}
        <div className="step-indicator">
          <div className="step-item">
            <div className={`step-circle ${step === 1 ? "active" : "done"}`}>
              {step === 1 ? "1" : <CheckIcon />}
            </div>
            <span className={`step-label ${step === 1 ? "active" : ""}`}>Akun</span>
          </div>
          <div className={`step-line ${step === 2 ? "done" : ""}`} />
          <div className="step-item">
            <div className={`step-circle ${step === 2 ? "active" : ""}`}>2</div>
            <span className={`step-label ${step === 2 ? "active" : ""}`}>Konfigurasi Device</span>
          </div>
        </div>

        {/* ── Alert ── */}
        {alert && (
          <div className={`register-alert visible ${alert.type}`}>{alert.message}</div>
        )}

        {/* ── STEP 1: Account ── */}
        {step === 1 && (
          <div className="register-form">
            <p className="section-label">Informasi Akun</p>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username" name="username" type="text"
                  placeholder="johndoe" autoComplete="username"
                  value={account.username} onChange={handleAccountChange}
                  className={accountErrors.username ? "input-error" : ""}
                />
                {accountErrors.username && (
                  <p className="field-error visible">{accountErrors.username}</p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email" name="email" type="email"
                  placeholder="john@email.com" autoComplete="email"
                  value={account.email} onChange={handleAccountChange}
                  className={accountErrors.email ? "input-error" : ""}
                />
                {accountErrors.email && (
                  <p className="field-error visible">{accountErrors.email}</p>
                )}
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
                placeholder="Minimal 6 karakter" autoComplete="new-password"
                value={account.password} onChange={handleAccountChange}
                className={accountErrors.password ? "input-error" : ""}
              />
              {accountErrors.password && (
                <p className="field-error visible">{accountErrors.password}</p>
              )}
              {account.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    {strengthSteps.map((s, i) => {
                      const active = i <= strengthSteps.indexOf(strength);
                      return <div key={s} className={`strength-segment ${active ? strength : ""}`} />;
                    })}
                  </div>
                  <span className={`strength-label ${strength}`}>{strengthLabel[strength]}</span>
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">Konfirmasi Password</label>
              <input
                id="confirmPassword" name="confirmPassword" type="password"
                placeholder="Ulangi password" autoComplete="new-password"
                value={account.confirmPassword} onChange={handleAccountChange}
                className={accountErrors.confirmPassword ? "input-error" : ""}
              />
              {accountErrors.confirmPassword && (
                <p className="field-error visible">{accountErrors.confirmPassword}</p>
              )}
            </div>

            <div className="step-nav">
              <button type="button" className="btn-register" onClick={handleNextStep}>
                Lanjut &rarr;
              </button>
            </div>

            <div className="register-divider"><span>atau</span></div>

            <button className="btn-oauth" type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        {/* ── STEP 2: Device Config ── */}
        {step === 2 && (
          <form className="register-form" onSubmit={handleSubmit} noValidate>
            <p className="section-label">Konfigurasi MQTT &amp; Device</p>

            {/* Host + Port */}
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="host">
                  Host <span className="label-optional">opsional</span>
                </label>
                <input
                  id="host" name="host" type="text"
                  placeholder="192.168.1.1"
                  value={device.host} onChange={handleDeviceChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="port">
                  Port <span className="label-optional">opsional</span>
                </label>
                <input
                  id="port" name="port" type="text"
                  placeholder="1883"
                  value={device.port} onChange={handleDeviceChange}
                  className={deviceErrors.port ? "input-error" : ""}
                />
                {deviceErrors.port && <p className="field-error visible">{deviceErrors.port}</p>}
              </div>
            </div>

            {/* Topics */}
            <div className="form-row">
              <div className="form-field">
                <TopicLabel htmlFor="battery_topic" fieldName="battery_topic">
                  Battery Topic <span className="label-optional">opsional</span>
                </TopicLabel>
                <input
                  id="battery_topic" name="battery_topic" type="text"
                  placeholder="device/battery"
                  value={device.battery_topic} onChange={handleDeviceChange}
                />
              </div>

              <div className="form-field">
                <TopicLabel htmlFor="water_topic" fieldName="water_topic">
                  Water Topic <span className="label-optional">opsional</span>
                </TopicLabel>
                <input
                  id="water_topic" name="water_topic" type="text"
                  placeholder="device/water"
                  value={device.water_topic} onChange={handleDeviceChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <TopicLabel htmlFor="attitude_topic" fieldName="attitude_topic">
                  Attitude Topic <span className="label-optional">opsional</span>
                </TopicLabel>
                <input
                  id="attitude_topic" name="attitude_topic" type="text"
                  placeholder="device/attitude"
                  value={device.attitude_topic} onChange={handleDeviceChange}
                />
              </div>

              <div className="form-field">
                <TopicLabel htmlFor="gps_topic" fieldName="gps_topic">
                  GPS Topic <span className="label-optional">opsional</span>
                </TopicLabel>
                <input
                  id="gps_topic" name="gps_topic" type="text"
                  placeholder="device/gps"
                  value={device.gps_topic} onChange={handleDeviceChange}
                />
              </div>
            </div>

            {/* Video URL */}
            <div className="form-field">
              <label htmlFor="video_url">
                Video URL <span className="label-optional">opsional</span>
              </label>
              <input
                id="video_url" name="video_url" type="text"
                placeholder="rtsp://192.168.1.1:8554/stream"
                value={device.video_url} onChange={handleDeviceChange}
              />
              <p className="field-hint">Supports RTSP, HTTP, atau URL stream lainnya</p>
            </div>

            {/* Terms */}
            <div className="terms-row">
              <input
                id="terms" type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="terms">
                Saya setuju dengan{" "}
                <a href="/terms">Syarat &amp; Ketentuan</a> dan{" "}
                <a href="/privacy">Kebijakan Privasi</a>
              </label>
            </div>

            {/* Buttons */}
            <div className="step-nav">
              <button
                type="button"
                className="btn-back"
                onClick={() => { setStep(1); setAlert(null); }}
              >
                &larr; Kembali
              </button>
              <button type="submit" className="btn-register" disabled={loading}>
                {loading ? <span className="spinner" /> : "Create Account"}
              </button>
            </div>
          </form>
        )}

        {/* ── Footer Status ── */}
        <div className="register-footer-note">
          <span className="footer-status-dot" />
          <span className="footer-status-text">Secure Connection</span>
        </div>

      </div>
    </div>
  );
}