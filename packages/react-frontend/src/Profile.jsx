import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./AuthContext";
import { supabase } from "./supabaseClient";

const PRESET_TOPICS = [
  "Technology",
  "Design",
  "Business",
  "Education",
  "Health",
  "Sustainability",
];

function Profile() {
  const { user, signOut, changeEmail } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user || !supabase) {
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, description, is_public, topics")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError(profileError.message);
      } else {
        setProfile({
          ...data,
          topics: data.topics ?? [],
        });
      }

      setLoading(false);
    }

    loadProfile();
  }, [user]);

  function handleChange(event) {
    const { name, value } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  }

  function toggleTopic(topic) {
    setProfile((currentProfile) => {
      const topics = currentProfile.topics ?? [];

      if (topics.includes(topic)) {
        return {
          ...currentProfile,
          topics: topics.filter((currentTopic) => currentTopic !== topic),
        };
      }

      return {
        ...currentProfile,
        topics: [...topics, topic],
      };
    });
  }

  function addCustomTopic() {
    const topic = customTopic.trim();

    if (!topic) {
      return;
    }

    setProfile((currentProfile) => {
      const topics = currentProfile.topics ?? [];

      if (
        topics.some(
          (currentTopic) => currentTopic.toLowerCase() === topic.toLowerCase(),
        )
      ) {
        setError("You already added that topic.");
        return currentProfile;
      }

      return {
        ...currentProfile,
        topics: [...topics, topic],
      };
    });

    setCustomTopic("");
  }
  async function handleEmailChange(event) {
    event.preventDefault();

    const email = newEmail.trim();

    if (!email) {
      setError("Enter a new email address.");
      return;
    }

    if (email.toLowerCase() === user.email.toLowerCase()) {
      setError("That is already your current email address.");
      return;
    }

    setChangingEmail(true);
    setError("");
    setMessage("");

    try {
      await changeEmail(email);
      setNewEmail("");
      setMessage(
        "Check your inbox for email-change verification instructions.",
      );
    } catch (emailError) {
      setError(emailError.message);
    } finally {
      setChangingEmail(false);
    }
  }

  async function handleLogout() {
    setError("");

    try {
      await signOut();
      navigate("/login");
    } catch (logoutError) {
      setError(logoutError.message);
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    const displayName = profile.display_name.trim();
    const description = profile.description.trim();

    if (!displayName) {
      setError("Please enter a display name.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        description,
        is_public: profile.is_public,
        topics: profile.topics,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfile((currentProfile) => ({
        ...currentProfile,
        display_name: displayName,
        description,
      }));
      setMessage("Profile saved.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="profile-page">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-page">
        <h1>Account</h1>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h1>Account</h1>

      <form className="profile-form" onSubmit={handleSave}>
        <label>
          Display name
          <input
            type="text"
            name="display_name"
            value={profile.display_name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Description
          <textarea
            name="description"
            value={profile.description}
            onChange={handleChange}
            rows={5}
            placeholder="Tell people a little about yourself."
          />
        </label>

        <fieldset className="profile-visibility-fieldset">
          <legend>Profile visibility</legend>

          <label className="profile-radio-label">
            <input
              type="radio"
              name="is_public"
              checked={!profile.is_public}
              onChange={() =>
                setProfile((currentProfile) => ({
                  ...currentProfile,
                  is_public: false,
                }))
              }
            />
            Private
          </label>

          <label className="profile-radio-label">
            <input
              type="radio"
              name="is_public"
              checked={profile.is_public}
              onChange={() =>
                setProfile((currentProfile) => ({
                  ...currentProfile,
                  is_public: true,
                }))
              }
            />
            Public
          </label>

          <span className="field-hint">
            Public profiles will later show your display name and description to
            other signed-in users.
          </span>
        </fieldset>

        <section className="profile-topics">
          <h2>Topics</h2>
          <p className="field-hint">
            Choose a few topics that represent your interests.
          </p>

          <div className="topic-options">
            {PRESET_TOPICS.map((topic) => {
              const selected = profile.topics.includes(topic);

              return (
                <button
                  key={topic}
                  type="button"
                  className={
                    selected ? "topic-option selected" : "topic-option"
                  }
                  onClick={() => toggleTopic(topic)}
                >
                  {topic}
                </button>
              );
            })}
          </div>

          <label>
            Add your own topic
            <input
              type="text"
              value={customTopic}
              onChange={(event) => setCustomTopic(event.target.value)}
              placeholder="For example, Accessibility"
            />
          </label>

          <button type="button" onClick={addCustomTopic}>
            Add topic
          </button>

          {profile.topics.length > 0 && (
            <div className="selected-topics">
              {profile.topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className="selected-topic"
                  onClick={() => toggleTopic(topic)}
                >
                  {topic} ×
                </button>
              ))}
            </div>
          )}
        </section>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="info-message">{message}</p>}

        <button type="submit" className="submit-button" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>

      <dl className="account-details">
        <div>
          <dt>Email</dt>
          <dd>{user?.email}</dd>
        </div>
        <div>
          <dt>Profile visibility</dt>
          <dd>{profile.is_public ? "Public" : "Private"}</dd>
        </div>
      </dl>
      <form className="change-email-form" onSubmit={handleEmailChange}>
        <label>
          New email address
          <input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="Enter a new email address"
            autoComplete="email"
            required
          />
        </label>

        <button
          type="submit"
          className="change-email-button"
          disabled={changingEmail}
        >
          {changingEmail ? "Sending..." : "Change email"}
        </button>

        {error && <p className="error-message">{error}</p>}
        {message && <p className="info-message">{message}</p>}
      </form>

      <button
        type="button"
        className="change-password-button"
        onClick={() => navigate("/reset-password")}
      >
        Change password
      </button>
      <button
        type="button"
        className="logout-profile-button"
        onClick={handleLogout}
      >
        Log out
      </button>
    </div>
  );
}

export default Profile;
