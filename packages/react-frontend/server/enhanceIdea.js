import { AnalysisError, asText, ideaPrompt, requestGroqJson } from "./groq.js";

const SYSTEM_PROMPT = `You are a sharp startup partner helping a founder improve an idea before they show it to anyone.
Return only a JSON object with this exact shape:
{
  "verdict": string,
  "enhancedTitle": string,
  "enhancedDescription": string,
  "upgrades": [{ "label": string, "detail": string }]
}
Rules:
- verdict is one honest sentence about the idea as written.
- enhancedTitle is a concrete title under 80 characters. Keep the same idea.
- enhancedDescription is 2 to 4 sentences: who it is for, the problem, what the product does, and why this version is stronger.
- upgrades has exactly 3 items.
- each label is a short name for the change, 2 to 5 words.
- each detail explains how the idea could be better with one specific addition. Name a real user, wedge, constraint, distribution path, or first version.
- Do not give generic advice such as "validate the market", "do more research", or "build an MVP".
- Do not turn the idea into a different company.
- Write like a person. No markdown.`;

function asUpgrade(item) {
  if (typeof item === "string") {
    const detail = asText(item, 400);
    return detail ? { label: "Could be better with", detail } : null;
  }

  if (!item || typeof item !== "object") {
    return null;
  }

  const label = asText(item.label || item.title || item.name, 80);
  const detail = asText(
    item.detail || item.text || item.suggestion || item.description,
    400,
  );

  if (!label || !detail) {
    return null;
  }

  return { label, detail };
}

export function normalizeEnhancement(raw) {
  const source = raw?.enhancement || raw?.result || raw;
  const verdict = asText(source?.verdict || source?.summary, 320);
  const enhancedTitle = asText(
    source?.enhancedTitle || source?.enhanced_title,
    120,
  );
  const enhancedDescription = asText(
    source?.enhancedDescription || source?.enhanced_description,
    1600,
  );
  const upgradeList = source?.upgrades || source?.suggestions;
  const upgrades = Array.isArray(upgradeList)
    ? upgradeList.map(asUpgrade).filter(Boolean).slice(0, 3)
    : [];

  if (
    !verdict ||
    !enhancedTitle ||
    !enhancedDescription ||
    upgrades.length < 3
  ) {
    throw new AnalysisError(
      "Groq returned an unexpected enhancement. Try again.",
    );
  }

  return {
    verdict,
    enhancedTitle,
    enhancedDescription,
    upgrades,
  };
}

export async function enhanceIdeaWithGroq(idea, apiKey) {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await requestGroqJson({
        system: SYSTEM_PROMPT,
        user: ideaPrompt(idea),
        apiKey,
        temperature: 0.5,
      });

      return normalizeEnhancement(raw);
    } catch (error) {
      lastError = error;

      if (error.status && error.status !== 500) {
        throw error;
      }
    }
  }

  throw lastError;
}
