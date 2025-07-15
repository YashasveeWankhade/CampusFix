import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Eye, EyeOff, User, Mail, Lock, UserCheck } from "lucide-react";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let userCredential;
      
      if (isNewUser) {
        // Create new user
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email,
          role: role,
          createdAt: new Date().toISOString()
        });
        
        toast.success(`${role === 'admin' ? 'Admin' : 'Student'} account created successfully!`);
        
        // Navigate based on role
        setTimeout(() => {
          navigate(role === "admin" ? "/admin" : "/dashboard");
        }, 1500);
        
      } else {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Get user role from Firestore
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRole = userData.role;
          
          toast.success(`Welcome back, ${userRole}!`);
          
          // Navigate based on role
          setTimeout(() => {
            navigate(userRole === "admin" ? "/admin" : "/dashboard");
          }, 1500);
        } else {
          // If user document doesn't exist, create it with default role
          await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: email,
            role: "student",
            createdAt: new Date().toISOString()
          });
          
          toast.success("Welcome! Account updated.");
          navigate("/dashboard");
        }
      }
      
    } catch (err) {
      console.error("Auth error:", err);
      let errorMessage = "An error occurred. Please try again.";
      
      if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email. Please create an account.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (err.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="brand-header">
          <h1 className="brand-title">CampusFix</h1>
          <p className="brand-subtitle">Smart Campus Complaint Management</p>
        </div>

        <motion.form 
          onSubmit={handleAuth}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="form-group">
            <label className="form-label">
              <Mail size={18} />
              Email Address
            </label>
            <input
              type="email"
              className="form-control modern-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={18} />
              Password
            </label>
            <div className="password-input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control modern-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength="6"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isNewUser && (
            <div className="form-group">
              <label className="form-label">
                <UserCheck size={18} />
                Account Type
              </label>
              <select
                className="form-control modern-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <motion.button
            type="submit"
            className="btn btn-primary modern-btn"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="spinner-border spinner-border-sm me-2" />
            ) : (
              <User size={18} className="me-2" />
            )}
            {loading ? "Please wait..." : (isNewUser ? "Create Account" : "Sign In")}
          </motion.button>

          <div className="auth-switch">
            <p>
              {isNewUser ? "Already have an account?" : "Don't have an account?"}
              <button
                type="button"
                className="btn btn-link switch-btn"
                onClick={() => setIsNewUser(!isNewUser)}
              >
                {isNewUser ? "Sign In" : "Create Account"}
              </button>
            </p>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}

export default LoginPage;