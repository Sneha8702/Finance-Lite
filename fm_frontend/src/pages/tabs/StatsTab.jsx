import { localDate } from "../../utils/localDate";
import { useState, useEffect, useCallback } from "react";
import { getAnalytics } from "../../services/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import {
  Calendar, TrendingUp, DollarSign, ArrowUpRight, ChevronLeft, ChevronRight, BarChart2
} from "lucide-react";

function StatsTab({ initialType = "expense" }) {
  const [mode, setMode] = useState("monthly"); // daily, monthly, yearly
  const [analysisType, setAnalysisType] = useState(initialType);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: localDate(),
    start_date: "",
    end_date: "",
  });

  const [summary, setSummary] = useState({
    total: 0,
    average: 0,
    max: 0
  });

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = { mode, type: analysisType };
      if (mode === "daily") {
        params.date = filters.date;
      }
      // Add more filters if needed

      const response = await getAnalytics(params);
      setData((response.data || []).map(item => ({ ...item, amount: Number(item.amount) })));

      // Calculate summary stats
      if (response.data && response.data.length > 0) {
        const amounts = response.data.map(item => Number(item.amount));
        const total = amounts.reduce((a, b) => a + b, 0);
        setSummary({
          total,
          average: (total / response.data.length).toFixed(2),
          max: Math.max(...amounts)
        });
      } else {
        setSummary({ total: 0, average: 0, max: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setData([]);
      setSummary({ total: 0, average: 0, max: 0 });
    } finally {
      setLoading(false);
    }
  }, [mode, filters.date, analysisType]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const modes = [
    { id: "daily", label: "Daily", icon: <Calendar size={14} /> },
    { id: "monthly", label: "Monthly", icon: <BarChart2 size={14} /> },
    { id: "yearly", label: "Yearly", icon: <TrendingUp size={14} /> },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(10px)",
          border: "1px solid var(--glass-border)",
          padding: "12px",
          borderRadius: "12px",
          boxShadow: "var(--shadow)"
        }}>
          <p style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>
            {label}
          </p>
          <p style={{ color: "var(--text-main)", fontWeight: "700", fontSize: "16px" }}>
            Rs. {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ animation: "fadeIn 0.5s ease-out" }}>
      {/* 🎮 Header & Controls */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ display: "flex", background: "var(--glass-bg)", padding: "4px", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
            <button
              onClick={() => setAnalysisType("expense")}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: analysisType === "expense" ? "var(--secondary)" : "transparent",
                color: analysisType === "expense" ? "#fff" : "var(--text-muted)",
              }}
            >
              Expense
            </button>
            <button
              onClick={() => setAnalysisType("income")}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                background: analysisType === "income" ? "#10b981" : "transparent",
                color: analysisType === "income" ? "#fff" : "var(--text-muted)",
              }}
            >
              Income
            </button>
          </div>

          <div style={{ width: "1px", height: "24px", background: "var(--glass-border)" }}></div>

          <div style={{ display: "flex", background: "var(--glass-bg)", padding: "4px", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: mode === m.id ? "var(--primary)" : "transparent",
                  color: mode === m.id ? "#fff" : "var(--text-muted)",
                }}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "daily" && (
          <div style={{ position: "relative" }}>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "10px",
                padding: "8px 12px",
                color: "var(--text-main)",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>
        )}
      </div>

      {/* 📊 Summary Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        <div className="glass-card" style={{ padding: "16px", margin: 0, boxShadow: "var(--shadow)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Total {analysisType === "income" ? "Income" : "Expense"}</p>
          <h4 style={{ color: "var(--text-main)", fontSize: "20px", fontWeight: "700", marginTop: "4px" }}>Rs. {summary.total.toLocaleString()}</h4>
        </div>
        <div className="glass-card" style={{ padding: "16px", margin: 0, boxShadow: "var(--shadow)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Avg. {analysisType === "income" ? "Earned" : "Spent"}</p>
          <h4 style={{ color: analysisType === "income" ? "#10b981" : "var(--secondary)", fontSize: "20px", fontWeight: "700", marginTop: "4px" }}>Rs. {summary.average}</h4>
        </div>
        <div className="glass-card" style={{ padding: "16px", margin: 0, boxShadow: "var(--shadow)" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Highest {analysisType === "income" ? "Income" : "Spend"}</p>
          <h4 style={{ color: "var(--accent)", fontSize: "20px", fontWeight: "700", marginTop: "4px" }}>Rs. {summary.max.toLocaleString()}</h4>
        </div>
      </div>

      {/* 📉 Main Chart */}
      <div className="glass-card" style={{
        padding: "24px",
        background: "var(--glass-bg)",
        height: "350px",
        position: "relative",
        boxShadow: "var(--shadow)"
      }}>
        {loading ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="auth-subtitle">Regenerating analysis...</p>
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {mode === "yearly" ? (
              <BarChart data={data}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={analysisType === "income" ? "#10b981" : "var(--primary)"} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={analysisType === "income" ? "#059669" : "var(--secondary)"} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  tickFormatter={(val) => {
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    return months[val - 1];
                  }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip cursor={{ fill: "var(--glass-bg)" }} content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#barGradient)" />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={analysisType === "income" ? "#10b981" : "var(--primary)"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={analysisType === "income" ? "#059669" : "var(--secondary)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  tickFormatter={(val) => val.split("-").slice(-1)[0]} // Show only day
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={analysisType === "income" ? "#10b981" : "var(--primary)"}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  animationDuration={1500}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
            <Calendar size={48} color="var(--text-muted)" style={{ opacity: 0.2 }} />
            <p className="auth-subtitle">No data available for this range.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default StatsTab;
