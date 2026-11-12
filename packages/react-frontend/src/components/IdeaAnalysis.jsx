function ScoreCard({ label, rating }) {
  return (
    <article className="analysis-score">
      <p className="analysis-score-label">{label}</p>
      <p className="analysis-score-value">
        {rating.score}
        <span>/10</span>
      </p>
      <p>{rating.summary}</p>
    </article>
  );
}

function PointList({ title, points }) {
  return (
    <section>
      <h4>{title}</h4>
      <ul>
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}

function IdeaAnalysis({ analysis, loading, error, onRefresh }) {
  if (loading) {
    return <p className="analysis-status">Analyzing this idea...</p>;
  }

  if (error) {
    return (
      <div className="analysis-panel">
        <p className="error-message">{error}</p>
        <button type="button" onClick={onRefresh}>
          Try again
        </button>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="analysis-panel">
      <div className="analysis-heading">
        <h3>Analysis</h3>
        <button type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div className="analysis-scores">
        <ScoreCard label="Feasibility" rating={analysis.feasibility} />
        <ScoreCard label="Uniqueness" rating={analysis.uniqueness} />
        <ScoreCard label="Overall" rating={analysis.quality} />
      </div>

      <div className="analysis-lists">
        <PointList title="Strengths" points={analysis.strengths} />
        <PointList title="Weaknesses" points={analysis.weaknesses} />
        <PointList title="Suggestions" points={analysis.suggestions} />
      </div>
    </div>
  );
}

export default IdeaAnalysis;
