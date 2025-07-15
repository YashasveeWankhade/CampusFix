import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MapPin, MessageSquare, AlertCircle, CheckCircle, XCircle, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

function ComplaintList() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    console.log("ComplaintList - Auth state:", { user: user?.uid, authLoading });
    
    if (authLoading) return;
    
    if (!user) {
      setError("Please log in to view complaints");
      setLoading(false);
      return;
    }

    console.log("Setting up complaints listener for user:", user.uid);
    setLoading(true);

    try {
      const q = query(
        collection(db, "complaints"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log("Snapshot received, docs count:", snapshot.docs.length);
          
          const results = snapshot.docs.map((doc) => {
            const data = doc.data();
            console.log("Complaint data:", data);
            return {
              id: doc.id,
              ...data
            };
          });
          
          setComplaints(results);
          setLoading(false);
          setError(null);

          // Show notifications for status changes
          snapshot.docChanges().forEach((change) => {
            if (change.type === "modified") {
              const complaint = { id: change.doc.id, ...change.doc.data() };
              toast.info(`Complaint status updated to: ${complaint.status}`);
            }
          });
        },
        (error) => {
          console.error("Error fetching complaints:", error);
          setError(`Error loading complaints: ${error.message}`);
          setLoading(false);
          
          if (error.code === 'permission-denied') {
            toast.error("Permission denied. Please check your login status.");
          } else {
            toast.error("Error loading complaints. Please try again.");
          }
        }
      );

      return () => {
        console.log("Cleaning up complaints listener");
        unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up listener:", error);
      setError(`Error: ${error.message}`);
      setLoading(false);
    }
  }, [user, authLoading]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock size={16} className="text-warning" />;
      case "In Progress":
        return <AlertCircle size={16} className="text-info" />;
      case "Resolved":
        return <CheckCircle size={16} className="text-success" />;
      case "Rejected":
        return <XCircle size={16} className="text-danger" />;
      default:
        return <AlertCircle size={16} className="text-secondary" />;
    }
  };

  const getUrgencyBadge = (urgency) => {
    const classes = {
      Critical: "bg-danger",
      High: "bg-warning",
      Medium: "bg-info", 
      Low: "bg-success"
    };
    return classes[urgency] || "bg-secondary";
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filter === "all") return true;
    return complaint.status?.toLowerCase() === filter;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString();
  };

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center">
        <AlertCircle className="me-2" size={20} />
        <div>
          <h5>Error</h5>
          <p className="mb-0">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading your complaints...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="complaints-list-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-4">
        <h3>Your Complaints</h3>
        <div className="btn-group" role="group">
          <button 
            className={`btn ${filter === "all" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilter("all")}
          >
            All ({complaints.length})
          </button>
          <button 
            className={`btn ${filter === "pending" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilter("pending")}
          >
            Pending ({complaints.filter(c => c.status === "Pending").length})
          </button>
          <button 
            className={`btn ${filter === "resolved" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilter("resolved")}
          >
            Resolved ({complaints.filter(c => c.status === "Resolved").length})
          </button>
          <button 
            className={`btn ${filter === "rejected" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilter("rejected")}
          >
            Rejected ({complaints.filter(c => c.status === "Rejected").length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredComplaints.length === 0 ? (
          <motion.div 
            className="text-center py-5"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            <FileText size={64} className="text-muted mb-3" />
            <h4>No complaints found</h4>
            <p className="text-muted">
              {filter === "all" 
                ? "You haven't submitted any complaints yet." 
                : `No complaints found for the ${filter} filter.`}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
            {filteredComplaints.map((complaint, index) => (
              <motion.div 
                key={complaint.id} 
                className="card mb-3"
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="card-title">
                        {complaint.department ? 
                          complaint.department.charAt(0).toUpperCase() + complaint.department.slice(1) : 
                          'Unknown Department'}
                      </h5>
                      <div className="d-flex gap-2 mb-2">
                        <span className={`badge ${getUrgencyBadge(complaint.urgency)}`}>
                          {complaint.urgency || 'Medium'}
                        </span>
                        <div className="d-flex align-items-center gap-1">
                          {getStatusIcon(complaint.status)}
                          <span className="badge bg-secondary">{complaint.status || 'Pending'}</span>
                        </div>
                      </div>
                    </div>
                    <small className="text-muted">{formatDate(complaint.timestamp)}</small>
                  </div>

                  <p className="card-text">{complaint.description}</p>

                  {complaint.location && complaint.location !== "Not specified" && (
                    <div className="d-flex align-items-center mb-2 text-muted">
                      <MapPin size={14} className="me-1" />
                      <small>{complaint.location}</small>
                    </div>
                  )}

                  {complaint.adminReply && (
                    <div className="alert alert-info">
                      <div className="d-flex align-items-center mb-2">
                        <MessageSquare size={14} className="me-1" />
                        <strong>Admin Reply:</strong>
                      </div>
                      <p className="mb-0">{complaint.adminReply}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ComplaintList;