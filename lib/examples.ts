export type Example = { id: string; name: string; description: string; code: string };

export const examples: Example[] = [
  {
    id: "hello", name: "Hello, Semauri", description: "Your first program",
    code: '# Your first Semauri program\nprint "Hello from Semauri".\nprint "Natural language can be code, too".',
  },
  {
    id: "lists", name: "Lists", description: "Variables and operations",
    code: 'let readings be a list of 3, 5, 2, 6.\nlet totals be running total of readings.\nassert totals is equal to (a list of 3, 8, 10, 16).\nprint "Running sum verified".',
  },
  {
    id: "statistics", name: "Statistics", description: "Minima, maxima, and product",
    code: 'let values be a list of 3, 5, 2, 6.\nlet minima be running minimum of values.\nlet maxima be cumulative maximum of values.\nlet products be running product of values.\nassert minima is equal to (a list of 3, 3, 2, 2).\nassert maxima is equal to (a list of 3, 5, 5, 6).\nassert products is equal to (a list of 3, 15, 30, 180).\nprint "Statistics verified".',
  },
  {
    id: "changes", name: "Changes", description: "Adjacent differences",
    code: 'let values be a list of 3, 5, 2, 6.\nlet changes be adjacent differences of values.\nassert changes is equal to (a list of 2, (minus 3), 4).\nprint "Differences verified".',
  },
];

export const starter = examples[0].code;
