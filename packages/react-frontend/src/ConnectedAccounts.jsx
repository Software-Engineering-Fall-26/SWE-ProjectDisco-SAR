
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function ConnectedAccounts({ user }) {
  const [linkedin, setLinkedin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) {
      setLinkedin(null);
      setLoading(false);
      return;
    }

    let active = true;

    async function loadConnection() {
      setLoading(true);

      const { data, error } = await supabase
        .from("social_accounts")
        .select("provider_user_id, display_name, connected_at")
        .eq("user_id", user.id)
        .eq("provider", "linkedin")
        .maybeSingle();

      if (!active) return;

      if (error) setError(error.message);
      else setLinkedin(data);

      setLoading(false);
    }

    const status = new URLSearchParams(
      window.location.search
    ).get("linkedin");

    if (status === "success") {
      setMessage("LinkedIn connected successfully.");
    } else if (status === "cancelled") {
      setMessage("LinkedIn connection cancelled.");
    } else if (status === "already-linked") {
      setError("This LinkedIn account is linked to another user.");
    } else if (status === "error") {
      setError("Could not connect LinkedIn.");
    }

    loadConnection();

    return () => { active = false; };
  }, [user?.id]);

  async function connectLinkedIn() {
    setConnecting(true);
    setError("");
    setMessage("");

    try {
      const { data: { session }, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Please sign in first.");
      }

      const { data, error } =
        await supabase.functions.invoke("linkedin-start", {
          method: "POST",
          body: {},
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

      if (error) throw error;

      const url = new URL(data.url);

      if (
        url.origin !== "https://www.linkedin.com" ||
        url.pathname !== "/oauth/v2/authorization"
      ) {
        throw new Error("Invalid LinkedIn authorization URL.");
      }

      window.location.assign(url.toString());
    } catch (err) {
      setError(err.message);
      setConnecting(false);
    }
  }

  return (
    <section className="connected-accounts">
      <h2>Connected Accounts</h2>
      <p className="field-hint">
        Connect social accounts to your Disco profile.
      </p>

      <div className="connected-account-row">
        <div className="connected-account-info">
          <span className="social-icon linkedin-icon">
            in
          </span>

          <div>
            <strong>LinkedIn</strong>
            <p className="field-hint">
              {loading
                ? "Checking connection..."
                : linkedin
                  ? `${linkedin.display_name || "LinkedIn user"} · Authenticated`
                  : "Not connected"}
            </p>
          </div>
        </div>

        {loading ? (
            <span className="field-hint">
                Checking...
            </span>
        ) : linkedin ? (
            <span className="connected-status">
                <span aria-hidden="true">✓</span>
                Connected
            </span>
        ) : (
            <button
                type="button"
                className="btn-secondary"
                onClick={connectLinkedIn}
                disabled={connecting}
            >
                {connecting ? "Connecting..." : "Connect"}
            </button>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="info-message">{message}</p>}
    </section>
  );
}
