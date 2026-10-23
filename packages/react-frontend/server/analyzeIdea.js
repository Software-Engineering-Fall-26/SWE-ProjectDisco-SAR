import { AnalysisError, asText, ideaPrompt, requestGroqJson } from "./groq.js";

const SYSTEM_PROMPT = `You evaluate early-stage product and startup ideas.
Return only a JSON object with this exact shape:
{
  "feasibility": { "score": number, "summary": string },
  "uniqueness": { "score": number, "summary": string },
  "quality": { "score": number, "summary": string },
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": string[]
}
Rules:
- Scores are integers from 1 to 10.
- feasibility: how realistic it is to build and deliver with a small team.
- uniqueness: how distinct it is from common products in the same space.
- quality: how strong the idea is overall, including clarity, user value, and potential.
- strengths, weaknesses, and suggestions each contain 3 short, specific points.
- suggestions must be concrete next steps.
- Do not wrap the JSON in markdown.`;

function clampScore(value) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return null;
  }

  return Math.min(10, Math.max(1, Math.round(score)));
}

function asList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asText(item, 280))
    .filter(Boolean)
    .slice(0, 5);
}

function asRating(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const score = clampScore(value.score);
  const summary = asText(value.summary, 500);

  if (score == null || !summary) {
    return null;
  }

  return { score, summary };
}

export function normalizeAnalysis(raw) {
  const feasibility = asRating(raw?.feasibility);
  const uniqueness = asRating(raw?.uniqueness);
  const quality = asRating(raw?.quality);
  const strengths = asList(raw?.strengths);
  const weaknesses = asList(raw?.weaknesses);
  const suggestions = asList(raw?.suggestions);

  if (!feasibility || !uniqueness || !quality) {
    throw new AnalysisError("Groq returned an unexpected analysis. Try again.");
  }

  if (!strengths.length || !weaknesses.length || !suggestions.length) {
    throw new AnalysisError("Groq returned an unexpected analysis. Try again.");
  }

  return {
    feasibility,
    uniqueness,
    quality,
    strengths,
    weaknesses,
    suggestions,
  };
}

export async function analyzeIdeaWithGroq(idea, apiKey) {
  const raw = await requestGroqJson({
    system: SYSTEM_PROMPT,
    user: ideaPrompt(idea),
    apiKey,
    temperature: 0.4,
  });

  return normalizeAnalysis(raw);
}
