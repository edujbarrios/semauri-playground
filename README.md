# Semauri Playground

An open-source, browser-based editor and execution environment for [Semauri](https://github.com/edujbarrios/semauri), the natural-language-inspired programming language.

![Semauri logo](public/semauri-logo.png)

Write, check, format, and run `.suri` files with **the official Semauri Rust compiler**, not a simulated interpreter. Features include Monaco Editor with custom Semauri syntax highlighting, code completion snippets, four runnable examples, console output, compiler diagnostics, file uploads/downloads, and shareable links.

## Tech stack

- Next.js App Router, React, TypeScript and custom CSS, optimized for Vercel.
- Monaco Editor with a Semauri Monarch grammar and theme.
- Node.js Vercel Functions running the **official Semauri v0.71.0** compiler.
- No database or external compiler server.

## Development

Requirements: Node.js 22+, npm, and a local Semauri compiler for interactive execution.

```sh
npm install
SEMAURI_BINARY_PATH=/absolute/path/to/semauri npm run dev
npm test
npm run typecheck
npm run build
```

Open http://localhost:3000. On Linux x86_64, `npm run build` prepares the official Semauri compiler in `.semauri/bin/semauri` by downloading the release with SHA-256 validation, or compiling from the pinned official release if the executable is incompatible. On other development platforms, configure `SEMAURI_BINARY_PATH` to your installed compiler. The editor loads without a compiler, but execution requires one.

## Deploy to Vercel

1. Import `edujbarrios/semauri-playground` into your Vercel account.
2. Choose Next.js with the repository root as the root directory.
3. Deploy `main`; the `build` script prepares the compiler automatically.
4. Confirm `Run`, `Check`, and `Format` function in the deployed app.

If the platform rejects native executable execution or build-time compiler preparation, deployment must fail visibly rather than simulate the compiler.

## Limits and security

The public endpoint accepts up to 32 KiB of source, runs the official compiler through `execFile` (no shell), times out after four seconds and caps output at 64 KiB. It grants **only `console_write`**; filesystem, network, and shell capabilities are not granted to user programs. Each execution runs in a temporary directory that is deleted afterward.

The in-memory rate limiter is best-effort and not shared across Vercel instances. Enable platform-level protection/rate limiting for production abuse prevention. Do not extend capabilities or allow untrusted executables on the server.

## Project layout

- `app/`: Next.js page, styles and compiler-backed API.
- `components/playground.tsx`: editor, console and file controls.
- `lib/semauri-language.ts`: syntax highlighting, language configuration and completion.
- `lib/protocol.ts`: request validation and compiler diagnostics.
- `scripts/prepare-compiler.mjs`: verified compiler preparation.
- `public/semauri-logo.png`: supplied Semauri logo, optimized for the web.
- `tests/`: automated tests; `.github/workflows/`: CI.

## License

The playground is distributed under the MIT License. The [Semauri compiler](https://github.com/edujbarrios/semauri) is a separate Apache-2.0 project. The Semauri brand and supplied logo remain attributable to their owner.
