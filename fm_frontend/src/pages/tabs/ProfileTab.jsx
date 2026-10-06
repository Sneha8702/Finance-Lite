import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteAccount } from "../../services/api";
import { useTheme } from "../../context/useTheme";
import { Sun, Moon, Shield, Mail, Trash2 } from "lucide-react";

function ProfileTab({ username = "User", email, accountId, emailVerified, onLogout }) {
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const handleDeleteAccount = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await deleteAccount(password);
      navigate("/", { replace: true });
    } catch (error) {
      setError(error.response?.data?.error || "Could not delete your account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card profile-card" style={{
      padding: "40px 24px", 
      textAlign: "center", 
      background: "var(--glass-bg)",
      margin: "0 auto",
      boxShadow: "var(--shadow)"
    }}>
      <div className="profile-avatar" style={{
        width: "100px", 
        height: "100px", 
        background: "linear-gradient(135deg, var(--primary), var(--secondary))", 
        borderRadius: "50%", 
        margin: "0 auto 24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "40px",
        fontWeight: "700",
        color: "white",
        boxShadow: "0 8px 32px rgba(139, 92, 246, 0.3)"
      }}>
        {username.charAt(0).toUpperCase()}
      </div>

      <h2 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px", color: "var(--text-main)" }}>
        {username}
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "40px" }}>
        {emailVerified ? "Email verified" : "Expense tracker account"}
      </p>

      <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* 🌓 Theme Toggle */}
        <div 
          onClick={toggleTheme}
          style={{ 
            padding: "16px", 
            background: "var(--input-bg)", 
            borderRadius: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            border: "1px solid var(--glass-border)",
            transition: "var(--transition)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {theme === "dark" ? <Moon size={20} color="var(--primary)" /> : <Sun size={20} color="var(--accent)" />}
            <span style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "14px" }}>
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
          </div>
          <div style={{ 
            width: "44px", 
            height: "24px", 
            background: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            borderRadius: "20px",
            position: "relative",
            padding: "2px"
          }}>
            <div style={{ 
              width: "20px", 
              height: "20px", 
              background: theme === "dark" ? "var(--primary)" : "var(--accent)", 
              borderRadius: "50%",
              position: "absolute",
              right: theme === "dark" ? "2px" : "auto",
              left: theme === "light" ? "2px" : "auto",
              transition: "var(--transition)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
            }} />
          </div>
        </div>

        <div className="profile-detail-row" style={{
          padding: "16px", 
          background: "var(--input-bg)", 
          borderRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid var(--glass-border)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Shield size={20} color="var(--text-muted)" />
            <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Account ID</span>
          </div>
          <span style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "14px" }}>{accountId ? `${accountId}` : "?"}</span>
        </div>

        <div className="profile-detail-row" style={{
          padding: "16px", 
          background: "var(--input-bg)", 
          borderRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid var(--glass-border)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Mail size={20} color="var(--text-muted)" />
            <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Email</span>
          </div>
          <span style={{ color: "var(--text-main)", fontWeight: "600", fontSize: "14px" }}>{email || "Not provided"}</span>
        </div>
      </div>

      <button type="button" className="social-btn" onClick={onLogout} disabled={busy} style={{ marginTop: "24px", width: "100%" }}>Log out</button>
      {confirming && (
        <form onSubmit={handleDeleteAccount} style={{ textAlign: "left", marginTop: "24px" }}>
          <h3>Delete your account permanently?</h3>
          <p style={{ margin: "12px 0" }}>Your expenses, income, and custom categories will be deleted. This cannot be undone.</p>
          <label className="form-label" htmlFor="delete-password">Current password</label>
          <input id="delete-password" className="form-input" type="password" autoComplete="current-password" required
            value={password} disabled={busy} onChange={event => setPassword(event.target.value)} />
          {error && <p role="alert" className="error-message">{error}</p>}
          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <button type="submit" className="primary-btn" disabled={busy} style={{ background: "#b91c1c" }}>{busy ? "Deleting?" : "Permanently delete my account"}</button>
            <button type="button" className="social-btn" disabled={busy} onClick={() => { setConfirming(false); setPassword(""); setError(""); }}>Cancel</button>
          </div>
        </form>
      )}
      {!confirming && <button
        type="button"
        onClick={() => setConfirming(true)}
        style={{ 
          marginTop: "60px",
          background: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          padding: "16px",
          borderRadius: "16px",
          width: "100%",
          cursor: "pointer",
          fontWeight: "600",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
        }}
      >
        <Trash2 size={18} />
        Delete Account
      </button>}

      <p style={{ marginTop: "12px", color: "rgba(255,255,255,0.2)", fontSize: "11px" }}>
        v1.0.4 • Beta
      </p>
    </div>
  );
}

export default ProfileTab;
