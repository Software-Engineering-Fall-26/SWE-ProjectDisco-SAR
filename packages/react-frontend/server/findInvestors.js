import {
  AnalysisError,
  asText,
  ideaPrompt,
  requestGroqJson,
  requestGroqSearch,
} from "./groq.js";

const SEARCH_PROMPT = `You research startup investors using public web pages.
Search for investors and funds whose stated focus matches this specific idea, not a broad category like "technology" or "startups".
Write a short research brief:
- Name the niche in a few words, specific to who the product is for and what it does.
- List up to 6 real investors or funds found on public pages.
- For each one, include only details that appear on a public page: name, firm, role, public investment focus, stage, check size, city or region, firm website, public profile URL, and the source page URL.
- Skip anyone you cannot tie to a public page from this search.
- Do not include email addresses, phone numbers, personal addresses, or anything behind a login.
- If a detail was not on a public page, leave it out.
- If the search finds no solid public match, say that plainly.`;

const STRUCTURE_PROMPT = `Turn investor research notes into JSON.
Return only a JSON object with this exact shape:
{
  "niche": string,
  "summary": string,
  "investors": [
    {
      "name": string,
      "firm": string,
      "role": string,
      "focus": string,
      "fit": string,
      "stage": string,
      "checkSize": string,
      "location": string,
      "website": string,
      "profileUrl": string,
      "sourceUrl": string
    }
  ]
}
Rules:
- niche is the specific market from the idea, not a generic industry label.
- summary is one sentence on why that niche points to these investors.
- Use only people, firms, and facts present in the research notes.
- Every investor needs a name, a public focus, and an http or https sourceUrl copied from the notes.
- website and profileUrl must be public http or https URLs from the notes, or empty strings.
- fit is one sentence connecting that public focus to this idea.
- Leave unknown fields as empty strings.
- Do not add emails, phone numbers, or street addresses.
- If the notes found no public match, return an empty investors array.
- Do not wrap the JSON in markdown.`;

const PUBLIC_NOTE =
  "Pulled from public pages for this niche. Details can be incomplete or out of date. Private emails, phone numbers, and home addresses are not included.";

const KNOWN_PROMPT = `You list startup investors for a specific niche.
Return only a JSON object with this exact shape:
{
  "niche": string,
  "summary": string,
  "investors": [
    {
      "name": string,
      "firm": string,
      "role": string,
      "focus": string,
      "fit": string,
      "stage": string,
      "checkSize": string,
      "location": string,
      "website": string,
      "profileUrl": string,
      "sourceUrl": string
    }
  ]
}
Rules:
- niche is the specific market from the idea, not a generic industry label.
- summary is one sentence on why that niche points to these investors.
- Include up to 6 real investors or funds that publicly invest in this niche.
- Leave someone out if you are not confident they exist.
- fit is one sentence connecting their public focus to this idea.
- sourceUrl must be an empty string.
- website and profileUrl must be empty strings unless you know the official public URL.
- Leave unknown fields as empty strings.
- Do not include emails, phone numbers, or street addresses.
- If you cannot name a confident match, return an empty investors array.
- Do not wrap the JSON in markdown.`;

const FALLBACK_NOTE =
  "Live page search was unavailable, so this list uses well-known public investors for the niche. Confirm each one before you reach out. Private emails, phone numbers, and home addresses are not included.";

function publicText(value, maxLength) {
  return asText(value, maxLength)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(
      /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}/g,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}

function asPublicUrl(value) {
  const text = asText(value, 500);

  if (!text || /\s/.test(text)) {
    return "";
  }

  let url;

  try {
    url = new URL(text);
  } catch {
    return "";
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "";
  }

  if (url.username || url.password) {
    return "";
  }

  const host = url.hostname.toLowerCase();

  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    /^(127\.|10\.|192\.168\.|0\.)/.test(host)
  ) {
    return "";
  }

  return url.href;
}

function asInvestor(item, requireSource) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const name = publicText(item.name, 120);
  const focus = publicText(item.focus, 320);
  const sourceUrl = asPublicUrl(
    item.sourceUrl || item.source_url || item.source,
  );

  if (!name || !focus || (requireSource && !sourceUrl)) {
    return null;
  }

  return {
    name,
    firm: publicText(item.firm, 120),
    role: publicText(item.role, 80),
    focus,
    fit: publicText(item.fit, 320),
    stage: publicText(item.stage, 80),
    checkSize: publicText(item.checkSize || item.check_size, 80),
    location: publicText(item.location, 80),
    website: asPublicUrl(item.website),
    profileUrl: asPublicUrl(
      item.profileUrl || item.profile_url || item.profile,
    ),
    sourceUrl,
  };
}

export function normalizeInvestors(raw, { live = true } = {}) {
  const source = raw?.investors ? raw : raw?.result || raw;
  const niche = publicText(source?.niche, 80);
  const summary = publicText(source?.summary, 320);
  const list = Array.isArray(source?.investors) ? source.investors : [];
  const seen = new Set();
  const investors = [];

  for (const item of list) {
    const investor = asInvestor(item, live);

    if (!investor) {
      continue;
    }

    const key = `${investor.name.toLowerCase()}|${investor.firm.toLowerCase()}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    investors.push(investor);

    if (investors.length === 6) {
      break;
    }
  }

  if (!niche || !summary) {
    throw new AnalysisError(
      "Groq returned an unexpected investor list. Try again.",
    );
  }

  return {
    niche,
    summary,
    investors,
    live,
    note: live ? PUBLIC_NOTE : FALLBACK_NOTE,
  };
}

async function investorsFromKnowledge(idea, apiKey) {
  const raw = await requestGroqJson({
    system: KNOWN_PROMPT,
    user: ideaPrompt(idea),
    apiKey,
    temperature: 0.2,
  });

  return normalizeInvestors(raw, { live: false });
}

export async function findInvestorsWithGroq(idea, apiKey) {
  try {
    const research = await requestGroqSearch({
      system: SEARCH_PROMPT,
      user: ideaPrompt(idea),
      apiKey,
      temperature: 0.2,
    });

    const raw = await requestGroqJson({
      system: STRUCTURE_PROMPT,
      user: `${ideaPrompt(idea)}\n\nPublic research notes:\n${research}`,
      apiKey,
      temperature: 0.1,
    });

    return normalizeInvestors(raw);
  } catch (error) {
    if (
      !(error instanceof AnalysisError) ||
      (error.status !== 429 && error.status !== 502)
    ) {
      throw error;
    }

    return investorsFromKnowledge(idea, apiKey);
  }
}
