import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "./useAuth";
import IdeaComments from "./components/IdeaComments";
import IdeaDetailModal from "./components/IdeaDetailModal";
import ReportIdea from "./components/ReportIdea";
import {
  getIdeaLikeSummaries,
  getPublicIdeas,
  setIdeaLike,
} from "./services/ideasAPi";
import {
  sendCollaborationRequest,
  fetchMyCollaborationRequest,
  alreadyHasConversation,
} from "./services/collaborationAPI";

const BOARD_FILTERS = [
  { id: "all", label: "All" },
  { id: "investor", label: "Investors" },
  { id: "co-founder", label: "Co-founders" },
  { id: "developer", label: "Developers" },
  { id: "designer", label: "Designers" },
  { id: "mentor", label: "Mentors" },
  { id: "feedback", label: "Feedback" },
  { id: "early user", label: "Early users" },
];

function matchesFilter(idea, filterId) {
  if (filterId === "all") {
    return true;
  }

  const haystack =
    `${idea.looking_for} ${idea.title} ${idea.description}`.toLowerCase();

  if (filterId === "co-founder") {
    return (
      haystack.includes("co-founder") ||
      haystack.includes("cofounder") ||
      haystack.includes("co founder")
    );
  }

  return haystack.includes(filterId);
}

function authorLabel(idea, currentUserId) {
  if (idea.user_id && idea.user_id === currentUserId) {
    return "You";
  }

  return idea.author_username?.trim() || "A member";
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function IdeaBoard() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterId, setFilterId] = useState("all");
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [reporting, setReporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [collaborationError, setCollaborationError] = useState("");
  const [requestStatus, setRequestStatus] = useState(null);
  const [requestStatusLoading, setRequestStatusLoading] = useState(false);
  const [alreadyCollaborating, setAlreadyCollaborating] = useState(false);
  const [checkingCollaboration, setCheckingCollaboration] = useState(false);
  const [likeSummaries, setLikeSummaries] = useState({});
  const [updatingLikeId, setUpdatingLikeId] = useState(null);

  function handleIdeaKeyDown(event, idea) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openIdea(idea);
    }
  }

  function openIdea(idea) {
    setReporting(false);
    setSelectedIdea(idea);
  }

  function handleReported(ideaId) {
    setIdeas((current) => current.filter((idea) => idea.id !== ideaId));
    setSelectedIdea(null);
    setReporting(false);
    setNotice("Reported. That idea is off the Idea Board.");
  }

  useEffect(() => {
    async function loadPublicIdeas() {
      try {
        const loadedIdeas = await getPublicIdeas();
        setIdeas(loadedIdeas);
        setLikeSummaries(
          await getIdeaLikeSummaries(loadedIdeas.map((idea) => idea.id)),
        );
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadPublicIdeas();
  }, []);

  async function handleLike(event, idea) {
    event?.stopPropagation();

    const currentSummary = likeSummaries[idea.id] ?? {
      count: 0,
      likedByCurrentUser: false,
    };
    const shouldLike = !currentSummary.likedByCurrentUser;

    setUpdatingLikeId(idea.id);
    setLikeSummaries((current) => ({
      ...current,
      [idea.id]: {
        count: Math.max(0, currentSummary.count + (shouldLike ? 1 : -1)),
        likedByCurrentUser: shouldLike,
      },
    }));

    try {
      await setIdeaLike(idea.id, shouldLike);
    } catch (likeError) {
      setLikeSummaries((current) => ({
        ...current,
        [idea.id]: currentSummary,
      }));
      setError(likeError.message);
    } finally {
      setUpdatingLikeId(null);
    }
  }

  function renderLikeButton(idea) {
    const summary = likeSummaries[idea.id] ?? {
      count: 0,
      likedByCurrentUser: false,
    };
    const isUpdating = updatingLikeId === idea.id;

    return (
      <button
        type="button"
        className={
          summary.likedByCurrentUser
            ? "idea-like-button liked"
            : "idea-like-button"
        }
        onClick={(event) => handleLike(event, idea)}
        disabled={isUpdating}
        aria-pressed={summary.likedByCurrentUser}
      >
        <span aria-hidden="true">♥</span>
        {summary.count} {summary.count === 1 ? "like" : "likes"}
      </button>
    );
  }

  const visibleIdeas = useMemo(() => {
    const query = search.trim().toLowerCase();

    return ideas.filter((idea) => {
      if (!matchesFilter(idea, filterId)) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack =
        `${idea.title} ${idea.description} ${idea.looking_for} ${idea.author_username}`.toLowerCase();

      return haystack.includes(query);
    });
  }, [ideas, search, filterId]);

  async function handleCollaborationRequest() {
    if (!selectedIdea || sendingRequest) {
      return;
    }

    setSendingRequest(true);
    setCollaborationError("");

    try {
      await sendCollaborationRequest(selectedIdea);
      setRequestStatus("pending");
    } catch (requestError) {
      setCollaborationError(requestError.message);
    } finally {
      setSendingRequest(false);
    }
  }

  useEffect(() => {
    if (!selectedIdea?.id || !user?.id) {
      setRequestStatus(null);
      return;
    }

    if (selectedIdea.user_id === user.id) {
      setRequestStatus(null);
      return;
    }

    let cancelled = false;

    async function loadRequestStatus() {
      setRequestStatusLoading(true);
      setRequestStatus(null);

      try {
        const request = await fetchMyCollaborationRequest(selectedIdea.id);

        if (!cancelled) {
          setRequestStatus(request?.status ?? null);
        }
      } catch (statusError) {
        console.error("Failed to load request status:", statusError);
      } finally {
        if (!cancelled) {
          setRequestStatusLoading(false);
        }
      }
    }

    loadRequestStatus();

    return () => {
      cancelled = true;
    };
  }, [selectedIdea?.id, selectedIdea?.user_id, user?.id]);

  useEffect(() => {
    if (!selectedIdea?.id || !user?.id || selectedIdea.user_id === user.id) {
      setAlreadyCollaborating(false);
      setCheckingCollaboration(false);
      return;
    }

    let cancelled = false;

    async function checkConversation() {
      setAlreadyCollaborating(false);
      setCheckingCollaboration(true);

      try {
        const exists = await alreadyHasConversation(selectedIdea.user_id);

        if (!cancelled) {
          setAlreadyCollaborating(exists);
        }
      } catch (checkError) {
        console.error("Could not check collaboration:", checkError);
      } finally {
        if (!cancelled) {
          setCheckingCollaboration(false);
        }
      }
    }

    checkConversation();

    return () => {
      cancelled = true;
    };
  }, [selectedIdea?.id, selectedIdea?.user_id, user?.id]);

  return (
    <div className="idea-board">
      <header className="page-header">
        <p className="page-kicker">Community</p>
        <h1>Idea Board</h1>
        <p className="page-intro">
          Public ideas from people on Disco. See what they are building and who
          they are looking for, from investors and co-founders to early users.
          Report an idea that doesn't belong. It comes off the board, with the
          reason you choose.
        </p>
      </header>

      {error && <p className="error-message">{error}</p>}
      {notice && <p className="info-message">{notice}</p>}

      <div className="board-toolbar">
        <label className="board-search-label">
          Search ideas
          <input
            type="search"
            className="board-search"
            value={search}
            placeholder="Search by idea, person, or what they need"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div
          className="board-filters"
          role="group"
          aria-label="Filter by what people are looking for"
        >
          {BOARD_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={
                filter.id === filterId ? "board-filter active" : "board-filter"
              }
              onClick={() => setFilterId(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="empty-state">Loading the board...</p>
      ) : ideas.length === 0 ? (
        <p className="empty-state">
          No public ideas yet. Publish one of yours from the Ideas page.
        </p>
      ) : visibleIdeas.length === 0 ? (
        <p className="empty-state">No public ideas match that search.</p>
      ) : (
        <>
          <p className="board-count">
            {visibleIdeas.length} public{" "}
            {visibleIdeas.length === 1 ? "idea" : "ideas"}
          </p>
          <div className="board-list">
            {visibleIdeas.map((idea) => (
              <article
                key={idea.id}
                className="board-card board-card-clickable"
                role="button"
                tabIndex={0}
                onClick={() => openIdea(idea)}
                onKeyDown={(event) => handleIdeaKeyDown(event, idea)}
              >
                <div className="board-card-top">
                  <h2>{idea.title}</h2>
                  {idea.user_id === user?.id && (
                    <span className="visibility-badge public">Your idea</span>
                  )}
                </div>

                <div className="board-meta">
                  <span className="looking-for-pill">
                    Looking for {idea.looking_for || "collaborators"}
                  </span>
                  <Link
                    className="board-author-link"
                    to={`/members/${idea.user_id}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {authorLabel(idea, user?.id)}
                  </Link>
                  <span>{formatDate(idea.created_at)}</span>
                </div>

                <p className="board-description">{idea.description}</p>
                <div className="board-card-actions">
                  {renderLikeButton(idea)}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {selectedIdea && (
        <IdeaDetailModal
          idea={selectedIdea}
          author={authorLabel(selectedIdea, user?.id)}
          isOwner={selectedIdea.user_id === user?.id}
          showVisibility={false}
          onClose={() => {
            setSelectedIdea(null);
            setReporting(false);
          }}
          actions={renderLikeButton(selectedIdea)}
        >
          {selectedIdea.user_id !== user?.id && !reporting && (
            <div className="idea-modal-actions">
              <button
                type="button"
                className="danger"
                onClick={() => setReporting(true)}
              >
                Report
              </button>
            </div>
          )}

          {reporting && selectedIdea.user_id !== user?.id && (
            <ReportIdea
              ideaId={selectedIdea.id}
              onCancel={() => setReporting(false)}
              onReported={() => handleReported(selectedIdea.id)}
            />
          )}

          {user && selectedIdea.user_id !== user.id && (
            <div className="idea-collaboration-section">
              {checkingCollaboration ? (
                <span className="idea-collaboration-status">
                  Checking collaboration...
                </span>
              ) : alreadyCollaborating ? (
                <span className="idea-collaboration-status">
                  ✓ Already collaborating
                </span>
              ) : (
                <button
                  type="button"
                  className="idea-collaboration-button"
                  onClick={handleCollaborationRequest}
                  disabled={
                    sendingRequest ||
                    requestStatusLoading ||
                    requestStatus === "pending" ||
                    requestStatus === "accepted"
                  }
                >
                  <span>
                    {sendingRequest
                      ? "Sending request..."
                      : requestStatusLoading
                        ? "Checking request..."
                        : requestStatus === "pending"
                          ? "Request sent"
                          : requestStatus === "accepted"
                            ? "Request accepted"
                            : "Request to collaborate"}
                  </span>
                  <span aria-hidden="true">
                    {requestStatus === "pending" ||
                    requestStatus === "accepted"
                      ? "✓"
                      : "→"}
                  </span>
                </button>
              )}

              {collaborationError && (
                <p className="error-message" role="alert">
                  {collaborationError}
                </p>
              )}
            </div>
          )}
          <IdeaComments ideaId={selectedIdea.id} currentUserId={user?.id} />
        </IdeaDetailModal>
      )}
    </div>
  );
}

export default IdeaBoard;
