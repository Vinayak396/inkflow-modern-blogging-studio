export default function PolishModal({ originalText, polishedText, isLoading, error, onAccept, onReject }) {
  return (
    <div className="confirm-overlay" onClick={onReject}>
      <div className="polish-modal" onClick={(e) => e.stopPropagation()}>
        <div className="polish-modal-header">
          <div className="polish-modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 3l1.912 5.813a2 2 0 001.272 1.278L21 12l-5.816 1.91a2 2 0 00-1.272 1.277L12 21l-1.912-5.813a2 2 0 00-1.272-1.278L3 12l5.816-1.91a2 2 0 001.272-1.277L12 3z" />
            </svg>
            AI Polish
          </div>
          <button className="polish-close-btn" onClick={onReject} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error ? (
          <div className="polish-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p>{error}</p>
            <button className="btn btn-ghost" onClick={onReject}>Close</button>
          </div>
        ) : (
          <>
            <div className="polish-modal-body">
              <div className="polish-panel">
                <span className="polish-panel-label">Original</span>
                <div className="polish-panel-text">{originalText}</div>
              </div>
              <div className="polish-panel polish-panel-new">
                <span className="polish-panel-label polish-label-new">Polished</span>
                {isLoading ? (
                  <div className="polish-loading">
                    <div className="polish-loading-dots">
                      <span /><span /><span />
                    </div>
                    <p>Polishing your text...</p>
                  </div>
                ) : (
                  <div className="polish-panel-text">{polishedText}</div>
                )}
              </div>
            </div>

            <div className="polish-modal-actions">
              <button className="btn btn-ghost" onClick={onReject}>
                Keep Original
              </button>
              <button
                className="btn btn-primary"
                onClick={onAccept}
                disabled={isLoading || !polishedText}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Accept Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
