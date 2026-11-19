import { useState } from "react";

import IdeaForm from "../components/IdeaForm";

// This route is only registered while VITE_E2E_TEST is true. It lets the
// browser tests exercise the real form without a real login or database.
export default function E2EIdeaFormHarness() {
  const [savedIdea, setSavedIdea] = useState(null);

  async function saveIdea(idea) {
    setSavedIdea(idea);
    return true;
  }

  return (
    <main className="page-shell">
      <IdeaForm onSave={saveIdea} />
      {savedIdea && (
        <p role="status">Idea saved: {savedIdea.title}</p>
      )}
    </main>
  );
}
