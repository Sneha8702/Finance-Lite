import Navbar from "../navigation/Navbar";

function MobileLayout({ children, activeTab, onTabChange, onAddClick, onLogout }) {
  return (
    <div
      className="auth-page"
      style={{
        padding: "92px 20px 40px 20px",
        display: "block",
        minHeight: "100vh",
        overflowY: "auto",
        position: "relative",
        background: "transparent",
      }}
    >
      <Navbar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onAddClick={onAddClick}
        onLogout={onLogout}
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        {children}
      </div>
    </div>
  );
}

export default MobileLayout;
