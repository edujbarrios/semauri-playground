export type PlaygroundAction = "run" | "check" | "format";

export type Diagnostic = {
  code: string;
  line: number;
  column: number;
  message: string;
};

export type ExecutionResult = {
  ok: boolean;
  action: PlaygroundAction;
  stdout: string;
  stderr: string;
  exitCode: number;
  elapsedMs: number;
  diagnostics: Diagnostic[];
  formatted?: string;
};

export const MAX_SOURCE_BYTES = 32 * 1024;

export function validateRequest(value: unknown): { action: PlaygroundAction; code: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("La petición debe ser un objeto JSON.");
  }
  const payload = value as Record<string, unknown>;
  if (payload.action !== "run" && payload.action !== "check" && payload.action !== "format") {
    throw new Error("Operación desconocida. Usa run, check o format.");
  }
  if (typeof payload.code !== "string") {
    throw new Error("Se requiere código Semauri en formato de texto.");
  }
  if (new TextEncoder().encode(payload.code).byteLength > MAX_SOURCE_BYTES) {
    throw new Error("El programa supera el límite de 32 KiB.");
  }
  if (!payload.code.trim()) {
    throw new Error("Escribe algún código Semauri primero.");
  }
  return { action: payload.action, code: payload.code };
}

export function extractDiagnostics(stderr: string): Diagnostic[] {
  const seen = new Set<string>();
  const diagnostics: Diagnostic[] = [];
  const pattern = /\b(S\d{3})\s+at\s+(\d+):(\d+):\s*([^\r\n]+)/g;
  for (const match of stderr.matchAll(pattern)) {
    const [_, code, line, column, message] = match;
    const key = code + ":" + line + ":" + column;
    if (seen.has(key)) continue;
    seen.add(key);
    diagnostics.push({
      code,
      line: Number(line),
      column: Number(column),
      message: message.trim(),
    });
  }
  return diagnostics;
}
