import { useEffect, useState } from "react";

import {
  createIdeaComment,
  deleteIdeaComment,
  getIdeaComments,
} from "../services/commentsApi";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function authorLabel(comment, currentUserId) {
  if (comment.user_id === currentUserId) {
    return "You";
  }

  return comment.author_username?.trim() || "A member";
}

function IdeaComments({ ideaId, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadComments() {
      try {
        const loadedComments = await getIdeaComments(ideaId);

        if (active) {
          setComments(loadedComments);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadComments();

    return () => {
      active = false;
    };
  }, [ideaId]);

  async function handleSubmit(event) {
    event.preventDefault();

    const content = draft.trim();

    if (!content || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const comment = await createIdeaComment(ideaId, content);
      setComments((currentComments) => [...currentComments, comment]);
      setDraft("");
    } catch (createError) {
      setError(createError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId) {
    setError("");

    try {
      await deleteIdeaComment(commentId);
      setComments((currentComments) =>
        currentComments.filter((comment) => comment.id !== commentId),
      );
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="idea-comments" aria-labelledby="idea-comments-title">
      <h3 id="idea-comments-title">Comments</h3>

      <form className="idea-comment-form" onSubmit={handleSubmit}>
        <label htmlFor={`comment-${ideaId}`}>Add a comment</label>
        <textarea
          id={`comment-${ideaId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Share helpful feedback or ask a question."
          maxLength={600}
          rows={3}
          required
        />
        <div className="idea-comment-form-footer">
          <span>{draft.length}/600</span>
          <button type="submit" disabled={submitting || !draft.trim()}>
            {submitting ? "Posting..." : "Post comment"}
          </button>
        </div>
      </form>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p className="comments-status">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="comments-status">No comments yet. Start the conversation.</p>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <article key={comment.id} className="comment-card">
              <div className="comment-card-header">
                <div>
                  <strong>{authorLabel(comment, currentUserId)}</strong>
                  <span>{formatDate(comment.created_at)}</span>
                </div>
                {comment.user_id === currentUserId && (
                  <button
                    type="button"
                    className="comment-delete"
                    onClick={() => handleDelete(comment.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p>{comment.content}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default IdeaComments;
