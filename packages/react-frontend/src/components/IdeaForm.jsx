import { useState } from "react";

function IdeaForm({ ideaToEdit, onSave, onCancel }) {
  const [title, setTitle] = useState(ideaToEdit?.title ?? "");
  const [description, setDescription] = useState(ideaToEdit?.description ?? "");

  async function handleSubmit(event) {
    event.preventDefault();

    const wasEditing = Boolean(ideaToEdit);

    const idea = {
      title: title.trim(),
      description: description.trim(),
    };

    const savedSuccessfully = await onSave(idea);

    if (savedSuccessfully && !wasEditing) {
      setTitle("");
      setDescription("");
    }
  }

  return (
    <form className="idea-form" onSubmit={handleSubmit}>
      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </label>

      <label>
        Description
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
      </label>

      <button type="submit">{ideaToEdit ? "Save Changes" : "Add Idea"}</button>

      {ideaToEdit && (
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      )}
    </form>
  );
}

export default IdeaForm;
