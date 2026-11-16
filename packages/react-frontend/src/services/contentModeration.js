import { screenIdea } from "./analyzeIdea";

const REPORT_REASONS = [
  { id: "hate", label: "Hate speech" },
  { id: "harassment", label: "Harassment or threats" },
  { id: "sexual", label: "Sexual content" },
  { id: "violence", label: "Violence" },
  { id: "illegal", label: "Illegal activity" },
  { id: "spam", label: "Spam or scam" },
  { id: "other", label: "Something else" },
];

const RULES = [
  {
    category: "Hate speech",
    reason: "Slurs and hateful attacks on a person or group aren't allowed.",
    phrases: [
      "nigger",
      "niggers",
      "nigga",
      "niggas",
      "faggot",
      "faggots",
      "fag",
      "kike",
      "kikes",
      "chink",
      "chinks",
      "spic",
      "spics",
      "tranny",
      "trannies",
      "wetback",
      "wetbacks",
      "retard",
      "retards",
      "retarded",
    ],
  },
  {
    category: "Harassment",
    reason: "Threats and harassment aren't allowed.",
    phrases: [
      "kill yourself",
      "kys",
      "go die",
      "i will find you",
      "i'll find you",
    ],
  },
  {
    category: "Sexual content",
    reason: "Sexually explicit content isn't allowed.",
    phrases: [
      "porn",
      "porno",
      "pornography",
      "hentai",
      "onlyfans",
      "xxx",
      "nudes",
      "nude pics",
      "dick pic",
      "dick pics",
    ],
  },
  {
    category: "Violence",
    reason: "Violent threats aren't allowed.",
    phrases: [
      "i will kill you",
      "i'll kill you",
      "ill kill you",
      "gonna kill you",
      "going to kill you",
      "kill you",
      "shoot you",
      "stab you",
      "murder you",
      "school shooting",
      "mass shooting",
      "make a bomb",
      "pipe bomb",
      "bomb threat",
    ],
  },
  {
    category: "Illegal activity",
    reason: "Ideas about illegal goods or fraud can't be public.",
    phrases: [
      "sell cocaine",
      "selling cocaine",
      "buy cocaine",
      "buying cocaine",
      "sell heroin",
      "sell meth",
      "sell fentanyl",
      "credit card fraud",
      "stolen credit cards",
      "phishing kit",
    ],
  },
  {
    category: "Spam or scam",
    reason: "Scams and spam aren't allowed.",
    phrases: [
      "guaranteed returns",
      "guaranteed profit",
      "wire me money",
      "send me bitcoin",
      "send bitcoin",
      "double your bitcoin",
      "nigerian prince",
      "gift card scam",
    ],
  },
  {
    category: "Profanity",
    reason: "Profanity isn't allowed on the public Idea Board.",
    phrases: [
      "asshole",
      "bastard",
      "bitch",
      "bitches",
      "bitching",
      "cunt",
      "whore",
      "slut",
      "dick",
      "dickhead",
      "cock",
      "pussy",
      "bullshit",
    ],
    stems: ["fuck", "shit"],
  },
];

function boundaryPattern(phrase) {
  const body = phrase
    .trim()
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");

  return new RegExp(`(?:^|\\s)${body}(?:\\s|$)`);
}

function stemPattern(stem) {
  const body = stem
    .trim()
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return new RegExp(`(?:^|\\s)\\w*${body}\\w*(?:\\s|$)`);
}

const COMPILED_RULES = RULES.map((rule) => ({
  category: rule.category,
  reason: rule.reason,
  patterns: [
    ...rule.phrases.map(boundaryPattern),
    ...(rule.stems || []).map(stemPattern),
  ],
}));

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ideaText(idea) {
  return normalize(
    [idea?.title, idea?.description, idea?.lookingFor, idea?.looking_for]
      .filter(Boolean)
      .join(" "),
  );
}

export function screenPublicIdea(idea) {
  const text = ideaText(idea);
  const flags = [];

  if (!text) {
    return { allowed: true, flags };
  }

  for (const rule of COMPILED_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      flags.push({
        category: rule.category,
        reason: rule.reason,
      });
    }
  }

  return {
    allowed: flags.length === 0,
    flags,
  };
}

export function reviewPublicIdea(idea) {
  const review = screenPublicIdea(idea);
  const flags = [...review.flags];

  if (idea?.moderation_status === "hidden") {
    flags.unshift({
      category: "Reported",
      reason:
        idea.moderation_reason ||
        "A member reported this idea, so it stays off the Idea Board.",
    });
  }

  return {
    allowed: flags.length === 0,
    flags,
  };
}

export function formatPublishError(flags) {
  const details = flags
    .map((flag) => `${flag.category}: ${flag.reason}`)
    .join(" ");

  return `This idea can't be public. ${details}`;
}

const AI_CATEGORIES = new Set([
  "Hate speech",
  "Harassment",
  "Harassment or threats",
  "Sexual content",
  "Violence",
  "Illegal activity",
  "Spam or scam",
  "Profanity",
]);

export async function reviewPublicIdeaForPublish(idea) {
  const localReview = reviewPublicIdea(idea);

  if (!localReview.allowed) {
    return localReview;
  }

  try {
    const result = await screenIdea(idea);

    if (result?.allowed) {
      return localReview;
    }

    const category = AI_CATEGORIES.has(result?.category)
      ? result.category
      : "Review";
    const reason =
      String(result?.reason || "").trim() ||
      "This isn't allowed on the public Idea Board.";

    return {
      allowed: false,
      flags: [{ category, reason }],
    };
  } catch (error) {
    return {
      allowed: false,
      flags: [
        {
          category: "Review",
          reason:
            error?.message ||
            "The second check couldn't finish. Try publishing again.",
        },
      ],
    };
  }
}

export function assertCanPublish(idea) {
  const review = reviewPublicIdea(idea);

  if (review.allowed) {
    return review;
  }

  const error = new Error(formatPublishError(review.flags));
  error.name = "PublishBlockedError";
  error.flags = review.flags;
  throw error;
}

export function filterBoardIdeas(ideas, reportedIds = new Set()) {
  return (ideas || []).filter((idea) => {
    if (reportedIds.has(idea.id)) {
      return false;
    }

    return reviewPublicIdea(idea).allowed;
  });
}

export function isAllowedReportReason(reason) {
  return REPORT_REASONS.some((item) => item.label === reason);
}

export { REPORT_REASONS };
