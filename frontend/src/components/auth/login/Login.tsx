import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./login.css";

interface LoginForm {
  username: string;
  password: string;
}

interface LoginResponse {
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

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";

  const [form, setForm] = useState<LoginForm>({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [errors, setErrors] = useState<Partial<LoginForm>>({});

  const validate = (): boolean => {
    const newErrors: Partial<LoginForm> = {};
    if (!form.username.trim()) newErrors.username = "Username wajib diisi";
    if (!form.password) newErrors.password = "Password wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginForm])
      setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data: LoginResponse | { detail: string } = await res.json();

      if (!res.ok) {
        setAlert({
          type: "error",
          message: (data as { detail: string }).detail ?? "Login gagal",
        });
        return;
      }

      const user = data as LoginResponse;

      login({
        id: user.user_id,
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        host: user.host,
        port: user.port,
        battery_topic: user.battery_topic,
        water_topic: user.water_topic,
        attitude_topic: user.attitude_topic,
        gps_topic: user.gps_topic,
        video_url: user.video_url,
      });

      navigate(from, { replace: true });
    } catch {
      setAlert({ type: "error", message: "Tidak dapat terhubung ke server" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* ── Logo ── */}
        <a href="/" className="login-logo">
          <div className="login-logo__icon"><span>✦</span></div>
          <span className="login-logo__name">UAV Control</span>
        </a>

        {/* ── Heading ── */}
        <div className="login-eyebrow">Agriculture Drone · Polman Bandung</div>
        <h1 className="login-heading">Welcome back</h1>
        <p className="login-subtext">
          Belum punya akun? <a href="/register">Sign up</a>
        </p>

        {/* ── Alert ── */}
        {alert && (
          <div className={`login-alert visible ${alert.type}`}>{alert.message}</div>
        )}

        {/* ── Form ── */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              id="username" name="username" type="text"
              placeholder="e.g. johndoe" autoComplete="username"
              value={form.username} onChange={handleChange}
              className={errors.username ? "input-error" : ""}
            />
            {errors.username && (
              <p className="field-error visible">{errors.username}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password"
              placeholder="••••••••" autoComplete="current-password"
              value={form.password} onChange={handleChange}
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && (
              <p className="field-error visible">{errors.password}</p>
            )}
            <div className="forgot-password">
              <a href="/forgot-password">Forgot password?</a>
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <span className="spinner" /> : "Sign In"}
          </button>
        </form>

        {/* ── Divider + OAuth ── */}
        <div className="login-divider"><span>atau</span></div>

        <button className="btn-oauth" type="button">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* ── Footer Status ── */}
        <div className="login-footer-note">
          <span className="footer-status-dot" />
          <span className="footer-status-text">Secure Connection</span>
        </div>

      </div>
    </div>
  );
}