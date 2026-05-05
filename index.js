const { spawn } = require("child_process");

const child = spawn("npm", ["run", "start:backend"], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code);
});

child.on("error", (err) => {
  console.error("Failed to start backend:", err);
  process.exit(1);
});
