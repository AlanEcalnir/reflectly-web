import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";

// ── Toggle Row ────────────────────────────────────────────────────────────────

const ToggleRow = ({ icon, label, desc, field, checked, saving, saved, onToggle }) => (
  <div style={{
    display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "14px 0",
    borderBottom: "1px solid var(--border)"
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: "#6c5ce711", display: "flex",
        alignItems: "center", justifyContent: "center"
      }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: 2, color: "var(--text)" }}>
          {label}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{desc}</div>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {saving === field && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Saving...</span>}
      {saved === field && <span style={{ fontSize: "11px", color: "#3dba7e" }}>Saved ✓</span>}
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={() => onToggle(field)} />
        <span className="toggle-slider" />
      </label>
    </div>
  </div>
);

// ── Delete Modal ──────────────────────────────────────────────────────────────

const DeleteModal = ({ onConfirm, onCancel, loading }) => {
  const [input, setInput] = useState("");
  const confirmed = input === "DELETE";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20
    }}>
      <div style={{
        background: "var(--card-bg)", borderRadius: 16, padding: "28px 28px 24px",
        maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        border: "1px solid var(--border)"
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <IconWarning />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: "16px", textAlign: "center", color: "#c0392b" }}>
          Delete Account
        </h3>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", margin: "0 0 20px", lineHeight: 1.6 }}>
          This will permanently delete your account and all associated data.{" "}
          <strong style={{ color: "var(--text)" }}>This cannot be undone.</strong>
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: 8 }}>
          Type <strong style={{ color: "var(--text)" }}>DELETE</strong> to confirm:
        </p>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type DELETE here"
          style={{
            width: "100%", padding: "9px 12px", borderRadius: 8,
            border: `1px solid ${confirmed ? "#e55" : "var(--border)"}`,
            fontSize: "13px", marginBottom: 16,
            boxSizing: "border-box", outline: "none",
            background: "var(--surface)", color: "var(--text)"
          }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={loading} style={{
            flex: 1, padding: "9px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--surface)",
            fontSize: "13px", cursor: "pointer", fontWeight: 600, color: "var(--text-muted)"
          }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!confirmed || loading}
            style={{
              flex: 1, padding: "9px", borderRadius: 8,
              border: "none", background: confirmed ? "#e55" : "#f0c0c0",
              fontSize: "13px", cursor: confirmed && !loading ? "pointer" : "default",
              fontWeight: 600, color: "#fff", transition: "background 0.2s"
            }}
          >
            {loading ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const IconMask = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconMoon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const IconMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconKey = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const IconLogOut = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconTrash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconWarning = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function Settings({ user, onLogout, darkMode, setDarkMode }) {
  const [anonymous, setAnonymous]             = useState(false);
  const [notifications, setNotifications]     = useState(true);
  const [settingsLoaded, setSettingsLoaded]   = useState(false);
  const [saving, setSaving]                   = useState("");
  const [saved, setSaved]                     = useState("");
  const [resetSent, setResetSent]             = useState(false);
  const [resetLoading, setResetLoading]       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [deleteError, setDeleteError]         = useState("");

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("users")
      .select("anonymous_mode")
      .eq("id", user.id)
      .single();
    if (data) setAnonymous(data.anonymous_mode);
    setSettingsLoaded(true);
  }, [user.id]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleToggle = async (field) => {
    if (field === "darkMode") {
      const newValue = !darkMode;
      setDarkMode(newValue);
      setSaving("darkMode");
      setSaved("");
      setTimeout(() => { setSaving(""); setSaved("darkMode"); }, 300);
      setTimeout(() => setSaved(""), 2500);
    } else if (field === "anonymous") {
      const newValue = !anonymous;
      setAnonymous(newValue);
      setSaving("anonymous");
      setSaved("");
      await supabase.from("users").update({ anonymous_mode: newValue }).eq("id", user.id);
      setSaving("");
      setSaved("anonymous");
      setTimeout(() => setSaved(""), 2000);
    } else if (field === "notifications") {
      setNotifications(!notifications);
      setSaving("notifications");
      setSaved("");
      setTimeout(() => { setSaving(""); setSaved("notifications"); }, 500);
      setTimeout(() => setSaved(""), 2500);
    }
  };

  const handleResetPassword = async () => {
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin,
    });
    setResetLoading(false);
    setResetSent(true);
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const { error } = await supabase.rpc("delete_user_account");
      if (error) throw error;
      await supabase.auth.signOut();
      onLogout();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete account. Please try again.");
      setDeleteLoading(false);
    }
  };

  const rowStyle = {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "14px 0",
    borderBottom: "1px solid var(--border)"
  };

  const iconBoxStyle = (bg = "#6c5ce711") => ({
    width: 40, height: 40, borderRadius: 10,
    background: bg, display: "flex",
    alignItems: "center", justifyContent: "center"
  });

  return (
    <>
      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDeleteAccount}
          onCancel={() => { setShowDeleteModal(false); setDeleteError(""); }}
          loading={deleteLoading}
        />
      )}

      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your preferences</p>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── PREFERENCES ── */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, color: "var(--text-muted)",
            letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8
          }}>
            Preferences
          </div>

          {settingsLoaded ? (
            <>
              <ToggleRow
                icon={<IconMask />} field="anonymous" checked={anonymous}
                label="Anonymous mode"
                desc="Hide your name from all feedback"
                saving={saving} saved={saved} onToggle={handleToggle}
              />
              <ToggleRow
                icon={<IconBell />} field="notifications" checked={notifications}
                label="Notifications"
                desc="Receive updates about your team activity"
                saving={saving} saved={saved} onToggle={handleToggle}
              />
              <ToggleRow
                icon={<IconMoon />} field="darkMode" checked={darkMode}
                label="Dark Mode"
                desc="Switch to a darker color scheme"
                saving={saving} saved={saved} onToggle={handleToggle}
              />
            </>
          ) : (
            <div style={{ padding: "14px 0", color: "var(--text-muted)", fontSize: "13px" }}>
              Loading preferences...
            </div>
          )}
        </div>

        {/* ── ACCOUNT ── */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{
            fontSize: "11px", fontWeight: 700, color: "var(--text-muted)",
            letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 16
          }}>
            Account
          </div>

          {/* Email */}
          <div style={rowStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={iconBoxStyle()}><IconMail /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: 2, color: "var(--text)" }}>
                  Email
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{user.email}</div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div style={rowStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={iconBoxStyle()}><IconKey /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: 2, color: "var(--text)" }}>
                  Change Password
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {resetSent ? "✅ Reset link sent to your email!" : "Send a password reset link to your email"}
                </div>
              </div>
            </div>
            <button onClick={handleResetPassword} disabled={resetLoading || resetSent} style={{
              fontSize: "12px", padding: "6px 14px", borderRadius: 6,
              border: "1px solid #6c5ce7", background: resetSent ? "var(--surface)" : "#6c5ce711",
              color: resetSent ? "var(--text-muted)" : "#6c5ce7",
              cursor: resetSent ? "default" : "pointer",
              fontWeight: 600, whiteSpace: "nowrap"
            }}>
              {resetLoading ? "Sending..." : resetSent ? "Sent ✓" : "Send Link"}
            </button>
          </div>

          {/* Sign Out */}
          <div style={rowStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={iconBoxStyle("#ff000011")}><IconLogOut /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: 2, color: "var(--text)" }}>
                  Sign Out
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Log out of your account</div>
              </div>
            </div>
            <button onClick={onLogout} style={{
              fontSize: "12px", padding: "6px 14px", borderRadius: 6,
              border: "1px solid #ffcccc", background: "#fff5f5",
              color: "#e55", cursor: "pointer", fontWeight: 600
            }}>
              Sign Out
            </button>
          </div>

          {/* Delete Account */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={iconBoxStyle("#ff000018")}><IconTrash /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: 2, color: "#c0392b" }}>
                  Delete Account
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Permanently remove your account and all data
                </div>
                {deleteError && (
                  <div style={{ fontSize: "11px", color: "#e55", marginTop: 4 }}>{deleteError}</div>
                )}
              </div>
            </div>
            <button onClick={() => setShowDeleteModal(true)} style={{
              fontSize: "12px", padding: "6px 14px", borderRadius: 6,
              border: "1px solid #e55", background: "#fff5f5",
              color: "#c0392b", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap"
            }}>
              Delete
            </button>
          </div>
        </div>

        {/* ── APP INFO ── */}
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <IconInfo />
            <div style={{
              fontSize: "11px", fontWeight: 700, color: "var(--text-muted)",
              letterSpacing: "0.8px", textTransform: "uppercase"
            }}>
              About
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["App", "Reflectly"],
              ["Version", "1.0.0"],
              ["Target Users", "GC CCS Students"],
              ["Purpose", "Team Sentiment Tracking"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "var(--text-muted)" }}>{label}</span>
                <span style={{ fontWeight: 600, color: "var(--text)" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}