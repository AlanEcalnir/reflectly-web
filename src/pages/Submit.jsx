import { useState, useEffect } from "react";
import { supabase } from "../supabase";

const MOODS = [
  { emoji: "🤩", value: "excited",  label: "Excited"  },
  { emoji: "😊", value: "happy",    label: "Happy"    },
  { emoji: "😐", value: "neutral",  label: "Neutral"  },
  { emoji: "😴", value: "tired",    label: "Tired"    },
  { emoji: "😰", value: "anxious",  label: "Anxious"  },
  { emoji: "😓", value: "stressed", label: "Stressed" },
  { emoji: "😠", value: "angry",    label: "Angry"    },
];

export default function Submit({ user, defaultTeamId }) {
  const [teams, setTeams]         = useState([]);
  const [teamId, setTeamId]       = useState("");
  const [mood, setMood]           = useState("");
  const [thoughts, setThoughts]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");
  const [aiResult, setAiResult]   = useState(null);
  const [hateWarning, setHateWarning] = useState(false);


  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    const { data: memberRows } = await supabase
      .from("team_members")
      .select("team_id, teams(id, name, color)")
      .eq("user_id", user.id);
    const myTeams = memberRows?.map((r) => r.teams).filter(Boolean) || [];
    setTeams(myTeams);
    if (myTeams.length > 0) {
      const preferred = defaultTeamId && myTeams.find((t) => t.id === defaultTeamId);
      setTeamId(preferred ? preferred.id : myTeams[0].id);
    }
  };

  // ─── CUSTOM ANALYSIS ────────────────────────────────────────────────────────
  const runCustomAnalysis = (text) => {
    const lowerText = text.toLowerCase();

    const negationPrefixes = [
      "not ", "not a ", "not at all ", "not even ",
      "never ", "no longer ", "no more ",
      "di ", "di naman ", "di na ",
      "hindi ", "hindi na ", "hindi naman ",
      "wala ", "wala nang ", "wala na akong ",
      "don't feel ", "dont feel ", "don't ", "dont ",
      "doesn't ", "doesnt ", "didn't ", "didnt ",
      "isn't ", "isnt ", "wasn't ", "wasnt ",
      "aren't ", "arent ", "weren't ", "werent ",
      "can't ", "cant ", "cannot ", "won't ", "wont ",
      "no longer feeling ", "not feeling ",
    ];

    let processedText = lowerText;
    const flippedPositive = [];
    const flippedNegative = [];
    const sortedPrefixes = [...negationPrefixes].sort((a, b) => b.length - a.length);

    const fillerWords = [
      "sobrang ", "nako ", "talaga nako ", "talaga ",
      "na ", "na naman ", "na nga ", "na talaga ",
      "pa ", "pa rin ", "pa naman ",
      "na ako ", "na siya ", "na kami ", "na tayo ", "na sila ",
      "ako ", "siya ", "kami ", "tayo ", "sila ", "kayo ",
      "naman ", "nga ", "eh ", "kasi ",
      "really ", "that ", "so ", "very ", "quite ", "just ",
      "actually ", "honestly ", "truly ", "even ", "still ",
      "anymore ", "at all ", "a bit ", "a little ", "that much ",
      "sa grupo natin ", "sa team ", "sa trabaho ", "sa work ",
      "sa aming team ", "sa atin ", "dito ", "rito ",
    ];

    for (const prefix of sortedPrefixes) {
      let idx = processedText.indexOf(prefix);
      while (idx !== -1) {
        const afterPrefix = processedText.slice(idx + prefix.length);
        const candidates = [{ stripped: afterPrefix, consumed: 0 }];
        let frontier = [afterPrefix];
        for (let depth = 0; depth < 4; depth++) {
          const nextFrontier = [];
          for (const str of frontier) {
            for (const filler of fillerWords) {
              if (str.startsWith(filler)) {
                const next = str.slice(filler.length);
                candidates.push({ stripped: next, consumed: afterPrefix.length - next.length });
                nextFrontier.push(next);
              }
            }
          }
          frontier = nextFrontier;
          if (frontier.length === 0) break;
        }

        candidates.sort((a, b) => b.consumed - a.consumed);

        const negWordsSorted = [...negativeWords].sort((a, b) => b.w.length - a.w.length);
        const posWordsSorted = [...positiveWords].sort((a, b) => b.w.length - a.w.length);

        let matched = false;
        outer: for (const { stripped, consumed } of candidates) {
          for (const item of negWordsSorted) {
            if (stripped.startsWith(item.w)) {
              flippedPositive.push(item.v * 0.85);
              const removeEnd = idx + prefix.length + consumed + item.w.length;
              processedText = processedText.slice(0, idx) + " __negated__ " + processedText.slice(removeEnd);
              matched = true;
              break outer;
            }
          }
          for (const item of posWordsSorted) {
            if (stripped.startsWith(item.w)) {
              flippedNegative.push(item.v * 0.85);
              const removeEnd = idx + prefix.length + consumed + item.w.length;
              processedText = processedText.slice(0, idx) + " __negated__ " + processedText.slice(removeEnd);
              matched = true;
              break outer;
            }
          }
        }

        idx = processedText.indexOf(prefix, idx + 1);
      }
    }

    const getHits = (wordList, src) => {
      const matched = [];
      const sorted = [...wordList].sort((a, b) => b.w.length - a.w.length);
      let remaining = src;
      for (const item of sorted) {
        if (remaining.includes(item.w)) {
          matched.push(item.v);
          remaining = remaining.replace(item.w, "");
        }
      }
      return matched;
    };

    const positiveHits = [...getHits(positiveWords, processedText), ...flippedPositive];
    const negativeHits = [...getHits(negativeWords, processedText), ...flippedNegative];

    const avgPositive = positiveHits.length > 0 ? positiveHits.reduce((a, b) => a + b, 0) / positiveHits.length : 0;
    const avgNegative = negativeHits.length > 0 ? negativeHits.reduce((a, b) => a + b, 0) / negativeHits.length : 0;

    const positiveStrength = avgPositive * Math.sqrt(positiveHits.length);
    const negativeStrength = avgNegative * Math.sqrt(negativeHits.length);

    if (positiveStrength === 0 && negativeStrength === 0) return null;

    let sentiment, score;

    if (positiveStrength > negativeStrength && positiveStrength > 0.3) {
      sentiment = "positive";
      const reduction = negativeHits.length > 0 ? negativeStrength * 0.25 : 0;
      score = parseFloat(Math.min(positiveStrength - reduction, 0.97).toFixed(2));
    } else if (negativeStrength > positiveStrength && negativeStrength > 0.3) {
      sentiment = "negative";
      const reduction = positiveHits.length > 0 ? positiveStrength * 0.25 : 0;
      score = parseFloat(-Math.min(negativeStrength - reduction, 0.97).toFixed(2));
    } else if (positiveStrength > 0 || negativeStrength > 0) {
      sentiment = "neutral";
      score = parseFloat(((positiveStrength - negativeStrength) * 0.3).toFixed(2));
    } else {
      return null;
    }

    const emotional_tone = sentiment === "positive" ? "motivated"
                         : sentiment === "negative" ? "frustrated"
                         : "content";

    return {
      sentiment,
      sentiment_score: score,
      emotional_tone,
      summary: "Analysis based on your text.",
      flag: sentiment === "negative" && Math.abs(score) > 0.65,
    };
  };

  // ─── MAIN ANALYSIS ORCHESTRATOR ─────────────────────────────────────────────
  const analyzeWithAI = async (text) => {
    setAnalyzing(true);
    try {
      const customResult = runCustomAnalysis(text);
      if (customResult) return customResult;

      try {
        const token = import.meta.env.VITE_HF_TOKEN;
        const response = await fetch(
          "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: text })
          }
        );

        const data = await response.json();
        const results = data[0];
        if (!results) throw new Error("No results");

        const top = results.reduce((a, b) => a.score > b.score ? a : b);
        const sentiment = top.label.toLowerCase() === "positive" ? "positive"
                        : top.label.toLowerCase() === "negative" ? "negative"
                        : "neutral";
        const score = sentiment === "positive" ? top.score
                    : sentiment === "negative" ? -top.score
                    : 0;

        const emotional_tone = sentiment === "positive" ? "motivated"
                             : sentiment === "negative" ? "frustrated"
                             : "content";
        const flag = sentiment === "negative" && top.score > 0.7;
        const summaryMap = {
          motivated: "This person seems to be in a positive and energized state.",
          content: "This person seems comfortable and at ease.",
          frustrated: "This person may be experiencing stress or frustration.",
        };

        return {
          sentiment,
          sentiment_score: parseFloat(score.toFixed(2)),
          emotional_tone,
          summary: summaryMap[emotional_tone],
          flag,
        };
      } catch (hfError) {
        console.error("HuggingFace error:", hfError);
        return {
          sentiment: "neutral",
          sentiment_score: 0,
          emotional_tone: "content",
          summary: "Analysis based on your text.",
          flag: false,
        };
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── MAIN SUBMIT ────────────────────────────────────────────────────────────
  const handleSubmit = async (force = false) => {
    setError("");
    if (!mood) { setError("Please select a mood."); return; }
    if (!thoughts.trim()) { setError("Please share your thoughts."); return; }
    if (!teamId) { setError("No team selected."); return; }

    // Hate check — warn first, allow on second attempt
    if (!force) {
      const hateCheck = checkForHateContent(thoughts);
      if (hateCheck.detected) {
        setHateWarning(true);
        return;
      }
    }

    setHateWarning(false);
    setLoading(true);

    const ai = await analyzeWithAI(thoughts);
    setAiResult(ai);

    const flagged = force;

    const { data: userProfile } = await supabase
      .from("users")
      .select("anonymous_mode, full_name")
      .eq("id", user.id)
      .single();

    const { error: insertError } = await supabase
      .from("feedback")
      .insert({
        user_id: user.id,
        team_id: teamId,
        mood,
        message: thoughts.trim(),
        sentiment: ai.sentiment,
        sentiment_score: ai.sentiment_score,
        anonymous: userProfile?.anonymous_mode ?? false,
        display_name: userProfile?.anonymous_mode ? null : userProfile?.full_name,
        flagged,
        flagged_reason: flagged ? "hate_speech" : null,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  };

  // ─── SUBMITTED SCREEN ───────────────────────────────────────────────────────
  if (submitted && aiResult) {
    const sentimentColor = aiResult.sentiment === "positive" ? "#3dba7e"
                         : aiResult.sentiment === "negative" ? "#e8692a"
                         : "#7a7f9a";

    return (
      <>
        <div className="page-header">
          <h2>Submit Feedback</h2>
        </div>
        <div className="card" style={{ maxWidth: 1000, textAlign: "center", padding: "40px 32px" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
          <h3 style={{ marginBottom: 4 }}>Feedback submitted!</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
            Thank you for sharing. Here's what our AI detected:
          </p>
          <div style={{
            background: sentimentColor + "12",
            border: `1px solid ${sentimentColor}44`,
            borderRadius: 12, padding: "16px 20px",
            textAlign: "left", marginBottom: 24
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: sentimentColor, textTransform: "capitalize" }}>
                {aiResult.sentiment} sentiment
              </span>
              <span style={{ fontSize: "13px", color: "#888" }}>
                Score: {aiResult.sentiment_score?.toFixed(2)}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "#444", margin: "0 0 8px" }}>
              {aiResult.summary}
            </p>
            <span style={{
              fontSize: "11px", padding: "3px 10px", borderRadius: 999,
              background: sentimentColor + "22", color: sentimentColor, fontWeight: 600
            }}>
              {aiResult.emotional_tone?.replace(/_/g, " ")}
            </span>
            {aiResult.flag && (
              <div style={{
                marginTop: 10, padding: "8px 12px", borderRadius: 8,
                background: "#fff3cd", fontSize: "12px", color: "#856404"
              }}>
                ⚠️ This response has been flagged — someone may need support.
              </div>
            )}
          </div>
          <button className="btn btn-outline" onClick={() => {
            setSubmitted(false);
            setMood("");
            setThoughts("");
            setAiResult(null);
            setHateWarning(false);
          }}>
            Submit Another
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Floating error toast ── */}
      {error && (
        <div style={{
          position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
          background: "#fff1f0", border: "1.5px solid #ff4d4f",
          borderRadius: 10, padding: "12px 18px",
          boxShadow: "0 4px 20px rgba(255,77,79,0.18)",
          fontSize: "14px", fontWeight: 500, color: "#cf1322",
          whiteSpace: "nowrap", animation: "slideDown 0.2s ease",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="#ff4d4f" opacity="0.15" stroke="#cf1322" strokeWidth="1.8" strokeLinejoin="round"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="#cf1322" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="17" r="1.1" fill="#cf1322"/>
          </svg>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="#cf1322" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="#cf1322" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="page-header">
        <h2>Submit Feedback</h2>
        <p>How are you feeling about the team right now?</p>
      </div>

      <div className="card" style={{ width: "100%" }}>

        {teams.length > 1 && (
          <div className="field">
            <label>Submit to Team</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: "14px" }}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>Select Mood</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => { setMood(m.value); setError(""); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 4, padding: "10px 14px", borderRadius: 12,
                  border: mood === m.value ? "2px solid #6c5ce7" : "1px solid #ddd",
                  background: mood === m.value ? "#6c5ce711" : "white",
                  cursor: "pointer", transition: "all 0.15s ease"
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>{m.emoji}</span>
                <span style={{ fontSize: "11px", color: "#666" }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Your Thoughts</label>
          <textarea
            placeholder="Share what's on your mind..."
            value={thoughts}
            onChange={(e) => {
              setThoughts(e.target.value);
              if (hateWarning) setHateWarning(false);
            }}
            rows={4}
            style={{ resize: "none" }}
          />
          {thoughts.trim().length > 0 && (
            <div style={{
              marginTop: 8, fontSize: "12px", color: "#3dba7e", display: "flex",
              alignItems: "center", gap: 6,
              textShadow: "0 0 8px #3dba7e, 0 0 20px #3dba7e, 0 0 40px #3dba7eaa",
              transition: "opacity 0.3s ease"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="3" fill="#3dba7e"/>
                <ellipse cx="12" cy="12" rx="9" ry="4.5" stroke="#3dba7e" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
                <ellipse cx="12" cy="12" rx="4.5" ry="9" stroke="#3dba7e" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
                <circle cx="12" cy="12" r="10.5" stroke="#3dba7e" strokeWidth="1.2" fill="none" opacity="0.4"/>
                <circle cx="12" cy="1.5" r="1.2" fill="#3dba7e"/>
                <circle cx="12" cy="22.5" r="1.2" fill="#3dba7e"/>
                <circle cx="1.5" cy="12" r="1.2" fill="#3dba7e"/>
                <circle cx="22.5" cy="12" r="1.2" fill="#3dba7e"/>
              </svg>
              AI will analyze the emotional tone of your response
            </div>
          )}
        </div>

        {/* ── Hate/toxic content warning banner ── */}
        {hateWarning && (
          <div style={{
            background: "#fffbe6",
            border: "1.5px solid #faad14",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 12,
            fontSize: "13px",
            color: "#7c5e00",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            animation: "fadeIn 0.2s ease",
          }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: "18px", lineHeight: 1 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Your message may contain inappropriate language</div>
                <div style={{ lineHeight: 1.5, color: "#92650a" }}>
                  Consider rephrasing to keep feedback constructive and respectful.
                  If you still want to submit as-is, it will be reviewed by your team manager.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-outline"
                onClick={() => setHateWarning(false)}
                style={{ flex: 1, fontSize: "13px" }}
              >
                ✏️ Edit Message
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSubmit(true)}
                disabled={loading}
                style={{
                  flex: 1, fontSize: "13px",
                  background: "#faad14", borderColor: "#faad14",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Submitting..." : "Submit Anyway"}
              </button>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={() => handleSubmit(false)}
          disabled={loading || analyzing}
          style={{ width: "100%", opacity: (!mood || !thoughts.trim()) ? 0.6 : 1 }}
        >
          {analyzing ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="3" fill="white"/>
                <ellipse cx="12" cy="12" rx="9" ry="4.5" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
                <ellipse cx="12" cy="12" rx="4.5" ry="9" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
                <circle cx="12" cy="12" r="10.5" stroke="white" strokeWidth="1.2" fill="none" opacity="0.4"/>
              </svg>
              Analyzing with AI...
            </span>
          ) : loading ? "Saving..." : "Submit Feedback"}
        </button>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HATE CONTENT CHECKER
// ═══════════════════════════════════════════════════════════════════════════════

const checkForHateContent = (text) => {
  const lower = text.toLowerCase();

  const hateTerms = [
    // ── Direct attacks / threats ─────────────────────────────────────────────
    "fuck you", "f*ck you", "fck you", "fuk you", "fuq you",
    "fuck off", "f*ck off", "fck off",
    "fuck this", "fuck that", "fuck everyone",
    "go fuck yourself", "go f yourself",
    "go to hell", "go to hell",
    "i hope you die", "i hope you get fired",
    "i'll kill you", "i will kill you",
    "i want to kill", "i want to hurt",
    "you deserve to die", "you should die",
    "drop dead", "get lost", "get out",
    "i hate you", "i hate this team", "i hate everyone here",
    "i hate my manager", "i hate my boss",
    "hate you all", "hate you guys",
    "screw you", "screw this", "screw everyone",
    "screw this team", "screw this company",
    "damn you", "curse you",

    // ── Degrading / dehumanizing ─────────────────────────────────────────────
    "you're useless", "youre useless", "you are useless",
    "you're worthless", "youre worthless", "you are worthless",
    "you're stupid", "youre stupid", "you are stupid",
    "you're an idiot", "youre an idiot", "you are an idiot",
    "you're pathetic", "youre pathetic", "you are pathetic",
    "you're trash", "youre trash", "you are trash",
    "you're garbage", "youre garbage", "you are garbage",
    "you're a loser", "youre a loser", "you are a loser",
    "you're dumb", "youre dumb", "you are dumb",
    "you're a waste", "youre a waste", "you are a waste",
    "you're disgusting", "youre disgusting", "you are disgusting",
    "you're a joke", "youre a joke", "you are a joke",
    "you're incompetent", "youre incompetent",
    "you're terrible", "youre terrible",
    "you're the worst", "youre the worst",
    "you're nothing", "youre nothing", "you are nothing",
    "you're a failure", "youre a failure",
    "you're hopeless", "youre hopeless",
    "you're brain dead", "youre brain dead",
    "you're a moron", "youre a moron",
    "you're an imbecile", "youre an imbecile",
    "you're a fool", "youre a fool",
    "you're a coward", "youre a coward",
    "you're a liar", "youre a liar",
    "you're a fraud", "youre a fraud",
    "you're fake", "youre fake",
    "you're weak", "youre weak",
    "everyone here is useless", "everyone is useless",
    "this team is useless", "this team is trash",
    "this team is garbage", "this team is a joke",
    "this company is trash", "this company is garbage",
    "management is useless", "management is incompetent",
    "my boss is an idiot", "my boss is stupid",
    "my manager is an idiot", "my manager is useless",

    // ── Bullying / personal attacks ──────────────────────────────────────────
    "shut up", "shut the f", "shut the hell up",
    "nobody likes you", "no one likes you",
    "nobody wants you here", "no one wants you here",
    "you don't belong here", "you dont belong here",
    "you should quit", "you should leave",
    "you should get fired", "you should be fired",
    "i want you fired", "get them fired",
    "you're replaceable", "youre replaceable",
    "you're expendable", "youre expendable",

    // ── English slurs / severe profanity ────────────────────────────────────
    "asshole", "a**hole", "a-hole",
    "bastard", "b*stard",
    "bitch", "b*tch", "btch",
    "son of a bitch", "son of a b",
    "motherfucker", "motherf*cker", "mf",
    "piece of shit", "piece of s***", "pos",
    "bullshit", "bull sh*t",
    "cunt", "c*nt",
    "dick", "d*ck",
    "prick", "pr*ck",
    "jackass", "jack ass",
    "douchebag", "douche bag", "douche",
    "shitheads", "shithead",
    "dipshit", "dip shit",
    "numbnuts", "numbskull",
    "schmuck", "dirtbag",
    "scumbag", "scum bag",
    "lowlife", "low life",
    "sleazebag", "sleaze",
    "creep", "pervert",
    "sicko", "freak",

    // ── Racial / ethnic slurs (written out to detect, not to promote) ────────
    // Note: these are included to DETECT and warn — not to promote
    "racist", "racial slur",
    "go back to your country",
    "you don't belong in this country",

    // ── Sexual harassment ────────────────────────────────────────────────────
    "sexual harassment", "harassing me",
    "inappropriate touching",
    "you're hot", "you're sexy", "youre sexy",
    "sleep with me", "sleep with you",
    "send nudes", "send pics",

    // ── Threatening behavior ─────────────────────────────────────────────────
    "i'll report you", "ill report you",
    "i'm going to destroy you", "im going to destroy you",
    "i'll ruin you", "ill ruin you",
    "you'll regret this", "youll regret this",
    "watch your back", "you better watch out",
    "i know where you live",

    // ── Filipino / Tagalog curse words and attacks ───────────────────────────
    "putang ina", "putangina", "p*tangina", "ptngna", "pota", "puta",
    "puta ka", "putang ina mo", "putang ina nyo", "putang ina nila",
    "putang ina ng", "tang ina", "tang ina mo", "tangina", "t*ngina",
    "gago", "gago ka", "mga gago", "gagong",
    "gaga", "gaga ka", "mga gaga",
    "ulol", "ulol ka", "mga ulol", "ulol na",
    "tanga", "tanga ka", "mga tanga", "tangang",
    "bobo", "bobo ka", "mga bobo", "bobong",
    "boba", "boba ka", "mga boba",
    "inutil", "inutil ka", "mga inutil", "inutilin",
    "hayop", "hayop ka", "mga hayop", "hayop na hayop",
    "pakyu", "pak yu", "pakyo", "pak yo",
    "leche", "leche ka", "mga leche", "letcheng",
    "lintik", "lintik ka", "mga lintik", "lintikang",
    "kupal", "kupal ka", "mga kupal", "kupaling",
    "tarantado", "tarantado ka", "mga tarantado",
    "tarantada", "tarantada ka",
    "bwisit", "bwisit ka", "nakakabwisit",
    "bwiset", "bwiset ka",
    "hudas", "hudas ka", "mga hudas",
    "demonyo", "demonyo ka", "mga demonyo",
    "diablo", "diablo ka",
    "salot", "salot ka", "mga salot",
    "peste", "peste ka", "mga peste",
    "siraulo", "sira ulo", "siraulo ka",
    "engot", "engot ka", "mga engot",
    "hangal", "hangal ka", "mga hangal",
    "buang", "buang ka", "mga buang",
    "tunggak", "tunggak ka", "mga tunggak",
    "burat", "b*rat",
    "tite", "t*te",
    "puke", "p*ke",
    "bilat", "b*lat",
    "kantot", "k*ntot",
    "jakol", "j*kol",
    "hindot", "h*ndot",
    "animal ka", "hayok ka",
    "walang hiya", "walang hiya ka", "walang hiyang",
    "walang kwenta ka", "walang kwenta kayo",
    "walang silbi", "walang silbi ka",
    "walang modo", "walang modo ka",
    "basura ka", "basura kayo",
    "dumi ka", "dumi kayo",
    "wala kang kwenta",
    "wala kayong kwenta",
    "di ka dapat dito", "hindi ka dapat dito",
    "lumayas ka", "lumayo ka na",
    "umalis ka na", "alis na",
    "sinisira mo", "sinisira nyo",
    "kasalanan mo", "kasalanan nyo",
    "lahat kasalanan mo",
    "ikaw kasi", "kayo kasi lagi",
    "pabigat ka", "pabigat kayo",
    "burden ka", "burden kayo",
    "wala kang kwenta dito",
    "mas magaling pa ako sayo",
    "mas magaling kami kaysa sa inyo",
    "mga tanga kayo",
    "mga bobo kayo",
    "mga gago kayo",
    "mga inutil kayo",
    "mga walang kwenta kayo",
    "sana mawala ka na",
    "sana mawala na kayo",
    "ayaw ko sa inyo",
    "galit na galit ako sa inyo",
    "pinagtatawanan kayo",
    "pinagtutungayaw",

    // ── Bisaya / Cebuano curse words ─────────────────────────────────────────
    "pisti", "pisti ka", "mga pisti",
    "yawa", "yawa ka", "mga yawa",
    "bugo", "bugo ka", "mga bugo",
    "bogo", "bogo ka", "mga bogo",
    "amaw", "amaw ka", "mga amaw",
    "atay", "atay ka", "pisti atay",
    "iyot", "i*ot",
    "boto", "b*to",
    "bilat bisaya",
    "puke bisaya",

    // ── Ilocano ──────────────────────────────────────────────────────────────
    "nakakasama", "makapadakes",

    // ── Taglish mixed attacks ────────────────────────────────────────────────
    "ang bobo mo", "ang tanga mo", "ang gago mo",
    "ang inutil mo", "ang pangit mo",
    "ang sama mo", "ang sama nyo",
    "ang pangit ng trabaho mo",
    "ang pangit ng ginagawa mo",
    "ang dami mong mali",
    "puro ka mali", "puro kayong mali",
    "hindi mo kaya", "hindi nyo kaya",
    "di mo kaya", "di nyo kaya",
    "walang silbi ang ginagawa mo",
    "sablay ka lagi", "sablay kayo lagi",
    "palpak ka lagi", "palpak kayo lagi",
    "bakit ka pa nandito",
    "bakit kayo pa nandito",
    "mas okay kung wala ka",
    "mas okay kung wala kayo",
    "layas ka na", "layas na kayo",

    // ── Workplace-specific toxic phrases ─────────────────────────────────────
    "this is the worst team", "worst team ever",
    "worst company ever", "worst manager ever",
    "worst boss ever", "worst workplace ever",
    "i hate working here", "i hate this place",
    "this place is toxic", "toxic workplace",
    "toxic team", "toxic manager", "toxic boss",
    "disgusting workplace", "disgusting team",
    "garbage company", "garbage management",
    "trash company", "trash management",
    "incompetent management", "incompetent team",
    "incompetent manager", "incompetent boss",
    "nobody knows what they're doing",
    "nobody knows what theyre doing",
    "everyone here is an idiot",
    "everyone is stupid here",
    "this team has no idea",
    "management has no idea",
    "i don't respect you", "i dont respect you",
    "i have no respect for", "zero respect",
    "you don't deserve", "you dont deserve",
    "you never deserved",
  ];

  for (const term of hateTerms) {
    if (lower.includes(term)) {
      return { detected: true, term };
    }
  }

  return { detected: false };
};

// ═══════════════════════════════════════════════════════════════════════════════
// VOCABULARY LISTS
// ═══════════════════════════════════════════════════════════════════════════════

const positiveWords = [
  // ── Strong positive multi-word phrases ──────────────────────────────────────
  { w: "extremely happy", v: 0.95 }, { w: "so happy", v: 0.88 },
  { w: "very happy", v: 0.85 }, { w: "super happy", v: 0.89 },
  { w: "sobrang happy", v: 0.90 }, { w: "love this", v: 0.87 },
  { w: "love it", v: 0.86 }, { w: "love na love", v: 0.91 },
  { w: "so good", v: 0.79 }, { w: "very good", v: 0.81 },
  { w: "so great", v: 0.82 }, { w: "so excited", v: 0.86 },
  { w: "super excited", v: 0.88 }, { w: "really happy", v: 0.86 },
  { w: "really good", v: 0.79 }, { w: "really great", v: 0.82 },
  { w: "feeling good", v: 0.74 }, { w: "feeling great", v: 0.79 },
  { w: "feel good", v: 0.72 }, { w: "feel great", v: 0.77 },
  { w: "doing well", v: 0.68 }, { w: "going well", v: 0.71 },
  { w: "all good", v: 0.64 }, { w: "so blessed", v: 0.84 },
  { w: "very blessed", v: 0.83 }, { w: "so grateful", v: 0.84 },
  { w: "very grateful", v: 0.82 }, { w: "thank god", v: 0.76 },
  { w: "thank goodness", v: 0.72 }, { w: "no complaints", v: 0.67 },
  { w: "couldn't be better", v: 0.91 }, { w: "could not be better", v: 0.91 },
  { w: "best day", v: 0.87 }, { w: "great day", v: 0.81 },
  { w: "good day", v: 0.72 }, { w: "good vibes", v: 0.78 },
  { w: "positive vibes", v: 0.79 }, { w: "high spirits", v: 0.81 },
  { w: "on top of the world", v: 0.93 }, { w: "over the moon", v: 0.92 },
  { w: "thrilled to bits", v: 0.90 }, { w: "walking on sunshine", v: 0.91 },
  { w: "cloud nine", v: 0.90 }, { w: "on cloud nine", v: 0.91 },
  { w: "so alive", v: 0.83 }, { w: "feeling alive", v: 0.80 },
  { w: "never been better", v: 0.92 }, { w: "best feeling", v: 0.86 },
  { w: "feeling blessed", v: 0.82 }, { w: "feeling motivated", v: 0.78 },
  { w: "feeling inspired", v: 0.80 }, { w: "feeling energized", v: 0.78 },
  { w: "so pumped", v: 0.84 }, { w: "very pumped", v: 0.83 },
  { w: "feeling pumped", v: 0.80 }, { w: "full of energy", v: 0.82 },
  { w: "full of life", v: 0.83 }, { w: "full of hope", v: 0.81 },
  { w: "at my best", v: 0.87 }, { w: "top of my game", v: 0.88 },
  { w: "in the zone", v: 0.83 }, { w: "crushing it", v: 0.85 },
  { w: "killing it", v: 0.84 }, { w: "nailing it", v: 0.83 },
  { w: "knocked it out", v: 0.84 }, { w: "knocked it out of the park", v: 0.90 },
  { w: "proud of myself", v: 0.82 }, { w: "proud of us", v: 0.83 },
  { w: "proud of the team", v: 0.85 }, { w: "love the team", v: 0.83 },
  { w: "love my team", v: 0.84 }, { w: "love our team", v: 0.85 },
  { w: "great team", v: 0.79 }, { w: "amazing team", v: 0.83 },
  { w: "good job", v: 0.74 }, { w: "great job", v: 0.79 },
  { w: "well done", v: 0.77 }, { w: "good work", v: 0.73 },
  { w: "great work", v: 0.79 }, { w: "amazing work", v: 0.84 },
  { w: "keep it up", v: 0.72 }, { w: "keep going", v: 0.69 },
  { w: "moving forward", v: 0.68 }, { w: "looking forward", v: 0.67 },
  { w: "looking up", v: 0.66 }, { w: "things are looking up", v: 0.79 },
  { w: "so worth it", v: 0.81 }, { w: "totally worth it", v: 0.80 },
  { w: "worth it", v: 0.67 }, { w: "glad to be here", v: 0.79 },
  { w: "happy to be here", v: 0.80 }, { w: "glad to be part", v: 0.79 },
  { w: "honored", v: 0.77 }, { w: "feel honored", v: 0.79 },
  { w: "feel valued", v: 0.79 }, { w: "feel appreciated", v: 0.81 },
  { w: "feel supported", v: 0.78 }, { w: "feel seen", v: 0.76 },
  { w: "feel heard", v: 0.74 }, { w: "this is great", v: 0.80 },
  { w: "this is amazing", v: 0.84 }, { w: "this is awesome", v: 0.82 },
  { w: "i love this", v: 0.87 }, { w: "i love it", v: 0.86 },
  { w: "couldn't ask for more", v: 0.88 },
  // ── Thrilled / Excited ───────────────────────────────────────────────────────
  { w: "thrilled", v: 0.84 }, { w: "delighted", v: 0.83 },
  { w: "ecstatic", v: 0.92 }, { w: "elated", v: 0.89 },
  { w: "pumped", v: 0.81 }, { w: "pumped up", v: 0.83 },
  { w: "hyped", v: 0.82 }, { w: "stoked", v: 0.83 },
  { w: "fired up", v: 0.81 }, { w: "lit", v: 0.73 },
  { w: "giddy", v: 0.78 }, { w: "overjoyed", v: 0.90 },
  { w: "exhilarated", v: 0.88 }, { w: "jubilant", v: 0.89 },
  { w: "euphoric", v: 0.91 }, { w: "blissful", v: 0.88 },
  { w: "radiant", v: 0.80 }, { w: "glowing", v: 0.76 },
  { w: "beaming", v: 0.79 }, { w: "gleaming", v: 0.72 },
  { w: "vibrant", v: 0.76 }, { w: "bubbly", v: 0.73 },
  { w: "lively", v: 0.72 }, { w: "spirited", v: 0.73 },
  { w: "zestful", v: 0.78 }, { w: "zealous", v: 0.74 },
  { w: "enthusiastic", v: 0.80 }, { w: "keen", v: 0.68 },
  { w: "eager", v: 0.72 }, { w: "willing", v: 0.60 },
  { w: "ready", v: 0.61 }, { w: "charged", v: 0.72 },
  { w: "jazzed", v: 0.79 }, { w: "amped", v: 0.80 },
  // ── Core positive ────────────────────────────────────────────────────────────
  { w: "amazing", v: 0.84 }, { w: "awesome", v: 0.82 },
  { w: "fantastic", v: 0.83 }, { w: "wonderful", v: 0.81 },
  { w: "excellent", v: 0.83 }, { w: "outstanding", v: 0.85 },
  { w: "superb", v: 0.84 }, { w: "brilliant", v: 0.83 },
  { w: "excited", v: 0.79 }, { w: "great", v: 0.74 },
  { w: "happy", v: 0.72 }, { w: "glad", v: 0.68 },
  { w: "good", v: 0.63 }, { w: "motivated", v: 0.76 },
  { w: "proud", v: 0.73 }, { w: "grateful", v: 0.75 },
  { w: "hopeful", v: 0.67 }, { w: "enjoyed", v: 0.71 },
  { w: "enjoy", v: 0.69 }, { w: "better", v: 0.58 },
  { w: "okay", v: 0.47 }, { w: "fine", v: 0.45 },
  { w: "confident", v: 0.74 }, { w: "relieved", v: 0.66 },
  { w: "cheerful", v: 0.77 }, { w: "optimistic", v: 0.72 },
  { w: "content", v: 0.61 }, { w: "well", v: 0.43 },
  { w: "blessed", v: 0.78 }, { w: "love", v: 0.74 },
  { w: "joyful", v: 0.81 }, { w: "joy", v: 0.76 },
  { w: "peaceful", v: 0.71 }, { w: "calm", v: 0.59 },
  { w: "relaxed", v: 0.63 }, { w: "refreshed", v: 0.67 },
  { w: "energized", v: 0.76 }, { w: "inspired", v: 0.78 },
  { w: "encouraged", v: 0.73 }, { w: "empowered", v: 0.77 },
  { w: "determined", v: 0.72 }, { w: "focused", v: 0.67 },
  { w: "productive", v: 0.72 }, { w: "accomplished", v: 0.79 },
  { w: "achieved", v: 0.76 }, { w: "succeed", v: 0.77 },
  { w: "success", v: 0.78 }, { w: "winning", v: 0.79 },
  { w: "progress", v: 0.68 }, { w: "growth", v: 0.69 },
  { w: "improving", v: 0.67 }, { w: "supported", v: 0.69 },
  { w: "appreciated", v: 0.73 }, { w: "valued", v: 0.72 },
  { w: "comfortable", v: 0.62 }, { w: "satisfied", v: 0.68 },
  { w: "fulfilling", v: 0.74 }, { w: "meaningful", v: 0.72 },
  { w: "fun", v: 0.67 }, { w: "laugh", v: 0.66 },
  { w: "smile", v: 0.65 }, { w: "positive", v: 0.64 },
  { w: "nice", v: 0.58 }, { w: "kind", v: 0.61 },
  { w: "caring", v: 0.65 }, { w: "warm", v: 0.63 },
  { w: "welcoming", v: 0.67 }, { w: "inclusive", v: 0.68 },
  { w: "safe", v: 0.63 }, { w: "secure", v: 0.64 },
  { w: "stable", v: 0.60 }, { w: "balanced", v: 0.63 },
  { w: "healthy", v: 0.65 }, { w: "recovered", v: 0.68 },
  { w: "healed", v: 0.70 }, { w: "rested", v: 0.64 },
  { w: "recharged", v: 0.70 }, { w: "revitalized", v: 0.74 },
  { w: "renewed", v: 0.72 }, { w: "restored", v: 0.69 },
  { w: "thriving", v: 0.82 }, { w: "flourishing", v: 0.83 },
  { w: "growing", v: 0.67 }, { w: "learning", v: 0.63 },
  { w: "resilient", v: 0.74 }, { w: "strong", v: 0.69 },
  { w: "capable", v: 0.70 }, { w: "able", v: 0.57 },
  { w: "prepared", v: 0.64 }, { w: "brave", v: 0.72 },
  { w: "courageous", v: 0.75 }, { w: "bold", v: 0.70 },
  { w: "daring", v: 0.69 }, { w: "creative", v: 0.68 },
  { w: "innovative", v: 0.71 }, { w: "collaborative", v: 0.70 },
  { w: "teamwork", v: 0.71 }, { w: "together", v: 0.62 },
  { w: "unity", v: 0.69 }, { w: "harmony", v: 0.73 },
  { w: "synergy", v: 0.72 }, { w: "bonding", v: 0.70 },
  { w: "connected", v: 0.65 }, { w: "belonging", v: 0.72 },
  { w: "engaged", v: 0.66 }, { w: "invested", v: 0.67 },
  { w: "committed", v: 0.68 }, { w: "dedicated", v: 0.71 },
  { w: "passionate", v: 0.76 }, { w: "driven", v: 0.73 },
  { w: "ambitious", v: 0.71 }, { w: "effective", v: 0.70 },
  { w: "efficient", v: 0.68 }, { w: "organized", v: 0.65 },
  { w: "on track", v: 0.69 }, { w: "on point", v: 0.70 },
  { w: "on fire", v: 0.78 }, { w: "perfect", v: 0.79 },
  { w: "ideal", v: 0.72 }, { w: "smooth", v: 0.64 },
  { w: "seamless", v: 0.71 }, { w: "flawless", v: 0.82 },
  { w: "impeccable", v: 0.83 }, { w: "spotless", v: 0.73 },
  { w: "pristine", v: 0.74 }, { w: "reward", v: 0.68 },
  { w: "rewarding", v: 0.73 }, { w: "milestone", v: 0.71 },
  { w: "achievement", v: 0.77 }, { w: "breakthrough", v: 0.79 },
  { w: "triumph", v: 0.82 }, { w: "victory", v: 0.83 },
  { w: "win", v: 0.73 }, { w: "champion", v: 0.80 },
  { w: "legend", v: 0.79 }, { w: "hero", v: 0.76 },
  { w: "superstar", v: 0.82 }, { w: "rockstar", v: 0.83 },
  { w: "star", v: 0.71 }, { w: "genius", v: 0.79 },
  { w: "talented", v: 0.74 }, { w: "skilled", v: 0.69 },
  { w: "expert", v: 0.71 }, { w: "master", v: 0.73 },
  { w: "pro", v: 0.69 }, { w: "ace", v: 0.73 },
  { w: "clutch", v: 0.76 }, { w: "legendary", v: 0.83 },
  { w: "iconic", v: 0.77 }, { w: "peak", v: 0.74 },
  // ── Internet / Gen Z / Millennial slang ─────────────────────────────────────
  { w: "goated", v: 0.89 }, { w: "goat", v: 0.82 },
  { w: "slay", v: 0.83 }, { w: "slaying", v: 0.84 },
  { w: "slayed", v: 0.83 }, { w: "slayed it", v: 0.86 },
  { w: "ate that", v: 0.83 }, { w: "ate and left no crumbs", v: 0.90 },
  { w: "no cap", v: 0.71 }, { w: "nocap", v: 0.71 },
  { w: "bussin", v: 0.83 }, { w: "bussing", v: 0.82 },
  { w: "fire", v: 0.79 }, { w: "w team", v: 0.81 },
  { w: "big w", v: 0.83 }, { w: "poggers", v: 0.82 },
  { w: "gg", v: 0.72 }, { w: "gg ez", v: 0.74 },
  { w: "lets go", v: 0.83 }, { w: "lezgo", v: 0.83 },
  { w: "lets gooo", v: 0.86 }, { w: "let's go", v: 0.83 },
  { w: "yesss", v: 0.81 }, { w: "yasss", v: 0.83 },
  { w: "yass", v: 0.81 }, { w: "yassss", v: 0.84 },
  { w: "yay", v: 0.76 }, { w: "woohoo", v: 0.81 },
  { w: "wohoo", v: 0.80 }, { w: "wahoo", v: 0.79 },
  { w: "hype", v: 0.78 }, { w: "chef kiss", v: 0.86 },
  { w: "immaculate", v: 0.84 }, { w: "based", v: 0.72 },
  { w: "valid", v: 0.61 }, { w: "facts", v: 0.63 },
  { w: "lowkey good", v: 0.68 }, { w: "highkey good", v: 0.76 },
  { w: "highkey happy", v: 0.79 }, { w: "lowkey happy", v: 0.66 },
  { w: "highkey excited", v: 0.82 }, { w: "hits different", v: 0.75 },
  { w: "it hits", v: 0.71 }, { w: "different energy", v: 0.66 },
  { w: "good energy", v: 0.76 }, { w: "main character", v: 0.73 },
  { w: "understood the assignment", v: 0.82 },
  { w: "ate the assignment", v: 0.84 },
  { w: "that's the vibe", v: 0.74 }, { w: "the vibe", v: 0.69 },
  { w: "sending good vibes", v: 0.78 }, { w: "manifesting", v: 0.67 },
  { w: "blessed era", v: 0.81 }, { w: "we ate", v: 0.80 },
  { w: "we won", v: 0.82 }, { w: "we're winning", v: 0.82 },
  { w: "glowed up", v: 0.82 }, { w: "glow up", v: 0.79 },
  { w: "level up", v: 0.78 }, { w: "leveled up", v: 0.81 },
  { w: "grind paying off", v: 0.83 }, { w: "hard work paid off", v: 0.84 },
  { w: "worth the grind", v: 0.81 }, { w: "bet", v: 0.67 },
  { w: "dope", v: 0.74 }, { w: "lowkey dope", v: 0.73 },
  { w: "highkey dope", v: 0.77 }, { w: "so dope", v: 0.78 },
  { w: "real one", v: 0.76 }, { w: "the real mvp", v: 0.82 },
  { w: "mvp", v: 0.78 }, { w: "top tier", v: 0.83 },
  { w: "s tier", v: 0.84 }, { w: "tier list s", v: 0.83 },
  { w: "10/10", v: 0.84 }, { w: "100/100", v: 0.86 },
  { w: "peak performance", v: 0.85 }, { w: "peak form", v: 0.83 },
  { w: "in my element", v: 0.80 }, { w: "in my bag", v: 0.79 },
  { w: "running it up", v: 0.78 }, { w: "going off", v: 0.77 },
  { w: "popping off", v: 0.79 }, { w: "snapped", v: 0.78 },
  { w: "snapped on it", v: 0.82 }, { w: "clapped it", v: 0.77 },
  { w: "wrecked it", v: 0.76 }, { w: "bodied it", v: 0.77 },
  { w: "secured the bag", v: 0.81 }, { w: "bag secured", v: 0.80 },
  { w: "chill", v: 0.56 }, { w: "chilling", v: 0.57 },
  { w: "vibing", v: 0.68 }, { w: "vibe", v: 0.64 },
  { w: "wholesome", v: 0.75 }, { w: "uwu", v: 0.68 },
  { w: "owo", v: 0.63 }, { w: "wholesome af", v: 0.79 },
  { w: "feels good man", v: 0.79 }, { w: "pogchamp", v: 0.80 },
  { w: "hype train", v: 0.80 }, { w: "massive w", v: 0.84 },
  { w: "absolute w", v: 0.85 }, { w: "certified w", v: 0.84 },
  // ── Typos / Informal spellings ───────────────────────────────────────────────
  { w: "hapy", v: 0.69 }, { w: "happpy", v: 0.71 },
  { w: "hapi", v: 0.70 }, { w: "happie", v: 0.70 },
  { w: "happi", v: 0.70 }, { w: "happe", v: 0.68 },
  { w: "excitd", v: 0.76 }, { w: "excitted", v: 0.77 },
  { w: "exited", v: 0.74 }, { w: "excite", v: 0.76 },
  { w: "awsome", v: 0.80 }, { w: "amzing", v: 0.81 },
  { w: "graet", v: 0.71 }, { w: "goood", v: 0.72 },
  { w: "guud", v: 0.61 }, { w: "luv", v: 0.71 },
  { w: "looove", v: 0.80 }, { w: "loove", v: 0.78 },
  { w: "loveee", v: 0.80 }, { w: "loveeee", v: 0.82 },
  { w: "thankfull", v: 0.73 }, { w: "gratefull", v: 0.73 },
  { w: "blesed", v: 0.76 }, { w: "blessedd", v: 0.78 },
  { w: "happyyy", v: 0.74 }, { w: "happyyyy", v: 0.76 },
  { w: "greatt", v: 0.73 }, { w: "greattt", v: 0.75 },
  { w: "amazingg", v: 0.85 }, { w: "amazinggg", v: 0.86 },
  { w: "awesomee", v: 0.83 }, { w: "awesomeee", v: 0.84 },
  { w: "cooool", v: 0.73 }, { w: "coool", v: 0.71 },
  { w: "niice", v: 0.60 }, { w: "niiice", v: 0.62 },
  { w: "perfectt", v: 0.80 }, { w: "perfecto", v: 0.79 },
  { w: "fantastik", v: 0.81 }, { w: "fantastico", v: 0.82 },
  { w: "wunderfull", v: 0.79 }, { w: "wonderfull", v: 0.80 },
  { w: "brillient", v: 0.80 }, { w: "briiliant", v: 0.81 },
  { w: "excellant", v: 0.81 }, { w: "excelent", v: 0.81 },
  { w: "outstandng", v: 0.83 }, { w: "outstandding", v: 0.83 },
  { w: "superbb", v: 0.83 }, { w: "supeerb", v: 0.82 },
  { w: "joyfull", v: 0.80 }, { w: "joyous", v: 0.79 },
  { w: "excstatic", v: 0.90 }, { w: "estatik", v: 0.88 },
  { w: "releeved", v: 0.64 }, { w: "releived", v: 0.65 },
  { w: "confedent", v: 0.72 }, { w: "motivatd", v: 0.74 },
  { w: "motiveted", v: 0.74 }, { w: "inspird", v: 0.76 },
  { w: "inspyred", v: 0.76 }, { w: "energised", v: 0.75 },
  { w: "enegized", v: 0.74 },
  // ── Filipino / Taglish phrases ───────────────────────────────────────────────
  { w: "sobrang saya", v: 0.91 }, { w: "grabe ang saya", v: 0.89 },
  { w: "ang saya saya", v: 0.88 }, { w: "masayang masaya", v: 0.87 },
  { w: "ok naman", v: 0.49 }, { w: "okay naman", v: 0.49 },
  { w: "ayos naman", v: 0.54 }, { w: "okay lang", v: 0.46 },
  { w: "ok lang", v: 0.46 }, { w: "ayos lang", v: 0.51 },
  { w: "nag-eenjoy", v: 0.71 }, { w: "enjoy naman", v: 0.68 },
  { w: "enjoy ako", v: 0.72 }, { w: "nasisiyahan ako", v: 0.76 },
  { w: "masaya ako", v: 0.78 }, { w: "proud ako", v: 0.76 },
  { w: "galing ng team", v: 0.81 }, { w: "love ang team", v: 0.83 },
  { w: "ang galing", v: 0.78 }, { w: "ang saya", v: 0.76 },
  { w: "ang ganda", v: 0.74 }, { w: "bet na bet", v: 0.81 },
  { w: "bet ko", v: 0.74 }, { w: "kaya natin", v: 0.77 },
  { w: "kayang kaya", v: 0.79 }, { w: "kaya ko", v: 0.74 },
  { w: "todo suporta", v: 0.79 }, { w: "maraming salamat", v: 0.74 },
  { w: "oo naman", v: 0.56 }, { w: "oo naman sure", v: 0.64 },
  { w: "sobrang ganda", v: 0.82 }, { w: "ang husay", v: 0.78 },
  { w: "sobrang husay", v: 0.84 }, { w: "grabe ang galing", v: 0.86 },
  { w: "grabe ang husay", v: 0.85 }, { w: "napakagaling", v: 0.83 },
  { w: "napakasaya", v: 0.84 }, { w: "napakaganda", v: 0.82 },
  { w: "ang sarap ng feeling", v: 0.83 }, { w: "sarap ng feeling", v: 0.80 },
  { w: "feeling ko kaya ko", v: 0.79 }, { w: "mahal ko ang team", v: 0.83 },
  { w: "mahal ko kayo", v: 0.82 }, { w: "love ko kayo", v: 0.83 },
  { w: "love ko ang work", v: 0.81 }, { w: "enjoy sa work", v: 0.74 },
  { w: "enjoy ang work", v: 0.73 }, { w: "masaya sa work", v: 0.78 },
  { w: "masaya ako dito", v: 0.80 }, { w: "masaya kami", v: 0.80 },
  { w: "maganda ang araw", v: 0.78 }, { w: "magandang araw", v: 0.74 },
  { w: "produktibo ngayon", v: 0.74 }, { w: "produktibo ako", v: 0.74 },
  { w: "focused ako", v: 0.72 }, { w: "motivated ako", v: 0.78 },
  { w: "inspired ako", v: 0.79 }, { w: "energized ako", v: 0.78 },
  { w: "todo ako", v: 0.73 }, { w: "full force", v: 0.78 },
  { w: "lahat tayo", v: 0.67 }, { w: "sama sama", v: 0.72 },
  { w: "magkakasama", v: 0.71 }, { w: "tulungan tayo", v: 0.72 },
  { w: "susuportahan kita", v: 0.76 }, { w: "susuportahan ko kayo", v: 0.77 },
  { w: "nandito ako", v: 0.66 }, { w: "solid ang team", v: 0.79 },
  { w: "solid tayo", v: 0.77 }, { w: "todo tiwala", v: 0.76 },
  { w: "tiwala ako sa team", v: 0.79 }, { w: "tiwala ako sa inyo", v: 0.79 },
  { w: "pasalamat", v: 0.72 }, { w: "nagpapasalamat", v: 0.74 },
  { w: "nagpapasalamat ako", v: 0.76 }, { w: "thankful ako", v: 0.75 },
  { w: "grateful ako", v: 0.76 }, { w: "blessed ako", v: 0.80 },
  { w: "buti na lang", v: 0.60 }, { w: "suwerte naman", v: 0.67 },
  { w: "swerte ko", v: 0.70 }, { w: "maswerte ako", v: 0.72 },
  { w: "good vibes lang", v: 0.78 }, { w: "positive lang", v: 0.72 },
  { w: "smile lang", v: 0.67 }, { w: "tara na", v: 0.59 },
  { w: "keri", v: 0.65 }, { w: "keri lang", v: 0.67 },
  { w: "kaya yan", v: 0.72 }, { w: "kaya natin yan", v: 0.77 },
  { w: "go lang", v: 0.67 }, { w: "push lang", v: 0.69 },
  { w: "todo push", v: 0.73 }, { w: "push na", v: 0.68 },
  // ── Filipino single words ────────────────────────────────────────────────────
  { w: "masaya", v: 0.78 }, { w: "maganda", v: 0.72 },
  { w: "ayos", v: 0.54 }, { w: "nagagalak", v: 0.77 },
  { w: "excite", v: 0.76 }, { w: "thankful", v: 0.73 },
  { w: "okey", v: 0.47 }, { w: "galing", v: 0.74 },
  { w: "swabe", v: 0.63 }, { w: "saya", v: 0.71 },
  { w: "nasisiyahan", v: 0.74 }, { w: "solid", v: 0.69 },
  { w: "lodi", v: 0.72 }, { w: "haha", v: 0.62 },
  { w: "hahaha", v: 0.67 }, { w: "hahahaha", v: 0.71 },
  { w: "lol", v: 0.59 }, { w: "hehe", v: 0.58 },
  { w: "hihi", v: 0.59 }, { w: "salamat", v: 0.67 },
  { w: "mabuti", v: 0.61 }, { w: "magaling", v: 0.72 },
  { w: "husay", v: 0.74 }, { w: "sulit", v: 0.68 },
  { w: "kaya namin", v: 0.76 }, { w: "tiwala", v: 0.69 },
  { w: "sigla", v: 0.71 }, { w: "sigasig", v: 0.74 },
  { w: "lakas", v: 0.69 }, { w: "tibay", v: 0.68 },
  { w: "tapang", v: 0.70 }, { w: "guts", v: 0.68 },
  { w: "diskarte", v: 0.67 }, { w: "talino", v: 0.72 },
  { w: "kahusayan", v: 0.75 }, { w: "tagumpay", v: 0.80 },
  { w: "panalo", v: 0.79 }, { w: "nananalo", v: 0.78 },
  { w: "nanalo", v: 0.78 }, { w: "sulong", v: 0.72 },
  { w: "tuloy", v: 0.62 }, { w: "tuloy lang", v: 0.68 },
  { w: "laban", v: 0.70 }, { w: "laban lang", v: 0.73 },
  { w: "laban tayo", v: 0.76 }, { w: "kaya", v: 0.63 },
  { w: "kayang-kaya", v: 0.78 }, { w: "malusog", v: 0.63 },
  { w: "maayos", v: 0.60 }, { w: "maliwanag", v: 0.66 },
  { w: "magaan", v: 0.63 }, { w: "masigla", v: 0.71 },
  { w: "buhay na buhay", v: 0.79 }, { w: "buhay", v: 0.57 },
  { w: "sariwa", v: 0.64 }, { w: "fresh", v: 0.65 },
  { w: "kabog", v: 0.78 }, { w: "grabe", v: 0.62 },
  { w: "sarap", v: 0.67 }, { w: "sulit na sulit", v: 0.74 },
  { w: "swak", v: 0.67 }, { w: "perpekto", v: 0.80 },
  { w: "magaling na magaling", v: 0.81 }, { w: "galing na galing", v: 0.82 },
  { w: "winner", v: 0.78 }, { w: "kampeon", v: 0.80 },
  // ── Laughing / Light ─────────────────────────────────────────────────────────
  { w: "hahahahaha", v: 0.73 }, { w: "hahahahahaha", v: 0.74 },
  { w: "lmao", v: 0.62 }, { w: "lmaoo", v: 0.64 },
  { w: "lmaooo", v: 0.65 }, { w: "lmfao", v: 0.63 },
  { w: "rofl", v: 0.66 }, { w: "rotfl", v: 0.66 },
  { w: "dying laughing", v: 0.71 }, { w: "dead", v: 0.62 },
  { w: "im dead", v: 0.64 }, { w: "i'm dead", v: 0.64 },
  { w: "crying laughing", v: 0.70 }, { w: "tears of joy", v: 0.74 },
  { w: "so funny", v: 0.69 }, { w: "too funny", v: 0.69 },
  { w: "hilarious", v: 0.71 }, { w: "cracking up", v: 0.70 },
  { w: "can't stop laughing", v: 0.72 }, { w: "cant stop laughing", v: 0.72 },
  // ── Grateful / Appreciation ───────────────────────────────────────────────────
  { w: "thank you so much", v: 0.82 }, { w: "thanks so much", v: 0.81 },
  { w: "thank you very much", v: 0.80 }, { w: "many thanks", v: 0.74 },
  { w: "so thankful", v: 0.81 }, { w: "very thankful", v: 0.80 },
  { w: "deeply grateful", v: 0.84 }, { w: "truly grateful", v: 0.83 },
  { w: "genuinely grateful", v: 0.83 }, { w: "eternally grateful", v: 0.86 },
  { w: "so appreciative", v: 0.80 }, { w: "really appreciate", v: 0.76 },
  { w: "appreciate it", v: 0.71 }, { w: "appreciate you", v: 0.74 },
  { w: "appreciate everyone", v: 0.78 }, { w: "appreciate the team", v: 0.80 },
];

const negativeWords = [
  // ── Strong negative multi-word phrases ──────────────────────────────────────
{ w: "gago ka", v: 0.88 }, { w: "gago", v: 0.85 },
{ w: "mga gago", v: 0.87 }, { w: "gagong", v: 0.85 },
{ w: "tanga ka", v: 0.87 }, { w: "tanga", v: 0.84 },
{ w: "bobo ka", v: 0.86 }, { w: "bobo", v: 0.83 },
{ w: "ulol ka", v: 0.86 }, { w: "ulol", v: 0.83 },
{ w: "inutil ka", v: 0.85 }, { w: "inutil", v: 0.82 },
{ w: "putang ina", v: 0.95 }, { w: "putangina", v: 0.95 },
{ w: "tang ina", v: 0.94 }, { w: "tangina", v: 0.94 },
{ w: "tangina mo", v: 0.96 }, { w: "tang ina mo", v: 0.96 },
{ w: "puta ka", v: 0.91 }, { w: "puta", v: 0.88 },
{ w: "pakyu", v: 0.90 }, { w: "pakyo", v: 0.90 },
{ w: "leche ka", v: 0.85 }, { w: "leche", v: 0.82 },
{ w: "lintik ka", v: 0.85 }, { w: "lintik", v: 0.82 },
{ w: "kupal", v: 0.86 }, { w: "kupal ka", v: 0.88 },
{ w: "tarantado", v: 0.87 }, { w: "tarantado ka", v: 0.89 },
{ w: "bwisit", v: 0.82 }, { w: "bwisit ka", v: 0.84 },
{ w: "hayop ka", v: 0.87 }, { w: "hayop", v: 0.83 },
{ w: "walang hiya", v: 0.84 }, { w: "walang hiya ka", v: 0.86 },
{ w: "walang kwenta ka", v: 0.87 }, { w: "walang silbi ka", v: 0.86 },
{ w: "basura ka", v: 0.88 }, { w: "dumi ka", v: 0.86 },
// ── Bisaya curse words ────────────────────────────────────────────────────────
{ w: "pisti", v: 0.84 }, { w: "pisti ka", v: 0.86 },
{ w: "yawa", v: 0.84 }, { w: "yawa ka", v: 0.86 },
{ w: "bugo ka", v: 0.85 }, { w: "bugo", v: 0.82 },
// ── English severe profanity ──────────────────────────────────────────────────
{ w: "fuck you", v: 0.95 }, { w: "fuck off", v: 0.93 },
{ w: "fuck this", v: 0.88 }, { w: "screw you", v: 0.87 },
{ w: "go to hell", v: 0.89 }, { w: "i hate you", v: 0.91 },
{ w: "you're useless", v: 0.89 }, { w: "youre useless", v: 0.89 },
{ w: "you're worthless", v: 0.91 }, { w: "youre worthless", v: 0.91 },
{ w: "you're stupid", v: 0.87 }, { w: "youre stupid", v: 0.87 },
{ w: "you're an idiot", v: 0.88 }, { w: "youre an idiot", v: 0.88 },
{ w: "you're trash", v: 0.89 }, { w: "youre trash", v: 0.89 },
{ w: "you're garbage", v: 0.89 }, { w: "youre garbage", v: 0.89 },
{ w: "you're pathetic", v: 0.88 }, { w: "youre pathetic", v: 0.88 },
{ w: "asshole", v: 0.88 }, { w: "bastard", v: 0.86 },
{ w: "son of a bitch", v: 0.92 }, { w: "piece of shit", v: 0.91 },
{ w: "motherfucker", v: 0.95 }, { w: "shut up", v: 0.78 },
  { w: "extremely sad", v: 0.94 }, { w: "very sad", v: 0.87 },
  { w: "so stressed", v: 0.89 }, { w: "very stressed", v: 0.86 },
  { w: "super stressed", v: 0.89 }, { w: "sobrang stressed", v: 0.90 },
  { w: "so tired", v: 0.81 }, { w: "very tired", v: 0.83 },
  { w: "super tired", v: 0.84 }, { w: "sobrang pagod", v: 0.87 },
  { w: "so sad", v: 0.86 }, { w: "super sad", v: 0.88 },
  { w: "really sad", v: 0.85 }, { w: "really stressed", v: 0.84 },
  { w: "really tired", v: 0.80 }, { w: "really bad", v: 0.79 },
  { w: "so bad", v: 0.78 }, { w: "very bad", v: 0.81 },
  { w: "feeling bad", v: 0.74 }, { w: "feel bad", v: 0.72 },
  { w: "feeling down", v: 0.76 }, { w: "feeling low", v: 0.74 },
  { w: "feeling lost", v: 0.77 }, { w: "feeling empty", v: 0.79 },
  { w: "feeling hopeless", v: 0.88 }, { w: "feeling helpless", v: 0.85 },
  { w: "feeling worthless", v: 0.89 }, { w: "feeling useless", v: 0.87 },
  { w: "feeling broken", v: 0.86 }, { w: "feeling defeated", v: 0.84 },
  { w: "feeling trapped", v: 0.85 }, { w: "feeling stuck", v: 0.78 },
  { w: "feeling anxious", v: 0.79 }, { w: "feeling stressed", v: 0.80 },
  { w: "feeling overwhelmed", v: 0.84 }, { w: "feeling exhausted", v: 0.80 },
  { w: "feel overwhelmed", v: 0.83 }, { w: "feel exhausted", v: 0.79 },
  { w: "cant cope", v: 0.86 }, { w: "can't cope", v: 0.86 },
  { w: "can't handle", v: 0.84 }, { w: "cant handle", v: 0.84 },
  { w: "can't take it", v: 0.85 }, { w: "cant take it", v: 0.85 },
  { w: "too much", v: 0.72 }, { w: "way too much", v: 0.78 },
  { w: "can't breathe", v: 0.83 }, { w: "cant breathe", v: 0.83 },
  { w: "falling apart", v: 0.87 }, { w: "breaking down", v: 0.88 },
  { w: "breaking apart", v: 0.87 }, { w: "coming undone", v: 0.85 },
  { w: "at my breaking point", v: 0.91 }, { w: "at my limit", v: 0.84 },
  { w: "at the end of my rope", v: 0.88 }, { w: "at my wit's end", v: 0.86 },
  { w: "hit rock bottom", v: 0.90 }, { w: "rock bottom", v: 0.89 },
  { w: "hitting rock bottom", v: 0.90 }, { w: "spiraling", v: 0.84 },
  { w: "losing my mind", v: 0.87 }, { w: "going crazy", v: 0.81 },
  { w: "going insane", v: 0.82 }, { w: "about to snap", v: 0.86 },
  { w: "on the verge", v: 0.80 }, { w: "can't do this anymore", v: 0.89 },
  { w: "cant do this anymore", v: 0.89 }, { w: "done with this", v: 0.80 },
  { w: "over this", v: 0.74 }, { w: "sick of this", v: 0.79 },
  { w: "fed up", v: 0.80 }, { w: "fed up with", v: 0.82 },
  { w: "had enough", v: 0.80 }, { w: "have had enough", v: 0.81 },
  { w: "not okay", v: 0.78 }, { w: "not ok", v: 0.77 },
  { w: "not fine", v: 0.74 }, { w: "not good", v: 0.71 },
  { w: "not well", v: 0.72 }, { w: "not happy", v: 0.74 },
  { w: "hindi masaya", v: 0.81 }, { w: "di masaya", v: 0.81 },
  { w: "di okay", v: 0.76 }, { w: "di ok", v: 0.75 },
  { w: "cant do this", v: 0.86 }, { w: "cannot do this", v: 0.86 },
  { w: "give up", v: 0.87 }, { w: "giving up", v: 0.86 },
  { w: "want to quit", v: 0.88 }, { w: "want to give up", v: 0.89 },
  { w: "ayaw ko na", v: 0.88 }, { w: "hindi ko kaya", v: 0.85 },
  { w: "di ko kaya", v: 0.84 }, { w: "wala na ako", v: 0.83 },
  { w: "give up na", v: 0.87 }, { w: "surrender na", v: 0.85 },
  { w: "no motivation", v: 0.81 }, { w: "no energy", v: 0.78 },
  { w: "no hope", v: 0.86 }, { w: "losing hope", v: 0.84 },
  { w: "lost hope", v: 0.85 }, { w: "burnt out", v: 0.87 },
  { w: "burned out", v: 0.86 }, { w: "burn out", v: 0.84 },
  { w: "worst day", v: 0.89 }, { w: "bad day", v: 0.73 },
  { w: "rough day", v: 0.71 }, { w: "tough day", v: 0.69 },
  { w: "bad vibes", v: 0.72 }, { w: "negative vibes", v: 0.74 },
  { w: "low spirits", v: 0.76 }, { w: "down in the dumps", v: 0.82 },
  { w: "too much pressure", v: 0.86 }, { w: "so much pressure", v: 0.84 },
  { w: "under too much pressure", v: 0.87 }, { w: "immense pressure", v: 0.84 },
  { w: "not great", v: 0.68 }, { w: "di maayos", v: 0.74 },
  { w: "may problema", v: 0.67 }, { w: "malaking problema", v: 0.79 },
  { w: "walang motivation", v: 0.79 }, { w: "walang energy", v: 0.77 },
  { w: "walang gana", v: 0.76 }, { w: "wala nang gana", v: 0.79 },
  { w: "ayaw na", v: 0.82 }, { w: "suko na", v: 0.84 },
  { w: "give up na ako", v: 0.87 }, { w: "quit na", v: 0.83 },
  { w: "naiiyak na ako", v: 0.83 }, { w: "iyak na lang", v: 0.81 },
  { w: "umiyak ako", v: 0.79 }, { w: "malungkot ako", v: 0.78 },
  { w: "nalulungkot ako", v: 0.79 }, { w: "galit ako", v: 0.77 },
  { w: "naiinis ako", v: 0.74 }, { w: "stressed out ako", v: 0.84 },
  { w: "burn out na ako", v: 0.87 }, { w: "nag-aalala ako", v: 0.76 },
  { w: "nahihirapan ako", v: 0.78 }, { w: "hindi ko na kaya", v: 0.87 },
  { w: "di ko na kaya", v: 0.86 }, { w: "pagod na pagod", v: 0.86 },
  { w: "napapagod na ako", v: 0.82 }, { w: "wala na akong", v: 0.83 },
  { w: "sobrang lungkot", v: 0.91 }, { w: "grabe ang lungkot", v: 0.89 },
  { w: "sobrang hirap", v: 0.88 }, { w: "grabe ang hirap", v: 0.87 },
  { w: "grabe ang pagod", v: 0.85 }, { w: "gusto ko nang sumuko", v: 0.91 },
  { w: "hindi ko comfortable", v: 0.71 }, { w: "hindi motivated", v: 0.78 },
  { w: "di motivated", v: 0.78 }, { w: "nakakainis", v: 0.72 },
  { w: "nakakastress", v: 0.79 }, { w: "nakakaburnout", v: 0.84 },
  { w: "nakakapraning", v: 0.76 }, { w: "nakakabaliw", v: 0.79 },
  { w: "nakakasawa", v: 0.72 }, { w: "nakakaiyak", v: 0.80 },
  { w: "nakakalungkot", v: 0.79 }, { w: "nakakainis talaga", v: 0.77 },
  { w: "ang hirap ng buhay", v: 0.84 }, { w: "mahirap ang buhay", v: 0.81 },
  { w: "ang lungkot", v: 0.76 }, { w: "ang sakit", v: 0.79 },
  { w: "ang hirap", v: 0.76 }, { w: "ang pagod", v: 0.73 },
  { w: "di ko na", v: 0.81 }, { w: "ayoko na", v: 0.83 },
  { w: "ayoko na talaga", v: 0.87 }, { w: "sawa na ako", v: 0.82 },
  { w: "napagod na ako", v: 0.82 }, { w: "burnout na ako", v: 0.87 },
  { w: "pagod na ako", v: 0.81 }, { w: "sobrang pagod ko", v: 0.86 },
  { w: "grabe ang stress", v: 0.87 }, { w: "sobrang stress", v: 0.88 },
  { w: "grabe ang pressure", v: 0.86 }, { w: "sobrang pressure", v: 0.87 },
  // ── English negative single words ────────────────────────────────────────────
  { w: "hopeless", v: 0.91 }, { w: "depressed", v: 0.92 },
  { w: "terrible", v: 0.88 }, { w: "hate", v: 0.84 },
  { w: "miserable", v: 0.87 }, { w: "overwhelmed", v: 0.83 },
  { w: "exhausted", v: 0.79 }, { w: "burnout", v: 0.86 },
  { w: "frustrated", v: 0.81 }, { w: "anxious", v: 0.78 },
  { w: "worried", v: 0.74 }, { w: "struggling", v: 0.77 },
  { w: "broken", v: 0.85 }, { w: "empty", v: 0.76 },
  { w: "lonely", v: 0.75 }, { w: "lost", v: 0.67 },
  { w: "scared", v: 0.73 }, { w: "afraid", v: 0.72 },
  { w: "stuck", v: 0.68 }, { w: "helpless", v: 0.82 },
  { w: "drained", v: 0.78 }, { w: "upset", v: 0.74 },
  { w: "disappointed", v: 0.73 }, { w: "uncomfortable", v: 0.64 },
  { w: "sad", v: 0.71 }, { w: "stressed", v: 0.76 },
  { w: "tired", v: 0.57 }, { w: "bad", v: 0.61 },
  { w: "angry", v: 0.79 }, { w: "lacking", v: 0.63 },
  { w: "problem", v: 0.59 }, { w: "difficult", v: 0.62 },
  { w: "hard", v: 0.54 }, { w: "pressure", v: 0.67 },
  { w: "pain", v: 0.76 }, { w: "hurt", v: 0.74 },
  { w: "fail", v: 0.72 }, { w: "failure", v: 0.78 },
  { w: "useless", v: 0.84 }, { w: "worthless", v: 0.87 },
  { w: "weak", v: 0.69 }, { w: "incompetent", v: 0.79 },
  { w: "behind", v: 0.62 }, { w: "delayed", v: 0.63 },
  { w: "regret", v: 0.74 }, { w: "mistake", v: 0.67 },
  { w: "wrong", v: 0.63 }, { w: "confused", v: 0.64 },
  { w: "uncertain", v: 0.61 }, { w: "doubt", v: 0.64 },
  { w: "insecure", v: 0.74 }, { w: "unappreciated", v: 0.79 },
  { w: "ignored", v: 0.74 }, { w: "excluded", v: 0.76 },
  { w: "isolated", v: 0.77 }, { w: "unmotivated", v: 0.76 },
  { w: "demotivated", v: 0.78 }, { w: "discouraged", v: 0.76 },
  { w: "unfair", v: 0.71 }, { w: "neglected", v: 0.74 },
  { w: "toxic", v: 0.82 }, { w: "tense", v: 0.67 },
  { w: "conflict", v: 0.72 }, { w: "argument", v: 0.73 },
  { w: "drama", v: 0.66 }, { w: "issue", v: 0.57 },
  { w: "worry", v: 0.71 }, { w: "fear", v: 0.73 },
  { w: "nervous", v: 0.69 }, { w: "panic", v: 0.81 },
  { w: "crisis", v: 0.82 }, { w: "breakdown", v: 0.87 },
  { w: "demoralized", v: 0.81 }, { w: "disengaged", v: 0.72 },
  { w: "undervalued", v: 0.76 }, { w: "hostile", v: 0.81 },
  { w: "defeated", v: 0.82 }, { w: "crushed", v: 0.83 },
  { w: "shattered", v: 0.85 }, { w: "devastated", v: 0.90 },
  { w: "heartbroken", v: 0.88 }, { w: "grief", v: 0.84 },
  { w: "grief-stricken", v: 0.89 }, { w: "mourning", v: 0.81 },
  { w: "misery", v: 0.86 }, { w: "anguish", v: 0.88 },
  { w: "agony", v: 0.89 }, { w: "torment", v: 0.87 },
  { w: "suffering", v: 0.84 }, { w: "despair", v: 0.90 },
  { w: "despairing", v: 0.89 }, { w: "hopelessness", v: 0.91 },
  { w: "numb", v: 0.75 }, { w: "hollow", v: 0.76 },
  { w: "void", v: 0.74 }, { w: "dark", v: 0.69 },
  { w: "darkness", v: 0.73 }, { w: "bleak", v: 0.79 },
  { w: "grim", v: 0.76 }, { w: "gloomy", v: 0.74 },
  { w: "sullen", v: 0.72 }, { w: "dismal", v: 0.77 },
  { w: "dreadful", v: 0.83 }, { w: "awful", v: 0.82 },
  { w: "horrific", v: 0.87 }, { w: "horrible", v: 0.85 },
  { w: "unbearable", v: 0.88 }, { w: "intolerable", v: 0.86 },
  { w: "insufferable", v: 0.85 }, { w: "excruciating", v: 0.89 },
  { w: "dreading", v: 0.79 }, { w: "dread", v: 0.78 },
  { w: "apprehensive", v: 0.73 }, { w: "uneasy", v: 0.69 },
  { w: "restless", v: 0.65 }, { w: "disquiet", v: 0.70 },
  { w: "unsettled", v: 0.68 }, { w: "rattled", v: 0.72 },
  { w: "shaken", v: 0.74 }, { w: "disturbed", v: 0.76 },
  { w: "troubled", v: 0.74 }, { w: "distressed", v: 0.81 },
  { w: "resentful", v: 0.79 }, { w: "bitter", v: 0.77 },
  { w: "bitterness", v: 0.78 }, { w: "furious", v: 0.85 },
  { w: "enraged", v: 0.88 }, { w: "livid", v: 0.86 },
  { w: "fuming", v: 0.84 }, { w: "seething", v: 0.85 },
  { w: "irate", v: 0.83 }, { w: "outraged", v: 0.86 },
  { w: "betrayed", v: 0.84 }, { w: "lied to", v: 0.81 },
  { w: "cheated", v: 0.80 }, { w: "backstabbed", v: 0.85 },
  { w: "manipulated", v: 0.82 }, { w: "disrespected", v: 0.81 },
  { w: "humiliated", v: 0.85 }, { w: "embarrassed", v: 0.72 },
  { w: "ashamed", v: 0.78 }, { w: "shame", v: 0.76 },
  { w: "guilt", v: 0.73 }, { w: "guilty", v: 0.74 },
  { w: "self-doubt", v: 0.78 }, { w: "self-loathing", v: 0.88 },
  { w: "self-hatred", v: 0.90 }, { w: "self-blame", v: 0.82 },
  { w: "failure mode", v: 0.82 }, { w: "can't win", v: 0.82 },
  { w: "no way out", v: 0.87 }, { w: "trapped", v: 0.84 },
  { w: "cornered", v: 0.80 }, { w: "powerless", v: 0.83 },
  { w: "insignificant", v: 0.79 }, { w: "invisible", v: 0.74 },
  { w: "unheard", v: 0.76 }, { w: "unseen", v: 0.73 },
  { w: "unloved", v: 0.83 }, { w: "unwanted", v: 0.82 },
  { w: "disposable", v: 0.81 }, { w: "replaceable", v: 0.72 },
  { w: "burden", v: 0.80 }, { w: "nuisance", v: 0.74 },
  { w: "loser", v: 0.81 }, { w: "pathetic", v: 0.84 },
  { w: "pitiful", v: 0.81 }, { w: "miserable failure", v: 0.91 },
  { w: "total failure", v: 0.87 },
  // ── Internet slang negative ──────────────────────────────────────────────────
  { w: "l team", v: 0.79 }, { w: "big l", v: 0.81 },
  { w: "took an l", v: 0.78 }, { w: "dead inside", v: 0.86 },
  { w: "its over", v: 0.83 }, { w: "it's over", v: 0.83 },
  { w: "we're cooked", v: 0.82 }, { w: "we are cooked", v: 0.82 },
  { w: "cooked", v: 0.74 }, { w: "mid", v: 0.63 },
  { w: "trash", v: 0.79 }, { w: "garbage", v: 0.79 },
  { w: "not it", v: 0.69 }, { w: "fml", v: 0.84 },
  { w: "ugh", v: 0.66 }, { w: "ughhh", v: 0.71 },
  { w: "oof", v: 0.63 }, { w: "yikes", v: 0.68 },
  { w: "smh", v: 0.67 }, { w: "bruh", v: 0.58 },
  { w: "bruhhh", v: 0.64 }, { w: "ngl this sucks", v: 0.80 },
  { w: "this sucks", v: 0.79 }, { w: "sucks", v: 0.74 },
  { w: "lowkey sucks", v: 0.72 }, { w: "highkey sucks", v: 0.78 },
  { w: "massive l", v: 0.84 }, { w: "absolute l", v: 0.85 },
  { w: "certified l", v: 0.84 }, { w: "ratio", v: 0.67 },
  { w: "ratioed", v: 0.71 }, { w: "skill issue", v: 0.69 },
  { w: "cope", v: 0.64 }, { w: "copium", v: 0.70 },
  { w: "on a bad one", v: 0.76 }, { w: "having a bad one", v: 0.76 },
  { w: "rough one", v: 0.69 }, { w: "tough one", v: 0.68 },
  { w: "not vibing", v: 0.71 }, { w: "not feeling it", v: 0.74 },
  { w: "not in the mood", v: 0.70 }, { w: "off day", v: 0.68 },
  { w: "off mood", v: 0.69 }, { w: "bad mood", v: 0.76 },
  { w: "in my feels", v: 0.72 }, { w: "down bad", v: 0.79 },
  { w: "going through it", v: 0.80 }, { w: "in a dark place", v: 0.87 },
  { w: "dark times", v: 0.83 }, { w: "rough patch", v: 0.74 },
  { w: "hard times", v: 0.77 }, { w: "struggle bus", v: 0.76 },
  { w: "on the struggle bus", v: 0.77 }, { w: "barely surviving", v: 0.84 },
  { w: "just surviving", v: 0.76 }, { w: "barely getting by", v: 0.80 },
  { w: "just getting by", v: 0.72 }, { w: "running on empty", v: 0.83 },
  { w: "no gas left", v: 0.81 }, { w: "tank is empty", v: 0.80 },
  { w: "hitting a wall", v: 0.78 }, { w: "hit a wall", v: 0.78 },
  { w: "spinning out", v: 0.82 }, { w: "unraveling", v: 0.83 },
  { w: "losing it", v: 0.80 }, { w: "losing myself", v: 0.81 },
  { w: "lost myself", v: 0.80 }, { w: "not myself", v: 0.74 },
  { w: "not me", v: 0.62 }, { w: "out of it", v: 0.68 },
  { w: "zoned out", v: 0.65 }, { w: "checked out", v: 0.71 },
  { w: "mentally checked out", v: 0.78 }, { w: "mentally drained", v: 0.81 },
  { w: "emotionally drained", v: 0.82 }, { w: "physically drained", v: 0.79 },
  { w: "totally drained", v: 0.82 }, { w: "completely drained", v: 0.83 },
  // ── Typos ────────────────────────────────────────────────────────────────────
  { w: "sadd", v: 0.73 }, { w: "saddd", v: 0.76 },
  { w: "tierd", v: 0.55 }, { w: "stresed", v: 0.74 },
  { w: "stressedd", v: 0.78 }, { w: "stresssed", v: 0.78 },
  { w: "anxous", v: 0.75 }, { w: "anxiuos", v: 0.76 },
  { w: "overwelmed", v: 0.81 }, { w: "ovewhelmed", v: 0.81 },
  { w: "overhelmed", v: 0.80 }, { w: "overhwelmed", v: 0.81 },
  { w: "exausted", v: 0.77 }, { w: "exhaustd", v: 0.77 },
  { w: "exhuasted", v: 0.78 }, { w: "frustarted", v: 0.79 },
  { w: "fustrated", v: 0.78 }, { w: "frustrted", v: 0.79 },
  { w: "deppressed", v: 0.90 }, { w: "depresed", v: 0.89 },
  { w: "depresssed", v: 0.90 }, { w: "depresd", v: 0.88 },
  { w: "hopeles", v: 0.89 }, { w: "lonley", v: 0.73 },
  { w: "loneley", v: 0.73 }, { w: "dissapointed", v: 0.71 },
  { w: "disapointed", v: 0.71 }, { w: "wurried", v: 0.72 },
  { w: "worreid", v: 0.72 }, { w: "panik", v: 0.79 },
  { w: "pannick", v: 0.80 }, { w: "panick", v: 0.80 },
  { w: "panicc", v: 0.79 }, { w: "angrey", v: 0.77 },
  { w: "angree", v: 0.77 }, { w: "angrry", v: 0.78 },
  { w: "madd", v: 0.76 }, { w: "maddd", v: 0.78 },
  { w: "realy sad", v: 0.83 }, { w: "verry sad", v: 0.85 },
  { w: "sooo tired", v: 0.81 }, { w: "sooo stressed", v: 0.87 },
  { w: "sooooo tired", v: 0.82 }, { w: "tiredd", v: 0.57 },
  { w: "tireddd", v: 0.60 }, { w: "stressful", v: 0.76 },
  { w: "stressfully", v: 0.77 }, { w: "boredd", v: 0.59 },
  { w: "boreddd", v: 0.61 }, { w: "scareedd", v: 0.73 },
  { w: "frighten", v: 0.72 }, { w: "terrfied", v: 0.84 },
  { w: "terrifed", v: 0.84 }, { w: "absolutley terrible", v: 0.87 },
  { w: "absolutly horrible", v: 0.84 }, { w: "horribl", v: 0.84 },
  { w: "awfull", v: 0.81 }, { w: "terribl", v: 0.87 },
  { w: "miserble", v: 0.85 }, { w: "misearble", v: 0.85 },
  { w: "misserble", v: 0.85 },
  // ── Filipino single words ────────────────────────────────────────────────────
  { w: "malungkot", v: 0.78 }, { w: "lungkot", v: 0.74 },
  { w: "pagod", v: 0.67 }, { w: "napagod", v: 0.71 },
  { w: "naiinis", v: 0.74 }, { w: "galit", v: 0.79 },
  { w: "nalulungkot", v: 0.77 }, { w: "nag-aalala", v: 0.76 },
  { w: "nahihirapan", v: 0.78 }, { w: "hirap", v: 0.69 },
  { w: "praning", v: 0.71 }, { w: "balisa", v: 0.73 },
  { w: "takot", v: 0.72 }, { w: "masakit", v: 0.77 },
  { w: "sakit", v: 0.73 }, { w: "problema", v: 0.64 },
  { w: "nahihiya", v: 0.67 }, { w: "nakakalungkot", v: 0.76 },
  { w: "nakakasawa", v: 0.71 }, { w: "naiiyak", v: 0.78 },
  { w: "iyak", v: 0.73 }, { w: "umiyak", v: 0.76 },
  { w: "suko", v: 0.79 }, { w: "sumuko", v: 0.82 },
  { w: "sablay", v: 0.72 }, { w: "palpak", v: 0.74 },
  { w: "bagsak", v: 0.76 }, { w: "bigo", v: 0.76 },
  { w: "nabigo", v: 0.77 }, { w: "nagsisi", v: 0.72 },
  { w: "walang", v: 0.54 }, { w: "wala", v: 0.51 },
  { w: "sawa", v: 0.67 }, { w: "badtrip", v: 0.76 },
  { w: "bad trip", v: 0.75 }, { w: "hassle", v: 0.63 },
  { w: "tamad", v: 0.58 }, { w: "inggit", v: 0.64 },
  { w: "asar", v: 0.73 }, { w: "nakakaasar", v: 0.75 },
  { w: "naaasar", v: 0.74 }, { w: "inis", v: 0.70 },
  { w: "lubog", v: 0.74 }, { w: "nalubog", v: 0.75 },
  { w: "talunan", v: 0.78 }, { w: "talo", v: 0.72 },
  { w: "natalo", v: 0.73 }, { w: "patay", v: 0.71 },
  { w: "bangon", v: 0.61 }, { w: "bumabagsak", v: 0.79 },
  { w: "bumagsak", v: 0.78 }, { w: "nalulunod", v: 0.82 },
  { w: "napapagod", v: 0.75 }, { w: "napapahirapan", v: 0.79 },
  { w: "naguguluhan", v: 0.72 }, { w: "nalilito", v: 0.70 },
  { w: "nangangamba", v: 0.76 }, { w: "natatakot", v: 0.75 },
  { w: "nababahala", v: 0.75 }, { w: "naiinip", v: 0.66 },
  { w: "nagagalit", v: 0.78 }, { w: "luha", v: 0.74 },
  { w: "luhaan", v: 0.78 }, { w: "iyakan", v: 0.76 },
  { w: "dalamhati", v: 0.84 }, { w: "kalungkutan", v: 0.82 },
  { w: "kalungkot", v: 0.80 }, { w: "kabiguan", v: 0.80 },
  { w: "pagkabigo", v: 0.81 }, { w: "pagod na pagod ako", v: 0.87 },
  { w: "haggard", v: 0.74 }, { w: "gasgas", v: 0.70 },
  { w: "laos", v: 0.69 }, { w: "sawang-sawa", v: 0.81 },
  { w: "sawang sawa", v: 0.81 }, { w: "sawa na sawa", v: 0.82 },
  { w: "ubos na ubos", v: 0.83 }, { w: "wala nang lakas", v: 0.83 },
  { w: "wala nang pag-asa", v: 0.88 }, { w: "wala nang sigla", v: 0.80 },
  { w: "wala nang gana", v: 0.79 }, { w: "wala nang motivation", v: 0.81 },
  { w: "wala nang energy", v: 0.79 },
];