import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";

// ── Outside Home so React never remounts it on re-render (fixes flickering) ──
const TeamAvatar = ({ team, size = 44, fontSize = "16px" }) => {
  const hasPhoto = !!team?.photo_url;
  const photoSrc = hasPhoto ? team.photo_url.split("?")[0] : null;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: hasPhoto ? "transparent" : (team?.color || "#7a7f9a"),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize,
      overflow: "hidden",
    }}>
      {hasPhoto
        ? <img src={photoSrc} alt="Team" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : team?.name?.[0]?.toUpperCase()
      }
    </div>
  );
};

export default function Home({ user, navigate, navigateToSubmit }) {
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
  const [mobileView, setMobileView]     = useState("list");

  // ── Unread counts per team: { [teamId]: number } ──
  const [unreadCounts, setUnreadCounts] = useState({});

  // ── Team photo upload ─────────────────────────────────────────────
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError]         = useState("");
  const teamPhotoInputRef = useRef(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [screenH, setScreenH]   = useState(window.innerHeight);
  const [screenW, setScreenW]   = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 640);
      setScreenH(window.innerHeight);
      setScreenW(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    fetchTeams();

    const channel = supabase
      .channel("teams-updates")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "teams",
      }, (payload) => {
        setTeams((prev) =>
          prev.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t))
        );
        setActiveTeam((prev) =>
          prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev
        );
      })
      // ── Realtime: bump unread + re-sort when new feedback arrives ──
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "feedback",
      }, (payload) => {
        const incomingTeamId = payload.new.team_id;
        setActiveTeam((active) => {
          if (active?.id !== incomingTeamId) {
            setUnreadCounts((prev) => ({
              ...prev,
              [incomingTeamId]: (prev[incomingTeamId] || 0) + 1,
            }));
          }
          return active;
        });
        fetchTeams();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (activeTeam) {
      fetchTeamData(activeTeam.id);
      markTeamAsRead(activeTeam.id);
    }
  }, [activeTeam]);

  // ── Mark team as read: upsert last_read_at, clear local unread count ──
  const markTeamAsRead = async (teamId) => {
    setUnreadCounts((prev) => ({ ...prev, [teamId]: 0 }));
    await supabase.from("team_read_status").upsert(
      { user_id: user.id, team_id: teamId, last_read_at: new Date().toISOString() },
      { onConflict: "user_id,team_id" }
    );
  };

  // ── fetchTeams: sorted by most recent feedback + compute unread counts ──
  const fetchTeams = async () => {
    setLoading(true);

    const { data: memberRows } = await supabase
      .from("team_members")
      .select("team_id, teams(id, name, color, description, code, created_by, created_at, photo_url)")
      .eq("user_id", user.id);
    const myTeams = memberRows?.map((r) => r.teams).filter(Boolean) || [];
    const teamIds = myTeams.map((t) => t.id);

    const safeIds = teamIds.length > 0 ? teamIds : ["00000000-0000-0000-0000-000000000000"];

    // Fetch latest feedback per team (for sorting)
    const { data: latestFeedback } = await supabase
      .from("feedback")
      .select("team_id, created_at")
      .in("team_id", safeIds)
      .order("created_at", { ascending: false });

    // Fetch user's last_read_at per team
    const { data: readRows } = await supabase
      .from("team_read_status")
      .select("team_id, last_read_at")
      .eq("user_id", user.id)
      .in("team_id", safeIds);

    const lastReadByTeam = {};
    for (const r of readRows || []) {
      lastReadByTeam[r.team_id] = r.last_read_at;
    }

    // Compute unread counts per team
    const counts = {};
    for (const teamId of teamIds) {
      const lastRead = lastReadByTeam[teamId];
      const teamFeedback = (latestFeedback || []).filter((f) => f.team_id === teamId);
      if (!lastRead) {
        counts[teamId] = teamFeedback.length;
      } else {
        counts[teamId] = teamFeedback.filter(
          (f) => new Date(f.created_at) > new Date(lastRead)
        ).length;
      }
    }
    setUnreadCounts(counts);

    // Sort: most recent feedback first, fallback to team created_at
    const latestByTeam = {};
    for (const row of latestFeedback || []) {
      if (!latestByTeam[row.team_id]) latestByTeam[row.team_id] = row.created_at;
    }
    const sorted = [...myTeams].sort((a, b) => {
      const aTime = latestByTeam[a.id] || a.created_at;
      const bTime = latestByTeam[b.id] || b.created_at;
      return new Date(bTime) - new Date(aTime);
    });

    setTeams(sorted);
    if (sorted.length > 0) setActiveTeam((prev) => prev ?? sorted[0]);
    else setLoading(false);
  };

  const fetchTeamDetails = async (team) => {
    const { data: memberRows } = await supabase
      .from("team_members").select("user_id, joined_at").eq("team_id", team.id);
    if (!memberRows || memberRows.length === 0) { setMembers([]); setCreator(null); return; }
    const userIds = memberRows.map((m) => m.user_id);
    const { data: userRows } = await supabase
      .from("users").select("id, full_name, avatar_url").in("id", userIds);
    const merged = memberRows.map((m) => ({ ...m, users: userRows?.find((u) => u.id === m.user_id) || null }));
    setMembers(merged);
    if (team?.created_by) {
      const { data: creatorData } = await supabase.from("users").select("full_name").eq("id", team.created_by).single();
      setCreator(creatorData);
    }
  };

  const fetchMemberProfile = async (member) => {
    setSelectedMember(member);
    const { data: profile } = await supabase
      .from("users").select("full_name, student_id, age, date_of_birth, phone_number, anonymous_mode, avatar_url")
      .eq("id", member.user_id).single();
    setMemberProfile(profile);
    const { data: feedbackData } = await supabase
      .from("feedback").select("mood, sentiment, sentiment_score")
      .eq("user_id", member.user_id).eq("team_id", activeTeam.id);
    if (feedbackData && feedbackData.length > 0) {
      const topMood = Object.entries(feedbackData.reduce((acc, f) => { acc[f.mood] = (acc[f.mood] || 0) + 1; return acc; }, {}))
        .sort((a, b) => b[1] - a[1])[0][0];
      const avgScore = feedbackData.filter(f => f.sentiment_score !== null)
        .reduce((sum, f) => sum + f.sentiment_score, 0) / feedbackData.length;
      setMemberStats({ total: feedbackData.length, topMood, avgScore: avgScore.toFixed(2) });
    } else {
      setMemberStats({ total: 0, topMood: null, avgScore: "0.00" });
    }
  };

  const fetchTeamData = async (teamId) => {
    setFeedLoading(true);
    const { data: feedbackRows } = await supabase
      .from("feedback").select("*").eq("team_id", teamId)
      .order("created_at", { ascending: false }).limit(30);
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
      const color = positive > negative ? "#3dba7e" : negative > positive ? "#e8692a" : dayFeedback.length > 0 ? "#7a7f9a" : "var(--border)";
      const scores = dayFeedback.map((f) => f.sentiment_score).filter((s) => s !== null && s !== undefined);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      const h = dayFeedback.length > 0 ? Math.min(dayFeedback.length * 10, 80) : 0;
      return { day, h, color, avgScore };
    });
    setBars(weekBars);
    setFeedLoading(false);
    setLoading(false);
  };

  const handleTeamPhotoClick = () => {
    setPhotoError("");
    teamPhotoInputRef.current?.click();
  };

  const handleTeamPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setPhotoError("Image must be smaller than 2MB."); return; }
    setPhotoError("");
    setPhotoUploading(true);
    try {
      const filePath = `${activeTeam.id}/photo`;
      await supabase.storage.from("team-photos").remove([
        `${activeTeam.id}/photo`, `${activeTeam.id}/photo.jpg`, `${activeTeam.id}/photo.jpeg`,
        `${activeTeam.id}/photo.png`, `${activeTeam.id}/photo.gif`, `${activeTeam.id}/photo.webp`,
      ]);
      const { error: uploadErr } = await supabase.storage
        .from("team-photos").upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadErr) { setPhotoError(`Storage error: ${uploadErr.message}`); return; }
      const { data: urlData } = supabase.storage.from("team-photos").getPublicUrl(filePath);
      const cleanUrl = urlData.publicUrl.split("?")[0];
      const { error: updateErr } = await supabase.from("teams").update({ photo_url: cleanUrl }).eq("id", activeTeam.id);
      if (updateErr) { setPhotoError(`DB error: ${updateErr.message}`); return; }
      const updatedTeam = { ...activeTeam, photo_url: cleanUrl };
      setActiveTeam(updatedTeam);
      setTeams((prev) => prev.map((t) => t.id === activeTeam.id ? updatedTeam : t));
    } catch (err) {
      setPhotoError(`Error: ${err.message}`);
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveTeamPhoto = async () => {
    if (!activeTeam?.photo_url) return;
    if (!window.confirm("Remove the team photo?")) return;
    setPhotoUploading(true);
    setPhotoError("");
    try {
      const { error: updateErr } = await supabase.from("teams").update({ photo_url: null }).eq("id", activeTeam.id);
      if (updateErr) { setPhotoError(`DB error: ${updateErr.message}`); return; }
      const updatedTeam = { ...activeTeam, photo_url: null };
      setActiveTeam(updatedTeam);
      setTeams((prev) => prev.map((t) => t.id === activeTeam.id ? updatedTeam : t));
    } catch (err) {
      setPhotoError(`Error: ${err.message}`);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeTeam?.code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveTeam = async () => {
    if (!activeTeam) return;
    const isCreatorCheck = activeTeam.created_by === user.id;
    if (isCreatorCheck) {
      setLeaveLoading(true);
      const { data: freshMembers } = await supabase.from("team_members").select("user_id, joined_at").eq("team_id", activeTeam.id);
      setLeaveLoading(false);
      const freshOthers = (freshMembers || []).filter((m) => m.user_id !== user.id);
      if (freshOthers.length > 0) { await fetchTeamDetails(activeTeam); setShowTransfer(true); return; }
      if (!window.confirm("You are the only member. Leaving will disband this team. Are you sure?")) return;
      setLeaveLoading(true);
      await supabase.from("feedback").delete().eq("team_id", activeTeam.id);
      await supabase.from("team_members").delete().eq("team_id", activeTeam.id);
      await supabase.from("teams").delete().eq("id", activeTeam.id);
      setLeaveLoading(false); setShowPanel(false); setShowTransfer(false);
      await fetchTeams(); return;
    }
    if (!window.confirm("Are you sure you want to leave this team?")) return;
    setLeaveLoading(true);
    await supabase.from("team_members").delete().eq("team_id", activeTeam.id).eq("user_id", user.id);
    setLeaveLoading(false); setShowPanel(false); setShowTransfer(false);
    await fetchTeams();
  };

  const handleTransferAndLeave = async () => {
    if (!transferTo) { alert("Please select a member to transfer leadership to."); return; }
    setLeaveLoading(true);
    const { error: transferError } = await supabase.from("teams").update({ created_by: transferTo }).eq("id", activeTeam.id).select();
    if (transferError) { alert(`Failed to transfer leadership.\n\nError: ${transferError.message}`); setLeaveLoading(false); return; }
    const { data: updatedTeam } = await supabase.from("teams").select("created_by").eq("id", activeTeam.id).single();
    if (!updatedTeam || updatedTeam.created_by !== transferTo) { alert("Transfer could not be verified. Please try again."); setLeaveLoading(false); return; }
    await supabase.from("team_members").delete().eq("team_id", activeTeam.id).eq("user_id", user.id);
    setLeaveLoading(false); setShowTransfer(false); setShowPanel(false);
    await fetchTeams();
  };

  const handleSelectTeam = (team) => {
    setActiveTeam(team);
    setPhotoError("");
    markTeamAsRead(team.id);
    if (isMobile) setMobileView("detail");
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
    if (["happy","excited"].includes(mood)) return "rgba(61,186,126,0.18)";
    if (["stressed","anxious","angry","tired"].includes(mood)) return "rgba(232,105,42,0.18)";
    return "rgba(122,127,154,0.18)";
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
    const top = Object.entries(feedback.reduce((acc, f) => { acc[f.mood] = (acc[f.mood] || 0) + 1; return acc; }, {}))
      .sort((a, b) => b[1] - a[1])[0][0];
    const emojiMap = { happy: "😊", excited: "🤩", stressed: "😓", tired: "😴", neutral: "😐", anxious: "😰", angry: "😠" };
    return `${emojiMap[top] || "💬"} ${top}`;
  };

  const isCreator = activeTeam?.created_by === user.id;
  const otherMembers = members.filter((m) => m.user_id !== user.id);

  // ── Responsive sizing derived from real screen dimensions ──
  // Only applied on mobile; desktop layout is unchanged
  const maxBarHeight    = screenH * 0.09;           // ~60px on SE (667px), ~84px on Pro Max (932px)
  const chartContainerH = maxBarHeight + 44;         // bars + day label + score label + gaps
  const bodyPadding     = screenH < 700 ? 10 : 16;
  const cardGap         = screenH < 700 ? 8 : 12;
  // detailHeaderH: the team detail top bar (back btn + avatar + name + buttons + border)
  const detailHeaderH   = screenH < 700 ? 58 : 68;
  // sentimentCardH: card padding top+bottom + title row + marginTop + chartContainer
  const sentimentCardPad = screenH < 700 ? 10 : 12;
  const sentimentCardH  = sentimentCardPad * 2 + 28 + 14 + chartContainerH;
  // feedCardH: whatever is left after everything else
  const feedCardH       = screenH - 64 - detailHeaderH - bodyPadding * 2 - cardGap - sentimentCardH;
  const dayFontSize     = screenW < 390 ? "9px" : "10px";
  const scoreFontSize   = screenW < 390 ? "8px" : "9px";

  if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;

  // ─── UNREAD BADGE ────────────────────────────────────────────────
  const UnreadBadge = ({ count }) => {
    if (!count || count === 0) return null;
    return (
      <div style={{
        minWidth: 20, height: 20, borderRadius: 999,
        background: "#e8692a", color: "white",
        fontSize: "11px", fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 5px", flexShrink: 0,
        boxShadow: "0 1px 4px rgba(232,105,42,0.4)",
      }}>
        {count > 99 ? "99+" : count}
      </div>
    );
  };

  // ─── TEAM LIST ───────────────────────────────────────────────────
  const TeamList = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--cream)" }}>
      <style>{`
        @keyframes badgePop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .unread-badge { animation: badgePop 0.3s ease forwards; }
      `}</style>

      <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid rgba(122,127,154,0.15)", background: "var(--cream)" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-main)", marginBottom: 10 }}>My Teams</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="choice-btn" onClick={() => navigate("create-team")}
            style={{ flex: 1, fontSize: "13px", padding: "8px 8px", marginBottom: 0 }}>
            <span>+ Create</span>
          </button>
          <button className="choice-btn" onClick={() => navigate("join-team")}
            style={{ flex: 1, fontSize: "13px", padding: "8px 8px", marginBottom: 0 }}>
            <span>+ Join</span>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", background: "var(--cream)" }}>
        {teams.length === 0 ? (
          <p style={{ padding: 16, color: "var(--text-muted)", fontSize: "14px" }}>You haven't joined any teams yet.</p>
        ) : (
          teams.map((t) => {
            const isActive = activeTeam?.id === t.id;
            const unread = unreadCounts[t.id] || 0;
            return (
              <div key={t.id} onClick={() => handleSelectTeam(t)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", cursor: "pointer",
                  background: isActive && !isMobile ? "var(--input-bg)" : "transparent",
                  borderLeft: isActive && !isMobile ? `3px solid ${t.color || "#7a7f9a"}` : "3px solid transparent",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--input-bg)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Avatar with small dot indicator on mobile */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <TeamAvatar team={t} size={44} fontSize="16px" />
                  {unread > 0 && isMobile && (
                    <div style={{
                      position: "absolute", top: -2, right: -2,
                      width: 12, height: 12, borderRadius: "50%",
                      background: "#e8692a",
                      border: "2px solid var(--cream)",
                    }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: unread > 0 ? 700 : 600,
                    fontSize: "14px", marginBottom: 2,
                    color: "var(--text-main)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>
                    {t.name}
                  </div>
                  {unread > 0 ? (
                    <div style={{ fontSize: "12px", color: "#e8692a", fontWeight: 600 }}>
                      {unread} new feedback
                    </div>
                  ) : t.description ? (
                    <div style={{ fontSize: "12px", color: "var(--text-muted)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.description}
                    </div>
                  ) : null}
                </div>

                {/* Unread count badge on desktop, chevron on mobile */}
                {isMobile
                  ? <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>›</span>
                  : unread > 0
                    ? <div className="unread-badge" style={{
                        minWidth: 20, height: 20, borderRadius: 999,
                        background: "#e8692a", color: "white",
                        fontSize: "11px", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "0 6px", flexShrink: 0,
                        boxShadow: "0 1px 6px rgba(232,105,42,0.5)",
                      }}>
                        {unread > 99 ? "99+" : unread}
                      </div>
                    : null
                }
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // ─── TEAM DETAIL ─────────────────────────────────────────────────
  const TeamDetail = () => (
    <div style={{ display: "flex", flexDirection: "column", background: "var(--cream)" }}>

      {/* HEADER */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        padding: isMobile ? `${(detailHeaderH - 36) / 2}px 16px` : "14px 16px",
        borderBottom: "1px solid rgba(122,127,154,0.15)",
        background: "var(--cream)"
      }}>
        {isMobile && (
          <button onClick={() => setMobileView("list")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-main)", fontSize: "20px", padding: 0, lineHeight: 1
          }}>‹</button>
        )}

        <TeamAvatar team={activeTeam} size={36} fontSize="14px" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-main)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeTeam?.name}
          </div>
          {!isMobile && activeTeam?.description && (
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{activeTeam.description}</div>
          )}
        </div>

        {/* QUICK SUBMIT BUTTON — pre-selects this team */}
        <button
          onClick={() => navigateToSubmit(activeTeam.id)}
          style={{
            fontSize: screenW < 390 ? "12px" : "13px",
            padding: screenW < 390 ? "6px 10px" : "8px 14px",
            borderRadius: 8,
            display: "flex", alignItems: "center", gap: 5,
            border: "none", background: "#f39c12",
            cursor: "pointer", color: "white",
            fontWeight: 600, boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
          ✍️ Submit
        </button>

        {/* INFO BUTTON */}
        <button onClick={() => { fetchTeamDetails(activeTeam); setShowPanel(true); }}
          style={{
            fontSize: "16px",
            padding: screenW < 390 ? "6px 10px" : "8px 16px",
            borderRadius: 8,
            display: "flex", alignItems: "center",
            border: "1px solid rgba(122,127,154,0.35)", background: "var(--surface)",
            cursor: "pointer", color: "var(--text-main)", whiteSpace: "nowrap",
            fontWeight: 600, boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 5}}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="8"/>
            <polyline points="11 12 12 12 12 16"/>
          </svg>
          Info
        </button>
      </div>

      {/* BODY */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? cardGap : 12,
        padding: isMobile ? bodyPadding : 16,
        overflow: "hidden",
      }}>

        {/* WEEKLY SENTIMENT */}
        <div className="card" style={{
          flexShrink: 0,
          padding: isMobile ? sentimentCardPad : undefined,
        }}>
          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            marginBottom: 8,
            gap: isMobile ? 4 : 0,
          }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: isMobile && screenH < 700 ? "0.95rem" : "1.05rem", margin: 0, color: "var(--text-main)" }}>
              Weekly Sentiment
            </h3>
            <div style={{ display: "flex", gap: isMobile ? 10 : 12, fontSize: "11px", color: "var(--text-muted)" }}>
              {[
                { label: "Positive", color: "#3dba7e" },
                { label: "Negative", color: "#e8692a" },
                { label: "Neutral",  color: "#7a7f9a" },
              ].map(({ label, color }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{
                    display: "inline-block", width: 18, height: 7,
                    borderRadius: 3, background: color, flexShrink: 0,
                  }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          {feedLoading ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p> : (
            <>
              <div style={{
                display: "flex", gap: 8, alignItems: "flex-end",
                height: isMobile ? chartContainerH : 120,
                marginTop: 8,
              }}>
                {bars.map((b) => (
                  <div key={b.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                    <div style={{
                      height: b.h === 0 ? 6 : Math.min((b.h / 100) * (isMobile ? maxBarHeight : 90), isMobile ? maxBarHeight : 90),
                      background: b.color, width: "100%", borderRadius: 6, minHeight: 6,
                      transition: "height 0.3s ease"
                    }} />
                    <span style={{ fontSize: isMobile ? dayFontSize : "10px", color: "var(--text-muted)" }}>{b.day}</span>
                    <span style={{
                      fontSize: isMobile ? scoreFontSize : "9px", fontWeight: 600,
                      color: b.avgScore === null ? "#a0a3b1" : b.avgScore > 0 ? "#3dba7e" : b.avgScore < 0 ? "#e8692a" : "#7a7f9a"
                    }}>
                      {b.avgScore === null ? "—" : (b.avgScore > 0 ? "+" : "") + b.avgScore.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* FEEDBACK FEED */}
        <div className="card" style={{
          height: isMobile ? feedCardH : "calc(100vh - 380px)",
          minHeight: isMobile ? 150 : 300,
          display: "flex",
          flexDirection: "column",
          padding: isMobile ? sentimentCardPad : undefined,
        }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: isMobile && screenH < 700 ? "0.95rem" : "1.05rem", marginBottom: isMobile ? 8 : 12, flexShrink: 0, color: "var(--text-main)" }}>
            Team Feedback Feed
          </h3>
          {feedLoading ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
          : feedback.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>💬</div>
              <p style={{ fontSize: "14px" }}>No feedback yet for this team.</p>
              <button className="btn btn-primary"
                style={{ marginTop: 12, fontSize: "13px", padding: "8px 16px" }}
                onClick={() => navigateToSubmit(activeTeam.id)}>
                Submit First Feedback
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 24, paddingRight: 4 }}>
              {Object.entries(groupedFeedback).map(([date, items]) => (
                <div key={date}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    <span style={{
                      fontSize: "11px", color: "var(--text-main)", whiteSpace: "nowrap",
                      fontWeight: 600, background: "var(--input-bg)",
                      padding: "2px 10px", borderRadius: 999,
                      border: "1px solid var(--border)"
                    }}>{date}</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {items.map((f) => (
                      <div key={f.id} style={{
                        display: "flex", gap: 10, alignItems: "flex-start",
                        background: getMoodBg(f.mood), borderRadius: 12, padding: "10px 14px",
                        borderLeft: `3px solid ${getMoodColor(f.mood)}`,
                        boxShadow: `inset 0 0 0 1px ${getMoodColor(f.mood)}22`
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: getMoodColor(f.mood) + "22",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "16px", flexShrink: 0
                        }}>
                          {getMoodEmoji(f.mood)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-main)" }}>
                              {f.anonymous || !f.display_name ? "Anonymous" : f.display_name}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{timeAgo(f.created_at)}</span>
                          </div>
                          <p style={{ fontSize: "13px", color: "var(--text-main)", margin: 0, lineHeight: 1.4 }}>
                            {f.message || <em style={{ color: "var(--text-muted)" }}>No message</em>}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            <span style={{
                              fontSize: "11px", padding: "2px 8px", borderRadius: 999,
                              background: getMoodColor(f.mood) + "22", color: getMoodColor(f.mood), fontWeight: 600
                            }}>{f.mood}</span>
                            {f.sentiment && (
                              <span style={{
                                fontSize: "11px", padding: "2px 8px", borderRadius: 999,
                                background: f.sentiment === "positive" ? "#3dba7e22" : f.sentiment === "negative" ? "#e8692a22" : "#7a7f9a22",
                                color: f.sentiment === "positive" ? "#3dba7e" : f.sentiment === "negative" ? "#e8692a" : "#7a7f9a",
                                fontWeight: 600
                              }}>
                                {f.sentiment} {f.sentiment_score !== null && f.sentiment_score !== undefined
                                  ? `(${f.sentiment_score > 0 ? "+" : ""}${Number(f.sentiment_score).toFixed(2)})` : ""}
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
    </div>
  );

  return (
    <>
      {/* ── TEAM INFO PANEL MODAL ── */}
      {showPanel && activeTeam && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowPanel(false); setShowTransfer(false); setPhotoError(""); } }}
          style={{
            position: "fixed",
            top: isMobile ? 64 : 0,
            left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: isMobile ? "flex-end" : "flex-start",
            justifyContent: "center",
            zIndex: 1000,
            overflowY: isMobile ? "hidden" : "auto",
            paddingTop: isMobile ? 0 : 80,
            paddingBottom: isMobile ? 0 : 24,
          }}
        >
          <div style={{
            background: "var(--surface)",
            borderRadius: isMobile ? "16px 16px 0 0" : 16,
            width: isMobile ? "100%" : "92%",
            maxWidth: isMobile ? "100%" : 860,
            padding: isMobile ? "16px 14px 24px" : 24,
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 10 : 16,
            maxHeight: isMobile ? "calc(100vh - 64px)" : "90vh",
            overflowY: "auto",
            boxSizing: "border-box",
          }}>

            {/* ── MODAL HEADER ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Team photo */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    onClick={handleTeamPhotoClick}
                    title="Click to change team photo"
                    style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: activeTeam.photo_url ? "transparent" : (activeTeam.color || "#7a7f9a"),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: 700, fontSize: "18px",
                      cursor: "pointer", overflow: "hidden",
                      border: "2px solid transparent", transition: "border-color 0.2s",
                      boxSizing: "border-box", position: "relative",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = activeTeam.color || "#6c5ce7"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
                  >
                    {activeTeam.photo_url
                      ? <img src={activeTeam.photo_url.split("?")[0]} alt="Team" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : activeTeam.name?.[0]?.toUpperCase()
                    }
                    <div style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 18, height: 18, borderRadius: "50%",
                      background: "#6c5ce7", border: "2px solid var(--surface, #fff)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "9px", pointerEvents: "none",
                    }}>📷</div>
                  </div>
                  <input ref={teamPhotoInputRef} type="file" accept="image/*"
                    style={{ display: "none" }} onChange={handleTeamPhotoChange} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-main)" }}>{activeTeam.name}</h3>
                  {photoUploading && <div style={{ fontSize: "11px", color: "#6c5ce7", marginTop: 2 }}>Uploading...</div>}
                  {photoError && <div style={{ fontSize: "11px", color: "#e8692a", marginTop: 2 }}>{photoError}</div>}
                  {!photoUploading && !photoError && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: 2 }}>Tap photo to change</div>}
                  {activeTeam.photo_url && !photoUploading && (
                    <button onClick={handleRemoveTeamPhoto} style={{
                      marginTop: 4, fontSize: "11px", padding: "2px 8px", borderRadius: 6,
                      border: "1px solid #ffaaaa", background: "transparent",
                      color: "#e55", cursor: "pointer", fontWeight: 600
                    }}>Remove photo</button>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setShowPanel(false); setShowTransfer(false); setPhotoError(""); }}
                style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}
              >✕</button>
            </div>

            {/* ── MODAL BODY: stacks vertically on mobile, side-by-side on desktop ── */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 16 }}>

              {/* LEFT COLUMN */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>

                {/* Invite code + Creator */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>🔑 Invite Code</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <span style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, letterSpacing: 3, color: "var(--text-main)" }}>
                        {activeTeam.code}
                      </span>
                      <button onClick={handleCopyCode} style={{
                        fontSize: "11px", padding: "3px 8px", borderRadius: 6,
                        border: "1px solid #6c5ce7", background: copied ? "#6c5ce7" : "#6c5ce711",
                        color: copied ? "white" : "#6c5ce7", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0
                      }}>{copied ? "✓" : "Copy"}</button>
                    </div>
                  </div>
                  <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>👑 Creator</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {creator?.full_name || "—"}
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "📅 Created", value: formatDateShort(activeTeam.created_at) },
                    { label: "👥 Members", value: members.length },
                    { label: "💬 Feedback", value: `${feedback.length} total` },
                    { label: "😊 Top Mood", value: getTopMood() },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Transfer leadership UI */}
                {showTransfer && (
                  <div style={{ background: "var(--input-bg)", border: "1px solid #f39c1244", borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: "13px", color: "#856404", marginBottom: 10 }}>
                      ⚠️ You are the team leader. Please transfer leadership before leaving.
                    </p>
                    <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "13px", marginBottom: 10, background: "var(--surface)", color: "var(--text-main)" }}>
                      <option value="">Select new leader...</option>
                      {otherMembers.map((m) => (
                        <option key={m.user_id} value={m.user_id}>{m.users?.full_name || "Unknown"}</option>
                      ))}
                    </select>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setShowTransfer(false)} style={{
                        flex: 1, padding: "8px", borderRadius: 8, border: "1px solid var(--border)",
                        background: "var(--surface)", cursor: "pointer", fontSize: "13px", color: "var(--text-main)"
                      }}>Cancel</button>
                      <button onClick={handleTransferAndLeave} disabled={leaveLoading} style={{
                        flex: 1, padding: "8px", borderRadius: 8, border: "none",
                        background: "#e8692a", color: "white", cursor: "pointer", fontSize: "13px", fontWeight: 600
                      }}>{leaveLoading ? "Leaving..." : "Transfer & Leave"}</button>
                    </div>
                  </div>
                )}

                {/* Leave button */}
                {!showTransfer && (
                  <button onClick={handleLeaveTeam} disabled={leaveLoading} style={{
                    padding: "10px", borderRadius: 8, border: "1px solid #ffaaaa",
                    background: "var(--input-bg)", color: "#e55", cursor: "pointer",
                    fontSize: "13px", fontWeight: 600, width: "100%"
                  }}>
                    {leaveLoading ? "Leaving..." : isCreator ? "👑 Leave & Transfer Leadership" : "Leave Team"}
                  </button>
                )}
              </div>

              {/* DIVIDER */}
              <div style={{
                width: isMobile ? "100%" : 1,
                height: isMobile ? 1 : "auto",
                background: "var(--border)",
                flexShrink: 0,
              }} />

              {/* RIGHT COLUMN — Members list (no nested scroll on mobile) */}
              <div style={{
                width: isMobile ? "100%" : 260,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  👥 Team Members <span style={{ fontWeight: 400 }}>(tap to view)</span>
                </div>
                {/* ── No inner scroll on mobile — the whole modal scrolls ── */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  ...(isMobile ? {} : { overflowY: "auto", maxHeight: "calc(100vh - 420px)", paddingRight: 4 }),
                }}>
                  {members.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No members found.</p>
                  ) : members.map((m) => {
                    const isOwner = activeTeam.created_by === m.user_id;
                    const isYou = m.user_id === user.id;
                    return (
                      <div key={m.user_id}
                        onClick={() => fetchMemberProfile(m)}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                        onMouseLeave={e => e.currentTarget.style.background = isYou ? "#6c5ce711" : "var(--input-bg)"}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 12px", borderRadius: 8,
                          background: isYou ? "#6c5ce711" : "var(--input-bg)",
                          cursor: "pointer", transition: "background 0.15s ease", flexShrink: 0,
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: isOwner ? "#f39c12" : "#6c5ce7",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", fontSize: "13px", fontWeight: 700, overflow: "hidden", flexShrink: 0
                          }}>
                            {m.users?.avatar_url
                              ? <img src={m.users.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : m.users?.full_name?.[0]?.toUpperCase() || "?"
                            }
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {m.users?.full_name || "Unknown"}
                              {isYou && <span style={{ fontSize: "11px", color: "#6c5ce7", marginLeft: 6 }}>(You)</span>}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Joined {formatDateShort(m.joined_at)}</div>
                          </div>
                        </div>
                        {isOwner && (
                          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: 999, background: "#f39c1222", color: "#f39c12", fontWeight: 600, flexShrink: 0 }}>👑</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MEMBER PROFILE MODAL ── */}
      {selectedMember && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedMember(null); setMemberProfile(null); setMemberStats(null); } }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div style={{
            background: "var(--surface)",
            borderRadius: isMobile ? "16px 16px 0 0" : 16,
            width: isMobile ? "100%" : "90%",
            maxWidth: isMobile ? "100%" : 480,
            padding: isMobile ? "16px 14px 28px" : 28,
            display: "flex", flexDirection: "column", gap: 14,
            maxHeight: isMobile ? "calc(100vh - 64px)" : "85vh",
            overflowY: "auto",
            boxSizing: "border-box",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-main)" }}>Member Profile</h3>
              <button onClick={() => { setSelectedMember(null); setMemberProfile(null); setMemberStats(null); }}
                style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "12px 0" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: activeTeam.created_by === selectedMember.user_id ? "#f39c12" : "#6c5ce7",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "1.6rem", fontWeight: 700, overflow: "hidden", flexShrink: 0
              }}>
                {memberProfile?.avatar_url
                  ? <img src={memberProfile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : memberProfile?.full_name?.[0]?.toUpperCase() || "?"
                }
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>{memberProfile?.full_name || "Unknown"}</div>
                {activeTeam.created_by === selectedMember.user_id && (
                  <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: 999, background: "#f39c1222", color: "#f39c12", fontWeight: 600 }}>👑 Team Leader</span>
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Student ID", value: memberProfile?.student_id || "—" },
                { label: "Age", value: memberProfile?.age || "—" },
                { label: "Date of Birth", value: memberProfile?.date_of_birth ? formatDateShort(memberProfile.date_of_birth) : "—" },
                { label: "Phone Number", value: memberProfile?.phone_number || "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>{value}</div>
                </div>
              ))}
              <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px", gridColumn: "span 2" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase" }}>Member Since</div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>{formatDateShort(selectedMember.joined_at)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT ── */}
      {isMobile ? (
        <div style={{ position: "fixed", inset: 0, top: 64, overflow: "hidden", background: "var(--cream)" }}>
          {mobileView === "list" ? <TeamList /> : <TeamDetail />}
        </div>
      ) : (
        <div style={{ position: "fixed", inset: 0, top: 64, display: "flex", background: "var(--cream)", overflow: "auto" }}>
          <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid rgba(122,127,154,0.15)", overflowY: "auto" }}>
            <TeamList />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {activeTeam
              ? <TeamDetail />
              : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
                  Select a team to get started
                </div>
            }
          </div>
        </div>
      )}
    </>
  );
}