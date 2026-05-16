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

const UsersIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M21 21v-2a4 4 0 0 0-3-3.87"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const UserIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12" />
    <path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const GearIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color} strokeWidth="1.8" />
  </svg>
);

const KeyIcon = ({ size = 20, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="8" cy="12" r="5" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12" />
    <path d="M13 12h8M17 10v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M21 10v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
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
        a: "On the Home page, scroll down and tap '+ Create a Team'. Type in your team's name, add a short description, and pick a color for it. Once you're done, a special code will be made for your team — share that code with your teammates so they can join!"
      },
      {
        q: "How do I join a team?",
        a: "On the Home page, tap '+ Join a Team'. You'll be asked to enter an invite code — ask your team leader to give you their team's code. Type it in and tap 'Join Team'. You'll be added right away!"
      },
      {
        q: "Can I be in multiple teams?",
        a: "Yes! You can be part of as many teams as you want. On the Home page, you'll see a list of all your teams on the right side — just tap on any of them to switch and view that team."
      },
      {
        q: "What is 'skip for now' on the setup screen?",
        a: "When you first sign up, the app asks you to create or join a team. If you're not ready yet, you can tap 'skip for now' to go straight to the app. You can always create or join a team later from the Home page."
      },
    ]
  },
  {
    category: "Submitting Feedback",
    icon: ChatIcon,
    items: [
      {
        q: "How do I submit feedback?",
        a: "Tap 'Submit' at the top of the screen. Pick an emoji that matches how you're feeling, write what's on your mind, choose which team you're sending it to, then tap the 'Submit Feedback' button. That's it!"
      },
      {
        q: "How does the AI sentiment analysis work?",
        a: "When you send your feedback, the app automatically reads your message and figures out if it sounds happy, sad, or somewhere in between. It then shows your team a score and a short summary so they can understand the general mood of everyone."
      },
      {
        q: "What do the mood colors mean?",
        a: "Green means positive or happy moods like Excited or Happy. Orange means harder moods like Stressed, Angry, or Tired. Gray means neutral — not too happy, not too sad. You'll see these colors in the chart on the Home page."
      },
      {
        q: "Can I submit feedback anonymously?",
        a: "Yes! If you don't want your name to show, go to Settings and turn on 'Anonymous Mode'. After that, whenever you submit feedback, it will show 'Anonymous' instead of your name. Nobody will know it was you!"
      },
    ]
  },
  {
    category: "Managing Your Team",
    icon: UsersIcon,
    items: [
      {
        q: "How do I find my team's invite code?",
        a: "Go to the Home page and find your team on the right side. Click the 'Info' button next to your team name. A popup will appear showing your team's invite code at the top — you can tap 'Copy' to copy it and share it with your teammates."
      },
      {
        q: "How do I see who's in my team?",
        a: "On the Home page, tap the 'Info' button beside your team. Scroll down in the popup and you'll see a list of all the members in your team, along with when they joined and if they're the team leader."
      },
      {
        q: "How do I view a member's profile?",
        a: "Open the team info by tapping 'Info' next to your team on the Home page. Then tap on any member's name in the list. A small popup will show their profile — their name, student ID, age, and when they joined."
      },
      {
        q: "What is 'Leave & Transfer Leadership'?",
        a: "If you created the team, you are the leader. To leave the team, you first need to pass the leader role to someone else — that's what 'Leave & Transfer Leadership' does. If you're just a regular member, you'll see a simple 'Leave Team' button instead."
      },
      {
        q: "Can I change my team's name or color?",
        a: "Currently, the team name, description, and color are set when the team is first created and cannot be changed afterward. Make sure to choose carefully when creating your team!"
      },
    ]
  },
  {
    category: "Your Profile",
    icon: UserIcon,
    items: [
      {
        q: "What is the Avg Sentiment score on my profile?",
        a: "The Avg Sentiment is a number that shows your overall mood based on all the feedback you've ever submitted. A positive number means your feedback has generally been happy or positive. A negative number means it's been more on the stressed or sad side. Zero means you're right in the middle!"
      },
      {
        q: "What is My Feedback History?",
        a: "It's a list of all the feedback you've ever submitted, shown from newest to oldest. You can see what mood you picked, what you wrote, which team you sent it to, and the sentiment score the app gave it."
      },
      {
        q: "What does Most Common Mood mean?",
        a: "This shows the emoji mood you've picked the most across all your feedback submissions. For example, if you usually pick 'Happy' when submitting, that emoji will show up here as your most common mood."
      },
      {
        q: "Can I edit or delete my feedback after submitting?",
        a: "No, once you submit feedback you cannot edit or delete it. Make sure you're happy with what you wrote before tapping Submit Feedback!"
      },
    ]
  },
  {
    category: "App & Settings",
    icon: GearIcon,
    items: [
      {
        q: "How do I turn on Dark Mode?",
        a: "Go to Settings and look for 'Dark Mode' under the Preferences section. Just tap the toggle switch to turn it on. The whole app will switch to a darker look right away. You can turn it back off the same way."
      },
      {
        q: "What are notifications for?",
        a: "When notifications are turned on, the app can send you updates about what's happening in your team — like when new feedback is submitted. You can turn this on or off anytime in Settings under Preferences."
      },
      {
        q: "How do I sign out?",
        a: "Go to Settings and scroll down to the Account section. Tap the 'Sign Out' button. You'll be logged out and taken back to the login screen. Your account and data are saved — you can log back in anytime."
      },
      {
        q: "What happens if I delete my account?",
        a: "Deleting your account will permanently remove everything — your profile, all your submitted feedback, and your team memberships. This cannot be undone! If you just want to take a break, signing out is the safer option."
      },
    ]
  },
  {
    category: "Privacy & Account",
    icon: LockIcon,
    items: [
      {
        q: "What does anonymous mode do exactly?",
        a: "When anonymous mode is turned ON, your name is hidden from everything you submit. Your teammates will only see 'Anonymous' — not your name. You can turn it on or off anytime in Settings."
      },
      {
        q: "Is my feedback private?",
        a: "Your feedback is shared with everyone in the same team. All team members can see what was submitted in the Team Feedback Feed on the Home page. If you want to hide your name, turn on Anonymous Mode in Settings."
      },
      {
        q: "How do I change my password?",
        a: "Go to Settings, then look for 'Change Password' under the Account section. Tap 'Send Link' and we'll send an email to your registered email address with a link to set a new password. Just check your inbox!"
      },
      {
        q: "How do I leave a team?",
        a: "On the Home page, find the team you want to leave and tap the 'Info' button beside it. Scroll down and tap 'Leave Team'. Note: if you were the one who created the team, you'll need to pass the leader role to someone else before you can leave."
      },
    ]
  },
  {
    category: "Login & Access",
    icon: KeyIcon,
    items: [
      {
        q: "What do I do if I forgot my password?",
        a: "On the login screen, tap 'Forgot Password'. Enter your email address and we'll send you a link to reset your password. Check your inbox (and your spam folder just in case!) and follow the link to create a new password."
      },
      {
        q: "What do I do if I can't log in?",
        a: "First, make sure your email and password are typed correctly — check for extra spaces or capital letters. If you still can't get in, tap 'Forgot Password' on the login screen to reset it. If the problem keeps happening, reach out to the developer for help."
      },
      {
        q: "Can I use the app on any device?",
        a: "Yes! Reflectly works on any device with a web browser — your phone, tablet, or computer. Since it's a web app, you don't need to download anything. Just open it in your browser and log in."
      },
    ]
  },
  {
    category: "Reports & Data",
    icon: ChartIcon,
    items: [
      {
        q: "What is the Weekly Sentiment chart?",
        a: "It's the bar chart you see on the Home page. It shows how your team has been feeling every day this week. Tall green bars mean a lot of positive feedback that day, orange means more negative, and gray means neutral. If nobody submitted that day, the bar will just be flat."
      },
      {
        q: "What does the sentiment score number mean?",
        a: "The score is a number between -1 and +1. A score close to +1 means the feedback was very positive and happy. A score close to -1 means it was very negative or sad. A score near 0 means it was neutral — not strongly positive or negative."
      },
      {
        q: "How far back does the feedback feed go?",
        a: "The feedback feed on the Home page shows the 30 most recent messages from your team, sorted by date. Older messages beyond that are not shown, so it stays clean and easy to read."
      },
      {
        q: "Why does my chart look empty?",
        a: "The chart only shows data for the current week. If your team hasn't submitted any feedback yet this week, all the bars will be flat. Once people start submitting, the bars will fill up and show the mood for each day."
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
                      borderColor: isOpen ? "#6c5ce733" : "var(--border)",
                      background: isOpen ? "rgba(108,92,231,0.15)" : "var(--input-bg)",
                      overflow: "hidden",
                      transition: "all 0.2s ease"
                    }}>
                      <button onClick={() => toggle(key)} style={{
                        width: "100%", textAlign: "left", padding: "12px 16px",
                        background: "none", border: "none", cursor: "pointer",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        gap: 12
                      }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>
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
                          fontSize: "13px", color: "var(--text-main)", lineHeight: 1.7, opacity: 0.8
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
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 16px" }}>
            Have a question or found a bug? Feel free to reach out to the developer directly.
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(108,92,231,0.12)", borderRadius: 8, padding: "10px 20px",
              fontSize: "13px", color: "#6c5ce7", fontWeight: 600,
              border: "1px solid rgba(108,92,231,0.3)"
            }}>
              <EnvelopeIcon size={16} color="#6c5ce7" />
              ecalniralan@gmail.com
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText("ecalniralan@gmail.com");
                alert("Email copied! You can now paste it anywhere.");
              }}
              style={{
                background: "#6c5ce7", color: "white", border: "none",
                borderRadius: 8, padding: "8px 18px", fontSize: "13px",
                fontWeight: 600, cursor: "pointer"
              }}
            >
              Copy Email
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: 10 }}>
            Developed by Alan Jr. P. Ecalnir
          </p>
        </div>

      </div>
    </>
  );
}