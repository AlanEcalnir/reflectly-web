import { useState } from "react";
import { supabase } from "../supabase";

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("1 uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("1 lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("1 number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("1 special character");
  return errors;
};

export default function ResetPassword({ onDone }) {
  const [password, setPassword]           = useState("");
  const [confirm, setConfirm]             = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [error, setError]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [success, setSuccess]             = useState(false);

  const handleChange = (value) => {
    setPassword(value);
    setPasswordErrors(validatePassword(value));
  };

  const handleReset = async () => {
    setError("");

    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0) { setError("Password does not meet requirements."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);

    // At this point Supabase has already set a session from the magic link.
    // updateUser will update the password for the currently authenticated user.
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) { setError(updateError.message); return; }

    setSuccess(true);

    // Give user a moment to read the success message, then go to login
    setTimeout(() => onDone(), 2500);
  };

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <div className="brand-logo">
          <div className="logo-icon">✏️</div>
          <span>Reflectly</span>
        </div>
        <h1>How is your team doing today?</h1>
        <p>Track team sentiment, share feedback, and build a healthier team culture — all in one place.</p>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-box">

          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✅</div>
              <h2>Password updated!</h2>
              <p style={{ color: "#888" }}>Redirecting you to login...</p>
            </div>
          ) : (
            <>
              <h2>Set new password</h2>
              <p className="subtitle">Choose a strong password for your account.</p>

              {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

              {/* New Password */}
              <div className="field">
                <label>New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => handleChange(e.target.value)}
                    style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: 12,
                      top: passwordErrors.length > 0 ? "22px" : "50%",
                      transform: passwordErrors.length > 0 ? "none" : "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "16px", color: "#888", padding: 0, lineHeight: 1
                    }}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {passwordErrors.length > 0 && (
                  <ul style={{ margin: "6px 0 0", paddingLeft: "18px", fontSize: "12px", color: "#e55" }}>
                    {passwordErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>

              {/* Confirm Password */}
              <div className="field">
                <label>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
                  />
                  <button
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: "absolute", right: 12, top: "50%",
                      transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "16px", color: "#888", padding: 0, lineHeight: 1
                    }}
                  >
                    {showConfirm ? "🙈" : "👁️"}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p style={{ color: "#e55", fontSize: "12px", margin: "4px 0 0" }}>
                    Passwords do not match.
                  </p>
                )}
              </div>

              <button
                className="btn btn-primary"
                onClick={handleReset}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}