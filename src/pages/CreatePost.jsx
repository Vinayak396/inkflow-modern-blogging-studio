import { useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PolishModal from "../components/PolishModal";
import { polishText } from "../utils/polishText";
import api from "../utils/api";


export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [authorName, setAuthorName] = useState(localStorage.getItem("inkflow-author") || "");
  const [authorTwitter, setAuthorTwitter] = useState(localStorage.getItem("inkflow-twitter") || "");
  const [authorGithub, setAuthorGithub] = useState(localStorage.getItem("inkflow-github") || "");
  const [authorWebsite, setAuthorWebsite] = useState(localStorage.getItem("inkflow-website") || "");

  // AI Polish state
  const [showPolish, setShowPolish] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("groq-api-key") || "");
  const [originalSelection, setOriginalSelection] = useState("");
  const [polishedText, setPolishedText] = useState("");
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishError, setPolishError] = useState(null);
  const selectionRef = useRef(null);
  const imageInputRef = useRef(null);
  const editorRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [wordCount, setWordCount] = useState(0);

  const syncContent = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText.trim();
      setIsEmpty(text === "");
      const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
      setWordCount(words);
    }
  }, []);

  const getContent = () => {
    return editorRef.current ? editorRef.current.innerHTML : "";
  };

  const focusEditor = () => {
    if (editorRef.current) editorRef.current.focus();
  };

  const execCmd = (command, value = null) => {
    focusEditor();
    document.execCommand(command, false, value);
    syncContent();
  };

  const handleFontSize = (size) => {
    if (!size) return;
    focusEditor();
    document.execCommand("fontSize", false, "7");
    const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
    fontElements.forEach((el) => {
      const span = document.createElement("span");
      span.style.fontSize = size + "px";
      span.innerHTML = el.innerHTML;
      el.parentNode.replaceChild(span, el);
    });
    syncContent();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxWidth = 800;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL("image/jpeg", 0.7);
      focusEditor();
      document.execCommand(
        "insertHTML",
        false,
        `<img src="${compressed}" style="max-width:100%; border-radius:10px;" />`
      );
      syncContent();
      URL.revokeObjectURL(url);
    };
    img.src = url;
    e.target.value = "";
  };

  const handlePublish = async () => {
    if (!title.trim()) return;
    localStorage.setItem("inkflow-author", authorName);
    localStorage.setItem("inkflow-twitter", authorTwitter);
    localStorage.setItem("inkflow-github", authorGithub);
    localStorage.setItem("inkflow-website", authorWebsite);

    try {
      const result = await api.createPost({
        title,
        content: getContent(),
        tags,
        author: authorName,
        socials: { twitter: authorTwitter, github: authorGithub, website: authorWebsite },
      });
      if (result.error) {
        alert(result.error);
        return;
      }
      navigate(`/post/${result._id}`);
    } catch (err) {
      alert("Failed to publish post. Make sure the server is running.");
      console.error(err);
    }
  };

  // AI Polish handlers
  const handlePolish = async () => {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
      alert("Select some text first, then click Polish.");
      return;
    }

    const key = localStorage.getItem("groq-api-key");
    if (!key) {
      setShowKeyInput(true);
      return;
    }

    const selected = selection.toString();
    selectionRef.current = selection.getRangeAt(0).cloneRange();
    setOriginalSelection(selected);
    setPolishedText("");
    setPolishError(null);
    setIsPolishing(true);
    setShowPolish(true);

    try {
      const result = await polishText(key, selected);
      setPolishedText(result);
    } catch (err) {
      const msg = err.message || "Something went wrong. Please try again.";
      if (msg.includes("API key") || msg.includes("401") || msg.includes("403") || msg.includes("expired") || msg.includes("429")) {
        setPolishError(msg + " — Try clicking 'Change API Key' to enter a new key.");
      } else {
        setPolishError(msg);
      }
    } finally {
      setIsPolishing(false);
    }
  };

  const handleAcceptPolish = () => {
    const range = selectionRef.current;
    if (range) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand("insertText", false, polishedText);
      syncContent();
    }
    setShowPolish(false);
  };

  const handleSaveKey = () => {
    if (!apiKey.trim()) return;
    localStorage.setItem("groq-api-key", apiKey.trim());
    setShowKeyInput(false);
  };

  return (
    <div className="editor-page">
      <Link to="/" className="blog-detail-back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back
      </Link>

      <h1>Create Post</h1>

      <div className="editor-field">
        <label>Title</label>
        <input
          className="editor-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your post a title..."
        />
      </div>

      <div className="editor-field">
        <label>Tags</label>
        <div className="tags-input-wrapper">
          {tags.map((tag, i) => (
            <span key={i} className="tag">
              {tag}
              <button type="button" onClick={() => setTags(tags.filter((_, j) => j !== i))}>&times;</button>
            </span>
          ))}
          <input
            className="tags-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                e.preventDefault();
                const newTag = tagInput.trim().toLowerCase();
                if (!tags.includes(newTag)) setTags([...tags, newTag]);
                setTagInput("");
              }
              if (e.key === "Backspace" && !tagInput && tags.length) {
                setTags(tags.slice(0, -1));
              }
            }}
            placeholder={tags.length ? "Add more..." : "Type a tag and press Enter..."}
          />
        </div>
      </div>

      <div className="editor-field">
        <label>Author</label>
        <div className="author-fields">
          <input className="author-input" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Your name" />
          <input className="author-input" value={authorTwitter} onChange={(e) => setAuthorTwitter(e.target.value)} placeholder="Twitter/X username (optional)" />
          <input className="author-input" value={authorGithub} onChange={(e) => setAuthorGithub(e.target.value)} placeholder="GitHub username (optional)" />
          <input className="author-input" value={authorWebsite} onChange={(e) => setAuthorWebsite(e.target.value)} placeholder="Website URL (optional)" />
        </div>
      </div>

      <div className="editor-field">
        <label>Content</label>
        <div className="editor-toolbar">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />
          <button type="button" className="toolbar-btn" onClick={() => imageInputRef.current.click()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Image
          </button>

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => {
              let url = prompt("Enter YouTube link");
              if (!url) return;
              if (url.includes("watch?v=")) url = url.replace("watch?v=", "embed/");
              focusEditor();
              document.execCommand(
                "insertHTML",
                false,
                `<div style="margin:20px 0"><iframe src="${url}" width="100%" height="400" style="border-radius:10px" frameBorder="0" allowFullScreen></iframe></div>`
              );
              syncContent();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Video
          </button>

          <button type="button" className="toolbar-btn" onClick={() => execCmd("bold")}>
            <strong>B</strong>
          </button>

          <button type="button" className="toolbar-btn" onClick={() => execCmd("italic")}>
            <em>I</em>
          </button>

          <button type="button" className="toolbar-btn" onClick={() => execCmd("formatBlock", "h2")}>
            H2
          </button>

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => execCmd("formatBlock", "blockquote")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
            </svg>
          </button>

          <select
            className="toolbar-select"
            defaultValue=""
            onChange={(e) => { handleFontSize(e.target.value); e.target.value = ""; }}
          >
            <option value="" disabled>Font Size</option>
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
            <option value="24">24px</option>
            <option value="28">28px</option>
            <option value="32">32px</option>
            <option value="36">36px</option>
            <option value="48">48px</option>
          </select>

          <div className="toolbar-divider" />

          <button type="button" className="toolbar-btn toolbar-btn-polish" onClick={handlePolish}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 3l1.912 5.813a2 2 0 001.272 1.278L21 12l-5.816 1.91a2 2 0 00-1.272 1.277L12 21l-1.912-5.813a2 2 0 00-1.272-1.278L3 12l5.816-1.91a2 2 0 001.272-1.277L12 3z" />
            </svg>
            Polish
          </button>
        </div>

        <div
          ref={editorRef}
          className={`editor-content${isEmpty ? " editor-content-empty" : ""}`}
          contentEditable
          onInput={syncContent}
          suppressContentEditableWarning
        />

        <div className="editor-footer">
          <p className="editor-hint">Select text and click <strong>Polish</strong> to fix grammar and improve clarity. Use <strong>Ctrl+B</strong> for bold, <strong>Ctrl+I</strong> for italic.</p>
          <span className="editor-wordcount">{wordCount} {wordCount === 1 ? "word" : "words"} · {Math.max(1, Math.round(wordCount / 200))} min read</span>
        </div>
      </div>

      <div className="editor-actions">
        <button className="btn btn-primary btn-lg" onClick={handlePublish} disabled={!title.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Publish Post
        </button>
        <Link to="/" className="btn btn-ghost btn-lg">Cancel</Link>
      </div>

      {/* AI Polish Modal */}
      {showPolish && (
        <PolishModal
          originalText={originalSelection}
          polishedText={polishedText}
          isLoading={isPolishing}
          error={polishError}
          onAccept={handleAcceptPolish}
          onReject={() => setShowPolish(false)}
        />
      )}

      {/* API Key Input Modal */}
      {showKeyInput && (
        <div className="confirm-overlay" onClick={() => setShowKeyInput(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Set up AI Polish</h3>
            <p>Enter your free Groq API key to enable grammar polishing. Get one from groq.com/keys.</p>
            <input
              className="gemini-key-input"
              type="password"
              placeholder="Paste your Groq API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
            />
            <div className="confirm-dialog-actions" style={{ marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setShowKeyInput(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveKey} disabled={!apiKey.trim()}>
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
