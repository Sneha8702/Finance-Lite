import { useEffect, useState } from "react";
import { getExpenseOverview } from "../../services/api";

function HomeTab({ username, onTabChange }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await getExpenseOverview();
        setOverview(data);
      } catch (err) {
        console.error("Failed to fetch overview:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <div className="auth-subtitle">Loading your financial summary...</div>
      </div>
    );
  }

  const income = overview?.total_income_this_month || 0;
  const expense = overview?.total_expenses_this_month || 0;
  const balance = overview?.balance || 0;
  const due = overview?.due || 0;

  const spendPercentage = income > 0 ? Math.min((expense / income) * 100, 100) : 0;

  return (
    <div style={{ animation: "slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
      {/* 👋 Header Section */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-main)", marginBottom: "4px" }}>
          Hello, {username || "User"}
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Welcome back to your financial dashboard</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* 💳 Hero Balance Card */}
        <div className="glass-card" style={{
          padding: "32px",
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(6, 182, 212, 0.15))",
          border: "1px solid var(--glass-border)",
          position: "relative",
          overflow: "hidden",
          boxShadow: "var(--shadow)"
        }}>
          {/* Decorative Glow */}
          <div style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "150px",
            height: "150px",
            background: "var(--secondary)",
            filter: "blur(80px)",
            opacity: "0.2",
            borderRadius: "50%"
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ color: "var(--text-muted)", opacity: 0.8, fontSize: "14px", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
              Total Balance
            </p>
            <h2 style={{ fontSize: "42px", fontWeight: "800", color: "var(--text-main)", marginBottom: "24px" }}>
              {formatCurrency(balance)}
            </h2>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ color: "var(--text-muted)", opacity: 0.5, fontSize: "12px", fontFamily: "monospace" }}>
                **** **** **** 882{username?.length || 0}
              </div>
              <div style={{
                background: "var(--glass-bg)",
                padding: "8px 16px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--text-main)",
                border: "1px solid var(--glass-border)"
              }}>
                Active Wallet
              </div>
            </div>
          </div>
        </div>

        {/* 📊 Metrics Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px"
        }}>

          {/* Income Card */}
          <div className="glass-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "8px", borderRadius: "10px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5" /></svg>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: "600" }}>Income</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-main)" }}>{formatCurrency(income)}</div>
              <button 
                onClick={() => onTabChange && onTabChange('stats', 'income')}
                style={{ 
                  background: "rgba(124, 58, 237, 0.1)", 
                  border: "1px solid rgba(124, 58, 237, 0.2)", 
                  color: "var(--primary)", 
                  fontSize: "11px", 
                  fontWeight: "700", 
                  cursor: "pointer",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                Details
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          {/* Expense Card */}
          <div className="glass-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "8px", borderRadius: "10px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 11l-5-5-5 5M17 18l-5-5-5 5" /></svg>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: "600" }}>Expense</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-main)" }}>{formatCurrency(expense)}</div>
          </div>

          {/* Due Card */}
          <div className="glass-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", padding: "8px", borderRadius: "10px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: "600" }}>Due</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-main)" }}>{formatCurrency(due)}</div>
          </div>

        </div>

        {/* 📉 Spending Analysis Section */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-main)" }}>Monthly Income Spent</h4>
            <span style={{ fontSize: "14px", fontWeight: "600", color: spendPercentage > 80 ? "#ef4444" : "var(--secondary)" }}>
              {spendPercentage.toFixed(0)}% Used
            </span>
          </div>

          {/* Progress Bar Container */}
          <div style={{
            height: "10px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "10px",
            overflow: "hidden",
            marginBottom: "12px"
          }}>
            <div style={{
              width: `${spendPercentage}%`,
              height: "100%",
              background: `linear-gradient(90deg, var(--primary), var(--secondary))`,
              borderRadius: "10px",
              transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1)"
            }} />
          </div>

          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            {spendPercentage > 80
              ? "Warning: You are approaching your monthly income."
              : "Good job! Your spending is below your monthly income."}
          </p>
        </div>

      </div>
    </div>
  );
}

export default HomeTab;
