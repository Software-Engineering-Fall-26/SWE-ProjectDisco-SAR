const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";

export class AnalysisError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export function asText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export function normalizeIdeaInput(body) {
  const title = asText(body?.title, 200);
  const description = asText(body?.description, 8000);
  const lookingFor = asText(body?.lookingFor ?? body?.looking_for, 200);

  if (!title || !description) {
    throw new AnalysisError("An idea needs a title and description.", 400);
  }

  return { title, description, lookingFor };
}

function extractJson(text) {
  const trimmed = String(text ?? "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end <= start) {
    throw new AnalysisError("Groq returned an unexpected response. Try again.");
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new AnalysisError("Groq returned an unexpected response. Try again.");
  }
}

function groqFailure(response, payload) {
  const message = payload?.error?.message || "";

  if (response.status === 401) {
    return new AnalysisError("Groq rejected the API key.", 502);
  }

  if (response.status === 429) {
    return new AnalysisError(
      "Groq is rate limiting requests. Try again in a moment.",
      429,
    );
  }

  return new AnalysisError(
    message ? `Groq could not do that. ${message}` : "Groq could not do that.",
    502,
  );
}

export async function requestGroqJson({ system, user, apiKey, temperature }) {
  if (!apiKey) {
    throw new AnalysisError(
      "Groq is not configured. Add GROQ_API_KEY to the repo-root .env file.",
    );
  }

  let response;

  try {
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature,
        max_completion_tokens: 1500,
        reasoning_effort: "low",
        reasoning_format: "hidden",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
  } catch {
    throw new AnalysisError(
      "Could not reach Groq. Check your connection and try again.",
    );
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw groqFailure(response, payload);
  }

  const message = payload?.choices?.[0]?.message;
  return extractJson(message?.content || message?.reasoning);
}

export function ideaPrompt(idea) {
  return [
    `Title: ${idea.title}`,
    `Looking for: ${idea.lookingFor || "Not specified"}`,
    `Description: ${idea.description}`,
  ].join("\n");
}
