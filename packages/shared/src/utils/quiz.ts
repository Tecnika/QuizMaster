import type { GameSettings, Participant, Question, QuizRound, QuizSettings } from '../types';

/** Классический квиз: 7 раундов и 51 вопрос. */
export const QUIZ_DEFAULT_ROUNDS: QuizRound[] = [
  { name: 'Разминка', type: 'choice', points: 1, count: 7 },
  { name: 'Бинго', type: 'text', points: 2, count: 9 },
  { name: 'Пошумим', type: 'media', points: 2, count: 7 },
  { name: 'Секундочку', type: 'blitz', points: 1, count: 12 },
  { name: 'За кулисами', type: 'backstage', points: 2, count: 5 },
  { name: 'Папарам', type: 'pairs', points: 3, count: 4 },
  { name: 'Казино', type: 'casino', points: 5, count: 6 },
];

export const QUIZ_DEFAULT_SETTINGS: QuizSettings = {
  rounds: QUIZ_DEFAULT_ROUNDS,
  bonusPoints: 3,
  timePerQuestion: 60,
};

/** Общее число вопросов квиза с учётом общего вопроса «За кулисами». */
export const QUIZ_TOTAL_QUESTIONS = QUIZ_DEFAULT_ROUNDS.reduce(
  (sum, round) => sum + round.count + (round.type === 'backstage' ? 1 : 0),
  0,
);

export function quizSettings(settings?: GameSettings | null): QuizSettings {
  const raw = settings?.quiz;
  return {
    rounds: raw?.rounds?.length === 7 ? raw.rounds : QUIZ_DEFAULT_ROUNDS,
    bonusPoints: raw?.bonusPoints ?? QUIZ_DEFAULT_SETTINGS.bonusPoints,
    timePerQuestion: raw?.timePerQuestion ?? QUIZ_DEFAULT_SETTINGS.timePerQuestion,
  };
}

export function quizRound(settings: QuizSettings, round: number): QuizRound {
  return settings.rounds[round - 1] ?? settings.rounds[0];
}

/** Сколько слотов в раунде: обычные вопросы плюс общий вопрос «За кулисами». */
export function quizRoundSlots(round: QuizRound): number {
  return round.count + (round.type === 'backstage' ? 1 : 0);
}

export function quizRoundTypeLabel(type: QuizRound['type']): string {
  switch (type) {
    case 'choice': return '4 варианта';
    case 'text': return 'письменный ответ';
    case 'media': return 'аудио/видео';
    case 'blitz': return 'блиц';
    case 'backstage': return '5 + общий';
    case 'pairs': return '10 элементов · пары';
    case 'casino': return 'ставки';
    default: return '';
  }
}

/** Строка ответа для раунда «Папарам»: «1–6, 2–7, …» (нумерация с 1). */
export function quizPairsLabel(pairs: [number, number][] | null | undefined): string {
  if (!pairs?.length) return '';
  return pairs.map(([a, b]) => `${a + 1}–${b + 1}`).join(', ');
}

/**
 * Считает очки команд по отметкам ведущего.
 * Обычные раунды: верный ответ — очки раунда.
 * «Казино»: верный — плюс ставка, неверный — минус ставка.
 * «За кулисами»: общий вопрос даёт бонус.
 */
export function quizScores({
  questions,
  marks,
  bets,
  settings,
  participants,
}: {
  questions: Question[];
  marks: Record<string, Record<string, boolean>> | null | undefined;
  bets: Record<string, Record<string, number>> | null | undefined;
  settings: QuizSettings;
  participants: Participant[];
}): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of participants) {
    let score = 0;
    for (const q of questions) {
      if (q.quizRound == null) continue;
      const round = quizRound(settings, q.quizRound);
      const mark = marks?.[q.id]?.[p.id];
      if (mark === undefined) continue;

      if (q.quizBonus) {
        if (mark) score += settings.bonusPoints;
        continue;
      }

      if (round.type === 'casino') {
        const bet = bets?.[q.id]?.[p.id] ?? round.points;
        score += mark ? bet : -bet;
      } else if (mark) {
        score += round.points;
      }
    }
    out[p.id] = score;
  }
  return out;
}

/** Сколько отметок «верно» уже стоит в вопросе. */
export function quizCorrectCount(
  marks: Record<string, Record<string, boolean>> | null | undefined,
  questionId: string,
): number {
  return Object.values(marks?.[questionId] ?? {}).filter(Boolean).length;
}

/** Вопросы раунда в порядке показа. */
export function quizQuestionsOfRound(questions: Question[], round: number): Question[] {
  return questions
    .filter((q) => q.quizRound === round)
    .sort((a, b) => a.order - b.order);
}

/** Все ли обычные вопросы раунда отмечены верно у команды. */
export function quizRoundComplete(
  questions: Question[],
  marks: Record<string, Record<string, boolean>> | null | undefined,
  round: number,
  participantId: string,
): boolean {
  const regular = quizQuestionsOfRound(questions, round).filter((q) => !q.quizBonus);
  if (regular.length === 0) return false;
  return regular.every((q) => marks?.[q.id]?.[participantId] === true);
}
