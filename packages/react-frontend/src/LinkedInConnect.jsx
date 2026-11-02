
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function LinkedInConnect() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      const { data: { user } } =
        await supabase.auth.getUser();

      if (!user) {
        if (active) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("social_accounts")
        .select("provider_user_id, display_name, connected_at")
        .eq("user_id", user.id)
        .eq("provider", "linkedin")
        .maybeSingle();

      if (active) {
        if (error) setMessage(error.message);
        else setAccount(data);
        setLoading(false);
      }
    }

    const status =
      new URLSearchParams(window.location.search)
        .get("linkedin");

    if (status === "success") {
      setMessage("LinkedIn connected successfully!");
    } else if (status === "already-linked") {
      setMessage(
        "This LinkedIn account belongs to another website profile."
      );
    } else if (status === "error") {
      setMessage("LinkedIn connection failed. Please retry.");
    } else if (status === "cancelled") {
      setMessage("LinkedIn connection cancelled.");
    }

    loadAccount();

    return () => { active = false; };
  }, []);

  async function connectLinkedIn() {
    setConnecting(true);
    setMessage("");

    try {
      const { data: { session } } =
        await supabase.auth.getSession();

      if (!session) {
        throw new Error("Please log in first.");
      }

      const { data, error } =
        await supabase.functions.invoke(
          "linkedin-start",
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${session.access_token}`
            },
            body: {}
          }
        );

      if (error) throw error;

      const url = new URL(data.url);

      if (
        url.origin !== "https://www.linkedin.com" ||
        url.pathname !== "/oauth/v2/authorization"
      ) {
        throw new Error("Invalid authorization URL");
      }

      window.location.assign(url.toString());
    } catch (error) {
      setMessage(error.message);
      setConnecting(false);
    }
  }

  if (loading) return <p>Loading LinkedIn...</p>;

  return (
    <section className="linkedin-connect">
      <h3>LinkedIn</h3>

      {account ? (
        <>
          <p>Connected: {account.display_name}</p>
          <p>✓ LinkedIn authenticated</p>
        </>
      ) : (
        <button
          onClick={connectLinkedIn}
          disabled={connecting}
        >
          {connecting
            ? "Connecting..."
            : "Connect LinkedIn"}
        </button>
      )}

      {message && <p role="status">{message}</p>}
    </section>
  );
}
