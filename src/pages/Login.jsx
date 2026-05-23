import { useState } from "react";
import { supabase } from "../supabase";
import ForgotPasswordModal from "../components/ForgotPasswordModal";

export default function Login({ onLogin, onGoRegister }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    onLogin(data.user);
  };

  return (
    <>
      {/* Forgot Password Modal — shown on top when triggered */}
      {showForgotModal && (
        <ForgotPasswordModal onClose={() => setShowForgotModal(false)} />
      )}

      <div className="auth-layout">
        <div className="auth-brand">
          <div className="brand-logo">
          <div className="logo-icon">✏️</div>
          <span style={{ color: "white" }}>Reflectly</span>
          </div>
          <h1>How is your team doing today?</h1>
          <p>Track team sentiment, share feedback, and build a healthier team culture — all in one place.</p>
        </div>

        <div className="auth-form-side">
          <div className="auth-form-box">
            <h2>Welcome back</h2>
            <p className="subtitle">Sign in to your account</p>

            {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@gordoncollege.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", fontSize: "16px",
                    color: "#888", padding: 0, lineHeight: 1
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div style={{ textAlign: "right", marginTop: "-8px" }}>
              <button
                className="link-btn"
                onClick={() => setShowForgotModal(true)}
                style={{ fontSize: "13px" }}
              >
                Forgot password?
              </button>
            </div>

            <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>

            <p className="divider-text">
              New to Reflectly?{" "}
              <button className="link-btn" onClick={onGoRegister}>Create account</button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}