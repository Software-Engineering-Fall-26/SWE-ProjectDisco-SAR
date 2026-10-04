function IdeasTable({ ideas, onEdit, onDelete, onToggleVisibility }) {
  if (ideas.length === 0) {
    return <p>No ideas have been added yet.</p>;
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
                <button type="button" onClick={() => onEdit(idea)}>
                  Edit
                </button>

                <button type="button" onClick={() => onToggleVisibility(idea)}>
                  {idea.is_public ? "Make private" : "Make public"}
                </button>

                <button type="button" onClick={() => onDelete(idea.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default IdeasTable;
