// TimSort Game Engine
// Manages the game state and validates player actions

export type GamePhase = 'intro' | 'identify-runs' | 'insertion-sort' | 'merge' | 'victory';

// ============================================================
// Levels — based on TimSort's complexity scenarios
// ============================================================
export type GameLevel = 'best' | 'average' | 'worst';

export interface LevelConfig {
  key: GameLevel;
  name: string;
  description: string;
  emoji: string;
  size: number;         // array length
  scoreMultiplier: number;
  color: string;        // UdeA color
}

export const LEVELS: LevelConfig[] = [
  {
    key: 'best',
    name: 'Mejor caso',
    description: 'Array casi ordenado — O(n). Pocas correcciones necesarias.',
    emoji: '🌱',
    size: 8,
    scoreMultiplier: 1,
    color: '#43b649',
  },
  {
    key: 'average',
    name: 'Caso promedio',
    description: 'Mezcla de runs cortos y desorden — O(n log n).',
    emoji: '⚡',
    size: 10,
    scoreMultiplier: 1.5,
    color: '#f9a12c',
  },
  {
    key: 'worst',
    name: 'Peor caso',
    description: 'Array completamente desordenado — O(n log n) maximo.',
    emoji: '🔥',
    size: 12,
    scoreMultiplier: 2,
    color: '#ef434d',
  },
];

export interface NumberCard {
  id: string;
  value: number;
  originalIndex: number;
}

export interface Run {
  id: string;
  cards: NumberCard[];
  sorted: boolean;
  color: string;
}

export interface GameState {
  phase: GamePhase;
  originalArray: number[];
  cards: NumberCard[];
  runs: Run[];
  mergedResult: NumberCard[];
  mergePairIndex: number; // which pair of runs we're merging
  score: number;
  mistakes: number;
  message: string;
  messageType: 'info' | 'success' | 'error' | 'warning';
  completed: boolean;
}

const RUN_COLORS = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function generateArray(size: number = 8): number[] {
  const arr: number[] = [];
  const used = new Set<number>();
  while (arr.length < size) {
    const n = Math.floor(Math.random() * 50) + 1;
    if (!used.has(n)) {
      used.add(n);
      arr.push(n);
    }
  }
  return arr;
}

/**
 * Best case: Nearly sorted array.
 * Long natural ascending runs with 1-2 small inversions.
 * TimSort handles this in O(n).
 */
function generateBestCase(size: number): number[] {
  // Start with a sorted array, then swap 1-2 adjacent pairs
  const arr = generateArray(size).sort((a, b) => a - b);
  // Swap 1 pair near the middle to create 2 natural runs
  const mid = Math.floor(size / 2);
  [arr[mid], arr[mid - 1]] = [arr[mid - 1], arr[mid]];
  return arr;
}

/**
 * Average case: Mix of short ascending runs and random segments.
 * Some natural order, some chaos.
 */
function generateAverageCase(size: number): number[] {
  const pool = generateArray(size);
  const result: number[] = [];
  let i = 0;

  while (i < pool.length) {
    // Alternating: sorted chunk (2-3) then random chunk (1-2)
    const runLen = Math.min(2 + Math.floor(Math.random() * 2), pool.length - i);
    const chunk = pool.slice(i, i + runLen);

    if (Math.random() > 0.4) {
      // Sorted run
      chunk.sort((a, b) => a - b);
    }
    // else leave random

    result.push(...chunk);
    i += runLen;
  }
  return result;
}

/**
 * Worst case: Fully random or zigzag — no natural ascending runs > 1.
 * Forces maximum splits and work.
 */
function generateWorstCase(size: number): number[] {
  const sorted = generateArray(size).sort((a, b) => a - b);
  // Zigzag: alternate picking from start and end
  const result: number[] = [];
  let lo = 0, hi = sorted.length - 1;
  let fromHi = true;
  while (lo <= hi) {
    if (fromHi) {
      result.push(sorted[hi--]);
    } else {
      result.push(sorted[lo++]);
    }
    fromHi = !fromHi;
  }
  return result;
}

/** Generate array based on level */
export function generateArrayForLevel(level: GameLevel): number[] {
  const config = LEVELS.find(l => l.key === level)!;
  switch (level) {
    case 'best': return generateBestCase(config.size);
    case 'average': return generateAverageCase(config.size);
    case 'worst': return generateWorstCase(config.size);
  }
}

