import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser, getUserDetails } from "../services/api";
import AddTransactionModal from "../components/AddTransactionModal";
import MobileLayout from "../components/layout/MobileLayout";
import { LogOut, X } from "lucide-react";

// Tab Imports
import HomeTab from "./tabs/HomeTab";
import StatsTab from "./tabs/StatsTab";
import ExpensesTab from "./tabs/ExpensesTab";
import ProfileTab from "./tabs/ProfileTab";

function Dashboard() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [userDetails, setUserDetails] = useState({});
  const [activeTab, setActiveTab] = useState("home");
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 🚪 Logout
  const requestLogout = () => {
    if (!loggingOut) setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setShowLogoutConfirm(false);
    setLoggingOut(true);
    try {
      await logoutUser();
      navigate("/", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  // 🔐 Check auth & Load Data
  useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
      navigate("/", { replace: true });
    } else {
      // 🔄 Fetch real user details
      getUserDetails()
        .then((data) => {
          if (data && data.username) {
            setUsername(data.username);
            setUserDetails(data);
            // Optionally sync to localStorage for persistence
            localStorage.setItem("username", data.username);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch user details:", err);
          // Fallback to localStorage if API fails
          setUsername(localStorage.getItem("username") || "User");
        });
    }
  }, [navigate]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [statsType, setStatsType] = useState("expense");

  const handleTabChange = (tab) => {
    setShowModal(false);
    setActiveTab(tab);
  };

  // 📑 Render Active Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeTab
            username={username}
            onTabChange={(tab, type) => {
              if (type) setStatsType(type);
              handleTabChange(tab);
            }}
            key={`home-${refreshKey}`}
          />
        );
      case "stats":
        return (
          <StatsTab
            initialType={statsType}
            key={`stats-${refreshKey}-${statsType}`}
          />
        );
      case "expenses":
        return <ExpensesTab key={`exp-${refreshKey}`} />;
      case "profile":
        return <ProfileTab username={username} email={userDetails.email} accountId={userDetails.id} emailVerified={userDetails.email_verified} onLogout={handleLogout} />;
      default:
        return <HomeTab username={username} />;
    }
  };

  return (
    <MobileLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onAddClick={() => setShowModal(true)}
      onLogout={requestLogout}
      username={username}
    >
      {/* 🔷 Streamlined Hero Section */}
      <div style={{ marginBottom: "32px", animation: "slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <h1 className="dashboard-title" style={{
          fontSize: "32px",
          fontWeight: "800",
          color: "var(--text-main)",
          marginBottom: "8px",
          letterSpacing: "-1px"
        }}>
          Dashboard <span className="text-gradient">Overview</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>
          Track, analyze and optimize your spending habits.
        </p>
      </div>

      {/* 📑 Dynamic Tab Content */}
      <div key={activeTab}>
        {renderTabContent()}
      </div>

      {/* 🪟 Reusable Modal */}
      <AddTransactionModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />
      {showLogoutConfirm && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowLogoutConfirm(false)}>
          <div
            className="glass-card logout-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            onClick={event => event.stopPropagation()}
          >
            <button type="button" className="logout-confirm-close" aria-label="Close logout confirmation" onClick={() => setShowLogoutConfirm(false)}>
              <X size={20} />
            </button>
            <div className="logout-confirm-icon"><LogOut size={24} /></div>
            <h2 id="logout-title">Log out?</h2>
            <p>Your current session will be ended on this device.</p>
            <div className="logout-confirm-actions">
              <button type="button" className="social-btn" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button type="button" className="primary-btn logout-confirm-submit" onClick={handleLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}

export default Dashboard;
