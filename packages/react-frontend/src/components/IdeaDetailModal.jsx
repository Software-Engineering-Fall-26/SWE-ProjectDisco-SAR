import { useEffect } from "react";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function IdeaDetailModal({ idea, author, isOwner, onClose, children }) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="idea-modal-backdrop" onMouseDown={onClose}>
      <section
        className="idea-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="idea-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="idea-modal-close"
          onClick={onClose}
          aria-label="Close idea details"
        >
          ×
        </button>

        <header className="idea-modal-header">
          <div>
            <p className="page-kicker">{isOwner ? "Your idea" : author}</p>
            <h2 id="idea-modal-title">{idea.title}</h2>
          </div>
          <span
            className={
              idea.is_public
                ? "visibility-badge public"
                : "visibility-badge private"
            }
          >
            {idea.is_public ? "Public" : "Private"}
          </span>
        </header>

        <div className="idea-modal-meta">
          <span className="looking-for-pill">
            Looking for {idea.looking_for || "collaborators"}
          </span>
          <span>{formatDate(idea.created_at)}</span>
        </div>

        <p className="idea-modal-description">{idea.description}</p>
        {children}
      </section>
    </div>
  );
}

export default IdeaDetailModal;
