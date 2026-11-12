function IdeasTable({ ideas, onSelectIdea }) {
  if (ideas.length === 0) {
    return (
      <p className="empty-state">
        No ideas yet. Start with a rough one above, then enhance it.
      </p>
    );
  }

  return (
    <div className="ideas-table-wrap">
      <table className="ideas-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Looking for</th>
            <th>Visibility</th>
            <th>Description</th>
          </tr>
        </thead>

        <tbody>
          {ideas.map((idea) => (
            <tr key={idea.id}>
              <td>
                <button
                  type="button"
                  className="idea-preview-link"
                  onClick={() => onSelectIdea(idea)}
                >
                  {idea.title}
                </button>
              </td>
              <td>{idea.looking_for || "—"}</td>
              <td>
                <span
                  className={
                    idea.is_public
                      ? "visibility-badge public"
                      : "visibility-badge private"
                  }
                >
                  {idea.is_public ? "Public" : "Private"}
                </span>
              </td>
              <td className="idea-preview-description">{idea.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default IdeasTable;
