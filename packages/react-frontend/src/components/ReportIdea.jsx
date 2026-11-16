import { useState } from "react";

import { REPORT_REASONS } from "../services/contentModeration";
import { reportPublicIdea } from "../services/reportsApi";

function ReportIdea({ ideaId, onCancel, onReported }) {
  const [reason, setReason] = useState(REPORT_REASONS[0].label);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const needsDetails = reason === "Something else";

  async function handleSubmit(event) {
    event.preventDefault();

    if (needsDetails && !details.trim()) {
      setError("Add a short note about what's wrong.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await reportPublicIdea({ ideaId, reason, details });
      onReported();
    } catch (reportError) {
      setError(reportError.message);
      setSubmitting(false);
    }
  }

  return (
    <form className="report-idea" onSubmit={handleSubmit}>
      <div>
        <h3>Report this idea</h3>
        <p>A report takes it off the Idea Board and records why.</p>
      </div>

      <label>
        What's wrong
        <select
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={submitting}
        >
          {REPORT_REASONS.map((item) => (
            <option key={item.id} value={item.label}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Details {needsDetails ? "" : "(optional)"}
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          maxLength={500}
          rows={3}
          required={needsDetails}
          disabled={submitting}
          placeholder="What should reviewers know?"
        />
      </label>

      {error && <p className="error-message">{error}</p>}

      <div className="report-idea-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Reporting..." : "Submit report"}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ReportIdea;
