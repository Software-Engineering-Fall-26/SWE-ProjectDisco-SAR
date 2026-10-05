import { useState } from "react";

const LOOKING_FOR_SUGGESTIONS = [
  "Investors",
  "A co-founder",
  "Developers",
  "Designers",
  "Mentors",
  "Feedback",
  "Early users",
];

function IdeaForm({ ideaToEdit, onSave, onCancel }) {
  const [title, setTitle] = useState(ideaToEdit?.title ?? "");
  const [description, setDescription] = useState(ideaToEdit?.description ?? "");
  const [lookingFor, setLookingFor] = useState(ideaToEdit?.looking_for ?? "");
  const [isPublic, setIsPublic] = useState(Boolean(ideaToEdit?.is_public));
  const [formError, setFormError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (isPublic && !lookingFor.trim()) {
      setFormError(
        "Say what you're looking for before making this idea public.",
      );
      return;
    }

    setFormError("");

    const wasEditing = Boolean(ideaToEdit);

    const idea = {
      title: title.trim(),
      description: description.trim(),
      lookingFor: lookingFor.trim(),
      isPublic,
    };

    const savedSuccessfully = await onSave(idea);

    if (savedSuccessfully && !wasEditing) {
      setTitle("");
      setDescription("");
      setLookingFor("");
      setIsPublic(false);
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
        Looking for
        <input
          type="text"
          list="looking-for-suggestions"
          value={lookingFor}
          placeholder="Investors, a co-founder, developers..."
          onChange={(event) => setLookingFor(event.target.value)}
          required={isPublic}
        />
      </label>

      <datalist id="looking-for-suggestions">
        {LOOKING_FOR_SUGGESTIONS.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>

      <label className="full-width">
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          rows={3}
        />
      </label>

      <fieldset className="visibility-fieldset full-width">
        <legend>Who can see this</legend>

        <label className="radio-label">
          <input
            type="radio"
            name="visibility"
            checked={!isPublic}
            onChange={() => setIsPublic(false)}
          />
          <span>
            Private
            <span className="field-hint">Only you</span>
          </span>
        </label>

        <label className="radio-label">
          <input
            type="radio"
            name="visibility"
            checked={isPublic}
            onChange={() => setIsPublic(true)}
          />
          <span>
            Public
            <span className="field-hint">
              Shows on the Idea Board for signed-in users
            </span>
          </span>
        </label>
      </fieldset>

      {formError && <p className="error-message full-width">{formError}</p>}

      <div className="idea-form-actions full-width">
        <button type="submit">{ideaToEdit ? "Save Changes" : "Add Idea"}</button>

        {ideaToEdit && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default IdeaForm;
