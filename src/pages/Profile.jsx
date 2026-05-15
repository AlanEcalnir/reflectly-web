import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const MOOD_EMOJI = {
  excited: "🤩", happy: "😊", neutral: "😐",
  tired: "😴", anxious: "😰", stressed: "😓", angry: "😠"
};

const SENTIMENT_COLOR = {
  positive: "#3dba7e", negative: "#e8692a", neutral: "#7a7f9a"
};

export default function Profile({ user }) {
  const [profile, setProfile]   = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading]   = useState(true);

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

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PH", {
      month: "long", day: "numeric", year: "numeric"
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PH", {
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
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.6rem", color: "white", fontWeight: 700, flexShrink: 0
          }}>
            {(profile?.full_name || user.email)?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: 2 }}>
              {profile?.full_name || "—"}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
              {user.email}
            </div>
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