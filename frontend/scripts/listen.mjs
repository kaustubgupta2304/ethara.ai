import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT || "3000";

const child = spawn("npx", ["serve", "-s", "dist", "-l", `tcp://0.0.0.0:${port}`], {
  stdio: "inherit",
  cwd: root,
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
