import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { formatAuthError } from "./authMessages";
import { useAuth } from "./AuthContext";
import "./pages.css";

function ResetPassword() {
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      await updatePassword(password);
      navigate("/ideas");
    } catch (authError) {
      setError(formatAuthError(authError, "reset"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="login-page">
        <p className="auth-status">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-page">
        <h1 className="login-title">Reset Password</h1>
        <p className="auth-status">
          Open the reset link from your email to choose a new password.
        </p>
        <p className="auth-status">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <h1 className="login-title">New Password</h1>

      <form className="login-form" onSubmit={handleSubmit}>
        <p className="info-message">
          Choose a new password for {user.email}.
        </p>

        <label htmlFor="password">New password</label>
        <input
          type="password"
          name="password"
          id="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="login-input"
          autoComplete="new-password"
          minLength={6}
          required
        />

        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="login-input"
          autoComplete="new-password"
          minLength={6}
          required
        />

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="submit-button" disabled={submitting}>
          {submitting ? "Please wait..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;
