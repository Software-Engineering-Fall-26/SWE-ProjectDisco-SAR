import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./useAuth";
import {
  fetchProfile,
  saveProfile,
  uploadAvatar,
  validateAvatar,
} from "./services/profileApi";

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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [nightModePreview, setNightModePreview] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!nightModePreview) {
      delete document.documentElement.dataset.theme;
      return undefined;
    }

    document.documentElement.dataset.theme = "dark";

    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [nightModePreview]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!user) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const loadedProfile = await fetchProfile(user.id);

        if (isMounted) {
          setProfile(loadedProfile.profile);
          setAvatarUrl(loadedProfile.avatarUrl);
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

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  function updateProfileField(field, value) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  }

  function handleChange(event) {
    updateProfileField(event.target.name, event.target.value);
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

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file || !user) {
      return;
    }

    setError("");
    setMessage("");

    const validationError = validateAvatar(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setSaving(true);

    try {
      const uploadedAvatar = await uploadAvatar(user.id, file);

      setProfile((currentProfile) => ({
        ...currentProfile,
        avatar_path: uploadedAvatar.avatarPath,
      }));
      setAvatarUrl(uploadedAvatar.avatarUrl);
      setMessage("Profile photo updated.");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!profile || !user) {
      return;
    }

    const displayName = profile.display_name.trim();

    if (!displayName) {
      setError("Please enter a display name.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const savedProfile = await saveProfile(user.id, profile);
      setProfile(savedProfile);
      setMessage("Profile saved.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
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

  function handleDeleteAccount() {
    setError(
      "Account deletion is not enabled yet. It must be implemented with a protected server-side function.",
    );
  }

  if (loading) {
    return (
      <div className="profile-page">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <header className="page-header">
          <p className="page-kicker">You</p>
          <h1>Account</h1>
        </header>
        <p className="error-message">
          {error || "Your profile could not be loaded."}
        </p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="page-header">
        <p className="page-kicker">You</p>
        <h1>Account</h1>
        <p className="page-intro">
          How you show up on Disco, and the settings for this login.
        </p>
      </header>

      <form className="profile-form" onSubmit={handleSave}>
        <section className="profile-avatar-section">
          <div className="avatar-preview">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Your profile" />
            ) : (
              <span>
                {profile.display_name?.slice(0, 1).toUpperCase() || "?"}
              </span>
            )}
          </div>

          <label className="avatar-upload-label">
            Change profile photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              disabled={saving}
            />
          </label>

          <span className="field-hint">JPG, PNG, or WebP; maximum 2 MB.</span>
        </section>

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
              onChange={() => updateProfileField("is_public", false)}
            />
            Private
          </label>

          <label className="profile-radio-label">
            <input
              type="radio"
              name="is_public"
              checked={profile.is_public}
              onChange={() => updateProfileField("is_public", true)}
            />
            Public
          </label>

          <span className="field-hint">
            Public profile viewing will be added later.
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

          <button type="button" className="btn-secondary" onClick={addCustomTopic}>
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

        <section className="profile-preferences">
          <h2>Preferences</h2>

          <button
            type="button"
            className="preference-button"
            onClick={() => setNightModePreview((currentValue) => !currentValue)}
          >
            Night mode: {nightModePreview ? "On" : "Off"} (preview only)
          </button>

          <label className="message-permission-label">
            <input
              type="checkbox"
              checked={profile.message_permission}
              onChange={(event) =>
                updateProfileField("message_permission", event.target.checked)
              }
            />
            Allow messages when messaging becomes available
          </label>

          <span className="field-hint">
            Messaging is not available yet. This preference is saved for later.
          </span>
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

      <div className="account-actions">
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

      <section className="delete-account-section">
        <h2>Danger zone</h2>
        <p>Account deletion is permanent and cannot be undone.</p>
        <button
          type="button"
          className="delete-account-button"
          onClick={handleDeleteAccount}
        >
          Delete account
        </button>
      </section>
    </div>
  );
}

export default Profile;
