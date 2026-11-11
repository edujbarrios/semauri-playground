# Semauri Playground

![Semauri logo](public/semauri-logo.png)

**Write, explore, and run Semauri in your browser.**

[Semauri Playground](https://github.com/edujbarrios/semauri-playground) is an open-source coding environment for [Semauri](https://github.com/edujbarrios/semauri), a natural-language-inspired programming language. It combines a modern code editor with the official Semauri compiler so you can experiment with `.suri` programs without leaving the page.

## Features

- **Semauri syntax highlighting** in Monaco Editor, with a custom theme, language rules, and code completion snippets.
- **Run, Check, and Format** commands powered by the official Semauri compiler.
- **Interactive console** displaying program output, compilation results, and errors.
- **Inline diagnostics** with source positions when supplied by the compiler.
- **Ready-to-run examples** covering basic programs, lists, running statistics, and adjacent differences.
- **File management** for opening and downloading `.suri` files.
- **Shareable links** for short programs, plus local draft preservation.
- **Responsive interface** designed for desktop and mobile devices.
- **Open source**, with automated checks and an MIT license.

## Try Semauri

A small Semauri program looks like this:

```text
let values be a list of 3, 5, 2, 6.
let totals be running total of values.

assert totals is equal to (a list of 3, 8, 10, 16).
print "Running sum verified".
```

Use the **Examples** menu to load a program. Select **Run** to execute it, **Check** to validate it without running it, or **Format** to apply the language's formatter.

## Getting started locally

You will need **Node.js 22 or newer**, npm, and the [Semauri compiler](https://github.com/edujbarrios/semauri) to execute programs.

```sh
git clone https://github.com/edujbarrios/semauri-playground.git
cd semauri-playground
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local **Run**, **Check**, and **Format** support, set `SEMAURI_BINARY_PATH` to the absolute path of your installed Semauri executable before starting the development server:

```sh
SEMAURI_BINARY_PATH=/absolute/path/to/semauri npm run dev
```

On Linux x86_64, the production build script can prepare the version-pinned official compiler automatically. On other development platforms, use `SEMAURI_BINARY_PATH` to select your local installation.

### Quality checks

```sh
npm test
npm run typecheck
npm run build
```

The automated test suite also exercises the real compiler through the HTTP API and checks that the compiled executable is included in the server build.

## How it works

The interface uses **Next.js**, **React**, **TypeScript**, and **Monaco Editor**. Semauri syntax highlighting is implemented as a dedicated Monaco language definition.

When you run a program, the server invokes the **official Semauri Rust compiler**. The playground does not use a simulated interpreter or reimplement Semauri semantics in JavaScript.

The compiler is the source of truth for parsing, type checking, formatting, execution, and diagnostics.

## Execution limits

To make interactive experimentation safer, the execution endpoint:

- Accepts up to **32 KiB** of source code per request.
- Limits compiler execution to **4 seconds** and process output to **64 KiB**.
- Grants only the Semauri `console_write` capability; other capabilities are not enabled.
- Uses isolated temporary working directories and removes them after each request.
- Performs basic request throttling.

These limits are safeguards, **not a complete security sandbox** or a substitute for infrastructure-level abuse protection.

## Project structure

| Path | Purpose |
| --- | --- |
| `app/` | Application pages, styling, and compiler API |
| `components/playground.tsx` | Editor, console, examples, and file actions |
| `lib/semauri-language.ts` | Syntax highlighting, editor configuration, and completions |
| `lib/protocol.ts` | Request validation and diagnostic parsing |
| `lib/examples.ts` | Example `.suri` programs |
| `scripts/` | Compiler preparation and integration checks |
| `public/semauri-logo.png` | Semauri PNG logo |
| `tests/` | Automated tests |

## Contributing

Contributions are welcome! Open an issue to suggest an improvement or report a bug, or submit a pull request with a focused change.

Before opening a pull request, run the tests and type checker. For editor-language changes, check that syntax highlighting and completion suggestions agree with the official Semauri language.

## License

This playground is licensed under the [MIT License](LICENSE). The [Semauri compiler](https://github.com/edujbarrios/semauri) is a separate project distributed under Apache-2.0. The Semauri name and supplied logo remain attributable to their owner.
