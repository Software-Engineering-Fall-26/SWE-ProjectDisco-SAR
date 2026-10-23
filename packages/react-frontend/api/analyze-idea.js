import { handleAnalyzeRequest } from "../server/handleAnalyzeRequest.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Use POST." });
    return;
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body ?? {});

    const analysis = await handleAnalyzeRequest({
      body,
      apiKey: process.env.GROQ_API_KEY,
      authorization: req.headers.authorization,
      supabaseUrl:
        process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      supabaseAnonKey:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY,
    });

    res.status(200).json(analysis);
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({
      error: error.message || "Could not analyze this idea.",
    });
  }
}
