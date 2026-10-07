import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "./useAuth";
import { supabase } from "./supabaseClient";

const PRESET_TOPICS = [
  "Technology",
  "Design",
  "Business",
  "Education",
  "Health",
  "Sustainability",
];

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getFileExtension(file) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

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
    let isMounted = true;

    async function loadProfile() {
      if (!user || !supabase) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select(
            "display_name, description, is_public, topics, avatar_path, message_permission",
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!isMounted) {
          return;
        }

        const loadedProfile = {
          ...data,
          topics: data.topics ?? [],
        };

        setProfile(loadedProfile);

        if (loadedProfile.avatar_path) {
          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from("avatars")
              .createSignedUrl(loadedProfile.avatar_path, 60 * 60);

          if (signedUrlError) {
            throw signedUrlError;
          }

          if (isMounted) {
            setAvatarUrl(signedUrlData.signedUrl);
          }
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

    if (!file || !user || !supabase) {
      return;
    }

    setError("");
    setMessage("");

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Choose an image smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    setSaving(true);

    try {
      const avatarPath = `${user.id}/avatar.${getFileExtension(file)}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(avatarPath, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_path: avatarPath })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("avatars")
          .createSignedUrl(avatarPath, 60 * 60);

      if (signedUrlError) {
        throw signedUrlError;
      }

      setProfile((currentProfile) => ({
        ...currentProfile,
        avatar_path: avatarPath,
      }));
      setAvatarUrl(signedUrlData.signedUrl);
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

    if (!profile || !user || !supabase) {
      return;
    }

    const displayName = profile.display_name.trim();
    const description = profile.description.trim();

    if (!displayName) {
      setError("Please enter a display name.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          description,
          is_public: profile.is_public,
          topics: profile.topics,
          message_permission: profile.message_permission,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile((currentProfile) => ({
        ...currentProfile,
        display_name: displayName,
        description,
      }));
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
        <h1>Account</h1>
        <p className="error-message">
          {error || "Your profile could not be loaded."}
        </p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h1>Account</h1>

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
