import { useEffect, useState } from "react";

import IdeaForm from "./components/IdeaForm";
import IdeasTable from "./components/IdeasTable";

import {
  getIdeas,
  createIdea,
  updateIdea,
  deleteIdea,
} from "./services/ideasApi";

function Ideas() {
  const [ideas, setIdeas] = useState([]);
  const [ideaToEdit, setIdeaToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadIdeas() {
      try {
        const loadedIdeas = await getIdeas();
        setIdeas(loadedIdeas);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadIdeas();
  }, []);

  async function handleSave(idea) {
    setError("");

    try {
      if (ideaToEdit) {
        const updatedIdea = await updateIdea(ideaToEdit.id, idea);

        setIdeas(
          ideas.map((currentIdea) => {
            if (currentIdea.id === updatedIdea.id) {
              return updatedIdea;
            }

            return currentIdea;
          }),
        );

        setIdeaToEdit(null);
      } else {
        const newIdea = await createIdea(idea);
        setIdeas([...ideas, newIdea]);
      }

      return true;
    } catch (error) {
      setError(error.message);
      return false;
    }
  }

  function handleEdit(idea) {
    setIdeaToEdit(idea);
    setError("");
  }

  async function handleDelete(id) {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this idea?",
    );

    if (!shouldDelete) {
      return;
    }

    setError("");

    try {
      await deleteIdea(id);

      setIdeas(
        ideas.filter((idea) => {
          return idea.id !== id;
        }),
      );

      if (ideaToEdit?.id === id) {
        setIdeaToEdit(null);
      }
    } catch (error) {
      setError(error.message);
    }
  }

  function cancelEdit() {
    setIdeaToEdit(null);
  }

  return (
    <div className="ideas-page">
      <h1>Ideas</h1>

      {error && <p className="error-message">{error}</p>}

      <IdeaForm
        key={ideaToEdit?.id ?? "new-idea"}
        ideaToEdit={ideaToEdit}
        onSave={handleSave}
        onCancel={cancelEdit}
      />

      {loading ? (
        <p>Loading ideas...</p>
      ) : (
        <IdeasTable ideas={ideas} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  );
}

export default Ideas;
