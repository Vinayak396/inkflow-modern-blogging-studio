import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function EditRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await api.getEditRequests();
        const mapped = (data || [])
          .map((r) => ({ ...r, id: r._id }))
          .filter((r) => r.authorId === user.id);
        setRequests(mapped);
      } catch (err) {
        console.error("Failed to fetch edit requests:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchRequests();
  }, [user]);

  const updateRequest = async (requestId, status) => {
    try {
      await api.updateEditRequest(requestId, status);
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r))
      );
    } catch (err) {
      console.error("Failed to update edit request:", err);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const handled = requests.filter((r) => r.status !== "pending");

  if (loading) {
    return (
      <div className="edit-requests-page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="edit-requests-page">
      <Link to="/" className="blog-detail-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back
      </Link>

      <h1>Edit Requests</h1>
      <p className="edit-requests-subtitle">People requesting permission to edit your posts</p>

      {requests.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h3>No edit requests</h3>
          <p>When someone wants to edit your posts, their requests will appear here.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="requests-section">
              <h2 className="requests-section-title">
                Pending
                <span className="requests-badge">{pending.length}</span>
              </h2>
              <div className="requests-list">
                {pending.map((req) => (
                  <div key={req.id} className="request-card">
                    <div className="request-card-header">
                      <div className="request-card-avatar">{req.requesterName.charAt(0).toUpperCase()}</div>
                      <div className="request-card-info">
                        <span className="request-card-name">{req.requesterName}</span>
                        <span className="request-card-date">
                          {new Date(req.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div className="request-card-post">
                      wants to edit <Link to={`/post/${req.postId}`}>"{req.postTitle}"</Link>
                    </div>
                    {req.message && (
                      <div className="request-card-message">"{req.message}"</div>
                    )}
                    <div className="request-card-actions">
                      <button className="btn btn-primary" onClick={() => updateRequest(req.id, "approved")}>
                        Approve
                      </button>
                      <button className="btn btn-danger" onClick={() => updateRequest(req.id, "rejected")}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {handled.length > 0 && (
            <div className="requests-section">
              <h2 className="requests-section-title">History</h2>
              <div className="requests-list">
                {handled.map((req) => (
                  <div key={req.id} className="request-card request-card-handled">
                    <div className="request-card-header">
                      <div className="request-card-avatar">{req.requesterName.charAt(0).toUpperCase()}</div>
                      <div className="request-card-info">
                        <span className="request-card-name">{req.requesterName}</span>
                        <span className="request-card-date">
                          {new Date(req.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <span className={`request-status request-status-${req.status}`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="request-card-post">
                      <Link to={`/post/${req.postId}`}>"{req.postTitle}"</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
