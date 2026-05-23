import { useState, useEffect } from "react";

const Icons = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  submit: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  profile: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  help: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

export default function Navbar({ active, navigate, hideSubmit }) {
  const [open, setOpen] = useState(false);

  const links = [
    { id: "home",     label: "Home",     icon: Icons.home },
    { id: "submit",   label: "Submit",   icon: Icons.submit },
    { id: "profile",  label: "Profile",  icon: Icons.profile },
    { id: "settings", label: "Settings", icon: Icons.settings },
    { id: "help",     label: "Help",     icon: Icons.help },
  ];

  const handleNav = (id) => {
    navigate(id);
    setOpen(false);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <nav className="navbar">
        {/* LOGO */}
        <div className="nav-logo" onClick={() => handleNav("home")}>
          <div className="logo-icon">✏️</div>
          Reflectly
        </div>

        {/* DESKTOP LINKS — hidden on mobile via CSS */}
        <div className="nav-links">
          {links.map((l) => (
            <button
              key={l.id}
              className={`nav-link ${active === l.id ? "active" : ""}`}
              onClick={() => handleNav(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* MOBILE RIGHT SIDE — Submit button + Hamburger */}
        <div className="mobile-nav-right">


          {/* HAMBURGER */}
          <button
            className="hamburger"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className={`ham-line ${open ? "open" : ""}`} />
            <span className={`ham-line ${open ? "open" : ""}`} />
            <span className={`ham-line ${open ? "open" : ""}`} />
          </button>
        </div>
      </nav>

      {/* BACKDROP */}
      {open && (
        <div className="drawer-backdrop" onClick={() => setOpen(false)} />
      )}

      {/* SIDE DRAWER */}
      <aside className={`side-drawer ${open ? "drawer-open" : ""}`}>
        <div className="drawer-header">
          <div className="nav-logo" style={{ color: "white" }} onClick={() => handleNav("home")}>
            <div className="logo-icon"></div>
            Reflectly
          </div>
        </div>
        <nav className="drawer-links">
          {links.map((l) => (
            <button
              key={l.id}
              className={`drawer-link ${active === l.id ? "active" : ""}`}
              onClick={() => handleNav(l.id)}
            >
              <span className="drawer-link-icon">{l.icon}</span>
              {l.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}