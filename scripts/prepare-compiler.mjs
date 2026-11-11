import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const version = process.env.SEMAURI_VERSION || "0.71.0";
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error("Invalid SEMAURI_VERSION.");
const target = path.resolve(".semauri/bin/semauri");
const upstream = "https://github.com/edujbarrios/semauri";
const release = upstream + "/releases/download/v" + version;
const packageName = "semauri-" + version + "-linux-x86_64.tar.gz";

function command(file, args, options = {}) {
  return execFileSync(file, args, {
    stdio: "inherit", maxBuffer: 1024 * 1024, ...options,
  });
}

async function download(url) {
  const response = await fetch(url, {
    redirect: "follow", signal: AbortSignal.timeout(30_000),
    headers: { "User-Agent": "semauri-playground-build" },
  });
  if (!response.ok) throw new Error("Download failed: " + response.status + " " + url);
  return Buffer.from(await response.arrayBuffer());
}

async function usePublishedBinary() {
  console.log("Trying the official Semauri v" + version + " Linux release...");
  const [archive, sums] = await Promise.all([
    download(release + "/" + packageName),
    download(release + "/SHA256SUMS"),
  ]);
  const line = sums.toString("utf8").split("\n").find(v => v.trim().endsWith("  " + packageName));
  if (!line || !/^[0-9a-f]{64}\s+/.test(line)) {
    throw new Error("Release checksum not found for " + packageName);
  }
  const expected = line.trim().split(/\s+/)[0];
  const actual = createHash("sha256").update(archive).digest("hex");
  if (expected !== actual) throw new Error("RELEASE CHECKSUM MISMATCH (build aborted)");
  const temp = await mkdtemp(path.join(os.tmpdir(), "semauri-release-"));
  try {
    const file = path.join(temp, packageName);
    await writeFile(file, archive);
    command("tar", ["-xzf", file, "-C", temp]);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(temp, "semauri-" + version + "-linux-x86_64", "bin", "semauri"), target);
    await chmod(target, 0o755);
    try {
      command(target, ["version"]);
      return true;
    } catch {
      // Vercel's Amazon Linux libc can be older than the release runner's.
      console.warn("Official binary is not ABI-compatible. Compiling the pinned release locally.");
      return false;
    }
  } finally { await rm(temp, { recursive: true, force: true }); }
}

async function compileSource() {
  const work = await mkdtemp(path.join(os.tmpdir(), "semauri-source-"));
  const source = path.join(work, "semauri");
  try {
    command("git", ["clone", "--depth", "1", "--branch", "v" + version,
      "--single-branch", upstream + ".git", source]);
    if (version === "0.71.0") {
      const current = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: source, encoding: "utf8",
      }).trim();
      if (current !== "71b0b00907f9d271a0b3dad202230957fa634e03") {
        throw new Error("Unexpected Semauri v0.71.0 source commit.");
      }
    }
    let cargo = "cargo";
    try { execFileSync("cargo", ["--version"], { stdio: "ignore" }); }
    catch {
      console.log("Installing official Rust build toolchain...");
      const install = path.join(work, "rustup.sh");
      await writeFile(install, await download("https://sh.rustup.rs"));
      command("sh", [install, "-y", "--profile", "minimal", "--default-toolchain", "stable"]);
      cargo = path.join(os.homedir(), ".cargo", "bin", "cargo");
    }
    console.log("Compiling official Semauri source for the Vercel build environment...");
    command(cargo, ["build", "--release", "--locked"], {
      cwd: source,
      env: { ...process.env, PATH: path.join(os.homedir(), ".cargo", "bin") + ":" + process.env.PATH },
    });
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(source, "target/release/semauri"), target);
    await chmod(target, 0o755);
    command(target, ["version"]);
  } finally { await rm(work, { recursive: true, force: true }); }
}

if (process.env.SEMAURI_BINARY_PATH) {
  console.log("Using explicit local Semauri executable: " + process.env.SEMAURI_BINARY_PATH);
} else if (process.platform !== "linux" || process.arch !== "x64") {
  console.warn("Native compiler preparation is supported on Linux x64 builds. Set SEMAURI_BINARY_PATH for local development.");
} else {
  let ready = false;
  try { ready = await usePublishedBinary(); }
  catch (error) {
    if (String(error).includes("CHECKSUM MISMATCH") || String(error).includes("checksum not found")) throw error;
    console.warn("Official release binary unavailable: " + String(error));
  }
  if (!ready) await compileSource();
  console.log("Official Semauri compiler ready.");
}
