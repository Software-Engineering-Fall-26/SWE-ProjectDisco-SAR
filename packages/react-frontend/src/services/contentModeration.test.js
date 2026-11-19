import { describe, expect, it } from "vitest";

import {
  filterBoardIdeas,
  reviewPublicIdea,
  screenPublicIdea,
} from "./contentModeration";

describe("content moderation", () => {
  it("allows a harmless idea containing the food word shitake", () => {
    const review = screenPublicIdea({
      title: "Shitake mushroom delivery",
      description: "A local-food marketplace for fresh mushrooms.",
    });

    expect(review.allowed).toBe(true);
    expect(review.flags).toEqual([]);
  });

  it("blocks an idea advertising illegal drug sales", () => {
    const review = screenPublicIdea({
      title: "Fast service",
      description: "Buy cocaine with same-day delivery.",
    });

    expect(review.allowed).toBe(false);
    expect(review.flags[0].category).toBe("Illegal activity");
  });

  it("keeps a reported idea off the public board", () => {
    const review = reviewPublicIdea({
      title: "Safe tutoring marketplace",
      moderation_status: "hidden",
      moderation_reason: "Reported for review.",
    });

    expect(review.allowed).toBe(false);
    expect(review.flags[0].category).toBe("Reported");
  });

  it("filters reported and blocked ideas from board results", () => {
    const visibleIdeas = filterBoardIdeas(
      [
        { id: "safe", title: "Study planner" },
        { id: "reported", title: "Design club" },
        { id: "blocked", title: "Buy cocaine" },
      ],
      new Set(["reported"]),
    );

    expect(visibleIdeas).toEqual([{ id: "safe", title: "Study planner" }]);
  });
});
