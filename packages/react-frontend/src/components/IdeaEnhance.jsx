function IdeaEnhance({
  enhancement,
  loading,
  error,
  onRetry,
  onApply,
  onUndo,
  applying,
  applied,
  canUndo,
  note,
}) {
  if (loading) {
    return (
      <div className="enhance-panel">
        <p className="enhance-kicker">Enhance</p>
        <p className="analysis-status">
          Looking for the changes that would make this stronger...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enhance-panel">
        <p className="enhance-kicker">Enhance</p>
        <p className="error-message">{error}</p>
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  if (!enhancement) {
    return null;
  }

  return (
    <div className="enhance-panel">
      <div className="analysis-heading">
        <div>
          <p className="enhance-kicker">Enhance</p>
          <p className="enhance-verdict">{enhancement.verdict}</p>
        </div>
        <button type="button" onClick={onRetry}>
          Refresh
        </button>
      </div>

      {note && <p className="enhance-note">{note}</p>}

      <div className="enhance-upgrades">
        {enhancement.upgrades.map((upgrade) => (
          <article
            className="enhance-upgrade"
            key={upgrade.label + upgrade.detail}
          >
            <span>{upgrade.label}</span>
            <p>{upgrade.detail}</p>
          </article>
        ))}
      </div>

      <div className="enhance-draft">
        <h4>Sharper version</h4>
        <p className="draft-title">{enhancement.enhancedTitle}</p>
        <p>{enhancement.enhancedDescription}</p>
        <div className="enhance-draft-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={onApply}
            disabled={applied || applying}
          >
            {applied
              ? "Using this version"
              : applying
                ? "Saving..."
                : "Use this version"}
          </button>
          {canUndo && (
            <button type="button" className="btn-ghost" onClick={onUndo}>
              Undo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IdeaEnhance;
