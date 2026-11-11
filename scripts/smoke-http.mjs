import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 37219;
const base = "http://127.0.0.1:" + port;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, PORT: String(port), NODE_ENV: "production" },
});
let logs = "";
server.stdout.on("data", chunk => { logs += String(chunk); });
server.stderr.on("data", chunk => { logs += String(chunk); });

async function ready() {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error("Next server exited before becoming ready: " + logs);
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Next server did not start: " + logs);
}
async function execute(action, code) {
  const response = await fetch(base + "/api/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, code }),
    signal: AbortSignal.timeout(7000),
  });
  assert.equal(response.status, 200, action + " HTTP status");
  return await response.json();
}
try {
  await ready();
  const run = await execute("run", 'print "Hello from Semauri".');
  assert.equal(run.ok, true, "real Semauri run: " + JSON.stringify(run));
  assert.equal(run.stdout, "Hello from Semauri\n");
  const check = await execute("check", "let value be running product of (a list of 2, 3, 4).");
  assert.equal(check.ok, true, "real Semauri check: " + JSON.stringify(check));
  assert.equal(check.stdout.trim(), "OK");
  const formatted = await execute("format", 'PRINT "Hello".');
  assert.equal(formatted.ok, true, "real Semauri formatter: " + JSON.stringify(formatted));
  assert.equal(formatted.formatted.trim(), 'print "Hello".');
  const bad = await execute("check", "print running total of true.");
  assert.equal(bad.ok, false, "type errors must not be hidden");
  assert.ok(bad.diagnostics.some(error => error.code === "S353"), JSON.stringify(bad));
  const invalid = await fetch(base + "/api/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "shell", code: "echo ignored" }),
  });
  assert.equal(invalid.status, 400);
  console.log("HTTP smoke test passed: run, check, format, diagnostics and invalid action.");
} catch (error) {
  console.error("HTTP smoke test failed:", error);
  console.error("Server logs:", logs);
  process.exitCode = 1;
} finally {
  server.kill("SIGTERM");
}
