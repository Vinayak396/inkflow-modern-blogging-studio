import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function Profile() {
  const { user } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch user's posts by authorId (reliable — not affected by author name string)
        const apiPosts = await api.getPosts({ authorId: user.id });
        const mappedPosts = (apiPosts || []).map((p) => ({ ...p, id: p._id }));
        setUserPosts(mappedPosts);

        // Count total likes across user's posts
        let likeCount = 0;
        for (const p of mappedPosts) {
          try {
            const likesData = await api.getLikes(p.id);
            likeCount += (likesData.count != null ? likesData.count : (likesData.users || []).length);
          } catch {
            // skip
          }
        }
        setTotalLikes(likeCount);

        // Count subscribers
        try {
          const subData = await api.getSubscriptionCount(user.name);
          setSubscriberCount(subData.count || 0);
        } catch {
          setSubscriberCount(0);
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  if (!user) return null;

  const joinDate = new Date(user.id).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  if (loading) {
    return (
      <div className="profile-page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div className="profile-info">
          <h1 className="profile-name">{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-joined">Member since {joinDate}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{userPosts.length}</span>
          <span className="profile-stat-label">{userPosts.length === 1 ? "Post" : "Posts"}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{totalLikes}</span>
          <span className="profile-stat-label">{totalLikes === 1 ? "Like" : "Likes"}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{subscriberCount}</span>
          <span className="profile-stat-label">{subscriberCount === 1 ? "Subscriber" : "Subscribers"}</span>
        </div>
      </div>

      {/* User's Posts */}
      <div className="profile-posts-section">
        <div className="profile-posts-header">
          <h2>Your Posts</h2>
          <Link to="/create" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Post
          </Link>
        </div>

        {userPosts.length === 0 ? (
          <div className="profile-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <h3>No posts yet</h3>
            <p>Start sharing your ideas with the world!</p>
            <Link to="/create" className="btn btn-primary btn-lg">Write Your First Post</Link>
          </div>
        ) : (
          <div className="profile-posts-list">
            {userPosts.map((post) => {
              const firstImage = getFirstImage(post.content);
              const preview = stripHtml(post.content).substring(0, 120);

              return (
                <Link to={`/post/${post.id}`} key={post.id} className="profile-post-card">
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
                      {post.date && (
                        <span>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      )}
                      <span>·</span>
                      <span>{getReadTime(post.content)}</span>
                    </div>
                    <p className="profile-post-preview">{preview}...</p>
                    {(post.tags || []).length > 0 && (
                      <div className="profile-post-tags">
                        {post.tags.slice(0, 3).map((t) => (
                          <span key={t} className="profile-post-tag">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
