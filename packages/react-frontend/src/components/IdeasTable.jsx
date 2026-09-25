//FORMAT FOR TABLE

function IdeasTable({ ideas, onEdit, onDelete }) {
  if (ideas.length === 0) {
    return <p>No ideas have been added yet.</p>;
  }

  return (
    <table className="ideas-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {ideas.map((idea) => (
          <tr key={idea.id}>
            <td>{idea.title}</td>
            <td>{idea.description}</td>

            <td>
              <button type="button" onClick={() => onEdit(idea)}>
                Edit
              </button>

              <button type="button" onClick={() => onDelete(idea.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default IdeasTable;
