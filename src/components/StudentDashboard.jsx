import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { LogOut, Plus, List, User } from "lucide-react";
import ComplaintForm from "./ComplaintForm";
import ComplaintList from "./ComplaintList";

function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("submit");
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <motion.div 
      className="dashboard-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">CampusFix</h1>
          <p className="dashboard-subtitle">Student Portal</p>
          <div className="user-info">
            <User size={16} />
            <span>{user?.email}</span>
          </div>
        </div>
        <button
          className="btn btn-outline-light logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={18} className="me-2" />
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === "submit" ? "active" : ""}`}
            onClick={() => setActiveTab("submit")}
          >
            <Plus size={18} className="me-2" />
            Submit Complaint
          </button>
          <button
            className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <List size={18} className="me-2" />
            My Complaints
          </button>
        </div>

        <motion.div
          className="tab-content"
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "submit" ? <ComplaintForm /> : <ComplaintList />}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default StudentDashboard;