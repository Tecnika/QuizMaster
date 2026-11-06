import type { Question, SvoyaCell, SvoyaRound } from '../types';

export const SVOYA_DEFAULT_ROUNDS: SvoyaRound[] = [
  { name: 'Раунд 1', values: [100, 200, 300, 400, 500] },
  { name: 'Раунд 2', values: [200, 400, 600, 800, 1000] },
  { name: 'Раунд 3', values: [300, 600, 900, 1200, 1500] },
];

export const SVOYA_DEFAULT_THEMES = 6;

/** Начисление очков: верно — плюс, неверно — минус. */
export function applySvoyaScore(score: number, value: number, correct: boolean): number {
  return score + (correct ? value : -value);
}

/** Строит табло из вопросов игры. */
export function buildBoard(questions: Question[]): SvoyaCell[] {
  return questions
    .filter((q) => q.round != null && q.theme && q.value != null)
    .map((q) => ({
      questionId: q.id,
      round: q.round as number,
      theme: q.theme as string,
      value: q.value as number,
      kind: q.kind ?? 'normal',
      used: false,
    }))
    .sort((a, b) => a.round - b.round || a.theme.localeCompare(b.theme) || a.value - b.value);
}

/** Группирует ячейки табло по раундам и темам. */
export function groupBoard(board: SvoyaCell[]) {
  const byRound = new Map<number, Map<string, SvoyaCell[]>>();
  for (const cell of board) {
    if (!byRound.has(cell.round)) byRound.set(cell.round, new Map());
    const themes = byRound.get(cell.round)!;
    if (!themes.has(cell.theme)) themes.set(cell.theme, []);
    themes.get(cell.theme)!.push(cell);
  }
  return byRound;
}

/** Победитель — максимальный счёт; при равенстве возвращает несколько. */
export function svoyaWinners<T extends { score: number }>(participants: T[]): T[] {
  const max = Math.max(...participants.map((p) => p.score), 0);
  return participants.filter((p) => p.score === max);
}

/** Ставка в финале: не больше счёта и не меньше нуля. */
export function clampFinalBet(bet: number, score: number): number {
  if (score <= 0) return 0;
  return Math.max(0, Math.min(bet, score));
}
