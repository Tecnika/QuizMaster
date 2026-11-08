import {
  MILLIONAIRE_LADDER,
  fallbackPrize,
  prizeFor,
  resolveMillionaireAnswer,
  fiftyFiftyOptions,
} from './millionaire';
import { applySvoyaScore, buildBoard, clampFinalBet, svoyaWinners } from './svoya';
import {
  MELODY_DEFAULT_SETTINGS,
  MELODY_SUPER_TRACKS,
  buildMelodyBoard,
  melodyBiddingWinner,
  melodyLowestScorers,
  melodyPrizeAt,
  melodySettings,
  melodySuperWon,
} from './melody';
import {
  QUIZ_DEFAULT_ROUNDS,
  QUIZ_DEFAULT_SETTINGS,
  QUIZ_TOTAL_QUESTIONS,
  quizPairsLabel,
  quizScores,
  quizSettings,
  quizRoundSlots,
} from './quiz';
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

describe('melody', () => {
  it('grows the second-round prize by the configured rate', () => {
    const started = 1_000_000;
    expect(melodyPrizeAt(50, 3, started, started)).toBe(50);
    expect(melodyPrizeAt(50, 3, started, started + 1_000)).toBe(53);
    expect(melodyPrizeAt(50, 3, started, started + 10_900)).toBe(80);
    expect(melodyPrizeAt(50, 3, null)).toBe(50);
  });

  it('falls back to default settings', () => {
    const settings = melodySettings({});
    expect(settings.categories).toHaveLength(4);
    expect(settings.startPrize).toBe(MELODY_DEFAULT_SETTINGS.startPrize);
    expect(settings.round1Values).toEqual([15, 30, 50, 100]);
  });

  it('builds the melody board in the authored order', () => {
    const questions: Question[] = [
      { id: 'r2', order: 101, text: '', answer: 'A', round: 2, theme: 'Кино', value: 50 },
      { id: 'r1b', order: 2, text: '', answer: 'B', round: 1, theme: 'Кино', value: 30 },
      { id: 'r1a', order: 1, text: '', answer: 'C', round: 1, theme: 'Кино', value: 15 },
      { id: 'r4', order: 300, text: '', answer: 'D', round: 4, theme: 'Суперигра', value: 0 },
    ];
    const board = buildMelodyBoard(questions);
    expect(board.map((c) => c.questionId)).toEqual(['r1a', 'r1b', 'r2', 'r4']);
    expect(board.at(-1)!.theme).toBe('Суперигра');
  });

  it('picks the lowest scorers for elimination', () => {
    const out = melodyLowestScorers([
      { id: 'a', name: 'A', score: 100, color: '#fff' },
      { id: 'b', name: 'B', score: 30, color: '#fff' },
      { id: 'c', name: 'C', score: 30, color: '#fff' },
    ]);
    expect(out).toEqual(['b', 'c']);
    expect(melodyLowestScorers([{ id: 'a', name: 'A', score: 0, color: '#fff' }])).toEqual([]);
  });

  it('detects the bidding winner and the supergame', () => {
    expect(melodyBiddingWinner({ a: 2, b: 3 }, 3)).toBe('b');
    expect(melodyBiddingWinner({ a: 1, b: 2 }, 3)).toBeNull();
    expect(melodySuperWon(Array.from({ length: MELODY_SUPER_TRACKS }, (_, i) => `t${i}`))).toBe(true);
    expect(melodySuperWon(['t1'])).toBe(false);
  });
});

describe('quiz', () => {
  const participants = [
    { id: 'a', name: 'A', score: 0, color: '#fff' },
    { id: 'b', name: 'B', score: 0, color: '#fff' },
  ];

  it('has the classic seven-round structure', () => {
    expect(QUIZ_DEFAULT_ROUNDS).toHaveLength(7);
    expect(QUIZ_TOTAL_QUESTIONS).toBe(51);
    expect(quizRoundSlots(QUIZ_DEFAULT_ROUNDS[4])).toBe(6);
    expect(quizSettings({}).bonusPoints).toBe(QUIZ_DEFAULT_SETTINGS.bonusPoints);
  });

  it('awards round points for correct answers', () => {
    const questions: Question[] = [
      { id: 'q1', order: 1, text: 'q', answer: 'a', quizRound: 1 },
      { id: 'q2', order: 2, text: 'q', answer: 'a', quizRound: 1 },
    ];
    const scores = quizScores({
      questions,
      marks: { q1: { a: true, b: false }, q2: { a: true } },
      bets: null,
      settings: QUIZ_DEFAULT_SETTINGS,
      participants,
    });
    expect(scores).toEqual({ a: 2, b: 0 });
  });

  it('adds and subtracts casino bets', () => {
    const questions: Question[] = [
      { id: 'c1', order: 1, text: 'q', answer: 'a', quizRound: 7 },
      { id: 'c2', order: 2, text: 'q', answer: 'a', quizRound: 7 },
    ];
    const scores = quizScores({
      questions,
      marks: { c1: { a: true, b: false }, c2: { a: false, b: true } },
      bets: { c1: { a: 10, b: 5 }, c2: { a: 5, b: 20 } },
      settings: QUIZ_DEFAULT_SETTINGS,
      participants,
    });
    expect(scores).toEqual({ a: 5, b: 15 });
  });

  it('gives the backstage bonus separately', () => {
    const questions: Question[] = [
      { id: 'b1', order: 1, text: 'q', answer: 'a', quizRound: 5 },
      { id: 'bonus', order: 99, text: 'q', answer: 'a', quizRound: 5, quizBonus: true },
    ];
    const scores = quizScores({
      questions,
      marks: { b1: { a: true }, bonus: { a: true } },
      bets: null,
      settings: QUIZ_DEFAULT_SETTINGS,
      participants,
    });
    expect(scores.a).toBe(2 + QUIZ_DEFAULT_SETTINGS.bonusPoints);
    expect(scores.b).toBe(0);
  });

  it('formats pairs for the host answer key', () => {
    expect(quizPairsLabel([[0, 5], [1, 6]])).toBe('1–6, 2–7');
    expect(quizPairsLabel(null)).toBe('');
  });
});
