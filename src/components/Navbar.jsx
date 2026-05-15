import { useState, useEffect } from "react";

export default function Navbar({ active, navigate }) {
  const [open, setOpen] = useState(false);

  const links = [
    { id: "home",     label: "Home",     icon: "🏠" },
    { id: "submit",   label: "Submit",   icon: "✍️" },
    { id: "profile",  label: "Profile",  icon: "👤" },
    { id: "settings", label: "Settings", icon: "⚙️" },
    { id: "help",     label: "Help",     icon: "❓" },
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

        {/* HAMBURGER — hidden on desktop via CSS */}
        <button
          className="hamburger"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className={`ham-line ${open ? "open" : ""}`} />
          <span className={`ham-line ${open ? "open" : ""}`} />
          <span className={`ham-line ${open ? "open" : ""}`} />
        </button>
      </nav>

      {/* BACKDROP */}
      {open && (
        <div className="drawer-backdrop" onClick={() => setOpen(false)} />
      )}

      {/* SIDE DRAWER */}
      <aside className={`side-drawer ${open ? "drawer-open" : ""}`}>
        <div className="drawer-header">
          <div className="nav-logo" style={{ color: "white" }} onClick={() => handleNav("home")}>
            <div className="logo-icon">✏️</div>
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