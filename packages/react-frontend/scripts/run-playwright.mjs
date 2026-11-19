import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const playwrightCli = new URL(
  "../node_modules/@playwright/test/cli.js",
  import.meta.url,
);
const child = spawn(process.execPath, [fileURLToPath(playwrightCli), "test", ...process.argv.slice(2)], {
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