export function createCards(arr: number[]): NumberCard[] {
  return arr.map((value, index) => ({
    id: `card-${index}`,
    value,
    originalIndex: index,
  }));
}

// Find natural runs in the array (ascending sequences)
export function findNaturalRuns(cards: NumberCard[]): number[][] {
  const runs: number[][] = [];
  let currentRun = [0];

  for (let i = 1; i < cards.length; i++) {
    if (cards[i].value >= cards[currentRun[currentRun.length - 1]].value) {
      currentRun.push(i);
    } else {
      runs.push([...currentRun]);
      currentRun = [i];
    }
  }
  runs.push([...currentRun]);
  return runs;
}

// In real TimSort, minRun is typically 32-64, but for our game we use 3
export const MIN_RUN = 3;

// Check if the user correctly identified run boundaries
export function validateRunSplit(cards: NumberCard[], userSplits: number[]): {
  valid: boolean;
  expectedRuns: number[][];
  message: string;
} {
  const naturalRuns = findNaturalRuns(cards);

  // Build user runs from split points
  const sortedSplits = [0, ...userSplits.sort((a, b) => a - b), cards.length];
  const userRuns: number[][] = [];
  for (let i = 0; i < sortedSplits.length - 1; i++) {
    const run: number[] = [];
    for (let j = sortedSplits[i]; j < sortedSplits[i + 1]; j++) {
      run.push(j);
    }
    userRuns.push(run);
  }

  // Check each user run: it should be either already sorted naturally
  // or match the natural run boundaries
  let valid = true;
  for (const run of userRuns) {
    if (run.length < 2) continue;
    // Check if the run captures a natural ascending sequence or a valid split
    let isNatural = true;
    for (let i = 1; i < run.length; i++) {
      if (cards[run[i]].value < cards[run[i - 1]].value) {
        isNatural = false;
        break;
      }
    }
    // Runs don't have to be pre-sorted, they just define chunks to be sorted later
    // So any split is valid as long as runs are >= MIN_RUN (except the last one)
  }

  return {
    valid: true, // We accept any reasonable split
    expectedRuns: naturalRuns,
    message: 'Runs identificados correctamente',
  };
}

// Check if a run is sorted
export function isRunSorted(cards: NumberCard[]): boolean {
  for (let i = 1; i < cards.length; i++) {
    if (cards[i].value < cards[i - 1].value) return false;
  }
  return true;
}

// Validate that the user correctly merged two sorted runs
export function validateMerge(
  runA: NumberCard[],
  runB: NumberCard[],
  merged: NumberCard[]
): { valid: boolean; message: string } {
  // Check the merged result is sorted
  for (let i = 1; i < merged.length; i++) {
    if (merged[i].value < merged[i - 1].value) {
      return {
        valid: false,
        message: `Error: ${merged[i].value} no deberia ir despues de ${merged[i - 1].value}`,
      };
    }
  }

  // Check all elements are present
  const expectedIds = new Set([...runA, ...runB].map(c => c.id));
  const mergedIds = new Set(merged.map(c => c.id));
  if (expectedIds.size !== mergedIds.size) {
    return { valid: false, message: 'Faltan elementos en la mezcla' };
  }

  return { valid: true, message: 'Mezcla correcta!' };
}

export function createInitialState(arraySize: number = 8): GameState {
  const arr = generateArray(arraySize);
  return {
    phase: 'intro',
    originalArray: arr,
    cards: createCards(arr),
    runs: [],
    mergedResult: [],
    mergePairIndex: 0,
    score: 0,
    mistakes: 0,
    message: 'Bienvenido al juego TimSort! Aprende a ordenar como un profesional.',
    messageType: 'info',
    completed: false,
  };
}

export function createRunsFromSplits(cards: NumberCard[], splits: number[]): Run[] {
  const sortedSplits = [0, ...splits.sort((a, b) => a - b), cards.length];
  const runs: Run[] = [];

  for (let i = 0; i < sortedSplits.length - 1; i++) {
    const runCards = cards.slice(sortedSplits[i], sortedSplits[i + 1]);
    runs.push({
      id: `run-${i}`,
      cards: runCards,
      sorted: isRunSorted(runCards),
      color: RUN_COLORS[i % RUN_COLORS.length],
    });
  }

  return runs;
}
