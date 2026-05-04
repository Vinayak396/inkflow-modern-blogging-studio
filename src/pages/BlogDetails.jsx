import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

function renderContent(text) {
  if (!text) return "";
  if (/<(div|p|span|strong|em|h[1-6]|blockquote|img|iframe|br)\b/i.test(text)) {
    return text;
  }
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\n/g, "<br />");
}

export default function BlogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [shared, setShared] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [allOtherPosts, setAllOtherPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch post from API
      let foundPost = null;
      try {
        const data = await api.getPost(id);
        if (data && data._id) {
          const aid = data.authorId?._id || data.authorId;
          foundPost = { ...data, id: data._id, authorId: aid };
        }
      } catch {
        // not found in API
      }
      setPost(foundPost);

      if (foundPost) {
        // Load likes from API
        try {
          const likesData = await api.getLikes(foundPost.id);
          setLikes(likesData.count);
          if (user) setLiked((likesData.users || []).includes(user.id));
        } catch {
          setLikes(0);
        }

        // Load comments from API
        try {
          const commentsData = await api.getComments(foundPost.id);
          setComments((commentsData || []).map((c) => ({ ...c, id: c._id })));
        } catch {
          setComments([]);
        }

        // Check subscription status via API
        if (user && foundPost.author) {
          try {
            const statusData = await api.getSubscriptionStatus(foundPost.author);
            setSubscribed(statusData.subscribed || false);
          } catch {
            setSubscribed(false);
          }
        }

        // Check saved status (localStorage helper)
        if (user) {
          setSaved(api.isSaved(user.id, foundPost.id));
        }

        // Fetch all posts for related posts
        let allPosts = [];
        try {
          const apiPosts = await api.getPosts();
          allPosts = (apiPosts || []).map((p) => ({ ...p, id: p._id, authorId: p.authorId?._id || p.authorId }));
        } catch {
          allPosts = [];
        }
        const others = allPosts.filter((p) => String(p.id) !== String(foundPost.id));
        setAllOtherPosts(others);
        setSelectedTag(null);

        const currentTags = foundPost.tags || [];
        const scored = others.map((p) => {
          const sharedTags = (p.tags || []).filter((t) => currentTags.includes(t)).length;
          const sameAuthor = p.author === foundPost.author ? 1 : 0;
          return { ...p, score: sharedTags * 2 + sameAuthor };
        });
        scored.sort((a, b) => b.score - a.score);
        setRelatedPosts(scored.filter((p) => p.score > 0).slice(0, 3));
      }

      // Check edit request status via API
      if (user && foundPost && foundPost.authorId !== user.id) {
        try {
          const statusData = await api.getEditRequestStatus(foundPost.id);
          if (statusData && statusData.status) setRequestStatus(statusData.status);
        } catch {
          // no existing request
        }
      }
    };

    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [id, user]);

  const isLegacyPost = post && !post.authorId;
  const isOwner = user && post && (isLegacyPost || post.authorId === user.id);
  const canEdit = isOwner || requestStatus === "approved";

  const handleDelete = async () => {
    try {
      await api.deletePost(id);
      navigate("/");
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const handleSendRequest = async () => {
    if (!user || !post) return;
    try {
      await api.createEditRequest({
        postId: post.id,
        postTitle: post.title,
        requesterId: user.id,
        requesterName: user.name,
        authorId: post.authorId,
        message: requestMessage.trim(),
      });
      setRequestStatus("pending");
      setShowRequestModal(false);
      setRequestMessage("");
    } catch (err) {
      console.error("Failed to send edit request:", err);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    try {
      const result = await api.toggleLike(post.id);
      setLiked(result.liked);
      setLikes(result.count);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleSave = () => {
    if (!user) return;
    const nowSaved = api.toggleSavePost(user.id, post.id);
    setSaved(nowSaved);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleSubscribe = async () => {
    if (!user || !post.author) return;
    try {
      const result = await api.toggleSubscription(post.author);
      setSubscribed(result.subscribed);

      // Update localStorage cache for Navbar
      const mySubs = JSON.parse(localStorage.getItem("inkflow-my-subs")) || [];
      if (result.subscribed) {
        if (!mySubs.includes(post.author)) mySubs.push(post.author);
      } else {
        const idx = mySubs.indexOf(post.author);
        if (idx > -1) mySubs.splice(idx, 1);
      }
      localStorage.setItem("inkflow-my-subs", JSON.stringify(mySubs));
    } catch (err) {
      console.error("Failed to toggle subscription:", err);
    }
  };

  const handleAddComment = async () => {
    if (!user || !commentText.trim()) return;
    try {
      const newComment = await api.addComment(post.id, commentText.trim());
      setComments((prev) => [...prev, { ...newComment, id: newComment._id }]);
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  if (loading) return null;

  if (!post) {
    return (
      <div className="not-found">
        <div className="not-found-code">?</div>
        <h2>Post not found</h2>
        <p>This post may have been deleted or doesn't exist.</p>
        <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="blog-detail">
      <Link to="/" className="blog-detail-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to all posts
      </Link>

      <h1>{post.title}</h1>

      {(post.tags || []).length > 0 && (
        <div className="blog-detail-tags">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className={`tag tag-clickable ${selectedTag === tag ? "tag-active" : ""}`}
              onClick={() => {
                const newTag = selectedTag === tag ? null : tag;
                setSelectedTag(newTag);
                if (newTag) {
                  const filtered = allOtherPosts.filter((p) => (p.tags || []).includes(newTag));
                  setRelatedPosts(filtered.slice(0, 6));
                } else {
                  const currentTags = post.tags || [];
                  const scored = allOtherPosts.map((p) => {
                    const sharedTags = (p.tags || []).filter((t) => currentTags.includes(t)).length;
                    const sameAuthor = p.author === post.author ? 1 : 0;
                    return { ...p, score: sharedTags * 2 + sameAuthor };
                  });
                  scored.sort((a, b) => b.score - a.score);
                  setRelatedPosts(scored.filter((p) => p.score > 0).slice(0, 3));
                }
                document.querySelector(".related-posts")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="blog-detail-meta">
        <div className="blog-detail-meta-info">
          {post.author && <Link to={`/author/${encodeURIComponent(post.author)}`} className="blog-detail-author blog-detail-author-link">{post.author}</Link>}
          {post.date && (
            <span className="blog-detail-date">
              {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          )}
        </div>
        <div className="blog-detail-actions">
          {user && (
            <>
              {canEdit ? (
                <Link to={`/edit/${post.id}`} className="btn btn-ghost">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </Link>
              ) : requestStatus === "pending" ? (
                <span className="btn btn-ghost edit-request-pending">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Request Pending
                </span>
              ) : !isOwner && post.authorId ? (
                <button className="btn btn-ghost" onClick={() => setShowRequestModal(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Request Edit
                </button>
              ) : null}

              {isOwner && (
                <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Author Card */}
      {post.author && (
        <div className="author-card">
          <div className="author-card-avatar">{post.author.charAt(0).toUpperCase()}</div>
          <div className="author-card-info">
            <Link to={`/author/${encodeURIComponent(post.author)}`} className="author-card-name author-card-link">{post.author}</Link>
            <div className="author-card-socials">
              {post.socials?.twitter && (
                <a href={`https://x.com/${post.socials.twitter}`} target="_blank" rel="noreferrer" title="Twitter/X">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {post.socials?.github && (
                <a href={`https://github.com/${post.socials.github}`} target="_blank" rel="noreferrer" title="GitHub">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                </a>
              )}
              {post.socials?.website && (
                <a href={post.socials.website.startsWith("http") ? post.socials.website : `https://${post.socials.website}`} target="_blank" rel="noreferrer" title="Website">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className="blog-detail-content"
        dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
      />

      {/* Like, Share, Subscribe */}
      <div className="blog-actions-bar">
        <button
          className={`blog-action-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
          disabled={!user}
          title={user ? (liked ? "Unlike this post" : "Like this post") : "Log in to like"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <span>{likes} {likes === 1 ? "like" : "likes"}</span>
        </button>

        <button
          className={`blog-action-btn save-btn ${saved ? "saved" : ""}`}
          onClick={handleSave}
          disabled={!user}
          title={user ? (saved ? "Unsave this post" : "Save this post") : "Log in to save"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          <span>{saved ? "Saved" : "Save"}</span>
        </button>

        <button className={`blog-action-btn ${shared ? "shared" : ""}`} onClick={handleShare} title="Share this post">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>{shared ? "Link copied!" : "Share"}</span>
        </button>

        {post.author && (!user || post.authorId !== user?.id) && (
          <button
            className={`blog-action-btn subscribe-btn ${subscribed ? "subscribed" : ""}`}
            onClick={handleSubscribe}
            disabled={!user}
            title={user ? (subscribed ? `Unsubscribe from ${post.author}` : `Subscribe to ${post.author}`) : "Log in to subscribe"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={subscribed ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span>{subscribed ? "Subscribed" : "Subscribe"}</span>
          </button>
        )}
      </div>

      {/* Comment Section */}
      <div className="comments-section">
        <h2 className="comments-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Discussion ({comments.length})
        </h2>

        {user ? (
          <div className="comment-form">
            <div className="comment-form-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <div className="comment-form-input-wrap">
              <textarea
                className="comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
              />
              <button
                className="btn btn-primary comment-submit-btn"
                onClick={handleAddComment}
                disabled={!commentText.trim()}
              >
                Comment
              </button>
            </div>
          </div>
        ) : (
          <div className="comment-login-prompt">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span><Link to="/login">Log in</Link> to join the discussion</span>
          </div>
        )}

        {comments.length > 0 ? (
          <div className="comments-list">
            {comments.map((c) => (
              <div key={c.id} className="comment-item">
                <div className="comment-avatar">{c.userName.charAt(0).toUpperCase()}</div>
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="comment-author">{c.userName}</span>
                    <span className="comment-date">
                      {new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {user && user.id === c.userId && (
                      <button className="comment-delete-btn" onClick={() => handleDeleteComment(c.id)} title="Delete comment">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="comment-text">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="comments-empty">
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      {/* Related Posts */}
      {(relatedPosts.length > 0 || selectedTag) && (
        <div className="related-posts">
          <div className="related-posts-header">
            <h2 className="related-posts-title">
              {selectedTag ? `More posts tagged "${selectedTag}"` : "You might also enjoy"}
            </h2>
            {selectedTag && (
              <button
                className="btn btn-ghost related-posts-clear"
                onClick={() => {
                  setSelectedTag(null);
                  const currentTags = post.tags || [];
                  const scored = allOtherPosts.map((p) => {
                    const sharedTags = (p.tags || []).filter((t) => currentTags.includes(t)).length;
                    const sameAuthor = p.author === post.author ? 1 : 0;
                    return { ...p, score: sharedTags * 2 + sameAuthor };
                  });
                  scored.sort((a, b) => b.score - a.score);
                  setRelatedPosts(scored.filter((p) => p.score > 0).slice(0, 3));
                }}
              >
                Clear filter
              </button>
            )}
          </div>
          {relatedPosts.length > 0 ? (
            <div className="related-posts-grid">
              {relatedPosts.map((rp) => (
                <Link to={`/post/${rp.id}`} key={rp.id} className="related-post-card">
                  <h3 className="related-post-title">{rp.title}</h3>
                  <div className="related-post-meta">
                    {rp.author && <span>{rp.author}</span>}
                    {rp.date && <span> · {new Date(rp.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                  </div>
                  {(rp.tags || []).length > 0 && (
                    <div className="related-post-tags">
                      {rp.tags.slice(0, 3).map((t) => (
                        <span key={t} className="related-post-tag">{t}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="related-posts-empty">No posts found with this tag.</p>
          )}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this post?</h3>
            <p>This action cannot be undone. The post will be permanently removed.</p>
            <div className="confirm-dialog-actions">
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {showRequestModal && (
        <div className="confirm-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="confirm-dialog edit-request-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Request Edit Access</h3>
            <p>Send a request to <strong>{post.author}</strong> to edit this post.</p>
            <textarea
              className="edit-request-textarea"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Why do you want to edit this post? (optional)"
              rows={3}
            />
            <div className="confirm-dialog-actions">
              <button className="btn btn-ghost" onClick={() => setShowRequestModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSendRequest}>Send Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
