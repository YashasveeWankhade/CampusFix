import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Send, FileText, MapPin, User, AlertCircle } from "lucide-react";
import axios from "axios";


function ComplaintForm() {
  const [formData, setFormData] = useState({
    department: "",
    description: "",
    location: ""
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser?.uid, currentUser?.email);
      setUser(currentUser);
      setAuthLoading(false);
    });


    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

    

const getUrgencyFromGemini = async (description) => {
  if (!description || description.trim().length === 0) {
    return "Medium";
  }

  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description })
    });

    if (!response.ok) {
      console.error("Gemini API Error:", await response.text());
      return "Medium";
    }

    const data = await response.json();
    const urgency = data.urgency;
    return urgency.charAt(0) + urgency.slice(1).toLowerCase();
  } catch (error) {
    console.error("Gemini API connection failed:", error.message);
    return "Medium";
  }
};






  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Form data:", formData);
    console.log("Current user from state:", user);
    console.log("Current user from auth:", auth.currentUser);
    
    setLoading(true);

    try {
      // Double-check authentication
      const currentUser = auth.currentUser;
      console.log("Auth currentUser:", currentUser);
      
      if (!currentUser) {
        console.error("No authenticated user found");
        toast.error("Please log in to submit a complaint");
        setLoading(false);
        return;
      }

      // Log user details
      console.log("User details:", {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        emailVerified: currentUser.emailVerified
      });

      // Validate form data
      if (!formData.department || !formData.description.trim()) {
        console.error("Form validation failed");
        toast.error("Please fill in all required fields");
        setLoading(false);
        return;
      }

      console.log("Getting urgency from AI...");
      const urgency = await getUrgencyFromGemini(formData.description);

      // Create complaint document
      const complaintData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        department: formData.department,
        description: formData.description.trim(),
        location: formData.location.trim() || "Not specified",
        urgency: urgency,
        status: "Pending",
        adminReply: "",
        timestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      console.log("Complaint data to be saved:", complaintData);

      // Test Firestore connection
      console.log("Testing Firestore connection...");
      console.log("Database instance:", db);

      // Add to Firestore
      console.log("Adding document to Firestore...");
      const docRef = await addDoc(collection(db, "complaints"), complaintData);
      console.log("Document added successfully with ID:", docRef.id);

      toast.success("Complaint submitted successfully!");
      
      // Reset form
      setFormData({ 
        department: "", 
        description: "", 
        location: "" 
      });
      
    } catch (error) {
      console.error("=== ERROR DETAILS ===");
      console.error("Error object:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // More specific error handling
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. Please check Firestore security rules.");
        console.error("Firestore permission denied - check security rules");
      } else if (error.code === 'unauthenticated') {
        toast.error("Authentication required. Please log in again.");
        console.error("User not authenticated");
      } else if (error.code === 'network-request-failed') {
        toast.error("Network error. Please check your connection.");
        console.error("Network request failed");
      } else if (error.code === 'unavailable') {
        toast.error("Firestore service unavailable. Please try again.");
        console.error("Firestore service unavailable");
      } else {
        toast.error(`Error submitting complaint: ${error.message}`);
        console.error("Unknown error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Show login required message if not authenticated
  if (!user) {
    return (
      <motion.div 
        className="complaint-form-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="alert alert-warning d-flex align-items-center">
          <AlertCircle className="me-2" size={20} />
          <div>
            <h5>Authentication Required</h5>
            <p className="mb-0">Please log in to submit a complaint. You need to be authenticated to access this feature.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="complaint-form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* User Info Display */}
      <div className="alert alert-info d-flex align-items-center mb-3">
        <User className="me-2" size={16} />
        <small>Logged in as: {user.email}</small>
      </div>

      <div className="form-header">
        <h3>Submit New Complaint</h3>
        <p>Help us improve campus facilities by reporting issues</p>
      </div>

      <form onSubmit={handleSubmit} className="modern-form">
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">
                <FileText size={18} />
                Department *
              </label>
              <select
                name="department"
                className="form-control modern-select"
                value={formData.department}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Department</option>
                <option value="hostel">Hostel</option>
                <option value="mess">Mess/Cafeteria</option>
                <option value="academics">Academics</option>
                <option value="facilities">Facilities</option>
                <option value="transport">Transport</option>
                <option value="security">Security</option>
                <option value="sports">Sports</option>
                <option value="library">Library</option>
                <option value="it">IT Support</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">
                <MapPin size={18} />
                Location
              </label>
              <input
                type="text"
                name="location"
                className="form-control modern-input"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Room 101, Block A"
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            name="description"
            className="form-control modern-textarea"
            rows="4"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe the issue in detail..."
            required
          />
        </div>

        <motion.button
          type="submit"
          className="btn btn-primary modern-btn submit-btn"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <>
              <div className="spinner-border spinner-border-sm me-2" />
              Processing...
            </>
          ) : (
            <>
              <Send size={18} className="me-2" />
              Submit Complaint
            </>
          )}
        </motion.button>
      </form>

    </motion.div>
  );
}

export default ComplaintForm;