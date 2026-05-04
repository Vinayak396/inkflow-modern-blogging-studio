import { useState } from "react";

const faqs = [
  {
    q: "How do I create a blog post?",
    a: "Click the \"Write\" button in the navbar. Add a title, content, tags, and your author info, then click \"Publish Post\".",
  },
  {
    q: "How do I format text (bold, italic, etc.)?",
    a: "Use the toolbar buttons above the editor. You can also use Ctrl+B for bold and Ctrl+I for italic.",
  },
  {
    q: "How do I change font size?",
    a: "Select the text you want to resize, then choose a size from the \"Font Size\" dropdown in the toolbar.",
  },
  {
    q: "What is AI Polish?",
    a: "Select text in the editor and click \"Polish\" to fix grammar, spelling, and improve clarity using AI.",
  },
  {
    q: "How do I edit someone else's post?",
    a: "Click \"Request Edit\" on their post. The original author will see your request and can approve or reject it.",
  },
  {
    q: "How do I delete a post?",
    a: "Only the post author can delete it. Open the post and click the \"Delete\" button.",
  },
  {
    q: "How do likes and subscriptions work?",
    a: "Log in to like posts and subscribe to authors. Likes and subscriber counts are visible to everyone.",
  },
  {
    q: "Where is my data stored?",
    a: "All data is stored in your browser's local storage. Clearing browser data will remove your posts and account.",
  },
];

const shortcuts = [
  { keys: "Ctrl + B", action: "Bold text" },
  { keys: "Ctrl + I", action: "Italic text" },
  { keys: "Ctrl + Z", action: "Undo" },
  { keys: "Ctrl + Shift + Z", action: "Redo" },
];

export default function HelpSupport() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("faq");
  const [expandedFaq, setExpandedFaq] = useState(null);

  return (
    <>
      {/* Floating Button */}
      <button
        className={`help-fab ${open ? "help-fab-active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        title="Help & Support"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="help-panel">
          <div className="help-panel-header">
            <h3>Help & Support</h3>
          </div>

          <div className="help-tabs">
            <button
              className={`help-tab ${activeTab === "faq" ? "active" : ""}`}
              onClick={() => setActiveTab("faq")}
            >
              FAQs
            </button>
            <button
              className={`help-tab ${activeTab === "shortcuts" ? "active" : ""}`}
              onClick={() => setActiveTab("shortcuts")}
            >
              Shortcuts
            </button>
            <button
              className={`help-tab ${activeTab === "contact" ? "active" : ""}`}
              onClick={() => setActiveTab("contact")}
            >
              Contact
            </button>
          </div>

          <div className="help-panel-body">
            {activeTab === "faq" && (
              <div className="help-faq-list">
                {faqs.map((faq, i) => (
                  <div key={i} className="help-faq-item">
                    <button
                      className={`help-faq-question ${expandedFaq === i ? "expanded" : ""}`}
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    >
                      <span>{faq.q}</span>
                      <svg
                        className="help-faq-chevron"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {expandedFaq === i && (
                      <p className="help-faq-answer">{faq.a}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "shortcuts" && (
              <div className="help-shortcuts-list">
                <p className="help-shortcuts-note">Editor keyboard shortcuts:</p>
                {shortcuts.map((s, i) => (
                  <div key={i} className="help-shortcut-item">
                    <kbd className="help-kbd">{s.keys}</kbd>
                    <span>{s.action}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "contact" && (
              <div className="help-contact">
                <a href="https://mail.google.com/mail/?view=cm&to=vinayakrv03@gmail.com" target="_blank" rel="noopener noreferrer" className="help-contact-icon" title="Email Support" style={{ cursor: "pointer" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </a>
                <h4>Get in Touch</h4>
                <p>Have a question, bug report, or feature request? Reach out via email, GitHub, or LinkedIn.</p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  <a href="https://github.com/Vinayak396" target="_blank" rel="noopener noreferrer" className="btn btn-primary help-contact-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                  <a href="https://www.linkedin.com/in/vinayak-vibhuti-aa1a06287/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost help-contact-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn
                  </a>
                  <a href="https://mail.google.com/mail/?view=cm&to=vinayakrv03@gmail.com" target="_blank" rel="noopener noreferrer" className="btn btn-ghost help-contact-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Email
                  </a>
                </div>
                <p className="help-contact-note">Built with InkFlow — Modern Blogging Studio</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
