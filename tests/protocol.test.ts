import { describe, expect, it } from "vitest";
import { extractDiagnostics, MAX_SOURCE_BYTES, validateRequest } from "../lib/protocol";

describe("request validation", () => {
  it("accepts supported actions and code", () => {
    expect(validateRequest({ action: "run", code: 'print "Hola".' })).toEqual({
      action: "run", code: 'print "Hola".',
    });
    expect(validateRequest({ action: "check", code: "let x be 1." }).action).toBe("check");
    expect(validateRequest({ action: "format", code: "LET X BE 1." }).action).toBe("format");
  });
  it("rejects unsupported and malformed payloads", () => {
    for (const input of [null, [], {}, { action: "delete", code: "x" }, { action: "run", code: 2 }]) {
      expect(() => validateRequest(input)).toThrow();
    }
  });
  it("rejects empty and oversized programs by UTF-8 bytes", () => {
    expect(() => validateRequest({ action: "run", code: "  " })).toThrow();
    expect(() => validateRequest({ action: "run", code: "ñ".repeat(MAX_SOURCE_BYTES) })).toThrow();
    expect(validateRequest({ action: "run", code: "ñ" }).code).toBe("ñ");
  });
});

describe("located compiler errors", () => {
  it("extracts Semauri diagnostic codes and locations", () => {
    expect(extractDiagnostics("/tmp/file.suri: S353 at 2:9: list<number> needed\n")).toEqual([{
      code: "S353", line: 2, column: 9, message: "list<number> needed",
    }]);
  });
  it("deduplicates the same diagnostic", () => {
    expect(extractDiagnostics("S500 at 1:2: fail\nS500 at 1:2: fail")).toHaveLength(1);
  });
  it("ignores lines without compiler locations", () => {
    expect(extractDiagnostics("No diagnostics\nTimed out")).toEqual([]);
  });
});
