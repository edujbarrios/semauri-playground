import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";
import { extractDiagnostics, MAX_SOURCE_BYTES, validateRequest } from "@/lib/protocol";

export const runtime = "nodejs";
export const maxDuration = 10;
export const dynamic = "force-dynamic";

const exec = promisify(execFile);
const counters = new Map<string, { total: number; until: number }>();
const commands = {
  run: (file: string) => ["run", "--allow", "console_write", file],
  check: (file: string) => ["check", file],
  format: (file: string) => ["fmt", file, "--json"],
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

async function readSmallJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length") || 0) > MAX_SOURCE_BYTES + 4096) {
    throw new Error("Request too large.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body is missing.");
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_SOURCE_BYTES + 4096) {
        await reader.cancel();
        throw new Error("Request too large.");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new Error("Request body must be valid JSON."); }
}

function rateLimited(request: NextRequest) {
  const now = Date.now();
  const id = request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (counters.size > 500) {
    for (const [key, entry] of counters) if (entry.until <= now) counters.delete(key);
  }
  const item = counters.get(id);
  if (!item || item.until <= now) {
    counters.set(id, { total: 1, until: now + 60_000 });
    return false;
  }
  if (item.total >= 20) return true;
  item.total++;
  return false;
}

export async function POST(request: NextRequest) {
  if (rateLimited(request)) {
    return json({ error: "Too many requests. Try again in one minute." }, 429);
  }
  let parsed: ReturnType<typeof validateRequest>;
  try {
    parsed = validateRequest(await readSmallJson(request));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Invalid request." }, 400);
  }

  // The official compiler's permission system must be the final authority.
  // This endpoint grants ONLY console_write. No filesystem, network or shell permissions.
  const binary = process.env.SEMAURI_BINARY_PATH ||
    path.join(process.cwd(), ".semauri", "bin", "semauri");
  const work = await mkdtemp(path.join(os.tmpdir(), "semauri-playground-"));
  const source = path.join(work, "main.suri");
  const start = Date.now();
  try {
    await writeFile(source, parsed.code, { encoding: "utf8", mode: 0o600 });
    let stdout = "";
    let stderr = "";
    let exitCode = 0;
    try {
      const output = await exec(binary, commands[parsed.action](source), {
        cwd: work, timeout: 4_000, maxBuffer: 64 * 1024, killSignal: "SIGKILL",
        encoding: "utf8", windowsHide: true,
        env: { PATH: process.env.PATH || "/usr/bin:/bin", HOME: work, LANG: "C.UTF-8" },
      });
      stdout = output.stdout;
      stderr = output.stderr;
    } catch (error) {
      const failure = error as Error & {
        code?: string | number; signal?: string; killed?: boolean;
        stdout?: string; stderr?: string;
      };
      stdout = failure.stdout || "";
      stderr = failure.stderr || "";
      exitCode = typeof failure.code === "number" ? failure.code : 1;
      if (failure.killed || failure.signal === "SIGKILL" || failure.code === "ETIMEDOUT") {
        exitCode = 124;
        stderr = "The program exceeded the 4-second execution limit.";
      } else if (failure.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
        exitCode = 125;
        stderr = "The program produced too much output.";
      } else if (failure.code === "ENOENT" || failure.code === "EACCES") {
        return json({ error: "The official Semauri compiler is not installed on the server." }, 503);
      } else if (!stderr) {
        stderr = "The process exited with an error.";
      }
    }
    let formatted: string | undefined;
    if (parsed.action === "format" && exitCode === 0) {
      try {
        const report = JSON.parse(stdout) as { formatted?: unknown };
        if (typeof report.formatted !== "string") throw new Error("Missing formatted text");
        formatted = report.formatted;
        stdout = "Code formatted successfully.";
      } catch {
        exitCode = 1;
        stderr = "The compiler returned an invalid formatting response.";
      }
    }
    return json({
      ok: exitCode === 0, action: parsed.action,
      stdout, stderr, exitCode,
      elapsedMs: Date.now() - start,
      diagnostics: extractDiagnostics(stderr),
      ...(formatted === undefined ? {} : { formatted }),
    });
  } catch {
    return json({ error: "Unable to prepare Semauri execution." }, 500);
  } finally {
    await rm(work, { recursive: true, force: true }).catch(() => {});
  }
}
