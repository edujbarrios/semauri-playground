# Semauri Playground

<div align="center">

<img src="public/semauri-logo.png" alt="Semauri logo" width="120" />

### Write, run, and explore Semauri in your browser.

**[Open Semauri Playground](https://semauri-playground.vercel.app)** · [Semauri language](https://github.com/edujbarrios/semauri) · [Language guide](https://github.com/edujbarrios/semauri/blob/main/docs/language-guide.md)

</div>

Semauri Playground is a free, open-source interactive environment for [Semauri](https://github.com/edujbarrios/semauri), the natural-language-inspired programming language. Write `.suri` code in a full-featured editor, run it with the **official Semauri compiler**, and see results instantly in the integrated console.

## Features

- **Syntax highlighting** for Semauri, powered by Monaco Editor and a dedicated language grammar.
- **Smart editing** with completion snippets, line numbers, bracket pairing, and a dark theme.
- **Real execution** with the official Semauri compiler—no simulated language interpreter.
- **Run, Check, and Format** actions for exploring and validating `.suri` programs.
- **Interactive console** showing output, errors, execution status, and source diagnostics.
- **Ready-to-run examples** covering first programs, lists, running statistics, and adjacent differences.
- **Open and download `.suri` files**, save a draft in your browser, and share short programs via links.
- **Responsive interface** for desktop and mobile devices.

## Try it online

Visit **[semauri-playground.vercel.app](https://semauri-playground.vercel.app)** and select an example or write your own code.

```text
let readings be a list of 3, 5, 2, 6.
let totals be running total of readings.

assert totals is equal to (a list of 3, 8, 10, 16).
print "Running sum verified".
```

Select **Run** to execute the program, **Check** to validate it, or **Format** to apply Semauri's official formatter. Results appear in the console beside the editor.

## How it works

The application uses **Next.js, React, TypeScript, and Monaco Editor**, with Semauri-specific syntax highlighting and completion rules. When you execute a program, a server endpoint invokes the **official Rust compiler**. The compiler remains the source of truth for parsing, typing, formatting, and runtime behavior.

The public execution endpoint imposes limits on program size, execution time, and output. It grants only the Semauri `console_write` capability to user programs. These measures reduce risk but are not a complete security sandbox.

## Project structure

| Path | Purpose |
| --- | --- |
| `app/` | Pages, styles, and the compiler-backed API |
| `components/playground.tsx` | Editor, console, and playground controls |
| `lib/semauri-language.ts` | Syntax highlighting, language configuration, and completion |
| `lib/examples.ts` | Sample Semauri programs |
| `lib/protocol.ts` | Request validation and compiler diagnostics |
| `public/` | The Semauri logo and other assets |
| `scripts/` | Compiler preparation and integration checks |
| `tests/` | Automated regression tests |

## Contributing

Contributions, bug reports, and suggestions are welcome. Check the existing issues or open a new one before starting a larger change. Please keep editor features consistent with the [official Semauri language](https://github.com/edujbarrios/semauri), and include tests when changing behavior.

## License

Semauri Playground is open source under the [MIT License](LICENSE). The [Semauri compiler](https://github.com/edujbarrios/semauri) is a separate Apache-2.0 project. The Semauri name and logo remain attributable to their respective owner.
