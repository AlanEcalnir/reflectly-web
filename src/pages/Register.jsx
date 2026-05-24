import { useState } from "react";
import { supabase } from "../supabase";

const TermsModal = ({ onClose, onAgree }) => {
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 10) setScrolled(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "white", borderRadius: "12px", width: "90%", maxWidth: "500px",
        padding: "24px", display: "flex", flexDirection: "column", gap: "16px"
      }}>
        <h3 style={{ margin: 0 }}>Terms and Conditions</h3>
        <div onScroll={handleScroll} style={{
          height: "300px", overflowY: "scroll", border: "1px solid #eee",
          borderRadius: "8px", padding: "16px", fontSize: "14px", lineHeight: "1.6"
        }}>
          <p><strong>1. Acceptance of Terms</strong><br />
          By using Reflectly, you agree to these terms and conditions. Please read them carefully.</p>
          <p><strong>2. Purpose</strong><br />
          Reflectly is a team sentiment and feedback tool designed for GC CCS students. It is intended for academic use only.</p>
          <p><strong>3. User Responsibilities</strong><br />
          You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information during registration.</p>
          <p><strong>4. Privacy</strong><br />
          Your feedback may be anonymous depending on your settings. However, your account information is stored securely in our database.</p>
          <p><strong>5. Prohibited Conduct</strong><br />
          You may not use Reflectly to submit false, offensive, or harmful feedback. Violations may result in account suspension.</p>
          <p><strong>6. Data Usage</strong><br />
          Data collected is used solely for team sentiment analysis within your registered groups. We do not share your data with third parties.</p>
          <p><strong>7. Changes to Terms</strong><br />
          We reserve the right to update these terms at any time. Continued use of the app constitutes acceptance of the new terms.</p>
          <p><strong>8. Contact</strong><br />
          For questions or concerns, contact your system administrator or class representative.</p>
          <p style={{ color: "#999" }}>— Scroll to the bottom to agree —</p>
        </div>
        {!scrolled && (
          <p style={{ color: "#999", fontSize: "13px", margin: 0 }}>
            Please read the full terms before agreeing.
          </p>
        )}
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px", borderRadius: "8px",
            border: "1px solid #ccc", background: "white", color: "#333", cursor: "pointer"
          }}>Cancel</button>
          <button onClick={onAgree} disabled={!scrolled} style={{
            flex: 1, padding: "10px", borderRadius: "8px", border: "none",
            background: scrolled ? "#1e2a3a" : "#ccc",
            color: "white", cursor: scrolled ? "pointer" : "not-allowed"
          }}>I Agree</button>
        </div>
      </div>
    </div>
  );
};

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("1 uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("1 lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("1 number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("1 special character");
  return errors;
};

export default function Register({ onRegister, onGoLogin }) {
  const [form, setForm] = useState({
    fullName: "", studentId: "", age: "", dob: "", phone: "", email: "", password: ""
  });
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [showTerms, setShowTerms]           = useState(false);
  const [agreedToTerms, setAgreedToTerms]   = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [showPassword, setShowPassword]     = useState(false);
  const [confirmSent, setConfirmSent]       = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "password") setPasswordErrors(validatePassword(value));
  };

  const handleRegister = async () => {
    setError("");

    if (!agreedToTerms) { setError("You must agree to the Terms and Conditions."); return; }

    const pwErrors = validatePassword(form.password);
    if (pwErrors.length > 0) { setError("Password does not meet requirements."); return; }

    if (!form.fullName || !form.studentId || !form.age || !form.dob || !form.phone || !form.email) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    // Check for duplicate name
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .ilike("full_name", form.fullName)
      .maybeSingle();

    if (existing) {
      setError("An account with this name already exists.");
      setLoading(false);
      return;
    }

    // ✅ Sign up — Supabase will send confirmation email automatically
    // (requires "Confirm email" to be ON in Dashboard → Auth → Providers → Email)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        // Pass extra metadata so it's available before they confirm
        data: {
          full_name: form.fullName,
          student_id: form.studentId,
        },
      },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    // Insert profile row — safe to do even before email is confirmed
    const { error: insertError } = await supabase.from("users").insert({
      id: data.user.id,
      full_name: form.fullName,
      student_id: form.studentId,
      age: parseInt(form.age),
      date_of_birth: form.dob,
      phone_number: form.phone,
      anonymous_mode: false,
    });

    setLoading(false);
    if (insertError) { setError(insertError.message); return; }

    // ✅ Show "check your email" screen — do NOT call onRegister() or navigate into the app.
    // The user must confirm their email first. App.jsx will handle letting them in
    // automatically when they click the confirmation link.
    setConfirmSent(true);
  };

  // ── Email confirmation screen ───────────────────────────────────────────────
  if (confirmSent) {
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
          <div className="auth-form-box" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📧</div>
            <h2>Check your email!</h2>
            <p style={{ color: "var(--text-muted, #888)", marginBottom: "8px" }}>
              We sent a confirmation link to:
            </p>
            <p style={{ fontWeight: "600", marginBottom: "24px" }}>{form.email}</p>
            <p style={{ color: "var(--text-muted, #888)", fontSize: "14px", marginBottom: "24px" }}>
              Click the link in the email to activate your account, then come back here to log in.
            </p>
            <button className="btn btn-primary" onClick={onGoLogin}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────
  return (
    <div className="auth-layout">
      {showTerms && (
        <TermsModal
          onClose={() => setShowTerms(false)}
          onAgree={() => { setAgreedToTerms(true); setShowTerms(false); }}
        />
      )}

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
          <h2>Create an account</h2>
          <p className="subtitle">Get started with Reflectly</p>

          {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

          <div className="field">
            <label>Full Name</label>
            <input type="text" placeholder="Juan Dela Cruz"
              value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} />
          </div>

          <div className="field">
            <label>Student ID</label>
            <input type="text" placeholder="e.g. 202515225"
              value={form.studentId} onChange={(e) => handleChange("studentId", e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Age</label>
              <input type="number" placeholder="20"
                value={form.age} onChange={(e) => handleChange("age", e.target.value)} />
            </div>
            <div className="field" style={{ flex: 2 }}>
              <label>Date of Birth</label>
              <input type="date"
                value={form.dob} onChange={(e) => handleChange("dob", e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Phone Number</label>
            <input type="tel" placeholder="09XXXXXXXXX"
              value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
          </div>

          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@gordoncollege.edu.ph"
              value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
          </div>

          <div className="field">
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                style={{ width: "100%", paddingRight: "40px", boxSizing: "border-box" }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: passwordErrors.length > 0 ? "22px" : "50%",
                  transform: passwordErrors.length > 0 ? "none" : "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "16px", color: "#888", padding: 0, lineHeight: 1
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {form.password.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { label: "8+ chars",   test: form.password.length >= 8 },
                    { label: "Uppercase",  test: /[A-Z]/.test(form.password) },
                    { label: "Lowercase",  test: /[a-z]/.test(form.password) },
                    { label: "Number",     test: /[0-9]/.test(form.password) },
                    { label: "Special",    test: /[^A-Za-z0-9]/.test(form.password) },
                  ].map(({ label, test }) => (
                    <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <div style={{
                        width: "100%", height: 4, borderRadius: 99,
                        background: test ? "#3dba7e" : "var(--border, #e0e0e0)",
                        transition: "background 0.25s ease",
                      }} />
                      <span style={{
                        fontSize: "9px", textAlign: "center", lineHeight: 1.2,
                        color: test ? "#3dba7e" : "var(--text-muted, #aaa)",
                        fontWeight: test ? 600 : 400,
                        transition: "color 0.25s ease",
                      }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={() => {
                if (!agreedToTerms) {
                  setShowTerms(true);
                } else {
                  setAgreedToTerms(false);
                }
              }}
              style={{ cursor: "pointer" }}
            />
            <span>
              I agree to the{" "}
              <button className="link-btn" onClick={() => setShowTerms(true)}>
                Terms and Conditions
              </button>
            </span>
          </div>

          <button className="btn btn-primary" onClick={handleRegister} disabled={loading}>
            {loading ? "Creating account..." : "Create an Account"}
          </button>

          <p className="divider-text">
            Already have an account?{" "}
            <button className="link-btn" onClick={onGoLogin}>Log in</button>
          </p>
        </div>
      </div>
    </div>
  );
}