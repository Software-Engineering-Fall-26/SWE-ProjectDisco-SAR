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
