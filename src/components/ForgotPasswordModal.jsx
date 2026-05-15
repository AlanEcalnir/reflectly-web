import { useState } from "react";
import { supabase } from "../supabase";

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setError("");
    if (!email) { setError("Please enter your email."); return; }

    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      // After the user clicks the link in the email, Supabase will redirect here.
      // This must match your Site URL in Supabase Dashboard → Auth → URL Configuration.
      redirectTo: window.location.origin,
    });

    setLoading(false);

    if (resetError) { setError(resetError.message); return; }

    setSent(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "white", borderRadius: "12px", width: "90%", maxWidth: "420px",
        padding: "28px", display: "flex", flexDirection: "column", gap: "16px"
      }}>

        {/* ── Sent confirmation ── */}
        {sent ? (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📬</div>
              <h3 style={{ margin: "0 0 8px" }}>Check your email</h3>
              <p style={{ color: "#888", fontSize: "14px", margin: "0 0 8px" }}>
                We sent a password reset link to:
              </p>
              <p style={{ fontWeight: "600", margin: "0 0 16px" }}>{email}</p>
              <p style={{ color: "#888", fontSize: "13px", margin: "0 0 20px" }}>
                Click the link in the email to reset your password. The link expires in 1 hour.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: "10px", borderRadius: "8px", border: "none",
                background: "#1e2a3a", color: "white", cursor: "pointer", fontWeight: "600"
              }}
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            {/* ── Email entry form ── */}
            <div>
              <h3 style={{ margin: "0 0 6px" }}>Forgot password?</h3>
              <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {error && (
              <p style={{ color: "red", fontSize: "13px", margin: 0 }}>{error}</p>
            )}

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@gordoncollege.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px",
                  border: "1px solid #ccc", background: "white", color: "#333", cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={loading}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px", border: "none",
                  background: loading ? "#ccc" : "#1e2a3a",
                  color: "white", cursor: loading ? "not-allowed" : "pointer", fontWeight: "600"
                }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}