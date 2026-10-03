import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser, getUserDetails } from "../services/api";
import AddTransactionModal from "../components/AddTransactionModal";
import MobileLayout from "../components/layout/MobileLayout";

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

  // 🚪 Logout
  const handleLogout = async () => {
    await logoutUser();
    navigate("/", { replace: true });
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

  // 📑 Render Active Tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeTab
            username={username}
            onTabChange={(tab, type) => {
              if (type) setStatsType(type);
              setActiveTab(tab);
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
      onTabChange={setActiveTab}
      onAddClick={() => setShowModal(true)}
      onLogout={handleLogout}
      username={username}
    >
      {/* 🔷 Streamlined Hero Section */}
      <div style={{ marginBottom: "32px", animation: "slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <h1 style={{
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
    </MobileLayout>
  );
}

export default Dashboard;