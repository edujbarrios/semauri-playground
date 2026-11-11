import type { Monaco } from "@monaco-editor/react";

const completions = [
  { label: "let", detail: "Declare a variable", insert: "let ${1:name} be ${2:value}." },
  { label: "print", detail: "Print to console", insert: "print ${1:value}." },
  { label: "assert", detail: "Assert a condition", insert: "assert ${1:value} is equal to ${2:expected}." },
  { label: "list", detail: "Create a list", insert: "a list of ${1:1}, ${2:2}, ${3:3}" },
  { label: "running total", detail: "Running total", insert: "running total of ${1:values}" },
  { label: "running average", detail: "Running average", insert: "running average of ${1:values}" },
  { label: "running minimum", detail: "Running minimum", insert: "running minimum of ${1:values}" },
  { label: "running maximum", detail: "Running maximum", insert: "running maximum of ${1:values}" },
  { label: "running product", detail: "Running product", insert: "running product of ${1:values}" },
  { label: "adjacent differences", detail: "Adjacent differences", insert: "adjacent differences of ${1:values}" },
  { label: "mean squared error", detail: "Mean squared error", insert: "mean squared error of ${1:errors}" },
  { label: "root mean squared error", detail: "Root mean squared error", insert: "root mean squared error of ${1:errors}" },
  { label: "mean absolute error", detail: "Mean absolute error", insert: "mean absolute error of ${1:errors}" },
];

export function registerSemauriLanguage(monaco: Monaco) {
  if (!monaco.languages.getLanguages().some(lang => lang.id === "semauri")) {
    monaco.languages.register({ id: "semauri", extensions: [".suri"], aliases: ["Semauri"] });
    monaco.languages.setLanguageConfiguration("semauri", {
      comments: { lineComment: "#" },
      brackets: [["(", ")"], ["[", "]"], ["{", "}"]],
      autoClosingPairs: [
        { open: "(", close: ")" }, { open: "[", close: "]" },
        { open: "{", close: "}" }, { open: '"', close: '"' },
      ],
      surroundingPairs: [
        { open: "(", close: ")" }, { open: '"', close: '"' },
      ],
    });
    monaco.languages.setMonarchTokensProvider("semauri", {
      ignoreCase: true,
      defaultToken: "",
      keywords: [
        "let", "be", "print", "assert", "if", "then", "otherwise", "unless",
        "for", "each", "in", "from", "to", "of", "with", "as", "and",
        "or", "not", "is", "equal", "than", "true", "false", "nil",
        "when", "where", "do", "return", "repeat", "times", "while",
        "a", "an", "the", "list", "number", "text", "string", "boolean",
      ],
      builtins: [
        "sum", "total", "average", "minimum", "maximum", "product",
        "running", "cumulative", "adjacent", "successive", "differences",
        "mean", "squared", "root", "square", "mse", "rmse", "mae", "mbe",
        "variance", "median", "absolute", "magnitude", "magnitudes",
        "length", "first", "last", "sorted", "distinct", "count",
        "plus", "minus", "divided", "multiplied", "sqrt", "rms",
        "zip", "map", "filter", "reduce", "every", "at", "drop",
      ],
      tokenizer: {
        root: [
          [/#.*$/, "comment"],
          [/r#{0,4}"/, "string", "@string"],
          [/"""/, "string", "@triple"],
          [/"([^"\\]|\\.)*"/, "string"],
          [/'([^'\\]|\\.)*'/, "string"],
          [/\b(?:0x[0-9a-f_]+|0b[01_]+|0o[0-7_]+|0z[0-9a-z_]+)\b/i, "number.hex"],
          [/\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, "number"],
          [/[a-zA-Z_][\w-]*/, {
            cases: {
              "@keywords": "keyword",
              "@builtins": "type",
              "@default": "identifier",
            },
          }],
          [/[(){}\[\],.]/, "delimiter"],
          [/[+*/<>=!\-]+/, "operator"],
        ],
        string: [
          [/\\./, "string.escape"],
          [/"/, "string", "@pop"],
          [/[^"\\]+/, "string"],
        ],
        triple: [
          [/"""/, "string", "@pop"],
          [/[^"]+/, "string"],
          [/"/, "string"],
        ],
      },
    });
    monaco.languages.registerCompletionItemProvider("semauri", {
      triggerCharacters: [" "],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
          startColumn: word.startColumn, endColumn: word.endColumn,
        };
        return {
          suggestions: completions.map(item => ({
            label: item.label, detail: item.detail,
            insertText: item.insert,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            kind: monaco.languages.CompletionItemKind.Snippet,
            range,
          })),
        };
      },
    });
  }
  monaco.editor.defineTheme("semauri-night", {
    base: "vs-dark", inherit: true,
    rules: [
      { token: "comment", foreground: "70817F", fontStyle: "italic" },
      { token: "keyword", foreground: "72E9D8", fontStyle: "bold" },
      { token: "type", foreground: "C9B5FF" },
      { token: "string", foreground: "B7DF98" },
      { token: "string.escape", foreground: "FBC98A" },
      { token: "number", foreground: "F6C887" },
      { token: "number.hex", foreground: "F6C887" },
      { token: "identifier", foreground: "E5EAE9" },
      { token: "operator", foreground: "E4A9DB" },
      { token: "delimiter", foreground: "A8B8B8" },
    ],
    colors: {
      "editor.background": "#0C1115",
      "editor.foreground": "#E5EAE9",
      "editorLineNumber.foreground": "#526066",
      "editorLineNumber.activeForeground": "#B5F5EC",
      "editorCursor.foreground": "#43EAD8",
      "editor.selectionBackground": "#154F50",
      "editor.inactiveSelectionBackground": "#15343B",
      "editor.lineHighlightBackground": "#131E22",
      "editorIndentGuide.background1": "#1E2A2F",
      "editorWidget.background": "#152024",
      "editorSuggestWidget.background": "#162226",
      "editorSuggestWidget.selectedBackground": "#245054",
      "editorHoverWidget.background": "#162226",
    },
  });
}
