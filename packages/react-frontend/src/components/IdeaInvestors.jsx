function safeHref(url) {
  try {
    const parsed = new URL(url);

    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.href;
    }
  } catch {
    return "";
  }

  return "";
}

function PublicLink({ href, children }) {
  const url = safeHref(href);

  if (!url) {
    return null;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function InvestorCard({ investor }) {
  const role = [investor.role, investor.firm].filter(Boolean).join(" · ");
  const facts = [
    investor.stage && `Stage: ${investor.stage}`,
    investor.checkSize && `Check: ${investor.checkSize}`,
    investor.location && investor.location,
  ].filter(Boolean);

  return (
    <article className="investor-card">
      <h4>{investor.name}</h4>
      {role && <p className="investor-role">{role}</p>}
      <p>{investor.focus}</p>
      {investor.fit && <p className="investor-fit">{investor.fit}</p>}
      {facts.length > 0 && (
        <ul className="investor-facts">
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      )}
      <div className="investor-links">
        <PublicLink href={investor.website}>Website</PublicLink>
        <PublicLink href={investor.profileUrl}>Profile</PublicLink>
        <PublicLink href={investor.sourceUrl}>Source</PublicLink>
      </div>
    </article>
  );
}

function IdeaInvestors({ result, loading, error, onRefresh }) {
  if (loading && !result) {
    return (
      <p className="analysis-status">
        Searching public pages for investors in this niche...
      </p>
    );
  }

  if (error && !result) {
    return (
      <div className="investor-panel">
        <p className="error-message">{error}</p>
        <button type="button" onClick={onRefresh}>
          Try again
        </button>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="investor-panel">
      <div className="analysis-heading">
        <div>
          <p className="enhance-kicker">{result.niche}</p>
          <h3>Investors</h3>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Searching..." : "Refresh"}
        </button>
      </div>

      <p className="investor-summary">{result.summary}</p>
      <p className="investor-note">{result.note}</p>

      {error && <p className="error-message">{error}</p>}

      {result.investors.length === 0 ? (
        <p className="investor-empty">
          {result.live === false
            ? "No widely known investors stood out for this niche."
            : "No public investor or fund pages matched this niche closely enough to list."}
        </p>
      ) : (
        <div className="investor-list">
          {result.investors.map((investor) => (
            <InvestorCard
              key={`${investor.name}-${investor.firm}`}
              investor={investor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default IdeaInvestors;
