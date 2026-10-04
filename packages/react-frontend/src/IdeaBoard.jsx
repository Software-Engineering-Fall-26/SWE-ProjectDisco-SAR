import { useEffect, useMemo, useState } from "react";

import { useAuth } from "./AuthContext";
import { getPublicIdeas } from "./services/ideasApi";

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

  const haystack = `${idea.looking_for} ${idea.title} ${idea.description}`.toLowerCase();

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

  useEffect(() => {
    async function loadPublicIdeas() {
      try {
        const loadedIdeas = await getPublicIdeas();
        setIdeas(loadedIdeas);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadPublicIdeas();
  }, []);

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

  return (
    <div className="idea-board">
      <h1>Idea Board</h1>
      <p className="page-intro">
        Public ideas from people on the platform. See what they are building
        and what they are looking for, whether that is investors, a co-founder,
        or something else.
      </p>

      {error && <p className="error-message">{error}</p>}

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

        <div className="board-filters" role="group" aria-label="Filter by what people are looking for">
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
        <p>Loading the board...</p>
      ) : ideas.length === 0 ? (
        <p>No public ideas yet. Publish one of yours from the Ideas page.</p>
      ) : visibleIdeas.length === 0 ? (
        <p>No public ideas match that search.</p>
      ) : (
        <>
          <p className="board-count">
            {visibleIdeas.length} public {visibleIdeas.length === 1 ? "idea" : "ideas"}
          </p>
          <div className="board-list">
            {visibleIdeas.map((idea) => (
              <article key={idea.id} className="board-card">
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
                  <span>{authorLabel(idea, user?.id)}</span>
                  <span>{formatDate(idea.created_at)}</span>
                </div>

                <p className="board-description">{idea.description}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default IdeaBoard;
