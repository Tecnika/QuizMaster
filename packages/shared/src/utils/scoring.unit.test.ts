import {
  MILLIONAIRE_LADDER,
  fallbackPrize,
  prizeFor,
  resolveMillionaireAnswer,
  fiftyFiftyOptions,
} from './millionaire';
import { applySvoyaScore, buildBoard, clampFinalBet, svoyaWinners } from './svoya';
import { generateJoinCode, generatePlayerToken, normalizeCode } from './code';
import type { Question } from '../types';

describe('millionaire', () => {
  it('uses the classic 15-step ladder', () => {
    expect(MILLIONAIRE_LADDER).toHaveLength(15);
    expect(MILLIONAIRE_LADDER[0]).toBe(100);
    expect(MILLIONAIRE_LADDER[4]).toBe(1000);
    expect(MILLIONAIRE_LADDER[9]).toBe(32000);
    expect(MILLIONAIRE_LADDER[14]).toBe(1000000);
  });

  it('returns the prize for a question number', () => {
    expect(prizeFor(1)).toBe(100);
    expect(prizeFor(5)).toBe(1000);
    expect(prizeFor(15)).toBe(1000000);
  });

  it('falls back to the last safe haven on a wrong answer', () => {
    expect(fallbackPrize(1)).toBe(0);
    expect(fallbackPrize(5)).toBe(0); // ещё не заработал 1000
    expect(fallbackPrize(6)).toBe(1000);
    expect(fallbackPrize(10)).toBe(1000);
    expect(fallbackPrize(11)).toBe(32000);
    expect(fallbackPrize(15)).toBe(32000);
  });

  it('finishes the run on a wrong answer', () => {
    expect(resolveMillionaireAnswer(7, false)).toEqual({ prize: 1000, finished: true });
  });

  it('continues on a correct answer before the last question', () => {
    expect(resolveMillionaireAnswer(7, true)).toEqual({ prize: 4000, finished: false });
  });

  it('finishes after the 15th correct answer', () => {
    expect(resolveMillionaireAnswer(15, true)).toEqual({ prize: 1000000, finished: true });
  });

  it('leaves the correct option plus one wrong option for 50/50', () => {
    const options = fiftyFiftyOptions(2, 4, () => 0);
    expect(options).toHaveLength(2);
    expect(options).toContain(2);
    expect(options.filter((i) => i !== 2)).toHaveLength(1);
  });
});

describe('svoya', () => {
  it('adds value for a correct answer and subtracts for a wrong one', () => {
    expect(applySvoyaScore(0, 300, true)).toBe(300);
    expect(applySvoyaScore(300, 300, false)).toBe(0);
  });

  it('builds and sorts the board', () => {
    const questions: Question[] = [
      { id: 'b', order: 2, text: 'q', answer: 'a', round: 1, theme: 'Тема', value: 300 },
      { id: 'a', order: 1, text: 'q', answer: 'a', round: 1, theme: 'Тема', value: 100 },
    ];
    const board = buildBoard(questions);
    expect(board.map((c) => c.value)).toEqual([100, 300]);
    expect(board[0].kind).toBe('normal');
  });

  it('finds the winners by score', () => {
    const winners = svoyaWinners([
      { name: 'A', score: 100 },
      { name: 'B', score: 500 },
      { name: 'C', score: 500 },
    ]);
    expect(winners.map((w) => w.name)).toEqual(['B', 'C']);
  });

  it('clamps the final bet to the score', () => {
    expect(clampFinalBet(-5, 100)).toBe(0);
    expect(clampFinalBet(150, 100)).toBe(100);
    expect(clampFinalBet(50, 100)).toBe(50);
  });
});

describe('code', () => {
  it('generates a 6-character join code', () => {
    expect(generateJoinCode()).toHaveLength(6);
  });

  it('generates a 32-character player token', () => {
    expect(generatePlayerToken()).toHaveLength(32);
  });

  it('normalizes a join code', () => {
    expect(normalizeCode(' ab-c12 ')).toBe('ABC12');
  });
});
