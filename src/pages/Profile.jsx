import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";

const MOOD_EMOJI = {
  excited: "🤩", happy: "😊", neutral: "😐",
  tired: "😴", anxious: "😰", stressed: "😓", angry: "😠"
};

const SENTIMENT_COLOR = {
  positive: "#3dba7e", negative: "#e8692a", neutral: "#7a7f9a"
};

export default function Profile({ user }) {
  const [profile, setProfile]       = useState(null);
  const [feedback, setFeedback]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [avatarUrl, setAvatarUrl]   = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    fetchFeedback();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(data);
    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
  };

  const fetchFeedback = async () => {
    const { data } = await supabase
      .from("feedback")
      .select("*, teams(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setFeedback(data || []);
    setLoading(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Image must be smaller than 2MB.");
      return;
    }

    setUploadError("");
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`; // bust cache

      // Save URL to users table
      const { error: updateErr } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateErr) throw updateErr;

      setAvatarUrl(publicUrl);
    } catch (err) {
      setUploadError("Upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-PH", {
      month: "long", day: "numeric", year: "numeric"
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const totalSubmissions = feedback.length;
  const avgScore = feedback.filter(f => f.sentiment_score != null).length > 0
    ? (feedback.reduce((sum, f) => sum + (f.sentiment_score || 0), 0) / feedback.length).toFixed(2)
    : "N/A";
  const mostCommonMood = feedback.length > 0
    ? Object.entries(feedback.reduce((acc, f) => {
        acc[f.mood] = (acc[f.mood] || 0) + 1; return acc;
      }, {})).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  return (
    <>
      <div className="page-header">
        <h2>My Profile</h2>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* USER INFO CARD */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>

            {/* AVATAR — clickable to upload */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                onClick={handleAvatarClick}
                title="Click to change profile picture"
                style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: avatarUrl
                    ? "transparent"
                    : "linear-gradient(135deg, #6c5ce7, #a29bfe)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.6rem", color: "white", fontWeight: 700,
                  cursor: "pointer", overflow: "hidden",
                  border: "3px solid transparent",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#6c5ce7"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (profile?.full_name || user.email)?.[0]?.toUpperCase()
                )}
              </div>

              {/* Camera icon overlay */}
              <div
                onClick={handleAvatarClick}
                title="Click to change profile picture"
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 24, height: 24, borderRadius: "50%",
                  background: "#6c5ce7", border: "2px solid var(--bg-card, #1e1e2e)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: "12px",
                }}
              >
                📷
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: 2 }}>
                {profile?.full_name || "—"}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                {user.email}
              </div>
              {uploading && (
                <div style={{ fontSize: "12px", color: "#6c5ce7", marginTop: 4 }}>
                  Uploading...
                </div>
              )}
              {uploadError && (
                <div style={{ fontSize: "12px", color: "#e8692a", marginTop: 4 }}>
                  {uploadError}
                </div>
              )}
              {!uploading && !uploadError && (
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 4 }}>
                  Click photo to change
                </div>
              )}
            </div>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 16, borderTop: "1px solid #eee", paddingTop: 20
          }}>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Student ID</div>
              <div style={{ fontSize: "14px", fontWeight: 500 }}>{profile?.student_id || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Age</div>
              <div style={{ fontSize: "14px", fontWeight: 500 }}>{profile?.age || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Date of Birth</div>
              <div style={{ fontSize: "14px", fontWeight: 500 }}>{formatDate(profile?.date_of_birth)}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone Number</div>
              <div style={{ fontSize: "14px", fontWeight: 500 }}>{profile?.phone_number || "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Member Since</div>
              <div style={{ fontSize: "14px", fontWeight: 500 }}>{formatDate(user.created_at)}</div>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Anonymous Mode</div>
              <div style={{ fontSize: "14px", fontWeight: 500 }}>
                {profile?.anonymous_mode ? "✅ On" : "❌ Off"}
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div className="card" style={{ flex: 1, textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#6c5ce7" }}>
              {totalSubmissions}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total Submissions</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#3dba7e" }}>
              {avgScore}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Avg Sentiment</div>
          </div>
          <div className="card" style={{ flex: 1, textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "1.8rem" }}>
              {mostCommonMood ? MOOD_EMOJI[mostCommonMood] : "—"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Most Common Mood</div>
          </div>
        </div>

        {/* FEEDBACK HISTORY */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>My Feedback History</h3>

          {loading && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}

          {!loading && feedback.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              You haven't submitted any feedback yet.
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {feedback.map((f) => {
              const color = SENTIMENT_COLOR[f.sentiment] || "#7a7f9a";
              return (
                <div key={f.id} style={{
                  padding: "12px 16px", borderRadius: 10,
                  border: `1px solid ${color}33`,
                  background: color + "08"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "1.2rem" }}>{MOOD_EMOJI[f.mood] || "😐"}</span>
                      <span style={{
                        fontSize: "11px", padding: "2px 8px", borderRadius: 999,
                        background: color + "22", color: color, fontWeight: 600,
                        textTransform: "capitalize"
                      }}>
                        {f.mood}
                      </span>
                      {f.teams?.name && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          → {f.teams.name}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {formatDateTime(f.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "#444", margin: 0 }}>{f.message}</p>
                  {f.sentiment && (
                    <div style={{ marginTop: 6, fontSize: "11px", color: color, fontWeight: 600 }}>
                      {f.sentiment} sentiment
                      {f.sentiment_score != null && ` · score: ${f.sentiment_score.toFixed(2)}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}