export type Example = { id: string; name: string; description: string; code: string };

export const examples: Example[] = [
  {
    id: "hello", name: "Hola, Semauri", description: "Tu primer programa",
    code: '# Tu primer programa en Semauri\nprint "Hello from Semauri".\nprint "El lenguaje natural también es código".',
  },
  {
    id: "lists", name: "Listas", description: "Variables y operaciones",
    code: 'let readings be a list of 3, 5, 2, 6.\nlet totals be running total of readings.\nassert totals is equal to (a list of 3, 8, 10, 16).\nprint "Suma acumulada correcta".',
  },
  {
    id: "statistics", name: "Estadísticas", description: "Mínimos, máximos y producto",
    code: 'let values be a list of 3, 5, 2, 6.\nlet minima be running minimum of values.\nlet maxima be cumulative maximum of values.\nlet products be running product of values.\nassert minima is equal to (a list of 3, 3, 2, 2).\nassert maxima is equal to (a list of 3, 5, 5, 6).\nassert products is equal to (a list of 3, 15, 30, 180).\nprint "Estadísticas verificadas".',
  },
  {
    id: "changes", name: "Cambios", description: "Diferencias consecutivas",
    code: 'let values be a list of 3, 5, 2, 6.\nlet changes be adjacent differences of values.\nassert changes is equal to (a list of 2, (minus 3), 4).\nprint "Diferencias correctas".',
  },
];

export const starter = examples[0].code;
