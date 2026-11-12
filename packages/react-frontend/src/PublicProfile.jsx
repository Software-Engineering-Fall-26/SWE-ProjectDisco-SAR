import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  fetchPublicLinkedInAccount,
  fetchPublicMember,
} from "./services/publicProfileApi";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PublicProfile() {
  const { userId } = useParams();
  const [member, setMember] = useState(null);
  const [linkedInAccount, setLinkedInAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMember() {
      setLoading(true);
      setError("");

      try {
        const loadedMember = await fetchPublicMember(userId);

        if (!loadedMember) {
          if (isMounted) {
            setMember(null);
          }
          return;
        }

        if (isMounted) {
          setMember(loadedMember);
        }

        try {
          const linkedAccount = await fetchPublicLinkedInAccount(userId);
          if (isMounted) {
            setLinkedInAccount(linkedAccount);
          }
        } catch {
          // A missing LinkedIn connection must not prevent the profile loading.
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMember();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading) {
    return <p className="empty-state">Loading member profile...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!member) {
    return (
      <section className="public-profile-page">
        <button type="button" className="private-account-notice" disabled>
          This account is private
        </button>
        <Link className="btn-secondary" to="/board">
          Back to Idea Board
        </Link>
      </section>
    );
  }

  const { profile, avatarUrl, ideas } = member;
  const username = ideas[0]?.author_username?.trim();
  const displayName = profile.display_name?.trim() || username || "Disco member";

  return (
    <div className="public-profile-page">
      <Link className="back-link" to="/board">
        ← Back to Idea Board
      </Link>

      <section className="public-profile-hero">
        <div className="public-profile-avatar" aria-hidden="true">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" />
          ) : (
            <span>{displayName.slice(0, 1).toUpperCase()}</span>
          )}
        </div>

        <div>
          <p className="page-kicker">Disco member</p>
          <h1>{displayName}</h1>
          {username && <p className="public-profile-username">@{username}</p>}
        </div>
      </section>

      {profile.description && (
        <section className="public-profile-section">
          <h2>About</h2>
          <p className="public-profile-description">{profile.description}</p>
        </section>
      )}

      {profile.topics.length > 0 && (
        <section className="public-profile-section">
          <h2>Interested in</h2>
          <div className="public-profile-topics">
            {profile.topics.map((topic) => (
              <span key={topic} className="looking-for-pill">
                {topic}
              </span>
            ))}
          </div>
        </section>
      )}

      {linkedInAccount && (
        <section className="public-profile-section public-profile-contact">
          <h2>Contact</h2>
          <p>
            <strong>LinkedIn</strong> connected
            {linkedInAccount.display_name
              ? ` as ${linkedInAccount.display_name}.`
              : "."}
          </p>
        </section>
      )}

      <section className="public-profile-section">
        <h2>Public ideas</h2>
        {ideas.length === 0 ? (
          <p className="field-hint">No public ideas yet.</p>
        ) : (
          <div className="public-profile-ideas">
            {ideas.map((idea) => (
              <article key={idea.id} className="public-profile-idea">
                <div>
                  <h3>{idea.title}</h3>
                  <p className="field-hint">{formatDate(idea.created_at)}</p>
                </div>
                <span className="looking-for-pill">
                  Looking for {idea.looking_for || "collaborators"}
                </span>
                <p>{idea.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default PublicProfile;
