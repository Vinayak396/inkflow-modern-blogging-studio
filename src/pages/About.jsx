import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-badge">About InkFlow</div>
        <h1>
          Where Ideas Take
          <br />
          <span className="gradient-text">Shape & Flow</span>
        </h1>
        <p className="about-tagline">
          A modern blogging studio built for writers, thinkers, and creators who believe their words deserve a beautiful home.
        </p>
      </div>

      <div className="about-sections">
        <div className="about-section">
          <div className="about-section-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <h2>Rich Text Editor</h2>
          <p>Write with a WYSIWYG editor that supports bold, italic, headings, quotes, font sizes, image uploads, and embedded videos. What you see is what you get — no raw HTML or markdown visible.</p>
        </div>

        <div className="about-section">
          <div className="about-section-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 3l1.912 5.813a2 2 0 001.272 1.278L21 12l-5.816 1.91a2 2 0 00-1.272 1.277L12 21l-1.912-5.813a2 2 0 00-1.272-1.278L3 12l5.816-1.91a2 2 0 001.272-1.277L12 3z" />
            </svg>
          </div>
          <h2>AI-Powered Polish</h2>
          <p>Select any text and let AI fix grammar, spelling, tense errors, and improve clarity. Your writing stays yours — we just make it shine.</p>
        </div>

        <div className="about-section">
          <div className="about-section-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <h2>Community & Collaboration</h2>
          <p>Like, comment, save, and subscribe to your favorite authors. Want to edit someone's post? Send an edit request and collaborate with the author's approval.</p>
        </div>

        <div className="about-section">
          <div className="about-section-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <h2>Share & Discover</h2>
          <p>Share posts with a single click. Discover related content at the end of every article. Filter by tags, search by title, and explore author profiles.</p>
        </div>

        <div className="about-section">
          <div className="about-section-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h2>Your Data, Your Browser</h2>
          <p>All data is stored locally in your browser. No servers, no tracking, no ads. Your writing stays private until you choose to share it.</p>
        </div>

        <div className="about-section">
          <div className="about-section-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
          <h2>Built with Love</h2>
          <p>InkFlow is crafted with React, designed with care, and built for people who love writing. Every detail — from the smooth animations to the dark theme — is intentional.</p>
        </div>
      </div>

      <div className="about-cta">
        <h2>Ready to start writing?</h2>
        <p>Join InkFlow and give your ideas the canvas they deserve.</p>
        <div className="about-cta-buttons">
          <Link to="/signup" className="btn btn-primary btn-lg">Get Started</Link>
          <Link to="/" className="btn btn-ghost btn-lg">Browse Posts</Link>
        </div>
      </div>
    </div>
  );
}
