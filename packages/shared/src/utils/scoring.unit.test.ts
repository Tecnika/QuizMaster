import { calculateEarnedSum, getFireproofSum } from './scoring';

describe('calculateEarnedSum', () => {
  it('returns 0 for incorrect answer on question 1', () => {
    expect(calculateEarnedSum(1, false)).toBe(0);
  });

  it('returns 0 for incorrect answer on question 4 (before fireproof)', () => {
    expect(calculateEarnedSum(4, false)).toBe(0);
  });

  it('returns fireproof sum 1000000 for incorrect on question 6', () => {
    expect(calculateEarnedSum(6, false)).toBe(1000000);
  });

  it('returns fireproof sum 1000000 for incorrect on question 11', () => {
    expect(calculateEarnedSum(11, false)).toBe(1000000);
  });

  it('returns LEVEL_PRIZES for correct answer', () => {
    expect(calculateEarnedSum(1, true)).toBe(1000);
    expect(calculateEarnedSum(5, true)).toBe(10000);
    expect(calculateEarnedSum(15, true)).toBe(3000000);
  });
});

describe('getFireproofSum', () => {
  it('returns null before question 5', () => {
    expect(getFireproofSum(3)).toBeNull();
  });

  it('returns 1000000 for question 5-9', () => {
    expect(getFireproofSum(5)).toBe(1000000);
    expect(getFireproofSum(9)).toBe(1000000);
  });

  it('returns 1000000 for question 10+', () => {
    expect(getFireproofSum(10)).toBe(1000000);
    expect(getFireproofSum(15)).toBe(1000000);
  });
});
