import { useState } from "react";

// ── SVG Icon Components ──────────────────────────────────────────────────────

const RocketIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 2C12 2 7 6.5 7 13a5 5 0 0 0 10 0c0-6.5-5-11-5-11Z"
      stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={color} fillOpacity="0.12" />
    <path d="M9 13c0-1.657.672-3.157 1.757-4.243"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="13" r="1.5" fill={color} />
    <path d="M7 15l-2.5 2.5M17 15l2.5 2.5"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9 19c0 1.105 1.343 2 3 2s3-.895 3-2"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ChatIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z"
      stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill={color} fillOpacity="0.12" />
    <path d="M8 10h8M8 14h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LockIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2"
      stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12" />
    <path d="M8 11V7a4 4 0 1 1 8 0v4"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1.5" fill={color} />
    <path d="M12 17.5v1.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ChartIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="3" y="14" width="4" height="7" rx="1"
      fill={color} fillOpacity="0.5" stroke={color} strokeWidth="1.8" />
    <rect x="10" y="9" width="4" height="12" rx="1"
      fill={color} fillOpacity="0.8" stroke={color} strokeWidth="1.8" />
    <rect x="17" y="4" width="4" height="17" rx="1"
      fill={color} stroke={color} strokeWidth="1.8" />
    <path d="M2 21h20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LifebuoyIcon = ({ size = 36, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="10"
      stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.08" />
    <circle cx="12" cy="12" r="4"
      stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.15" />
    <path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M19.07 4.93l-4.24 4.24M9.17 14.83l-4.24 4.24"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const EnvelopeIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2"
      stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12" />
    <path d="M3 8l9 6 9-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── FAQ Data ─────────────────────────────────────────────────────────────────

const faqs = [
  {
    category: "Getting Started",
    icon: RocketIcon,
    items: [
      {
        q: "How do I create a team?",
        a: "Go to Home and click '+ Create a Team'. Fill in your team name, description, and pick a color. A unique invite code will be generated automatically that you can share with your teammates."
      },
      {
        q: "How do I join a team?",
        a: "Click '+ Join a Team' on the Home page. Enter the invite code given to you by your team leader and you'll be added instantly."
      },
      {
        q: "Can I be in multiple teams?",
        a: "Yes! You can join or create as many teams as you need. Switch between them on the Home page by clicking on any team in the My Teams list."
      },
    ]
  },
  {
    category: "Submitting Feedback",
    icon: ChatIcon,
    items: [
      {
        q: "How do I submit feedback?",
        a: "Click 'Submit' in the navbar. Select your current mood, type your thoughts, choose which team to submit to, and hit Submit Feedback."
      },
      {
        q: "How does the AI sentiment analysis work?",
        a: "When you submit feedback, our AI reads your message and detects the emotional tone — whether it's positive, negative, or neutral. It also gives a score and summary to help your team understand the overall vibe."
      },
      {
        q: "What do the mood colors mean?",
        a: "Green means positive moods (Happy, Excited). Orange means negative moods (Stressed, Anxious, Angry, Tired). Gray means neutral. These colors appear on the Weekly Sentiment chart on your Home page."
      },
      {
        q: "Can I submit feedback anonymously?",
        a: "Yes! Go to Settings and turn on Anonymous Mode. When enabled, your name will be hidden from all feedback you submit and will show as 'Anonymous' to your teammates."
      },
    ]
  },
  {
    category: "Privacy & Account",
    icon: LockIcon,
    items: [
      {
        q: "What does anonymous mode do exactly?",
        a: "When anonymous mode is ON, your name is hidden from all feedback entries. Your teammates will see 'Anonymous' instead of your name. You can toggle this anytime in Settings."
      },
      {
        q: "How do I change my password?",
        a: "Go to Settings → Account → Change Password. Click 'Send Link' and a password reset email will be sent to your registered email address."
      },
      {
        q: "How do I leave a team?",
        a: "Click the 'Info' button next to your active team on the Home page. Scroll down and click 'Leave Team'. If you are the team leader, you will need to transfer leadership to another member first."
      },
    ]
  },
  {
    category: "Reports & Data",
    icon: ChartIcon,
    items: [
      {
        q: "What is the Weekly Sentiment chart?",
        a: "The chart on your Home page shows each day of the current week. Green bars mean more positive feedback that day, orange means more negative, and gray means neutral. Empty days show a flat bar."
      },
      {
        q: "How far back does the feedback feed go?",
        a: "The Team Feedback Feed shows the 30 most recent feedback entries for the selected team, grouped by date."
      },
    ]
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Help() {
  const [openItem, setOpenItem] = useState(null);

  const toggle = (key) => setOpenItem(openItem === key ? null : key);

  return (
    <>
      <div className="page-header">
        <h2>Help & FAQ</h2>
        <p>Find answers to common questions about Reflectly</p>
      </div>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
        {faqs.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.category} className="card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <Icon size={20} color="#6c5ce7" />
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                  {section.category}
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {section.items.map((item, i) => {
                  const key = `${section.category}-${i}`;
                  const isOpen = openItem === key;
                  return (
                    <div key={key} style={{
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor: isOpen ? "#6c5ce733" : "#f0f0f0",
                      background: isOpen ? "#6c5ce708" : "white",
                      overflow: "hidden",
                      transition: "all 0.2s ease"
                    }}>
                      <button onClick={() => toggle(key)} style={{
                        width: "100%", textAlign: "left", padding: "12px 16px",
                        background: "none", border: "none", cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        gap: 12
                      }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e2a3a" }}>
                          {item.q}
                        </span>
                        <span style={{
                          fontSize: "18px", color: "#6c5ce7", flexShrink: 0,
                          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                          display: "inline-block"
                        }}>+</span>
                      </button>
                      {isOpen && (
                        <div style={{
                          padding: "0 16px 14px",
                          fontSize: "13px", color: "#555", lineHeight: 1.7
                        }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Support Card */}
        <div className="card" style={{ padding: "20px 24px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <LifebuoyIcon size={36} color="#6c5ce7" />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: "1rem" }}>Still need help?</h3>
          <p style={{ fontSize: "13px", color: "#888", margin: "0 0 16px" }}>
            Contact your class representative or system administrator for further support.
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#f8f8fc", borderRadius: 8, padding: "10px 20px",
            fontSize: "13px", color: "#6c5ce7", fontWeight: 600
          }}>
            <EnvelopeIcon size={16} color="#6c5ce7" />
            Target Users: GC CCS Students
          </div>
        </div>

      </div>
    </>
  );
}