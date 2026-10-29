import { useEffect, useState } from "react";

import IdeaForm from "./components/IdeaForm";
import IdeaDetailModal from "./components/IdeaDetailModal";
import IdeaAnalysis from "./components/IdeaAnalysis";
import IdeaEnhance from "./components/IdeaEnhance";
import IdeasTable from "./components/IdeasTable";

import { analyzeIdea, enhanceIdea } from "./services/analyzeIdea";
import {
  getIdeas,
  createIdea,
  updateIdea,
  setIdeaVisibility,
  deleteIdea,
} from "./services/ideasAPi";

function Ideas() {
  const [ideas, setIdeas] = useState([]);
  const [ideaToEdit, setIdeaToEdit] = useState(null);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyses, setAnalyses] = useState({});
  const [enhancements, setEnhancements] = useState({});
  const [openPanel, setOpenPanel] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [enhancingId, setEnhancingId] = useState(null);
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    async function loadIdeas() {
      try {
        const loadedIdeas = await getIdeas();
        setIdeas(loadedIdeas);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadIdeas();
  }, []);

  useEffect(() => {
    if (!openPanel || openPanel.mode !== "enhance") {
      return;
    }

    document
      .querySelector(`[data-idea-panel="${openPanel.id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [openPanel]);

  function replaceIdea(updatedIdea) {
    setIdeas((current) =>
      current.map((idea) => {
        if (idea.id === updatedIdea.id) {
          return updatedIdea;
        }

        return idea;
      }),
    );

    if (ideaToEdit?.id === updatedIdea.id) {
      setIdeaToEdit(updatedIdea);
    }

    setSelectedIdea((currentIdea) =>
      currentIdea?.id === updatedIdea.id ? updatedIdea : currentIdea,
    );
  }

  function showEnhancement(id, result) {
    setEnhancements((current) => ({
      ...current,
      [id]: { result, error: "" },
    }));
    setOpenPanel({ id, mode: "enhance" });
  }

  function dismissCoach(id) {
    setAnalyses((current) => {
      if (!current[id]) {
        return current;
      }

      const next = { ...current };
      delete next[id];
      return next;
    });
    setEnhancements((current) => {
      if (!current[id]) {
        return current;
      }

      const next = { ...current };
      delete next[id];
      return next;
    });
    setOpenPanel((current) => (current?.id === id ? null : current));
  }

  async function handleSave(idea, meta) {
    setError("");

    try {
      if (ideaToEdit) {
        const updatedIdea = await updateIdea(ideaToEdit.id, idea);
        replaceIdea(updatedIdea);
        setIdeaToEdit(null);
        setAnalyses((current) => {
          const next = { ...current };
          delete next[updatedIdea.id];
          return next;
        });

        if (idea.isPublic || meta?.accepted) {
          dismissCoach(updatedIdea.id);
        } else if (meta?.enhancement) {
          showEnhancement(updatedIdea.id, meta.enhancement);
        } else {
          dismissCoach(updatedIdea.id);
        }
      } else {
        const newIdea = await createIdea(idea);
        setIdeas((current) => [newIdea, ...current]);

        if (idea.isPublic || meta?.accepted) {
          dismissCoach(newIdea.id);
        } else if (meta?.enhancement) {
          showEnhancement(newIdea.id, meta.enhancement);
        } else {
          runEnhance(newIdea);
        }
      }

      return true;
    } catch (saveError) {
      setError(saveError.message);
      return false;
    }
  }

  function handleEdit(idea) {
    setIdeaToEdit(idea);
    setSelectedIdea(null);
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

      setIdeas((current) => current.filter((idea) => idea.id !== id));

      if (ideaToEdit?.id === id) {
        setIdeaToEdit(null);
      }

      setSelectedIdea((currentIdea) =>
        currentIdea?.id === id ? null : currentIdea,
      );

      setAnalyses((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setEnhancements((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      if (openPanel?.id === id) {
        setOpenPanel(null);
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function cancelEdit() {
    setIdeaToEdit(null);
  }

  async function runAnalysis(idea) {
    setAnalyzingId(idea.id);
    setOpenPanel({ id: idea.id, mode: "analysis" });
    setAnalyses((current) => ({
      ...current,
      [idea.id]: {
        result: current[idea.id]?.result ?? null,
        error: "",
      },
    }));

    try {
      const result = await analyzeIdea(idea);

      setAnalyses((current) => ({
        ...current,
        [idea.id]: { result, error: "" },
      }));
    } catch (analysisError) {
      setAnalyses((current) => ({
        ...current,
        [idea.id]: {
          result: null,
          error: analysisError.message,
        },
      }));
    } finally {
      setAnalyzingId(null);
    }
  }

  function handleAnalyze(idea) {
    if (analyzingId === idea.id) {
      return;
    }

    if (openPanel?.id === idea.id && openPanel.mode === "analysis") {
      setOpenPanel(null);
      return;
    }

    if (analyses[idea.id]?.result) {
      setOpenPanel({ id: idea.id, mode: "analysis" });
      return;
    }

    runAnalysis(idea);
  }

  async function runEnhance(idea) {
    setEnhancingId(idea.id);
    setOpenPanel({ id: idea.id, mode: "enhance" });
    setEnhancements((current) => ({
      ...current,
      [idea.id]: {
        result: current[idea.id]?.result ?? null,
        error: "",
      },
    }));

    try {
      const result = await enhanceIdea(idea);

      setEnhancements((current) => ({
        ...current,
        [idea.id]: { result, error: "" },
      }));
    } catch (enhanceError) {
      setEnhancements((current) => ({
        ...current,
        [idea.id]: {
          result: null,
          error: enhanceError.message,
        },
      }));
    } finally {
      setEnhancingId(null);
    }
  }

  function handleEnhance(idea) {
    if (enhancingId === idea.id) {
      return;
    }

    if (openPanel?.id === idea.id && openPanel.mode === "enhance") {
      setOpenPanel(null);
      return;
    }

    if (enhancements[idea.id]?.result) {
      setOpenPanel({ id: idea.id, mode: "enhance" });
      return;
    }

    runEnhance(idea);
  }

  async function handleApplyEnhancement(idea, enhancement) {
    setApplyingId(idea.id);
    setError("");

    try {
      const updatedIdea = await updateIdea(idea.id, {
        title: enhancement.enhancedTitle,
        description: enhancement.enhancedDescription,
        lookingFor: idea.looking_for || "",
        isPublic: Boolean(idea.is_public),
      });

      replaceIdea(updatedIdea);
      dismissCoach(idea.id);
    } catch (applyError) {
      setError(applyError.message);
    } finally {
      setApplyingId(null);
    }
  }

  async function handleToggleVisibility(idea) {
    const nextPublic = !idea.is_public;

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
      replaceIdea(updatedIdea);

      if (nextPublic) {
        dismissCoach(idea.id);
      }
    } catch (toggleError) {
      setError(toggleError.message);
    }
  }

  const selectedAnalysis = selectedIdea ? analyses[selectedIdea.id] : null;
  const selectedEnhancement = selectedIdea
    ? enhancements[selectedIdea.id]
    : null;
  const showingSelectedAnalysis =
    Boolean(openPanel && selectedIdea) &&
    openPanel.id === selectedIdea.id &&
    openPanel.mode === "analysis";
  const showingSelectedEnhance =
    Boolean(openPanel && selectedIdea) &&
    openPanel.id === selectedIdea.id &&
    openPanel.mode === "enhance";
  const selectedEnhancementApplied =
    selectedEnhancement?.result &&
    selectedIdea.title === selectedEnhancement.result.enhancedTitle &&
    selectedIdea.description === selectedEnhancement.result.enhancedDescription;

  return (
    <div className="ideas-page">
      <header className="page-header">
        <p className="page-kicker">Workspace</p>
        <h1>Ideas</h1>
        <p className="page-intro">
          Write the idea, then enhance it. You get a sharper version and the
          specific changes that would make it stronger. It stays private until
          you publish.
        </p>
      </header>

      {error && <p className="error-message">{error}</p>}

      <IdeaForm
        key={`${ideaToEdit?.id ?? "new-idea"}-${ideaToEdit?.is_public ? "public" : "private"}`}
        ideaToEdit={ideaToEdit}
        onSave={handleSave}
        onCancel={cancelEdit}
      />

      <section className="ideas-list">
        <div className="section-heading">
          <h2>Your ideas</h2>
        </div>

        {loading ? (
          <p className="empty-state">Loading ideas...</p>
        ) : (
          <IdeasTable
            ideas={ideas}
            onSelectIdea={setSelectedIdea}
          />
        )}
      </section>

      {selectedIdea && (
        <IdeaDetailModal
          idea={selectedIdea}
          author="You"
          isOwner
          onClose={() => setSelectedIdea(null)}
        >
          <div className="idea-modal-actions">
            <button
              type="button"
              className="enhance"
              onClick={() => handleEnhance(selectedIdea)}
            >
              {showingSelectedEnhance ? "Hide enhance" : "Enhance"}
            </button>
            <button type="button" onClick={() => handleAnalyze(selectedIdea)}>
              {showingSelectedAnalysis ? "Hide analysis" : "Analyze"}
            </button>
            <button type="button" onClick={() => handleEdit(selectedIdea)}>
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleToggleVisibility(selectedIdea)}
            >
              {selectedIdea.is_public ? "Make private" : "Make public"}
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => handleDelete(selectedIdea.id)}
            >
              Delete
            </button>
          </div>

          {showingSelectedAnalysis && (
            <IdeaAnalysis
              analysis={selectedAnalysis?.result}
              loading={analyzingId === selectedIdea.id}
              error={selectedAnalysis?.error}
              onRefresh={() => runAnalysis(selectedIdea)}
            />
          )}

          {showingSelectedEnhance && (
            <div data-idea-panel={selectedIdea.id}>
              <IdeaEnhance
                enhancement={selectedEnhancement?.result}
                loading={enhancingId === selectedIdea.id}
                error={selectedEnhancement?.error}
                onRetry={() => runEnhance(selectedIdea)}
                onApply={() =>
                  handleApplyEnhancement(
                    selectedIdea,
                    selectedEnhancement.result,
                  )
                }
                applying={applyingId === selectedIdea.id}
                applied={selectedEnhancementApplied}
                note="Saved. Use the sharper version, or keep what you wrote."
              />
            </div>
          )}
        </IdeaDetailModal>
      )}
    </div>
  );
}

export default Ideas;
