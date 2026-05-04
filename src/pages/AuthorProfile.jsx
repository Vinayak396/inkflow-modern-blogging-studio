import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function AuthorProfile() {
  const { authorName } = useParams();
  const { user } = useAuth();
  const decodedName = decodeURIComponent(authorName);
  const [authorPosts, setAuthorPosts] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user && user.name === decodedName;

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        // Fetch author's posts from API
        const apiPosts = await api.getPosts({ author: decodedName });
        const mappedPosts = (apiPosts || []).map((p) => ({ ...p, id: p._id }));
        setAuthorPosts(mappedPosts);

        // Count total likes
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

        // Subscriber count
        try {
          const subData = await api.getSubscriptionCount(decodedName);
          setSubscriberCount(subData.count || 0);
        } catch {
          setSubscriberCount(0);
        }

        // Subscription status
        if (user) {
          try {
            const statusData = await api.getSubscriptionStatus(decodedName);
            setSubscribed(statusData.subscribed || false);
          } catch {
            setSubscribed(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch author data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authorName, user, decodedName]);

  const handleSubscribe = async () => {
    if (!user) return;
    try {
      const result = await api.toggleSubscription(decodedName);
      setSubscribed(result.subscribed);
      setSubscriberCount(result.count != null ? result.count : (prev) => result.subscribed ? prev + 1 : prev - 1);

      // Update localStorage cache for Navbar
      const mySubs = JSON.parse(localStorage.getItem("inkflow-my-subs")) || [];
      if (result.subscribed) {
        if (!mySubs.includes(decodedName)) mySubs.push(decodedName);
      } else {
        const idx = mySubs.indexOf(decodedName);
        if (idx > -1) mySubs.splice(idx, 1);
      }
      localStorage.setItem("inkflow-my-subs", JSON.stringify(mySubs));
    } catch (err) {
      console.error("Failed to toggle subscription:", err);
    }
  };

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

  // Get socials from the author's most recent post
  const socials = authorPosts.length > 0 ? authorPosts[0].socials : null;

  if (loading) {
    return (
      <div className="profile-page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Author Header */}
      <div className="profile-header">
        <div className="profile-avatar">{decodedName.charAt(0).toUpperCase()}</div>
        <div className="profile-info">
          <h1 className="profile-name">{decodedName}</h1>
          {socials && (
            <div className="author-profile-socials">
              {socials.twitter && (
                <a href={`https://x.com/${socials.twitter}`} target="_blank" rel="noreferrer" title="Twitter/X">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {socials.github && (
                <a href={`https://github.com/${socials.github}`} target="_blank" rel="noreferrer" title="GitHub">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                </a>
              )}
              {socials.website && (
                <a href={socials.website.startsWith("http") ? socials.website : `https://${socials.website}`} target="_blank" rel="noreferrer" title="Website">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                </a>
              )}
            </div>
          )}
        </div>
        {!isOwnProfile && (
          <button
            className={`btn ${subscribed ? "btn-ghost" : "btn-primary"} profile-subscribe-btn`}
            onClick={handleSubscribe}
            disabled={!user}
            title={user ? (subscribed ? "Unsubscribe" : "Subscribe") : "Log in to subscribe"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={subscribed ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {subscribed ? "Subscribed" : "Subscribe"}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{authorPosts.length}</span>
          <span className="profile-stat-label">{authorPosts.length === 1 ? "Post" : "Posts"}</span>
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

      {/* Author's Posts */}
      <div className="profile-posts-section">
        <div className="profile-posts-header">
          <h2>Posts by {decodedName}</h2>
        </div>

        {authorPosts.length === 0 ? (
          <div className="profile-empty">
            <h3>No posts yet</h3>
            <p>This author hasn't published any posts.</p>
          </div>
        ) : (
          <div className="profile-posts-list">
            {authorPosts.map((post) => {
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
