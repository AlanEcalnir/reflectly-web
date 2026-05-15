import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function Home({ user, navigate }) {
  const [teams, setTeams]               = useState([]);
  const [activeTeam, setActiveTeam]     = useState(null);
  const [feedback, setFeedback]         = useState([]);
  const [bars, setBars]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [feedLoading, setFeedLoading]   = useState(false);
  const [showPanel, setShowPanel]       = useState(false);
  const [members, setMembers]           = useState([]);
  const [creator, setCreator]           = useState(null);
  const [copied, setCopied]             = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo]     = useState("");
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberProfile, setMemberProfile]   = useState(null);
  const [memberStats, setMemberStats]       = useState(null);

  useEffect(() => { fetchTeams(); }, []);
  useEffect(() => { if (activeTeam) fetchTeamData(activeTeam.id); }, [activeTeam]);

  const fetchTeams = async () => {
    setLoading(true);
    const { data: memberRows } = await supabase
      .from("team_members")
      .select("team_id, teams(id, name, color, description, code, created_by, created_at)")
      .eq("user_id", user.id);

    const myTeams = memberRows?.map((r) => r.teams).filter(Boolean) || [];
    setTeams(myTeams);
    if (myTeams.length > 0) setActiveTeam(myTeams[0]);
    else setLoading(false);
  };

  const fetchTeamDetails = async (team) => {
    const { data: memberRows } = await supabase
      .from("team_members")
      .select("user_id, joined_at")
      .eq("team_id", team.id);

    if (!memberRows || memberRows.length === 0) {
      setMembers([]);
      setCreator(null);
      return;
    }

    const userIds = memberRows.map((m) => m.user_id);
    const { data: userRows } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", userIds);

    const merged = memberRows.map((m) => ({
      ...m,
      users: userRows?.find((u) => u.id === m.user_id) || null
    }));

    setMembers(merged);

    if (team?.created_by) {
      const { data: creatorData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", team.created_by)
        .single();
      setCreator(creatorData);
    }
  };

  const fetchMemberProfile = async (member) => {
    setSelectedMember(member);

    const { data: profile } = await supabase
      .from("users")
      .select("full_name, student_id, age, date_of_birth, phone_number, anonymous_mode")
      .eq("id", member.user_id)
      .single();

    setMemberProfile(profile);

    const { data: feedbackData } = await supabase
      .from("feedback")
      .select("mood, sentiment, sentiment_score")
      .eq("user_id", member.user_id)
      .eq("team_id", activeTeam.id);

    if (feedbackData && feedbackData.length > 0) {
      const topMood = Object.entries(
        feedbackData.reduce((acc, f) => { acc[f.mood] = (acc[f.mood] || 0) + 1; return acc; }, {})
      ).sort((a, b) => b[1] - a[1])[0][0];

      const avgScore = feedbackData
        .filter(f => f.sentiment_score !== null)
        .reduce((sum, f) => sum + f.sentiment_score, 0) / feedbackData.length;

      setMemberStats({
        total: feedbackData.length,
        topMood,
        avgScore: avgScore.toFixed(2)
      });
    } else {
      setMemberStats({ total: 0, topMood: null, avgScore: "0.00" });
    }
  };

  const fetchTeamData = async (teamId) => {
    setFeedLoading(true);
    const { data: feedbackRows } = await supabase
      .from("feedback")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(30);

    setFeedback(feedbackRows || []);

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const weekBars = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day, i) => {
      const date = new Date(todayLocal);
      date.setDate(todayLocal.getDate() + (i - todayLocal.getDay()));

      const dayFeedback = (feedbackRows || []).filter((f) => {
        const d = new Date(f.created_at);
        const dLocal = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return dLocal.getTime() === date.getTime();
      });

      const positive = dayFeedback.filter((f) => f.sentiment === "positive").length;
      const negative = dayFeedback.filter((f) => f.sentiment === "negative").length;
      const color = positive > negative ? "#3dba7e"
                  : negative > positive ? "#e8692a"
                  : dayFeedback.length > 0 ? "#7a7f9a" : "#e8e8f0";

      const scores = dayFeedback
        .map((f) => f.sentiment_score)
        .filter((s) => s !== null && s !== undefined);
      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;

      const h = dayFeedback.length > 0 ? Math.min(dayFeedback.length * 10, 80) : 0;

      return { day, h, color, avgScore };
    });

    setBars(weekBars);
    setFeedLoading(false);
    setLoading(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeTeam?.code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveTeam = async () => {
    if (!activeTeam) return;
    const isCreator = activeTeam.created_by === user.id;

    if (isCreator) {
      // Always fetch fresh member list before deciding
      setLeaveLoading(true);
      const { data: freshMembers } = await supabase
        .from("team_members")
        .select("user_id, joined_at")
        .eq("team_id", activeTeam.id);
      setLeaveLoading(false);

      const freshOthers = (freshMembers || []).filter((m) => m.user_id !== user.id);

      if (freshOthers.length > 0) {
        // Re-fetch full details so the dropdown is populated
        await fetchTeamDetails(activeTeam);
        setShowTransfer(true);
        return;
      }

      // Only member — confirm disband
      if (!window.confirm("You are the only member. Leaving will disband this team. Are you sure?")) return;
      setLeaveLoading(true);
      await supabase.from("feedback").delete().eq("team_id", activeTeam.id);
      await supabase.from("team_members").delete().eq("team_id", activeTeam.id);
      await supabase.from("teams").delete().eq("id", activeTeam.id);
      setLeaveLoading(false);
      setShowPanel(false);
      setShowTransfer(false);
      await fetchTeams();
      return;
    }

    if (!window.confirm("Are you sure you want to leave this team?")) return;
    setLeaveLoading(true);
    await supabase.from("team_members").delete()
      .eq("team_id", activeTeam.id).eq("user_id", user.id);
    setLeaveLoading(false);
    setShowPanel(false);
    setShowTransfer(false);
    await fetchTeams();
  };

  const handleTransferAndLeave = async () => {
    if (!transferTo) { alert("Please select a member to transfer leadership to."); return; }
    setLeaveLoading(true);

    // Transfer ownership
    const { data: transferData, error: transferError } = await supabase
      .from("teams")
      .update({ created_by: transferTo })
      .eq("id", activeTeam.id)
      .select();

    console.log("Transfer result:", transferData, transferError);

    if (transferError) {
      alert(`Failed to transfer leadership.\n\nError: ${transferError.message}\nCode: ${transferError.code}\n\nCheck Supabase RLS policies on the 'teams' table.`);
      setLeaveLoading(false);
      return;
    }

    // Verify the transfer actually happened
    const { data: updatedTeam } = await supabase
      .from("teams")
      .select("created_by")
      .eq("id", activeTeam.id)
      .single();

    if (!updatedTeam || updatedTeam.created_by !== transferTo) {
      alert("Transfer could not be verified. Please try again.");
      setLeaveLoading(false);
      return;
    }

    // Now safe to leave
    await supabase.from("team_members").delete()
      .eq("team_id", activeTeam.id).eq("user_id", user.id);

    setLeaveLoading(false);
    setShowTransfer(false);
    setShowPanel(false);
    await fetchTeams();
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  };

  const getMoodEmoji = (mood) => {
    const map = { happy: "😊", excited: "🤩", stressed: "😓", tired: "😴", neutral: "😐", anxious: "😰", angry: "😠" };
    return map[mood] || "💬";
  };

  const getMoodColor = (mood) => {
    if (["happy","excited"].includes(mood)) return "#3dba7e";
    if (["stressed","anxious","angry","tired"].includes(mood)) return "#e8692a";
    return "#7a7f9a";
  };

  const getMoodBg = (mood) => {
    if (["happy","excited"].includes(mood)) return "#f0fdf7";
    if (["stressed","anxious","angry","tired"].includes(mood)) return "#fff5f0";
    return "#f5f5f8";
  };

  const timeAgo = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const groupedFeedback = feedback.reduce((acc, f) => {
    const dateKey = formatDate(f.created_at);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(f);
    return acc;
  }, {});

  const getTopMood = () => {
    if (feedback.length === 0) return "—";
    const top = Object.entries(
      feedback.reduce((acc, f) => { acc[f.mood] = (acc[f.mood] || 0) + 1; return acc; }, {})
    ).sort((a, b) => b[1] - a[1])[0][0];
    const emojiMap = { happy: "😊", excited: "🤩", stressed: "😓", tired: "😴", neutral: "😐", anxious: "😰", angry: "😠" };
    return `${emojiMap[top] || "💬"} ${top}`;
  };

  const isCreator = activeTeam?.created_by === user.id;
  const otherMembers = members.filter((m) => m.user_id !== user.id);

  if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;

  return (
    <>
      {/* TEAM INFO PANEL */}
      {showPanel && activeTeam && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "var(--surface)", borderRadius: 16, width: "90%", maxWidth: 1000,
            padding: 28, display: "flex", flexDirection: "column", gap: 20,
            maxHeight: "85vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: activeTeam.color || "#7a7f9a" }} />
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{activeTeam.name}</h3>
              </div>
              <button onClick={() => { setShowPanel(false); setShowTransfer(false); }}
                style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
            </div>

            <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🔑 Invite Code
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "monospace", fontSize: "1.4rem", fontWeight: 700, letterSpacing: 4, color: "var(--text-main)" }}>
                  {activeTeam.code}
                </span>
                <button onClick={handleCopyCode} style={{
                  fontSize: "12px", padding: "6px 12px", borderRadius: 6,
                  border: "1px solid #6c5ce7", background: copied ? "#6c5ce7" : "#6c5ce711",
                  color: copied ? "white" : "#6c5ce7", cursor: "pointer", fontWeight: 600
                }}>
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>

            <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                👑 Creator
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)" }}>
                {creator?.full_name || "—"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>📅 Created</div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{formatDateShort(activeTeam.created_at)}</div>
              </div>
              <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>👥 Members</div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{members.length}</div>
              </div>
              <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>💬 Feedback</div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{feedback.length} total</div>
              </div>
              <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}>😊 Top Mood</div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{getTopMood()}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                👥 Team Members <span style={{ color: "var(--text-muted)" }}>(click to view profile)</span>
              </div>
              {members.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No members found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {members.map((m) => {
                    const isOwner = activeTeam.created_by === m.user_id;
                    const isYou = m.user_id === user.id;
                    return (
                      <div key={m.user_id}
                        onClick={() => fetchMemberProfile(m)}
                        onMouseEnter={e => e.currentTarget.style.background = "#efefff"}
                        onMouseLeave={e => e.currentTarget.style.background = isYou ? "#6c5ce711" : "var(--input-bg)"}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 12px", borderRadius: 8,
                          background: isYou ? "#6c5ce711" : "var(--input-bg)",
                          cursor: "pointer", transition: "background 0.15s ease"
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: isOwner ? "#f39c12" : "#6c5ce7",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", fontSize: "13px", fontWeight: 700
                          }}>
                            {m.users?.full_name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 600 }}>
                              {m.users?.full_name || "Unknown"}
                              {isYou && <span style={{ fontSize: "11px", color: "#6c5ce7", marginLeft: 6 }}>(You)</span>}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              Joined {formatDateShort(m.joined_at)}
                            </div>
                          </div>
                        </div>
                        {isOwner && (
                          <span style={{
                            fontSize: "11px", padding: "2px 8px", borderRadius: 999,
                            background: "#f39c1222", color: "#f39c12", fontWeight: 600
                          }}>👑 Leader</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {showTransfer && (
              <div style={{ background: "var(--input-bg)", border: "1px solid #f39c1244", borderRadius: 10, padding: 16 }}>
                <p style={{ fontSize: "13px", color: "#856404", marginBottom: 12 }}>
                  ⚠️ You are the team leader. Please transfer leadership before leaving.
                </p>
                <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "13px", marginBottom: 10 }}>
                  <option value="">Select new leader...</option>
                  {otherMembers.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.users?.full_name || "Unknown"}</option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowTransfer(false)} style={{
                    flex: 1, padding: "8px", borderRadius: 8,
                    border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: "13px"
                  }}>Cancel</button>
                  <button onClick={handleTransferAndLeave} disabled={leaveLoading} style={{
                    flex: 1, padding: "8px", borderRadius: 8, border: "none",
                    background: "#e8692a", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600
                  }}>
                    {leaveLoading ? "Leaving..." : "Transfer & Leave"}
                  </button>
                </div>
              </div>
            )}

            {!showTransfer && (
              <button onClick={handleLeaveTeam} disabled={leaveLoading} style={{
                padding: "10px", borderRadius: 8, border: "1px solid #ffcccc",
                background: "var(--input-bg)", color: "#e55", cursor: "pointer",
                fontSize: "13px", fontWeight: 600, width: "100%"
              }}>
                {leaveLoading ? "Leaving..." : isCreator ? "👑 Leave & Transfer Leadership" : "Leave Team"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* MEMBER PROFILE MODAL */}
{selectedMember && (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
  }}>
    <div style={{
      background: "var(--surface)", borderRadius: 16, width: "90%", maxWidth: 1000,
      padding: 28, display: "flex", flexDirection: "column", gap: 16,
      maxHeight: "85vh", overflowY: "auto"
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Member Profile</h3>
        <button onClick={() => { setSelectedMember(null); setMemberProfile(null); setMemberStats(null); }}
          style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
      </div>

      {/* Avatar + Name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px 0" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: activeTeam.created_by === selectedMember.user_id ? "#f39c12" : "#6c5ce7",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: "1.6rem", fontWeight: 700
        }}>
          {memberProfile?.full_name?.[0]?.toUpperCase() || "?"}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)" }}>
            {memberProfile?.full_name || "Unknown"}
          </div>
          {activeTeam.created_by === selectedMember.user_id && (
            <span style={{
              fontSize: "11px", padding: "2px 10px", borderRadius: 999,
              background: "#f39c1222", color: "#f39c12", fontWeight: 600
            }}>👑 Team Leader</span>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}> Student ID</div>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>{memberProfile?.student_id || "—"}</div>
        </div>
        <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}> Age</div>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>{memberProfile?.age || "—"}</div>
        </div>
        <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}> Date of Birth</div>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>{memberProfile?.date_of_birth ? formatDateShort(memberProfile.date_of_birth) : "—"}</div>
        </div>
        <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}> Phone Number</div>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>{memberProfile?.phone_number || "—"}</div>
        </div>
        <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "12px 14px", gridColumn: "span 2" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase" }}> Member Since</div>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>{formatDateShort(selectedMember.joined_at)}</div>
        </div>
      </div>
    </div>
  </div>
)}

      <div className="page-header">
        <h2>{activeTeam ? activeTeam.name : "No Team Yet"}</h2>
        <p>{activeTeam?.description || "Weekly overview and team feedback"}</p>
      </div>

      <div className="home-grid">
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", marginBottom: 12 }}>
              Weekly Sentiment
            </h3>
            {feedLoading ? <p style={{ color: "#999", fontSize: "14px" }}>Loading...</p> : (
              <>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 200, marginTop: 16 }}>
                  {bars.map((b) => (
                    <div key={b.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                      <div style={{
                        height: b.h === 0 ? 8 : Math.min((b.h / 100) * 160, 160),
                        background: b.color, width: "100%", borderRadius: 6, minHeight: 8,
                        transition: "height 0.3s ease"
                      }} />
                      <span style={{ fontSize: "11px", color: "#999" }}>{b.day}</span>
                      <span style={{
                        fontSize: "10px", fontWeight: 600,
                        color: b.avgScore === null ? "#ccc"
                             : b.avgScore > 0 ? "#3dba7e"
                             : b.avgScore < 0 ? "#e8692a"
                             : "#7a7f9a",
                      }}>
                        {b.avgScore === null ? "—" : (b.avgScore > 0 ? "+" : "") + b.avgScore.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: "12px", color: "#888" }}>
                  <span><span style={{ color: "#3dba7e" }}>●</span> Positive</span>
                  <span><span style={{ color: "#e8692a" }}>●</span> Negative</span>
                  <span><span style={{ color: "#7a7f9a" }}>●</span> Neutral</span>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", marginBottom: 16 }}>
              Team Feedback Feed
            </h3>
            {feedLoading ? <p style={{ color: "#999", fontSize: "14px" }}>Loading...</p>
            : feedback.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: "#aaa" }}>
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>💬</div>
                <p style={{ fontSize: "14px" }}>No feedback yet for this team.</p>
                <button className="btn btn-primary"
                  style={{ marginTop: 12, fontSize: "13px", padding: "8px 16px" }}
                  onClick={() => navigate("submit")}>
                  Submit First Feedback
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 24, maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
                {Object.entries(groupedFeedback).map(([date, items]) => (
                  <div key={date}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 1, background: "#eee" }} />
                      <span style={{ fontSize: "11px", color: "#aaa", whiteSpace: "nowrap" }}>{date}</span>
                      <div style={{ flex: 1, height: 1, background: "#eee" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {items.map((f) => (
                        <div key={f.id} style={{
                          display: "flex", gap: 10, alignItems: "flex-start",
                          background: getMoodBg(f.mood), borderRadius: 12, padding: "10px 14px",
                          borderLeft: `3px solid ${getMoodColor(f.mood)}`
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: getMoodColor(f.mood) + "22",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "18px", flexShrink: 0
                          }}>
                            {getMoodEmoji(f.mood)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "#555" }}>
                                {f.anonymous || !f.display_name ? "Anonymous" : f.display_name}
                              </span>
                              <span style={{ fontSize: "11px", color: "#bbb" }}>{timeAgo(f.created_at)}</span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#333", margin: 0, lineHeight: 1.5 }}>
                              {f.message || <em style={{ color: "#aaa" }}>No message</em>}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                              <span style={{
                                display: "inline-block", fontSize: "11px",
                                padding: "2px 8px", borderRadius: 999,
                                background: getMoodColor(f.mood) + "22",
                                color: getMoodColor(f.mood), fontWeight: 600
                              }}>
                                {f.mood}
                              </span>
                              {f.sentiment && (
                                <span style={{
                                  display: "inline-block", fontSize: "11px",
                                  padding: "2px 8px", borderRadius: 999,
                                  background: f.sentiment === "positive" ? "#3dba7e22"
                                            : f.sentiment === "negative" ? "#e8692a22"
                                            : "#7a7f9a22",
                                  color: f.sentiment === "positive" ? "#3dba7e"
                                       : f.sentiment === "negative" ? "#e8692a"
                                       : "#7a7f9a",
                                  fontWeight: 600
                                }}>
                                  {f.sentiment} {f.sentiment_score !== null && f.sentiment_score !== undefined
                                    ? `(${f.sentiment_score > 0 ? "+" : ""}${Number(f.sentiment_score).toFixed(2)})`
                                    : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", marginBottom: 16 }}>
              My Teams
            </h3>
            {teams.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {teams.map((t) => (
                  <div key={t.id} onClick={() => setActiveTeam(t)} style={{
                    display: "flex", flexDirection: "column", gap: 2,
                    padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                    background: activeTeam?.id === t.id ? (t.color || "#7a7f9a") + "18" : "transparent",
                    border: `2px solid ${activeTeam?.id === t.id ? (t.color || "#7a7f9a") : "transparent"}`,
                    transition: "all 0.15s ease"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: t.color || "#7a7f9a", flexShrink: 0 }} />
                      <span style={{ fontSize: "14px", fontWeight: activeTeam?.id === t.id ? 600 : 400, flex: 1 }}>
                        {t.name}
                      </span>
                      {activeTeam?.id === t.id && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: "11px", color: t.color || "#7a7f9a", fontWeight: 600 }}>Viewing</span>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            fetchTeamDetails(t);
                            setShowPanel(true);
                          }} style={{
                            fontSize: "11px", padding: "2px 8px", borderRadius: 6,
                            border: "1px solid var(--border)", background: "var(--surface)",
                            cursor: "pointer", color: "var(--text-muted)"
                          }}>Info</button>
                        </div>
                      )}
                    </div>
                    {t.description && (
                      <span style={{ fontSize: "11px", color: "#999", paddingLeft: 18 }}>{t.description}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#999", fontSize: "14px" }}>You haven't joined any teams yet.</p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button className="choice-btn" onClick={() => navigate("create-team")} style={{ fontSize: "0.9rem", padding: "10px 14px" }}>
                <span>+ Create a Team</span><span className="arrow">›</span>
              </button>
              <button className="choice-btn" onClick={() => navigate("join-team")} style={{ fontSize: "0.9rem", padding: "10px 14px" }}>
                <span>+ Join a Team</span><span className="arrow">›</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}