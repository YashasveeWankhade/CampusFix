import { useState, useEffect } from "react";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  MapPin,
  FileText,
  LogOut
} from "lucide-react";

function AdminPanel() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [adminReply, setAdminReply] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    console.log("AdminPanel - Setting up complaints listener...");
    
    if (!user) {
      setError("Please log in to access admin panel");
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      const q = query(
        collection(db, "complaints"),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log("Admin - Snapshot received, docs count:", snapshot.docs.length);
          
          const complaintsData = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log("Admin - Complaint data:", data);
            return {
              id: doc.id,
              ...data
            };
          });
          
          setComplaints(complaintsData);
          setLoading(false);
          setError(null);
        }, 
        (error) => {
          console.error("Admin - Error loading complaints:", error);
          setError(`Error loading complaints: ${error.message}`);
          setLoading(false);
          
          if (error.code === 'permission-denied') {
            toast.error("Permission denied. Please check admin privileges.");
          } else {
            toast.error("Error loading complaints. Please try again.");
          }
        }
      );

      return () => {
        console.log("Admin - Cleaning up complaints listener");
        unsubscribe();
      };
    } catch (error) {
      console.error("Admin - Error setting up listener:", error);
      setError(`Error: ${error.message}`);
      setLoading(false);
    }
  }, [user]);

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 'text-danger';
      case 'high': return 'text-warning';
      case 'medium': return 'text-info';
      case 'low': return 'text-success';
      default: return 'text-secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock size={16} className="text-warning" />;
      case 'resolved': return <CheckCircle size={16} className="text-success" />;
      case 'rejected': return <XCircle size={16} className="text-danger" />;
      default: return <AlertTriangle size={16} className="text-secondary" />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleUpdateComplaint = async (complaintId, newStatus) => {
    setUpdating(true);
    try {
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      if (adminReply.trim()) {
        updateData.adminReply = adminReply.trim();
      }

      await updateDoc(doc(db, "complaints", complaintId), updateData);
      
      toast.success("Complaint updated successfully!");
      setSelectedComplaint(null);
      setAdminReply("");
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast.error("Error updating complaint");
    } finally {
      setUpdating(false);
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || complaint.status?.toLowerCase() === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || complaint.urgency?.toLowerCase() === urgencyFilter;
    const matchesDepartment = departmentFilter === "all" || complaint.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency && matchesDepartment;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    critical: complaints.filter(c => c.urgency === 'Critical').length
  };

  if (loading) {
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
        <AlertTriangle className="me-2" size={20} />
        <div>
          <h5>Error</h5>
          <p className="mb-0">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="admin-panel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header matching student dashboard style */}
      <div className="dashboard-header">
        <span className="logout-btn-container"><button
          className="btn btn-outline-light logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={18} className="me-2" />
          Logout
        </button></span>
        <div className="header-content">
          <h1 className="dashboard-title">CampusFix</h1>
          <p className="dashboard-subtitle">Admin Panel</p>
          <div className="user-info">
            <User size={16} />
            <span>{user?.email}</span>
          </div>
        </div>
        
      </div>

      <div className="dashboard-content">
        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h5>Total Complaints</h5>
                <h3>{stats.total}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body">
                <h5>Pending</h5>
                <h3>{stats.pending}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body">
                <h5>Resolved</h5>
                <h3>{stats.resolved}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-danger text-white">
              <div className="card-body">
                <h5>Critical</h5>
                <h3>{stats.critical}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-2">
            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="col-md-2">
            <select 
              className="form-select"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
            >
              <option value="all">All Urgency</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="col-md-2">
            <select 
              className="form-select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
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

        {/* Complaints List */}
        <div className="complaints-list">
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-5">
              <FileText size={64} className="text-muted mb-3" />
              <h4>No complaints found</h4>
              <p className="text-muted">No complaints match your current filters.</p>
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <motion.div
                key={complaint.id}
                className="card mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-8">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="card-title">
                            {complaint.department ? complaint.department.charAt(0).toUpperCase() + complaint.department.slice(1) : 'Unknown Department'}
                          </h5>
                          <div className="d-flex gap-3 text-muted small mb-2">
                            <span>
                              <User size={14} className="me-1" />
                              {complaint.userName || complaint.userEmail}
                            </span>
                            <span>
                              <Calendar size={14} className="me-1" />
                              {formatDate(complaint.timestamp)}
                            </span>
                            <span>
                              <MapPin size={14} className="me-1" />
                              {complaint.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="d-flex gap-2 align-items-center mb-2">
                            {getStatusIcon(complaint.status)}
                            <span className="badge bg-secondary">{complaint.status}</span>
                          </div>
                          <span className={`badge ${getUrgencyColor(complaint.urgency)} border`}>
                            {complaint.urgency}
                          </span>
                        </div>
                      </div>
                      <p className="card-text">{complaint.description}</p>
                      {complaint.adminReply && (
                        <div className="alert alert-info">
                          <strong>Admin Reply:</strong> {complaint.adminReply}
                        </div>
                      )}
                    </div>
                    <div className="col-md-4">
                      <div className="d-flex flex-column gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setAdminReply(complaint.adminReply || "");
                          }}
                        >
                          <MessageSquare size={14} className="me-1" />
                          Respond
                        </button>
                        <button
                          className="btn btn-outline-success btn-sm"
                          onClick={() => handleUpdateComplaint(complaint.id, 'Resolved')}
                          disabled={updating}
                        >
                          <CheckCircle size={14} className="me-1" />
                          Mark Resolved
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleUpdateComplaint(complaint.id, 'Rejected')}
                          disabled={updating}
                        >
                          <XCircle size={14} className="me-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Reply Modal */}
        {selectedComplaint && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Respond to Complaint</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setSelectedComplaint(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <strong>Complaint:</strong>
                    <p className="text-muted">{selectedComplaint.description}</p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Admin Reply</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      placeholder="Type your response here..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setSelectedComplaint(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => handleUpdateComplaint(selectedComplaint.id, 'Resolved')}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Send Reply & Resolve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AdminPanel;