import { describe, expect, it } from "vitest";

import { describeSignupResult, formatAuthError } from "./authMessages";

describe("authentication messages", () => {
  it("gives signup users a helpful rate-limit message", () => {
    expect(
      formatAuthError(
        { status: 429, message: "Too many requests" },
        "signup",
      ),
    ).toContain("Too many signup attempts");
  });

  it("explains invalid login credentials without exposing account details", () => {
    expect(
      formatAuthError(
        { code: "invalid_credentials", message: "Invalid login credentials" },
        "login",
      ),
    ).toContain("Wrong email or password");
  });

  it("identifies the Supabase response for an existing account", () => {
    expect(
      describeSignupResult({ user: { identities: [] }, session: null }),
    ).toMatchObject({ alreadyExists: true });
  });

  it("tells a new user when email confirmation is required", () => {
    expect(
      describeSignupResult({ user: { identities: [{}] }, session: null }),
    ).toMatchObject({ needsConfirmation: true });
  });
});
