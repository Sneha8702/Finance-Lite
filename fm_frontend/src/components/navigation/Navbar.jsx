import { Home, BarChart2, List, User, Plus, LogOut } from "lucide-react";

function Navbar({ activeTab, onTabChange, onAddClick, onLogout }) {

  const navItems = [
    { id: "home", label: "Home", icon: <Home size={20} /> },
    { id: "stats", label: "Stats", icon: <BarChart2 size={20} /> },
    { id: "expenses", label: "Expenses", icon: <List size={20} /> },
    { id: "profile", label: "Profile", icon: <User size={20} /> },
  ];

  return (
    <nav className="main-navbar" style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      background: "var(--glass-bg)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--glass-border)",
      zIndex: 1000,
      padding: "0 10px",
      height: "72px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "var(--shadow)"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1200px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {/* 🚀 Logo */}
        <div
          onClick={() => onTabChange("home")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            userSelect: "none"
          }}
        >
          <div className="nav-links" style={{
            background: "linear-gradient(135deg, var(--primary), var(--secondary))",
            color: "white",
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "18px",
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)"
          }}>
            FL
          </div>
          <span style={{
            fontSize: "20px",
            fontWeight: "700",
            color: "var(--text-main)",
            display: "none", // Hide on small mobile, show on tablet+
            sm: { display: "block" }
          }} className="nav-logo-text">
            Finance<span style={{ color: "var(--primary)" }}>Lite</span>
          </span>
        </div>

        {/* 🧭 Nav Links */}
        <div className="nav-links" style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--input-bg)",
          padding: "6px",
          borderRadius: "14px",
          border: "1px solid var(--glass-border)"
        }}>
          {navItems.map((item) => (
            <div
              key={item.id}
              className="nav-item"
              onClick={() => onTabChange(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "var(--transition)",
                background: activeTab === item.id ? "var(--primary)" : "transparent",
                color: activeTab === item.id ? "white" : "var(--text-muted)",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.color = "var(--text-main)";
                  e.currentTarget.style.background = "var(--glass-bg)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {item.icon}
              <span style={{
                fontSize: "14px",
                fontWeight: "600",
                display: "none",
                md: { display: "block" }
              }} className="nav-label">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* ➕ Quick Actions */}
        <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button type="button" onClick={onLogout} aria-label="Log out" title="Log out"
            style={{ background: "transparent", border: 0, color: "var(--text-main)", padding: "8px", cursor: "pointer" }}><LogOut size={20} /></button>
          <button
            className="nav-add-button"
            onClick={onAddClick}
            style={{
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "14px",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
              transition: "transform 0.2s ease"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            <Plus size={20} />
            <span className="add-btn-text">New</span>
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .nav-logo-text { display: none !important; }
          .nav-label { display: none !important; }
          .add-btn-text { display: none !important; }
        }
        @media (min-width: 641px) {
          .nav-logo-text { display: block !important; }
          .nav-label { display: block !important; }
          .add-btn-text { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;
