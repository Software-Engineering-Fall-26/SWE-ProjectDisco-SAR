# Contributing

## Project Setup

After cloning the repository, install the dependencies in the root, frontend, and backend:

```bash
npm install

cd packages/react-frontend
npm install

cd ../express-backend
npm install
```

## Prettier

This project uses Prettier to maintain consistent formatting across the repository. The formatting rules are defined in the root `.prettierrc` file.

The team uses the following formatting rules:

- Two spaces for indentation
- Spaces instead of tabs
- Semicolons after statements
- Maximum line length of 80 characters
- Double quotation marks
- Trailing commas
- Spaces inside object brackets
- Parentheses around arrow-function parameters

From the repository root, format supported files by running:

```bash
npm run format
```

Team members should also install the Prettier extension for their editor and configure it to format files when saving.

## ESLint

This project uses ESLint 9 to identify problems in JavaScript and React code. The frontend and backend have separate ESLint configurations because they run in different environments.

To check the React frontend:

```bash
cd packages/react-frontend
npm run lint
```

To check the Express backend:

```bash
cd packages/express-backend
npx eslint .
```

ESLint reports code problems but does not automatically reformat the code.

## Git Workflow

Before beginning work, pull the newest changes:

```bash
git pull origin main
```

During regular project development, create a separate branch for your work. Before committing, run Prettier and ESLint and review the changed files with:

```bash
git status
```

Use a clear commit message that describes the change. Do not commit generated or private files, including `node_modules`, `dist`, and `.env` files._

## Additional Downloads

Download react-router-dom to be able to run the separate pages

SUPABASE:
Run npm install supabase@supabase.js

Vercel and Public Domain Info:

## Branches and deployment

Our website is hosted on Vercel. The project is still in development;
not every feature needs to be finished before the website is deployed.

- `main` is our shared integration branch.
- Vercel should use `main` as the production branch.
- Production means the version served at our main website address,
  not that the project is finished.
- Feature branches keep individual changes separate until reviewed
  and merged.
- Pushing a feature branch creates a Vercel preview for online testing.
- Merging into `main` triggers a production deployment. The live website
  updates after the deployment succeeds.
- Manual promotion is not part of our normal workflow.

## Making changes

1. Start from an up-to-date `main` and create a feature or fix branch.
2. Make your changes on that branch.
3. Test locally from `packages/react-frontend` using `npm run dev`.
4. Run `npm run build` before submitting your changes.
5. Commit and push your branch.
6. Test the Vercel preview, including the pages affected by your changes.
7. Open a pull request with `main` as the base branch.
8. Describe what changed, how it was tested, and any unfinished behavior.
9. Have a teammate review the changes before merging.
10. After merging, check that the production deployment succeeds.

## Deployment precautions

- Do not commit `.env` files or secret credentials.
- Never expose a Supabase service-role key in frontend code.
- Match import paths to filenames exactly, including capitalization.
- Clearly label or disable unfinished controls instead of implying
  that they work.
- A successful build does not replace testing the actual website.
