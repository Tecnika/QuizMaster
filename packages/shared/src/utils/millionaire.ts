import type { MillionaireTurn } from '../types';

/** Классическая лестница из 15 сумм. */
export const MILLIONAIRE_LADDER = [
  100, 200, 300, 500, 1000,
  2000, 4000, 8000, 16000, 32000,
  64000, 125000, 250000, 500000, 1000000,
];

/** Несгораемые вопросы (1-based): после верного ответа сумма гарантирована. */
export const MILLIONAIRE_SAFE_HAVENS = [5, 10, 15];

/** Сумма, которая остаётся при неверном ответе на вопрос questionNumber (1-based). */
export function fallbackPrize(questionNumber: number, ladder: number[] = MILLIONAIRE_LADDER): number {
  if (questionNumber <= 5) return 0;
  if (questionNumber <= 10) return ladder[4];
  return ladder[9];
}

/** Выигрыш за верный ответ на вопрос questionNumber (1-based). */
export function prizeFor(questionNumber: number, ladder: number[] = MILLIONAIRE_LADDER): number {
  return ladder[questionNumber - 1] ?? 0;
}

/**
 * Результат ответа на текущий вопрос.
 * questionNumber — 1-based номер вопроса, на который отвечали.
 */
export function resolveMillionaireAnswer(
  questionNumber: number,
  correct: boolean,
  ladder: number[] = MILLIONAIRE_LADDER,
): { prize: number; finished: boolean } {
  if (correct) {
    return {
      prize: prizeFor(questionNumber, ladder),
      finished: questionNumber >= ladder.length,
    };
  }
  return {
    prize: fallbackPrize(questionNumber, ladder),
    finished: true,
  };
}

/** Индексы двух вариантов для подсказки 50/50: правильный + один неправильный. */
export function fiftyFiftyOptions(correctIndex: number, count = 4, random: () => number = Math.random): number[] {
  const wrong = Array.from({ length: count }, (_, i) => i).filter((i) => i !== correctIndex);
  const pick = wrong[Math.floor(random() * wrong.length)];
  return [correctIndex, pick].sort((a, b) => a - b);
}

export function newTurnId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyTurn(participantId: string): MillionaireTurn {
  return {
    participantId,
    turnId: newTurnId(),
    questionIndex: 0,
    status: 'answering',
    lifelines: { fifty: false, audience: false, phone: false },
    chosenIndex: null,
    correct: null,
    prize: 0,
  };
}
