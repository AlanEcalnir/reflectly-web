import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Home from "./pages/Home";
import Submit from "./pages/Submit";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import TeamSetup from "./pages/TeamSetup";
import JoinTeam from "./pages/JoinTeam";
import CreateTeam from "./pages/CreateTeam";
import Navbar from "./components/Navbar";
import "./App.css";

export default function App() {
  const [page, setPage]             = useState("login");
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitTeamId, setSubmitTeamId] = useState(null);

  // ── Dark Mode ─────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("reflectly_darkMode") === "true"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("reflectly_darkMode", darkMode);
  }, [darkMode]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (session.user.email_confirmed_at) {
          setUser(session.user);
          setPage("home");
        } else {
          supabase.auth.signOut();
          setUser(null);
          setPage("login");
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // PASSWORD_RECOVERY — user clicked the reset link in their email.
      // Supabase fires this event and gives us a temporary session.
      // Show the "set new password" screen immediately.
      if (event === "PASSWORD_RECOVERY") {
        setUser(session.user);
        setPage("reset-password");
        return;
      }

      if (session?.user) {
        if (session.user.email_confirmed_at) {
          setUser(session.user);
          // Only redirect to home if we're on an auth screen
          setPage((prev) =>
            prev === "login" || prev === "register" ? "home" : prev
          );
        } else {
          // Signed in but email not yet confirmed
          supabase.auth.signOut();
          setUser(null);
          setPage("login");
        }
      } else {
        setUser(null);
        setPage("login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setPage("home");
  };

  const handleRegister = (registeredUser) => {
    setUser(registeredUser);
    setPage("team-setup");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("login");
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100svh", background: "var(--cream)",
      flexDirection: "column", gap: "12px"
    }}>
      <div style={{
        width: 40, height: 40, background: "var(--orange)",
        borderRadius: 10, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 20
      }}>✏️</div>
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontFamily: "var(--font-body)" }}>
        Loading...
      </p>
    </div>
  );

  // ── Password reset screen ─────────────────────────────────────────────────
  if (page === "reset-password") {
    return (
      <ResetPassword
        onDone={() => {
          supabase.auth.signOut();
          setUser(null);
          setPage("login");
        }}
      />
    );
  }

  // ── Unauthenticated routes ────────────────────────────────────────────────
  if (!user) {
    if (page === "register")
      return (
        <Register
          onRegister={handleRegister}
          onGoLogin={() => setPage("login")}
        />
      );
    return (
      <Login
        onLogin={handleLogin}
        onGoRegister={() => setPage("register")}
      />
    );
  }

  // ── Team setup routes ─────────────────────────────────────────────────────
  if (page === "team-setup")
    return (
      <TeamSetup
        user={user}
        onJoin={() => setPage("join-team")}
        onCreate={() => setPage("create-team")}
        onSkip={() => setPage("home")}
      />
    );

  if (page === "join-team")
    return (
      <JoinTeam
        user={user}
        onDone={() => setPage("home")}
        onBack={() => setPage("team-setup")}
      />
    );

  if (page === "create-team")
    return (
      <CreateTeam
        user={user}
        onDone={() => setPage("home")}
        onBack={() => setPage("team-setup")}
      />
    );

  // ── Authenticated app shell ───────────────────────────────────────────────
  return (
    <div className="app-shell">
      <Navbar active={page} navigate={setPage} hideSubmit={page === "home"} />
      <main className="page-content">
        {page === "home" && (
          <Home
            user={user}
            navigate={setPage}
            navigateToSubmit={(teamId) => { setSubmitTeamId(teamId); setPage("submit"); }}
          />
        )}
        {page === "submit"   && <Submit user={user} defaultTeamId={submitTeamId} />}
        {page === "profile"  && <Profile user={user} />}
        {page === "settings" && (
          <Settings
            user={user}
            onLogout={signOut}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        )}
        {page === "help"     && <Help />}
      </main>
    </div>
  );
}