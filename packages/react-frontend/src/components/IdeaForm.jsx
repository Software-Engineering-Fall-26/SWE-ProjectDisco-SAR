import { useRef, useState } from "react";

import { enhanceIdea } from "../services/analyzeIdea";
import IdeaEnhance from "./IdeaEnhance";
import LookingForSelect from "./LookingForSelect";

function IdeaForm({ ideaToEdit, onSave, onCancel }) {
  const [title, setTitle] = useState(ideaToEdit?.title ?? "");
  const [description, setDescription] = useState(ideaToEdit?.description ?? "");
  const [lookingFor, setLookingFor] = useState(ideaToEdit?.looking_for ?? "");
  const [isPublic, setIsPublic] = useState(Boolean(ideaToEdit?.is_public));
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState("");
  const [enhancement, setEnhancement] = useState(null);
  const [previousDraft, setPreviousDraft] = useState(null);
  const requestRef = useRef(0);

  function currentIdea() {
    return {
      title: title.trim(),
      description: description.trim(),
      lookingFor: lookingFor.trim(),
      isPublic,
    };
  }

  function markApplied(nextTitle, nextDescription) {
    setEnhancement((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        applied:
          nextTitle.trim() === current.result.enhancedTitle &&
          nextDescription.trim() === current.result.enhancedDescription,
      };
    });
  }

  function updateTitle(value) {
    setTitle(value);
    setPreviousDraft(null);
    markApplied(value, description);
  }

  function updateDescription(value) {
    setDescription(value);
    setPreviousDraft(null);
    markApplied(title, value);
  }

  async function handleEnhance() {
    const idea = currentIdea();

    if (!idea.title || !idea.description) {
      setFormError("Add a title and description before enhancing.");
      return;
    }

    setFormError("");
    setEnhanceError("");
    setEnhancing(true);
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    try {
      const result = await enhanceIdea(idea);

      if (requestId !== requestRef.current) {
        return;
      }

      setEnhancement({
        result,
        title: idea.title,
        description: idea.description,
        applied: false,
      });
    } catch (error) {
      if (requestId !== requestRef.current) {
        return;
      }

      setEnhanceError(error.message);
    } finally {
      if (requestId === requestRef.current) {
        setEnhancing(false);
      }
    }
  }

  function useEnhancedVersion() {
    if (!enhancement) {
      return;
    }

    setPreviousDraft({ title, description });
    setTitle(enhancement.result.enhancedTitle);
    setDescription(enhancement.result.enhancedDescription);
    setEnhancement({
      ...enhancement,
      title: enhancement.result.enhancedTitle,
      description: enhancement.result.enhancedDescription,
      applied: true,
    });
  }

  function undoEnhancedVersion() {
    if (!previousDraft || !enhancement) {
      return;
    }

    setTitle(previousDraft.title);
    setDescription(previousDraft.description);
    setEnhancement({
      ...enhancement,
      title: previousDraft.title.trim(),
      description: previousDraft.description.trim(),
      applied: false,
    });
    setPreviousDraft(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError("");
    setSaving(true);
    requestRef.current += 1;

    const idea = currentIdea();
    const wasEditing = Boolean(ideaToEdit);
    const matchesSource =
      enhancement &&
      enhancement.title === idea.title &&
      enhancement.description === idea.description;
    const matchesRewrite =
      enhancement &&
      enhancement.result.enhancedTitle === idea.title &&
      enhancement.result.enhancedDescription === idea.description;
    const matchingEnhancement =
      matchesSource || matchesRewrite ? enhancement.result : null;

    const savedSuccessfully = await onSave(idea, {
      enhancement: idea.isPublic ? null : matchingEnhancement,
      accepted: matchesRewrite || idea.isPublic,
    });

    if (savedSuccessfully && !wasEditing) {
      setTitle("");
      setDescription("");
      setLookingFor("");
      setIsPublic(false);
      setEnhancement(null);
      setPreviousDraft(null);
      setEnhanceError("");
    }

    setSaving(false);
    setEnhancing(false);
  }

  function chooseVisibility(nextPublic) {
    setIsPublic(nextPublic);

    if (!nextPublic) {
      return;
    }

    requestRef.current += 1;
    setEnhancing(false);
    setEnhancement(null);
    setEnhanceError("");
    setPreviousDraft(null);
  }

  const showEnhance =
    !isPublic && (enhancing || enhanceError || enhancement);

  return (
    <form className="idea-form" onSubmit={handleSubmit}>
      <div className="form-heading full-width">
        <h2>{ideaToEdit ? "Edit idea" : "New idea"}</h2>
        <p>
          {ideaToEdit
            ? "Update the details, then save. Enhance if you want a sharper version."
            : "Write it rough. Enhance shows what would make it stronger before you save."}
        </p>
      </div>

      <label>
        Title
        <input
          type="text"
          value={title}
          placeholder="Neighborhood tool library"
          onChange={(event) => updateTitle(event.target.value)}
          required
        />
      </label>

      <div className="looking-for-field">
        <label htmlFor="looking-for">Looking for</label>
        <LookingForSelect
          id="looking-for"
          value={lookingFor}
          onChange={setLookingFor}
        />
      </div>

      <label className="full-width">
        Description
        <textarea
          value={description}
          placeholder="Who it's for, the problem, and what the product does."
          onChange={(event) => updateDescription(event.target.value)}
          required
          rows={4}
        />
      </label>

      <fieldset className="visibility-fieldset full-width">
        <legend>Who can see this</legend>

        <label className="radio-label">
          <input
            type="radio"
            name="visibility"
            checked={!isPublic}
            onChange={() => chooseVisibility(false)}
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
            onChange={() => chooseVisibility(true)}
          />
          <span>
            Public
            <span className="field-hint">
              Shows on the Idea Board for signed-in users
            </span>
          </span>
        </label>
      </fieldset>

      {showEnhance && (
        <div className="full-width">
          <IdeaEnhance
            enhancement={enhancement?.result}
            loading={enhancing}
            error={enhanceError}
            onRetry={handleEnhance}
            onApply={useEnhancedVersion}
            onUndo={undoEnhancedVersion}
            applied={Boolean(enhancement?.applied)}
            canUndo={Boolean(previousDraft)}
            note="Nothing is saved until you add the idea."
          />
        </div>
      )}

      {formError && <p className="error-message full-width">{formError}</p>}

      <div className="idea-form-actions full-width">
        <button
          type="button"
          className="btn-enhance"
          onClick={handleEnhance}
          disabled={enhancing || saving}
        >
          {enhancing ? "Enhancing..." : "Enhance"}
        </button>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : ideaToEdit ? "Save changes" : "Add idea"}
        </button>

        {ideaToEdit && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default IdeaForm;
