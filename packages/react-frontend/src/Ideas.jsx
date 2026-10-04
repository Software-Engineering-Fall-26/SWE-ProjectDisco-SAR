import { useEffect, useState } from "react";

import IdeaForm from "./components/IdeaForm";
import IdeasTable from "./components/IdeasTable";

import {
  getIdeas,
  createIdea,
  updateIdea,
  setIdeaVisibility,
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

  async function handleToggleVisibility(idea) {
    const nextPublic = !idea.is_public;

    if (nextPublic && !idea.looking_for?.trim()) {
      setError("Say what this idea is looking for before making it public.");
      setIdeaToEdit(idea);
      return;
    }

    if (nextPublic) {
      const shouldPublish = window.confirm(
        "Make this idea public on the Idea Board? Other signed-in users will be able to see it.",
      );

      if (!shouldPublish) {
        return;
      }
    }

    setError("");

    try {
      const updatedIdea = await setIdeaVisibility(idea.id, nextPublic);

      setIdeas(
        ideas.map((currentIdea) => {
          if (currentIdea.id === updatedIdea.id) {
            return updatedIdea;
          }

          return currentIdea;
        }),
      );

      if (ideaToEdit?.id === updatedIdea.id) {
        setIdeaToEdit(updatedIdea);
      }
    } catch (toggleError) {
      setError(toggleError.message);
    }
  }

  return (
    <div className="ideas-page">
      <h1>Ideas</h1>
      <p className="page-intro">
        Ideas stay private unless you publish them. Public ideas show up on
        the Idea Board for other signed-in users.
      </p>

      {error && <p className="error-message">{error}</p>}

      <IdeaForm
        key={`${ideaToEdit?.id ?? "new-idea"}-${ideaToEdit?.is_public ? "public" : "private"}`}
        ideaToEdit={ideaToEdit}
        onSave={handleSave}
        onCancel={cancelEdit}
      />

      {loading ? (
        <p>Loading ideas...</p>
      ) : (
        <IdeasTable
          ideas={ideas}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleVisibility={handleToggleVisibility}
        />
      )}
    </div>
  );
}

export default Ideas;
