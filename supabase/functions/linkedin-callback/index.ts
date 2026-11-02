
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createRemoteJWKSet,
  jwtVerify
} from "npm:jose@6";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const clientId = Deno.env.get("LINKEDIN_CLIENT_ID")!;
const clientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET")!;
const redirectUri = Deno.env.get("LINKEDIN_REDIRECT_URI")!;
const frontendUrl = Deno.env.get("FRONTEND_URL")!;

const jwks = createRemoteJWKSet(
  new URL("https://www.linkedin.com/oauth/openid/jwks")
);

function hex(bytes: Uint8Array) {
  return Array.from(bytes, b =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

async function hash(value: string) {
  return hex(new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(value)
    )
  ));
}

function redirect(status: string) {
  const url = new URL("/profile", frontendUrl);
  url.searchParams.set("linkedin", status);
  return Response.redirect(url.toString(), 303);
}

Deno.serve(async req => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405
    });
  }

  const url = new URL(req.url);
  const state = url.searchParams.get("state");

  if (!state || !/^[a-f0-9]{64}$/.test(state)) {
    return redirect("error");
  }

  try {
    // Consume the state exactly once.
    const { data: userId, error: stateError } =
      await admin.rpc(
        "consume_linkedin_oauth_state",
        { p_state_hash: await hash(state) }
      );

    if (stateError || !userId) {
      return redirect("error");
    }

    if (url.searchParams.has("error")) {
      return redirect("cancelled");
    }

    const code = url.searchParams.get("code");

    if (!code) {
      return redirect("error");
    }

    // Exchange the authorization code server-side.
    const tokenResponse = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        })
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Token exchange failed");
    }

    const tokens = await tokenResponse.json();

    if (typeof tokens.id_token !== "string") {
      throw new Error("Missing LinkedIn ID token");
    }

    // Verify signature and required OIDC claims.
    const { payload } = await jwtVerify(
      tokens.id_token,
      jwks,
      {
        issuer: "https://www.linkedin.com",
        audience: clientId,
        algorithms: ["RS256"],
        requiredClaims: ["sub", "iat", "exp"]
      }
    );

    if (typeof payload.sub !== "string" ||
        !payload.sub) {
      throw new Error("Invalid LinkedIn subject");
    }

    // Optional: retrieve current profile information.
    let displayName =
      typeof payload.name === "string"
        ? payload.name
        : null;

    if (typeof tokens.access_token === "string") {
      const profileResponse = await fetch(
        "https://api.linkedin.com/v2/userinfo",
        {
          headers: {
            Authorization:
              `Bearer ${tokens.access_token}`
          }
        }
      );

      if (profileResponse.ok) {
        const profile = await profileResponse.json();

        if (profile.sub !== payload.sub) {
          throw new Error("LinkedIn subject mismatch");
        }

        if (typeof profile.name === "string") {
          displayName = profile.name;
        }
      }
    }

    // Avoid replacing a connection owned by another
    // website user. The database unique constraints
    // enforce account ownership.
    const { data: existing, error: lookupError } =
      await admin
        .from("social_accounts")
        .select("user_id")
        .eq("provider", "linkedin")
        .eq("provider_user_id", payload.sub)
        .maybeSingle();

    if (lookupError) throw lookupError;

    if (existing && existing.user_id !== userId) {
      return redirect("already-linked");
    }

    // Upsert only on this user's provider slot.
    const { error: saveError } = await admin
      .from("social_accounts")
      .upsert({
        user_id: userId,
        provider: "linkedin",
        provider_user_id: payload.sub,
        display_name: displayName,
        connected_at: new Date().toISOString()
      }, {
        onConflict: "user_id,provider"
      });

    if (saveError) {
      // Includes concurrent ownership conflicts.
      throw saveError;
    }

    return redirect("success");

  } catch (error) {
    console.error(
      "LinkedIn callback failed:",
      error instanceof Error ? error.message : "Unknown"
    );
    return redirect("error");
  }
});
