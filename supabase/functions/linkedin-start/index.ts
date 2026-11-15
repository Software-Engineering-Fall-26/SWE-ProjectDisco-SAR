
import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const clientId = Deno.env.get("LINKEDIN_CLIENT_ID")!;
const redirectUri = Deno.env.get("LINKEDIN_REDIRECT_URI")!;
const frontendUrl = Deno.env.get("FRONTEND_URL")!;

const admin = createClient(supabaseUrl, serviceKey);


const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-retry-count",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};


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

Deno.serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405, headers: cors
    });
  }

  const bearer = req.headers.get("Authorization");

  if (!bearer?.startsWith("Bearer ")) {
    return new Response("Unauthorized", {
      status: 401, headers: cors
    });
  }

  const jwt = bearer.slice(7);

  const { data: { user }, error } =
    await admin.auth.getUser(jwt);

  if (error || !user) {
    return new Response("Unauthorized", {
      status: 401, headers: cors
    });
  }

  const state = hex(crypto.getRandomValues(
    new Uint8Array(32)
  ));

  const stateHash = await hash(state);

  const { error: dbError } = await admin
    .from("linkedin_oauth_states")
    .insert({
      state_hash: stateHash,
      user_id: user.id,
      expires_at: new Date(
        Date.now() + 10 * 60 * 1000
      ).toISOString()
    });

  if (dbError) {
    return new Response("Could not start connection", {
      status: 500, headers: cors
    });
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile"
  });

  const url =
    "https://www.linkedin.com/oauth/v2/authorization?" +
    params.toString();

  return Response.json({ url }, { headers: cors });
});
