import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const trace = JSON.parse(readFileSync(".next/server/app/api/execute/route.js.nft.json", "utf8"));
assert.ok(
  trace.files.some(file => file.includes(".semauri/bin/semauri")),
  "The official Semauri executable is missing from the Vercel function trace.",
);
const logo = readFileSync("public/semauri-logo.png");
assert.deepEqual(Array.from(logo.subarray(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10], "Logo must be a PNG");
assert.equal(logo.readUInt32BE(16), 192, "Logo width");
assert.equal(logo.readUInt32BE(20), 192, "Logo height");
console.log("Vercel function trace includes the Semauri executable, and the PNG logo is valid.");
