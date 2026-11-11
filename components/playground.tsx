"use client";

import dynamic from "next/dynamic";
import {
  ArrowDownToLine, ArrowUpFromLine, BookOpen, Braces, Check,
  CheckCircle2, ChevronDown, CircleHelp, Clock3, Code2, Copy,
  ExternalLink, FileCode2, Github, Loader2, Maximize2, Menu,
  Play, RotateCcw, Share2, ShieldCheck, Sparkles, Terminal,
  WandSparkles, X, XCircle,
} from "lucide-react";
import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useCallback, useEffect, useRef, useState } from "react";
import { examples, starter } from "@/lib/examples";
import { registerSemauriLanguage } from "@/lib/semauri-language";
import type { ExecutionResult, PlaygroundAction } from "@/lib/protocol";

const CodeEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const MAX_SOURCE_BYTES = 32 * 1024;
type ConsoleTab = "output" | "errors";

function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export default function Playground() {
  const [code, setCode] = useState(starter);
  const [fileName, setFileName] = useState("hello.suri");
  const [selectedExample, setSelectedExample] = useState("hello");
  const [action, setAction] = useState<PlaygroundAction | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState("");
  const [consoleTab, setConsoleTab] = useState<ConsoleTab>("output");
  const [toast, setToast] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"editor" | "console">("editor");
  const [showExamples, setShowExamples] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const filePicker = useRef<HTMLInputElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const runnerRef = useRef<(action: PlaygroundAction) => Promise<void>>(async () => {});
  const requestRef = useRef<AbortController | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search).get("code");
    if (query && query.length < 12_000) {
      setCode(query);
      setFileName("shared.suri");
      setSelectedExample("");
    } else {
      const saved = localStorage.getItem("semauri-playground-code");
      if (saved && new TextEncoder().encode(saved).byteLength <= MAX_SOURCE_BYTES) {
        setCode(saved);
        setSelectedExample("");
        setFileName("draft.suri");
      }
    }
  }, []);

  useEffect(() => {
    if (new TextEncoder().encode(code).byteLength <= MAX_SOURCE_BYTES) {
      localStorage.setItem("semauri-playground-code", code);
    }
  }, [code]);

  useEffect(() => {
    const model = editorRef.current?.getModel();
    const monaco = monacoRef.current;
    if (!model || !monaco) return;
    monaco.editor.setModelMarkers(model, "semauri", (result?.diagnostics || []).map(d => ({
      severity: monaco.MarkerSeverity.Error,
      message: d.code + ": " + d.message,
      startLineNumber: Math.max(1, d.line), startColumn: Math.max(1, d.column),
      endLineNumber: Math.max(1, d.line), endColumn: Math.max(1, d.column) + 3,
    })));
  }, [result, code]);

  const runAction = useCallback(async (kind: PlaygroundAction) => {
    if (action) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setAction(kind);
    setError("");
    setResult(null);
    setConsoleTab("output");
    const start = performance.now();
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: kind, code }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not connect to the compiler.");
      const output = data as ExecutionResult;
      setResult(output);
      if (kind === "format" && output.ok && typeof output.formatted === "string") {
        setCode(output.formatted);
        notify("Code formatted using Semauri.");
      }
      if (!output.ok && output.diagnostics.length) setConsoleTab("errors");
      setMobilePanel("console");
    } catch (failure) {
      if (controller.signal.aborted) return;
      setError(failure instanceof Error ? failure.message : "Unexpected error.");
      setResult({
        ok: false, action: kind, stdout: "", stderr: "",
        exitCode: 1, elapsedMs: Math.round(performance.now() - start), diagnostics: [],
      });
      setMobilePanel("console");
    } finally {
      setAction(null);
      requestRef.current = null;
    }
  }, [action, code, notify]);
  runnerRef.current = runAction;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void runnerRef.current("run");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => () => {
    requestRef.current?.abort();
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const chooseExample = (id: string) => {
    const picked = examples.find(example => example.id === id);
    if (!picked) return;
    setCode(picked.code);
    setFileName(picked.id + ".suri");
    setSelectedExample(picked.id);
    setResult(null);
    setError("");
    setMobilePanel("editor");
    setShowExamples(false);
    notify("Example loaded: " + picked.name);
  };

  const reset = () => {
    setCode(starter);
    setFileName("hello.suri");
    setSelectedExample("hello");
    setResult(null);
    setError("");
    setMobilePanel("editor");
    notify("Editor reset.");
  };

  const openFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".suri")) {
      notify("Only .suri files are supported.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      notify("The file exceeds the 32 KiB limit.");
      return;
    }
    const contents = await file.text();
    setCode(contents);
    setFileName(file.name.replace(/[^a-zA-Z0-9._-]/g, "_"));
    setResult(null);
    setSelectedExample("");
    setMobilePanel("editor");
    notify("File opened.");
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".suri") ? fileName : "main.suri";
    a.click();
    URL.revokeObjectURL(url);
    notify("Downloaded .suri file.");
  };

  const share = async () => {
    if (code.length > 2500) {
      notify("To share by URL, keep programs under 2,500 characters.");
      return;
    }
    const link = new URL(location.href);
    link.searchParams.set("code", code);
    try { await copyToClipboard(link.toString()); notify("Share link copied to clipboard."); }
    catch { notify("Could not copy the share link."); }
  };

  const clearResult = () => {
    setResult(null);
    setError("");
    setConsoleTab("output");
  };

  const success = !!result?.ok;
  const loadingLabel = action === "run" ? "Running" : action === "check" ? "Checking" : "Formatting";
  const outputText = result?.stdout || (result?.ok ? "The operation completed successfully with no output." : "");
  const errorText = error || result?.stderr || (!result ? "No errors yet. Run a check to see diagnostics." : "No compiler errors.");

  return (
    <div className="app-shell">
      <header className="main-header">
        <a className="brand" href="/" aria-label="Semauri Playground, home">
          <img src="/semauri-logo.png" alt="Semauri symbol" width="42" height="42" />
          <span className="brand-type">semauri<span className="brand-dot">.</span></span>
          <span className="brand-divider" />
          <span className="brand-subtitle">playground</span>
        </a>
        <nav className="header-nav" aria-label="Main navigation">
          <a href="https://github.com/edujbarrios/semauri" target="_blank" rel="noopener noreferrer"><BookOpen size={16} /> Docs</a>
          <a href="https://github.com/edujbarrios/semauri-playground" target="_blank" rel="noopener noreferrer"><Github size={16} /> Open source <ExternalLink size={13} /></a>
          <span className="version-chip"><span className="chip-dot" /> Semauri v0.71.0</span>
        </nav>
        <button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {menuOpen && <nav className="mobile-menu">
        <a href="https://github.com/edujbarrios/semauri" target="_blank" rel="noopener noreferrer">Docs</a>
        <a href="https://github.com/edujbarrios/semauri-playground" target="_blank" rel="noopener noreferrer">GitHub / Source code</a>
      </nav>}

      <main className="page-main">
        <section className="hero">
          <div className="hero-content">
            <div className="hero-eyebrow"><Sparkles size={14} /> YOUR SPACE TO CREATE</div>
            <h1>Ideas become <span>real code.</span></h1>
            <p>Write, experiment, and run Semauri right in your browser. No installation needed. Just code and creativity.</p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-glow" />
            <img src="/semauri-logo.png" alt="" />
          </div>
          <div className="hero-status"><span className="status-indicator" /> Interactive environment <span className="hero-status-divider" /> Open source</div>
        </section>

        <section className={"workspace" + (fullscreen ? " workspace-fullscreen" : "")} aria-label="Editor de Semauri">
          <div className="workspace-toolbar">
            <div className="workspace-heading"><Code2 size={18} /> <strong>Workspace</strong><span className="workspace-note">Your coding space</span></div>
            <div className="workspace-actions">
              <div className="example-menu-wrap">
                <button className="tool-button example-trigger" type="button" onClick={() => setShowExamples(!showExamples)} aria-expanded={showExamples}>
                  <Braces size={16} /> Examples <ChevronDown size={14} />
                </button>
                {showExamples && <div className="examples-menu" role="menu">
                  <div className="examples-menu-title">LOAD AN EXAMPLE</div>
                  {examples.map(ex => (
                    <button type="button" role="menuitem" key={ex.id} onClick={() => chooseExample(ex.id)}
                      className={"example-option" + (selectedExample === ex.id ? " selected" : "")}>
                      <FileCode2 size={16} />
                      <span><b>{ex.name}</b><small>{ex.description}</small></span>
                      {selectedExample === ex.id && <Check size={16} />}
                    </button>
                  ))}
                </div>}
              </div>
              <button className="tool-button" title="Open .suri file" type="button" onClick={() => filePicker.current?.click()}><ArrowUpFromLine size={16} /><span className="desktop-label">Open</span></button>
              <button className="tool-button" title="Download program" type="button" onClick={download}><ArrowDownToLine size={16} /><span className="desktop-label">Download</span></button>
              <button className="tool-button" title="Share program" type="button" onClick={() => void share()}><Share2 size={16} /><span className="desktop-label">Share</span></button>
              <button className="tool-button full-button" title={fullscreen ? "Exit fullscreen" : "Expand editor"} type="button" onClick={() => setFullscreen(!fullscreen)}><Maximize2 size={16} /></button>
              <input ref={filePicker} className="visually-hidden" type="file" accept=".suri,text/plain"
                onChange={event => { void openFile(event.target.files?.[0]); event.target.value = ""; }} />
            </div>
          </div>

          <div className="mobile-switch" role="tablist" aria-label="Visible panel">
            <button type="button" role="tab" aria-selected={mobilePanel === "editor"} className={mobilePanel === "editor" ? "active" : ""} onClick={() => setMobilePanel("editor")}><Code2 size={15} /> Editor</button>
            <button type="button" role="tab" aria-selected={mobilePanel === "console"} className={mobilePanel === "console" ? "active" : ""} onClick={() => setMobilePanel("console")}><Terminal size={15} /> Console</button>
          </div>

          <div className="panels">
            <div className={"editor-pane" + (mobilePanel !== "editor" ? " mobile-hidden" : "")}>
              <div className="pane-header">
                <div className="file-tab"><FileCode2 size={15} /><span>{fileName}</span><span className="file-tab-dot" /></div>
                <span className="pane-header-meta">Semauri <b>.suri</b></span>
              </div>
              <div className="editor-surface" aria-label="Semauri code">
                <CodeEditor
                  height="100%"
                  defaultLanguage="semauri"
                  language="semauri"
                  theme="semauri-night"
                  value={code}
                  onChange={value => { setCode(value || ""); setSelectedExample(""); setResult(null); setError(""); }}
                  beforeMount={registerSemauriLanguage}
                  onMount={(instance, monaco) => {
                    editorRef.current = instance;
                    monacoRef.current = monaco;
                  }}
                  loading={<div className="editor-loading"><Loader2 size={18} className="spinner" /> Cargando editor...</div>}
                  options={{
                    fontSize: 14, lineHeight: 25, fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                    minimap: { enabled: false }, lineNumbers: "on", glyphMargin: true,
                    scrollBeyondLastLine: false, automaticLayout: true, wordWrap: "on",
                    tabSize: 2, fontLigatures: true, renderLineHighlight: "all",
                    padding: { top: 18, bottom: 18 }, quickSuggestions: true,
                    smoothScrolling: true, bracketPairColorization: { enabled: true },
                    overviewRulerBorder: false, scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                  }}
                />
              </div>
              <div className="editor-footer">
                <span><span className="file-ready" /> Semauri</span>
                <span>UTF-8 <span className="footer-dot">·</span> {code.split("\n").length} lines</span>
              </div>
            </div>

            <div className={"console-pane" + (mobilePanel !== "console" ? " mobile-hidden" : "")}>
              <div className="pane-header console-header">
                <div className="console-title"><Terminal size={16} /> <strong>Console</strong></div>
                <button type="button" className="clear-button" onClick={clearResult} title="Clear console"><RotateCcw size={14} /> Clear</button>
              </div>
              <div className="console-tabs">
                <button type="button" className={consoleTab === "output" ? "selected" : ""} onClick={() => setConsoleTab("output")}>Output</button>
                <button type="button" className={consoleTab === "errors" ? "selected" : ""} onClick={() => setConsoleTab("errors")}>
                  Diagnostics {(result?.diagnostics.length || 0) > 0 && <span className="error-count">{result?.diagnostics.length}</span>}
                </button>
              </div>
              <div className="console-surface">
                {action ? <div className="console-running"><Loader2 className="spinner" size={21} /><span>{loadingLabel}...</span><small>Official Semauri compiler</small></div>
                : result && consoleTab === "output" ? (
                  <div className="console-output">
                    <div className={"output-status" + (success ? " success" : " failure")}>
                      {success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      {success ? "Process completed" : "Process finished with errors"}
                      <span>{result.elapsedMs} ms</span>
                    </div>
                    <pre>{outputText || result.stderr || error}</pre>
                    <p className="process-code">Process exited with code {result.exitCode}.</p>
                  </div>
                ) : result && consoleTab === "errors" ? (
                  <div className="diagnostics-list">
                    {result.diagnostics.length ? result.diagnostics.map((d, i) => (
                      <button className="diagnostic-card" type="button" key={d.code + i} onClick={() => {
                        setMobilePanel("editor"); editorRef.current?.setPosition({ lineNumber: d.line, column: d.column });
                        editorRef.current?.revealLineInCenter(d.line);
                      }}>
                        <XCircle size={16} /><span><b>{d.code} · Line {d.line}:{d.column}</b><small>{d.message}</small></span>
                      </button>
                    )) : <pre className="diagnostics-plain">{errorText}</pre>}
                  </div>
                ) : <div className="console-empty">
                  <div className="console-empty-icon">{consoleTab === "errors" ? <ShieldCheck size={28} /> : <Terminal size={28} />}</div>
                  <h3>{consoleTab === "errors" ? "No diagnostics yet" : "Ready when you are"}</h3>
                  <p>{consoleTab === "errors" ? "Click Check to analyze your code." : "Run your program to see its output here."}</p>
                  {consoleTab === "output" && <div className="console-shortcut"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> to run</div>}
                </div>}
              </div>
              <div className="console-footer">
                <span><span className={"indicator" + (result && !result.ok ? " indicator-error" : "")} /> {action ? "Processing..." : result ? (success ? "No errors" : "With errors") : "Waiting"}</span>
                <span>{result ? result.elapsedMs + " ms" : "Program output"}</span>
              </div>
            </div>
          </div>

          <div className="command-bar">
            <div className="command-hint"><ShieldCheck size={17} /> Restricted execution permissions <span>·</span> Console output only</div>
            <div className="command-buttons">
              <button type="button" disabled={!!action} className="command secondary" onClick={() => void runAction("format")}><WandSparkles size={16} /> Format</button>
              <button type="button" disabled={!!action} className="command secondary" onClick={() => void runAction("check")}><CheckCircle2 size={16} /> Check</button>
              <button type="button" disabled={!!action} className="command primary" onClick={() => void runAction("run")}>
                {action === "run" ? <Loader2 size={16} className="spinner" /> : <Play size={16} fill="currentColor" />}
                {action === "run" ? "Running" : "Run"} <span className="shortcut-hint">⌘ ↵</span>
              </button>
            </div>
          </div>
        </section>

        <div className="below-workspace">
          <div className="hint-card"><div className="hint-icon"><Sparkles size={20} /></div><div><h3>Learn by experimenting</h3><p>Explore examples, edit the code, and discover how Semauri works. Every run uses the real compiler.</p></div><button type="button" onClick={() => { setShowExamples(true); window.scrollTo({ top: 320, behavior: "smooth" }); }}>Explore examples <ChevronDown size={15} /></button></div>
          <a className="docs-card" href="https://github.com/edujbarrios/semauri/blob/main/docs/language-guide.md" target="_blank" rel="noopener noreferrer"><CircleHelp size={21} /><span><strong>New to Semauri?</strong><small>Read the language guide</small></span><ExternalLink size={15} /></a>
        </div>
      </main>

      <footer className="site-footer"><span>© 2026 Semauri · Built for learning, exploring, and creating.</span><span>Open source · <a href="https://github.com/edujbarrios/semauri-playground" target="_blank" rel="noopener noreferrer">GitHub <ExternalLink size={12} /></a></span></footer>
      {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
    </div>
  );
}
