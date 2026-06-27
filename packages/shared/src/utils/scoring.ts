export const FIREPROOF_SUMS: Record<number, number> = {
  5: 1000000,
  10: 1000000,
};

export const LEVEL_PRIZES: Record<number, number> = {
  1: 1000,
  2: 2000,
  3: 4000,
  4: 8000,
  5: 10000,
  6: 40000,
  7: 80000,
  8: 100000,
  9: 200000,
  10: 500000,
  11: 1000000,
  12: 1500000,
  13: 2000000,
  14: 2500000,
  15: 3000000,
};

export function calculateEarnedSum(questionNumber: number, isCorrect: boolean): number {
  if (!isCorrect) {
    if (questionNumber === 1) return 0;
    if (questionNumber <= 5) return 0;
    if (questionNumber <= 10) return FIREPROOF_SUMS[5];
    return FIREPROOF_SUMS[10];
  }
  return LEVEL_PRIZES[questionNumber] || 0;
}

export function getFireproofSum(questionNumber: number): number | null {
  if (questionNumber >= 5 && questionNumber < 10) return FIREPROOF_SUMS[5];
  if (questionNumber >= 10) return FIREPROOF_SUMS[10];
  return null;
}
