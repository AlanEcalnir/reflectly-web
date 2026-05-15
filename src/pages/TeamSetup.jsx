export default function TeamSetup({ onJoin, onCreate, onSkip }) {
  return (
    <div className="setup-layout">
      <div className="setup-box">
        <div className="setup-logo">
          <div className="logo-icon">✏️</div>
          <span>Reflectly</span>
        </div>

        <h1 className="setup-title">Set up your team space</h1>
        <p className="setup-subtitle">
          Connect with your team to share feedback and track sentiment together.
        </p>

        <button className="choice-btn" onClick={onCreate}>
          <span>Create a Team</span>
          <span className="arrow">›</span>
        </button>

        <button className="choice-btn" onClick={onJoin}>
          <span>Join a Team</span>
          <span className="arrow">›</span>
        </button>

        <p className="divider-text">
          or{" "}
          <button className="link-btn" onClick={onSkip}>
            skip for now
          </button>
        </p>
      </div>
    </div>
  );
}
