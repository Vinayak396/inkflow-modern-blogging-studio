import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../utils/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [subscribedAuthors, setSubscribedAuthors] = useState([]);
  const [sidebarPinned, setSidebarPinned] = useState(false);

  useEffect(() => {
    if (!user) { setPendingCount(0); setSubscribedAuthors([]); return; }
    const check = async () => {
      // Fetch pending edit requests count from API
      try {
        const requests = await api.getEditRequests();
        const count = (requests || []).filter((r) => r.authorId === user.id && r.status === "pending").length;
        setPendingCount(count);
      } catch {
        setPendingCount(0);
      }

      // Read subscribed authors from localStorage cache
      const mySubs = JSON.parse(localStorage.getItem("inkflow-my-subs")) || [];
      setSubscribedAuthors(mySubs);
    };
    check();
    window.addEventListener("focus", check);
    const interval = setInterval(check, 5000);
    return () => { window.removeEventListener("focus", check); clearInterval(interval); };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="navbar">
        {user && (
          <button
            className="nav-hamburger-sidebar"
            onClick={() => setSidebarPinned((prev) => !prev)}
            title={sidebarPinned ? "Collapse menu" : "Expand menu"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <div className="navbar-inner">
          <div className="navbar-left">
            <Link to="/" className="navbar-brand">
              <span className="brand-dot" />
              InkFlow
            </Link>
          </div>

          <div className="navbar-right">
            <Link to="/about" className="nav-link">About</Link>
            {user ? (
              <>
                <Link to="/create" className="nav-link-create">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Write
                </Link>
                <Link to="/edit-requests" className="nav-icon-btn" title="Edit requests">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                  {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
                </Link>
                <Link to="/profile" className="nav-icon-btn nav-avatar-btn" title="Profile">
                  <div className="nav-avatar">{user.name.charAt(0).toUpperCase()}</div>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Log In</Link>
                <Link to="/signup" className="nav-link-create">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar — always visible as icons, expands on hover */}
      {user && (
        <aside className={`sidebar ${sidebarPinned ? "sidebar-pinned" : ""}`}>
          <div className="sidebar-nav">
            <Link to="/" className={`sidebar-item ${isActive("/") ? "active" : ""}`} title="Home">
              <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="sidebar-label">Home</span>
            </Link>

            <Link to="/saved" className={`sidebar-item ${isActive("/saved") ? "active" : ""}`} title="Saved">
              <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              <span className="sidebar-label">Saved</span>
            </Link>

            <Link to="/profile" className={`sidebar-item ${isActive("/profile") ? "active" : ""}`} title="Your Profile">
              <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="sidebar-label">Your Profile</span>
            </Link>

            <Link to="/edit-requests" className={`sidebar-item ${isActive("/edit-requests") ? "active" : ""}`} title="Edit Requests">
              <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="sidebar-label">Edit Requests</span>
              {pendingCount > 0 && <span className="sidebar-badge">{pendingCount}</span>}
            </Link>

            {/* Subscribed Authors */}
            {subscribedAuthors.length > 0 && (
              <>
                <div className="sidebar-divider" />
                <div className="sidebar-section-label">Subscriptions</div>
                {subscribedAuthors.map((author) => (
                  <Link
                    to={`/author/${encodeURIComponent(author)}`}
                    key={author}
                    className={`sidebar-item sidebar-author ${isActive(`/author/${encodeURIComponent(author)}`) ? "active" : ""}`}
                    title={author}
                  >
                    <div className="sidebar-author-avatar">{author.charAt(0).toUpperCase()}</div>
                    <span className="sidebar-label">{author}</span>
                  </Link>
                ))}
              </>
            )}

            <div className="sidebar-divider" />

            <button className="sidebar-item sidebar-logout" onClick={handleLogout} title="Logout">
              <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="sidebar-label">Logout</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
