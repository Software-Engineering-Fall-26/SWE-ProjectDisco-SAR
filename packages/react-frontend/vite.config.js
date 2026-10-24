import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

import { groqAnalyzePlugin } from "./server/groqPlugin.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");

  return {
    plugins: [react(), groqAnalyzePlugin(env)],
    envDir: repoRoot,
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  };
});
