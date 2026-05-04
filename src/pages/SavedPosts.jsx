import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function SavedPosts() {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSaved = async () => {
      try {
        const userSavedIds = api.getSavedPostIds(user.id).map(String);

        const posts = [];
        for (const sid of userSavedIds) {
          try {
            const data = await api.getPost(sid);
            if (data && data._id) {
              posts.push({ ...data, id: data._id });
            }
          } catch {
            // Post may have been deleted, skip
          }
        }
        setSavedPosts(posts);
      } catch (err) {
        console.error("Failed to fetch saved posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, [user]);

  const stripHtml = (content) =>
    content
      .replace(/<[^>]*>?/gm, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/^#{1,3}\s+/gm, "")
      .replace(/^>\s+/gm, "");

  const getReadTime = (content) => {
    const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.round(words / 200))} min read`;
  };

  const getFirstImage = (content) => {
    const match = content.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : null;
  };

  const handleUnsave = (postId) => {
    api.toggleSavePost(user.id, postId);
    setSavedPosts(savedPosts.filter((p) => String(p.id) !== String(postId)));
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="profile-page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-posts-section">
        <div className="profile-posts-header">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 8 }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            Saved Posts
          </h2>
          <span className="posts-count">
            {savedPosts.length} {savedPosts.length === 1 ? "post" : "posts"}
          </span>
        </div>

        {savedPosts.length === 0 ? (
          <div className="profile-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            <h3>No saved posts</h3>
            <p>Posts you save will appear here for easy access.</p>
            <Link to="/" className="btn btn-primary btn-lg">Browse Posts</Link>
          </div>
        ) : (
          <div className="profile-posts-list">
            {savedPosts.map((post) => {
              const firstImage = getFirstImage(post.content);
              const preview = stripHtml(post.content).substring(0, 120);

              return (
                <div key={post.id} className="profile-post-card saved-post-card">
                  <Link to={`/post/${post.id}`} className="saved-post-link">
                    {firstImage ? (
                      <img src={firstImage} alt="" className="profile-post-image" />
                    ) : (
                      <div className="profile-post-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                    <div className="profile-post-body">
                      <h3 className="profile-post-title">{post.title}</h3>
                      <div className="profile-post-meta">
                        {post.author && <span>{post.author}</span>}
                        {post.author && post.date && <span>·</span>}
                        {post.date && (
                          <span>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        )}
                        <span>·</span>
                        <span>{getReadTime(post.content)}</span>
                      </div>
                      <p className="profile-post-preview">{preview}...</p>
                    </div>
                  </Link>
                  <button
                    className="saved-post-remove"
                    onClick={() => handleUnsave(post.id)}
                    title="Remove from saved"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
