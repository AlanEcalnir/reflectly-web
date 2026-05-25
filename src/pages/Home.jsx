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

// ── SVG Icon Components ──────────────────────────────────────────────────────
const KeyIcon = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="M21 2l-9.6 9.6"/>
    <path d="M15.5 7.5l3 3L22 7l-3-3"/>
  </svg>
);

const CrownIcon = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
    <path d="M5 20h14"/>
  </svg>
);

const CalendarIcon = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const UsersIcon = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const MessageIcon = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const SmileIcon = ({ size = 12, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
);

const CameraIcon = ({ size = 9 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const PenIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>
);

const AlertIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#856404" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const LogOutIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

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

  // ── Team name / description inline edit ──────────────────────────
  const [editingInfo, setEditingInfo]   = useState(false);
  const [editName, setEditName]         = useState("");
  const [editDesc, setEditDesc]         = useState("");
  const [editColor, setEditColor]       = useState("");
  const [editSaving, setEditSaving]     = useState(false);
  const [editError, setEditError]       = useState("");

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

  const handleSaveTeamInfo = async () => {
    if (!editName.trim()) { setEditError("Team name cannot be empty."); return; }
    setEditSaving(true);
    setEditError("");
    const { error } = await supabase
      .from("teams")
      .update({ name: editName.trim(), description: editDesc.trim(), color: editColor })
      .eq("id", activeTeam.id);
    if (error) { setEditError(error.message); setEditSaving(false); return; }
    const updatedTeam = { ...activeTeam, name: editName.trim(), description: editDesc.trim(), color: editColor };
    setActiveTeam(updatedTeam);
    setTeams((prev) => prev.map((t) => t.id === activeTeam.id ? updatedTeam : t));
    setEditSaving(false);
    setEditingInfo(false);
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
  const maxBarHeight    = screenH * 0.09;
  const chartContainerH = maxBarHeight + 44;
  const bodyPadding     = screenH < 700 ? 10 : 16;
  const cardGap         = screenH < 700 ? 8 : 12;
  const detailHeaderH   = screenH < 700 ? 58 : 68;
  const sentimentCardPad = screenH < 700 ? 10 : 12;
  const sentimentCardH  = sentimentCardPad * 2 + 28 + 14 + chartContainerH;
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

        {/* QUICK SUBMIT BUTTON */}
        <button
          onClick={() => navigateToSubmit(activeTeam.id)}
          style={{
            fontSize: screenW < 390 ? "12px" : "13px",
            padding: screenW < 390 ? "6px 10px" : "8px 14px",
            borderRadius: 8,
            display: "flex", alignItems: "center", gap: 6,
            border: "none", background: "#f39c12",
            cursor: "pointer", color: "white",
            fontWeight: 600, boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
          <PenIcon size={13} />
          Submit
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
              <div style={{ marginBottom: 8 }}>
  <MessageIcon size={32} color="var(--text-muted)" />
</div>
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
  top: 0,
  left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  zIndex: 1000,
  overflowY: "hidden",
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
            maxHeight: screenH - 64,
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
                    {/* Camera overlay badge */}
                    <div style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 18, height: 18, borderRadius: "50%",
                      background: "#6c5ce7", border: "2px solid var(--surface, #fff)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      pointerEvents: "none",
                    }}>
                      <CameraIcon size={9} />
                    </div>
                  </div>
                  <input ref={teamPhotoInputRef} type="file" accept="image/*"
                    style={{ display: "none" }} onChange={handleTeamPhotoChange} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingInfo ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Team name"
                        style={{
                          fontSize: "14px", fontWeight: 700, padding: "5px 8px",
                          borderRadius: 6, border: "1px solid #6c5ce7",
                          background: "var(--input-bg)", color: "var(--text-main)",
                          width: "100%", boxSizing: "border-box",
                        }}
                      />
                      <input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description (optional)"
                        style={{
                          fontSize: "12px", padding: "5px 8px",
                          borderRadius: 6, border: "1px solid var(--border)",
                          background: "var(--input-bg)", color: "var(--text-main)",
                          width: "100%", boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Color</span>
                        {["#1e2140","#e8692a","#1e7d6b","#e84040","#3a6fd8"].map((c) => (
                          <div
                            key={c}
                            onClick={() => setEditColor(c)}
                            style={{
                              width: 22, height: 22, borderRadius: "50%", background: c,
                              cursor: "pointer", flexShrink: 0,
                              outline: editColor === c ? `3px solid ${c}` : "3px solid transparent",
                              outlineOffset: 2,
                              transition: "outline 0.15s ease",
                            }}
                          />
                        ))}
                      </div>
                      {editError && <div style={{ fontSize: "11px", color: "#e55" }}>{editError}</div>}
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={handleSaveTeamInfo} disabled={editSaving} style={{
                          flex: 1, fontSize: "11px", padding: "4px 0", borderRadius: 6,
                          border: "none", background: "#6c5ce7", color: "white",
                          cursor: editSaving ? "not-allowed" : "pointer", fontWeight: 600,
                        }}>{editSaving ? "Saving..." : "Save"}</button>
                        <button onClick={() => { setEditingInfo(false); setEditError(""); }} style={{
                          flex: 1, fontSize: "11px", padding: "4px 0", borderRadius: 6,
                          border: "1px solid var(--border)", background: "transparent",
                          color: "var(--text-muted)", cursor: "pointer",
                        }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                      <button
                        onClick={() => { setEditName(activeTeam.name); setEditDesc(activeTeam.description || ""); setEditColor(activeTeam.color || "#1e2140"); setEditingInfo(true); setEditError(""); }}
                        title="Edit team name and description"
                        style={{
                          background: "none", border: "1px solid var(--border)",
                          borderRadius: 6, cursor: "pointer", padding: "3px 7px",
                          color: "var(--text-muted)", fontSize: "13px", flexShrink: 0,
                          lineHeight: 1,
                        }}
                      ><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setShowPanel(false); setShowTransfer(false); setPhotoError(""); setEditingInfo(false); setEditError(""); }}
                style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--text-muted)", flexShrink: 0 }}
              >✕</button>
            </div>

            {/* ── MODAL BODY ── */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 16 }}>

              {/* LEFT COLUMN */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>

                {/* Invite code + Creator */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 4 }}>
                      <KeyIcon size={10} /> Invite Code
                    </div>
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
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 4 }}>
                      <CrownIcon size={10} color="#f39c12" /> Creator
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {creator?.full_name || "—"}
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { icon: <CalendarIcon size={10} />, label: "Created",  value: formatDateShort(activeTeam.created_at) },
                    { icon: <UsersIcon size={10} />,    label: "Members",  value: members.length },
                    { icon: <MessageIcon size={10} />,  label: "Feedback", value: `${feedback.length} total` },
                    { icon: <SmileIcon size={10} />,    label: "Top Mood", value: getTopMood() },
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={{ background: "var(--input-bg)", borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                        {icon}{label}
                      </div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-main)" }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Transfer leadership UI */}
                {showTransfer && (
                  <div style={{ background: "var(--input-bg)", border: "1px solid #f39c1244", borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: "13px", color: "#856404", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <AlertIcon size={14} />
                      You are the team leader. Please transfer leadership before leaving.
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
                    fontSize: "13px", fontWeight: 600, width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    {leaveLoading ? "Leaving..." : (
                      <>
                        {isCreator ? <CrownIcon size={13} color="#e55" /> : <LogOutIcon size={13} />}
                        {isCreator ? "Leave & Transfer Leadership" : "Leave Team"}
                      </>
                    )}
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

              {/* RIGHT COLUMN — Members list */}
              <div style={{
                width: isMobile ? "100%" : 260,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 4 }}>
                  <UsersIcon size={11} /> Team Members <span style={{ fontWeight: 400 }}>(tap to view)</span>
                </div>
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
                          <span style={{
                            display: "flex", alignItems: "center", gap: 3,
                            fontSize: "10px", padding: "2px 7px", borderRadius: 999,
                            background: "#f39c1222", color: "#f39c12", fontWeight: 600, flexShrink: 0
                          }}>
                            <CrownIcon size={9} color="#f39c12" />
                          </span>
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
            maxHeight: isMobile ? "calc(100dvh - 64px)" : "85vh",
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
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: "11px", padding: "2px 10px", borderRadius: 999,
                    background: "#f39c1222", color: "#f39c12", fontWeight: 600
                  }}>
                    <CrownIcon size={10} color="#f39c12" /> Team Leader
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Student ID",    value: memberProfile?.student_id || "—" },
                { label: "Age",           value: memberProfile?.age || "—" },
                { label: "Date of Birth", value: memberProfile?.date_of_birth ? formatDateShort(memberProfile.date_of_birth) : "—" },
                { label: "Phone Number",  value: memberProfile?.phone_number || "—" },
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