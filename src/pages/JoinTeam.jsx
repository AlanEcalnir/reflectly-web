import { useState } from "react";
import { supabase } from "../supabase";

export default function JoinTeam({ user, onDone, onBack }) {
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleJoin = async () => {
    setError("");

    if (!code.trim()) {
      setError("Please enter an invite code.");
      return;
    }

    setLoading(true);

    // Find team by code
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (teamError || !team) {
      setError("Invalid invite code. Please check and try again.");
      setLoading(false);
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", team.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      setError("You are already a member of this team.");
      setLoading(false);
      return;
    }

    // Join the team
    const { error: joinError } = await supabase
      .from("team_members")
      .insert({
        team_id: team.id,
        user_id: user.id,
      });

    if (joinError) {
      setError(joinError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    alert(`Successfully joined "${team.name}"!`);
    onDone();
  };

  return (
    <div className="setup-layout">
      <div className="setup-box">
        <button className="back-btn" onClick={onBack}>
          ‹ Back
        </button>

        <h1 className="setup-title">Join your team using an invite code</h1>
        <p className="setup-subtitle">Ask your team leader for the invite code.</p>

        {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

        <div className="field">
          <label>Invite Code</label>
          <input
            className="invite-code-input"
            type="text"
            placeholder="e.g. RF4X92"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: 8 }}
          onClick={handleJoin}
          disabled={loading}
        >
          {loading ? "Joining..." : "Join Team"}
        </button>
      </div>
    </div>
  );
}