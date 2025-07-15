import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

function ProtectedRoute({ children, allowedRole }) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <motion.div
          className="loading-content"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="spinner-border text-primary" />
          <h3>CampusFix</h3>
          <p>Loading...</p>
        </motion.div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If user role doesn't match allowed role, redirect to appropriate dashboard
  if (userRole !== allowedRole) {
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;