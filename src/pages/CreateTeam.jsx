import { useState } from "react";
import { supabase } from "../supabase";

const COLORS = [
  { cls: "swatch-navy",   value: "#1e2140" },
  { cls: "swatch-orange", value: "#e8692a" },
  { cls: "swatch-teal",   value: "#1e7d6b" },
  { cls: "swatch-red",    value: "#e84040" },
  { cls: "swatch-blue",   value: "#3a6fd8" },
];

// Generate a random 6-character invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function CreateTeam({ user, onDone, onBack }) {
  const [name, setName]     = useState("");
  const [desc, setDesc]     = useState("");
  const [color, setColor]   = useState(COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handleCreate = async () => {
    setError("");

    if (!name.trim()) {
      setError("Please enter a team name.");
      return;
    }

    setLoading(true);

    // Generate unique invite code
    const inviteCode = generateInviteCode();

    // Insert team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: name.trim(),
        description: desc.trim(),
        color,
        code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single();

    if (teamError) {
      setError(teamError.message);
      setLoading(false);
      return;
    }

    // Add creator as a team member
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: team.id,
        user_id: user.id,
      });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    alert(`Team created! Your invite code is: ${inviteCode}\nShare this with your team members.`);
    onDone();
  };

  return (
    <div className="setup-layout">
      <div className="setup-box">
        <button className="back-btn" onClick={onBack}>
          ‹ Back
        </button>

        <h1 className="setup-title">Create a Team</h1>
        <p className="setup-subtitle">Set up a space for your team to reflect together.</p>

        {error && <p style={{ color: "red", fontSize: "14px" }}>{error}</p>}

        <div className="field">
          <label>Team Name</label>
          <input
            type="text"
            placeholder="e.g. Code A"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Description</label>
          <input
            type="text"
            placeholder="e.g. BSCS 2-A project group..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Team Color</label>
          <div className="color-swatches">
            {COLORS.map((c) => (
              <div
                key={c.value}
                className={`swatch ${c.cls}${color === c.value ? " selected" : ""}`}
                onClick={() => setColor(c.value)}
              />
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: 24 }}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Team"}
        </button>
      </div>
    </div>
  );
}