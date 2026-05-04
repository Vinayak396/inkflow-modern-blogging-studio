import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";

import api from "../utils/api";

export default function Home() {
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [activeAuthor, setActiveAuthor] = useState(searchParams.get("author") || "");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [allLikes, setAllLikes] = useState({});
  const [loading, setLoading] = useState(true);
  const tagDropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawPosts = await api.getPosts();
        const apiPosts = rawPosts.map((p) => ({ ...p, id: p._id, authorId: p.authorId?._id || p.authorId }));
        const merged = [...apiPosts];
        setPosts(merged);

        // Fetch likes for each post
        const likesMap = {};
        await Promise.all(
          merged.map(async (post) => {
            try {
              const likeData = await api.getLikes(post.id);
              likesMap[post.id] = likeData.count;
            } catch {
              likesMap[post.id] = 0;
            }
          })
        );
        setAllLikes(likesMap);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFirstImage = (content) => {
    const match = content.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : null;
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
    const minutes = Math.max(1, Math.round(words / 200));
    return `${minutes} min read`;
  };

  const highlightText = (text) => {
    if (!search) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === search.toLowerCase()
        ? <span key={i} className="search-highlight">{part}</span>
        : part
    );
  };

  const allTags = [...new Set(posts.flatMap((post) => post.tags || []))];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || (post.tags || []).includes(activeTag);
    const matchesAuthor = !activeAuthor || post.author === activeAuthor;
    return matchesSearch && matchesTag && matchesAuthor;
  });

  if (loading) return null;

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">Modern Blogging</div>
        <h1>
          Where Ideas Take
          <br />
          <span className="gradient-text">Shape & Flow</span>
        </h1>
        <p>
          Create, share, and discover beautifully crafted stories.
          Your thoughts deserve a stunning canvas.
        </p>
        <div className="hero-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search posts by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* Tag Filter Dropdown */}
      {allTags.length > 0 && (
        <div className="tag-dropdown-wrapper" ref={tagDropdownRef}>
          <button
            className={`tag-dropdown-toggle ${activeTag ? "active" : ""}`}
            onClick={() => setTagDropdownOpen((prev) => !prev)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            {activeTag || "Filter by tag"}
            <svg className={`tag-dropdown-chevron ${tagDropdownOpen ? "open" : ""}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {tagDropdownOpen && (
            <div className="tag-dropdown-menu">
              <button
                className={`tag-dropdown-item ${!activeTag ? "active" : ""}`}
                onClick={() => { setActiveTag(""); setTagDropdownOpen(false); }}
              >
                All tags
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`tag-dropdown-item ${activeTag === tag ? "active" : ""}`}
                  onClick={() => { setActiveTag(activeTag === tag ? "" : tag); setTagDropdownOpen(false); }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Posts Section */}
      <section className="posts-section">
        <div className="posts-header">
          <h2>{search ? "Search Results" : activeAuthor ? `Posts by ${activeAuthor}` : activeTag ? `Tagged "${activeTag}"` : "Latest Posts"}</h2>
          {activeAuthor && (
            <button className="btn btn-ghost" onClick={() => setActiveAuthor("")} style={{ marginLeft: "0.5rem" }}>
              Clear filter
            </button>
          )}
          <span className="posts-count">
            {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
          </span>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            <h3>{search ? "No matching posts" : "No posts yet"}</h3>
            <p>{search ? "Try a different search term" : "Start writing your first blog post!"}</p>
            {!search && (
              <Link to="/create" className="btn btn-primary btn-lg">
                Create Your First Post
              </Link>
            )}
          </div>
        ) : (
          <div className="posts-grid">
            {filteredPosts.map((post) => {
              const firstImage = getFirstImage(post.content);
              const previewText = stripHtml(post.content).substring(0, 150);

              return (
                <article key={post.id} className="post-card">
                  {firstImage ? (
                    <img src={firstImage} alt="" className="post-card-image" />
                  ) : (
                    <div className="post-card-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                  <div className="post-card-body">
                    <h3 className="post-card-title">{highlightText(post.title)}</h3>
                    <div className="post-card-meta">
                      {post.author && <Link to={`/author/${encodeURIComponent(post.author)}`} className="post-card-author post-card-author-link">{post.author}</Link>}
                      {post.author && <span className="post-card-dot">·</span>}
                      {post.date && <span className="post-card-date">{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                      {post.date && <span className="post-card-dot">·</span>}
                      <span className="post-card-readtime">{getReadTime(post.content)}</span>
                      {(allLikes[post.id] || 0) > 0 && (
                        <>
                          <span className="post-card-dot">·</span>
                          <span className="post-card-likes">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                            </svg>
                            {allLikes[post.id]}
                          </span>
                        </>
                      )}
                      {(post.tags || []).length > 0 && (
                        <div className="post-card-tags">
                          {post.tags.map((tag) => (
                            <span key={tag} className={`post-card-tag ${activeTag === tag ? "post-card-tag-active" : ""}`} onClick={(e) => { e.preventDefault(); setActiveTag(activeTag === tag ? "" : tag); }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="post-card-preview">{highlightText(previewText)}</p>
                    <div className="post-card-footer">
                      <Link to={`/post/${post.id}`} className="btn btn-primary">
                        Read More
                      </Link>
                      <Link to={`/edit/${post.id}`} className="btn btn-ghost">
                        Edit
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
