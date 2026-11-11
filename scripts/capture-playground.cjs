/**
 * Capture the real production Playground with Chromium.
 *
 * Run from the repository root after installing Playwright:
 *   node scripts/capture-playground.cjs
 *
 * This script intentionally fails if the live editor or official compiler
 * is unavailable. We never replace the README image with a mock screenshot.
 */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 1024 },
      deviceScaleFactor: 2,
      colorScheme: "dark",
      reducedMotion: "reduce",
    });
    const url = "https://semauri-playground.vercel.app/";
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 75_000,
    });
    if (!response || !response.ok()) {
      throw new Error("Live Playground did not respond successfully: " + (response?.status() || "no response"));
    }
    await page.locator(".workspace").waitFor({ state: "visible", timeout: 40_000 });
    await page.locator(".monaco-editor .view-lines").waitFor({ state: "visible", timeout: 40_000 });
    await page.evaluate(() => document.fonts.ready);

    // Execute a real .suri example and verify the console before capturing it.
    await page.locator(".command.primary").click();
    await page.locator(".console-output pre").waitFor({ state: "visible", timeout: 40_000 });
    const output = await page.locator(".console-output pre").innerText();
    if (!output.includes("Hello from Semauri") || !output.includes("Natural language can be code, too")) {
      throw new Error("Expected real Semauri output was missing: " + output);
    }
    if (!(await page.locator(".output-status.success").isVisible())) {
      throw new Error("Run did not complete successfully.");
    }

    // The element screenshot preserves the editor and console without
    // including extra surrounding page chrome, at 2x physical resolution.
    const imagePath = path.resolve("public/playground-screenshot.png");
    await page.locator(".workspace").screenshot({
      path: imagePath,
      animations: "disabled",
      timeout: 30_000,
    });
    const signature = fs.readFileSync(imagePath).subarray(0, 8);
    if (!signature.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      throw new Error("Capture did not produce a valid PNG.");
    }
    const size = fs.statSync(imagePath).size;
    if (size < 25_000) {
      throw new Error("Screenshot is suspiciously small (" + size + " bytes).");
    }
    console.log("Captured real Semauri Playground:", imagePath, "size:", size, "bytes");

    const readmePath = path.resolve("README.md");
    const readme = fs.readFileSync(readmePath, "utf8");
    const oldRef = "public/playground-screenshot.webp";
    if (!readme.includes(oldRef)) throw new Error("Expected old README image reference was not found.");
    fs.writeFileSync(readmePath, readme.replace(oldRef, "public/playground-screenshot.png"));
    console.log("README now references the high-resolution PNG.");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
