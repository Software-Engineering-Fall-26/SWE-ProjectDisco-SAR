import { Fragment } from "react";

import IdeaAnalysis from "./IdeaAnalysis";
import IdeaEnhance from "./IdeaEnhance";

function IdeasTable({
  ideas,
  analyses,
  enhancements,
  openPanel,
  analyzingId,
  enhancingId,
  applyingId,
  onEdit,
  onDelete,
  onToggleVisibility,
  onAnalyze,
  onRefreshAnalysis,
  onEnhance,
  onRefreshEnhance,
  onApplyEnhancement,
}) {
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
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {ideas.map((idea) => {
            const analysis = analyses[idea.id];
            const enhancement = enhancements[idea.id];
            const panelOpen = openPanel?.id === idea.id;
            const showingAnalysis = panelOpen && openPanel.mode === "analysis";
            const showingEnhance = panelOpen && openPanel.mode === "enhance";
            const applied =
              enhancement?.result &&
              idea.title === enhancement.result.enhancedTitle &&
              idea.description === enhancement.result.enhancedDescription;

            return (
              <Fragment key={idea.id}>
                <tr>
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
                      <button
                        type="button"
                        className="enhance"
                        onClick={() => onEnhance(idea)}
                      >
                        {showingEnhance ? "Hide enhance" : "Enhance"}
                      </button>

                      <button type="button" onClick={() => onAnalyze(idea)}>
                        {showingAnalysis ? "Hide analysis" : "Analyze"}
                      </button>

                      <button type="button" onClick={() => onEdit(idea)}>
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleVisibility(idea)}
                      >
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

                {showingAnalysis && (
                  <tr className="analysis-row">
                    <td colSpan={5}>
                      <IdeaAnalysis
                        analysis={analysis?.result}
                        loading={analyzingId === idea.id}
                        error={analysis?.error}
                        onRefresh={() => onRefreshAnalysis(idea)}
                      />
                    </td>
                  </tr>
                )}

                {showingEnhance && (
                  <tr className="analysis-row" data-idea-panel={idea.id}>
                    <td colSpan={5}>
                      <IdeaEnhance
                        enhancement={enhancement?.result}
                        loading={enhancingId === idea.id}
                        error={enhancement?.error}
                        onRetry={() => onRefreshEnhance(idea)}
                        onApply={() =>
                          onApplyEnhancement(idea, enhancement.result)
                        }
                        applying={applyingId === idea.id}
                        applied={applied}
                        note="Saved. Use the sharper version, or keep what you wrote."
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default IdeasTable;
