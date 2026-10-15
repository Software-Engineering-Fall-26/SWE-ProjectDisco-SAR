import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { describeSignupResult, formatAuthError } from "./authMessages";
import AuthFrame from "./components/AuthFrame";
import { useAuth } from "./useAuth";
import "./pages.css";

function Login() {
  const { user, loading, signIn, signUp, requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="boot-screen">
        <span className="brand-mark" aria-hidden="true">
          D
        </span>
        <p>Loading Disco</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/ideas" replace />;
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setInfo("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);

    const email = form.email.trim();

    try {
      if (mode === "reset") {
        await requestPasswordReset(email);
        setInfo(
          "If that email has an account, a password reset link was sent. Open it to choose a new password. Add http://localhost:5173/reset-password to Supabase redirect URLs if the link fails.",
        );
        return;
      }

      if (mode === "signup") {
        const data = await signUp(email, form.password, form.username.trim());
        const result = describeSignupResult(data);

        if (result.alreadyExists) {
          setError(result.message);
          return;
        }

        if (result.needsConfirmation) {
          setInfo(result.message);
          return;
        }

        navigate("/ideas");
        return;
      }

      await signIn(email, form.password);
      navigate("/ideas");
    } catch (authError) {
      setError(formatAuthError(authError, mode));
    } finally {
      setSubmitting(false);
    }
  }

  const titles = {
    login: "Log in",
    signup: "Create your account",
    reset: "Reset password",
  };

  const kickers = {
    login: "Welcome back",
    signup: "Get started",
    reset: "Account recovery",
  };

  const submitLabels = {
    login: "Log in",
    signup: "Create account",
    reset: "Send reset link",
  };

  return (
    <AuthFrame kicker={kickers[mode]} title={titles[mode]}>
      <form className="login-form" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              value={form.username}
              onChange={handleChange}
              className="login-input"
              required
            />
          </>
        )}

        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          value={form.email}
          onChange={handleChange}
          className="login-input"
          autoComplete="email"
          required
        />

        {mode !== "reset" && (
          <>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              value={form.password}
              onChange={handleChange}
              className="login-input"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              minLength={6}
              required
            />
          </>
        )}

        {mode === "login" && (
          <button
            type="button"
            className="auth-switch-button forgot-link"
            onClick={() => switchMode("reset")}
          >
            Forgot password?
          </button>
        )}

        {mode === "reset" && (
          <p className="info-message">
            Enter the email for your account. If it exists, we will send a reset
            link. No new account is created.
          </p>
        )}

        {error && <p className="error-message">{error}</p>}
        {info && <p className="info-message">{info}</p>}

        <button type="submit" className="submit-button" disabled={submitting}>
          {submitting ? "Please wait..." : submitLabels[mode]}
        </button>

        {mode === "signup" && error.includes("already has an account") && (
          <button
            type="button"
            className="auth-switch-button"
            onClick={() => switchMode("reset")}
          >
            Reset password for this email
          </button>
        )}

        <button
          type="button"
          className="auth-switch-button"
          onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
        >
          {mode === "signup"
            ? "Already have an account? Log in"
            : "Need an account? Create one"}
        </button>

        {mode === "reset" && (
          <button
            type="button"
            className="auth-switch-button"
            onClick={() => switchMode("login")}
          >
            Back to login
          </button>
        )}
      </form>
    </AuthFrame>
  );
}

export default Login;
