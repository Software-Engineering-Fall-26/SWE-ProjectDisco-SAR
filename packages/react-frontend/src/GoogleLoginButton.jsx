
import { useState } from "react";
import { useAuth } from "./useAuth";

export default function GoogleLoginButton() {
  const { signInWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "Could not sign in with Google.");
      setLoading(false);
    }
  }

  return (
    <div className="google-login-section">
      <button
        type="button"
        className="google-login-button"
        onClick={handleGoogleLogin}
        disabled={loading}
      >

    <span className="google-logo" aria-hidden="true">
         <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            width="20"
            height="20"
        />
    </span>


        {loading ? "Connecting..." : "Continue with Google"}
      </button>

      {error && (
        <p className="error-message">{error}</p>
      )}
    </div>
  );
}
