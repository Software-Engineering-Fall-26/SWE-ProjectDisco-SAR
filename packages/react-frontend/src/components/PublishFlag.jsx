function PublishFlag({ flags }) {
  if (!flags?.length) {
    return null;
  }

  return (
    <div className="publish-flag" role="alert">
      <h3>This idea can't be public</h3>
      <p>
        Disco flagged it for the reasons below, so it stays off the Idea
        Board. Private drafts can still be saved.
      </p>
      <ul>
        {flags.map((flag) => (
          <li key={flag.category}>
            <strong>{flag.category}.</strong> {flag.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PublishFlag;
