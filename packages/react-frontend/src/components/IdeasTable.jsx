function IdeasTable({ ideas, onEdit, onDelete, onToggleVisibility }) {
  if (ideas.length === 0) {
    return <p className="empty-state">No ideas yet. Add the first one above.</p>;
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
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {ideas.map((idea) => (
            <tr key={idea.id}>
              <td>{idea.title}</td>
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
              <td>{idea.description}</td>

              <td>
                <div className="row-actions">
                  <button type="button" onClick={() => onEdit(idea)}>
                    Edit
                  </button>

                  <button type="button" onClick={() => onToggleVisibility(idea)}>
                    {idea.is_public ? "Make private" : "Make public"}
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => onDelete(idea.id)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default IdeasTable;
