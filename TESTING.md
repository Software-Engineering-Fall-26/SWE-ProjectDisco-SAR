# Automated testing

This project uses **Vitest** with React Testing Library for unit and system
tests, and **Playwright** for browser UI tests.

## Install and run

From the repository root, move into the frontend folder and install the
JavaScript dependencies once:

```powershell
cd packages/react-frontend
npm install
```

The first time Playwright is used on a computer, download its Chromium
browser from that same `packages/react-frontend` folder:

```powershell
npx playwright install chromium
```

Playwright saves that browser download locally, so it must not be committed.
`node_modules` and the npm cache are also local files and are already ignored
by Git.

Return to the repository root before using the project-wide test commands:

```powershell
cd ../..
```

Run the unit and system suite:

```powershell
npm test
```

Run the browser UI suite:

```powershell
npm run test:ui
```

`npm test` is intentionally available from the documented repository root.
To open the visual Playwright runner from `packages/react-frontend`, use:

```powershell
npx playwright test --ui
```

To watch a visible browser perform the tests, use:

```powershell
npx playwright test --headed
```

## Test levels

### Unit tests

- `packages/react-frontend/src/services/contentModeration.test.js` verifies
  moderation decisions and board filtering, including illegal content and a
  reported idea.
- `packages/react-frontend/src/authMessages.test.js` verifies authentication
  error messages and sign-up result states.

These tests call isolated helper/service functions only. They require no live
Supabase project, network access, or test account.

### System tests

`packages/react-frontend/src/components/IdeaForm.system.test.jsx` combines the
real `IdeaForm`, collaborator selector, visibility controls, moderation rules,
and save callback boundary. It checks that prohibited public content cannot be
saved and that a valid private idea is submitted with its selected collaborator
need.

### UI tests

`packages/react-frontend/tests/ui/idea-form.spec.js` uses a real Chromium
browser to complete two visible user flows:

1. Fill in and save a valid private idea, then confirm the save outcome.
2. Make an idea public with prohibited content, then confirm the visible
   warning and disabled publish button.

The browser suite uses `/e2e/idea-form`, a route that exists only while
`VITE_E2E_TEST=true`. It renders the production `IdeaForm` but replaces the
database save with an in-memory confirmation. This keeps UI tests
deterministic and prevents them from creating real ideas or requiring a real
user session.

## TDD example: moderation false positive

### Requirement

A user should be able to publish a harmless public idea containing “Shitake
mushroom.” The moderation system must still block actual profanity and illegal
content.

### Red: initial failing test

The initial test expected this public idea to be allowed:

```js
const result = reviewPublicIdea({
  title: "Shitake mushroom delivery",
  description: "A local service that delivers fresh shitake mushrooms.",
  isPublic: true,
});

expect(result.allowed).toBe(true);
```

It initially failed because `reviewPublicIdea` returned a profanity flag: the
word-stem matcher saw `shit` inside `shitake`.

### Green: production-code change

The production matcher was changed with the smallest targeted exception: when
checking the `shit` stem, it ignores the complete word `shitake`. Actual uses
of the prohibited stem continue to be flagged.

```js
const STEM_EXCLUSIONS = {
  shit: ["shitake"],
};
```

### Refactor

The one-off `if (stem === "shit")` condition was refactored into the
`STEM_EXCLUSIONS` configuration used by the shared `stemPattern` helper. This
keeps exceptions centralized and makes future safe-word exceptions possible
without adding more special-case branches. All tests still pass after the
refactor.

## Test data and limitations

- Unit and system tests use in-memory data and mock callbacks instead of live
  Supabase calls.
- Browser tests do not cover login, Supabase authentication, real-time events,
  or database row-level security. Those need a dedicated Supabase test project
  and seeded accounts before they can be reliable automated tests.
- The UI test harness is intentionally test-only; it is not added to the
  production route list.
