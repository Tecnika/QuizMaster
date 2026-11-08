import type { Game, Question, QuizSettings } from '@quizmaster/shared';
import { quizRoundSlots } from '@quizmaster/shared';

export interface GameStartCheck {
  blocking: boolean;
  message: string | null;
}

export interface MelodyCounts {
  round1: number;
  round2: number;
  round3: number;
  super: number;
}

/** Считает заполненные вопросы квиза по раундам. */
export function countQuizRounds(questions: Question[], settings: QuizSettings): Record<number, number> {
  const out: Record<number, number> = {};
  for (let round = 1; round <= settings.rounds.length; round++) {
    out[round] = questions.filter((q) => q.quizRound === round && q.answer).length;
  }
  return out;
}

/** Считает заполненные мелодии по турам. */
export function countMelodyRounds(questions: Question[]): MelodyCounts {
  const byRound = (round: number) => questions.filter(
    (q) => q.round === round && q.answer && (q.audioUrl || q.audioMediaId),
  ).length;
  return { round1: byRound(1), round2: byRound(2), round3: byRound(3), super: byRound(4) };
}

/** Проверка перед созданием сессии: пустая игра блокируется, неполная — предупреждает. */
export function checkGameStart(
  game: Game,
  questionCount: number,
  melody?: MelodyCounts,
  quiz?: { counts: Record<number, number>; settings: QuizSettings },
): GameStartCheck {
  if (questionCount === 0) {
    return { blocking: true, message: 'В игре нет вопросов. Добавьте хотя бы один вопрос.' };
  }

  if (game.type === 'quiz') {
    if (!quiz) {
      return { blocking: false, message: null };
    }
    if (questionCount === 0) {
      return { blocking: true, message: 'В квизе нет ни одного вопроса.' };
    }
    const parts: string[] = [];
    if (game.status !== 'ready') parts.push('Игра ещё в черновике.');
    quiz.settings.rounds.forEach((round, i) => {
      const expected = quizRoundSlots(round);
      const actual = quiz.counts[i + 1] ?? 0;
      if (actual < expected) {
        parts.push(`${round.name}: ${actual} из ${expected}.`);
      }
    });
    return {
      blocking: false,
      message: parts.length ? `${parts.join(' ')} Запустить сессию?` : null,
    };
  }

  if (game.type === 'melody') {
    const counts = melody ?? { round1: 0, round2: 0, round3: 0, super: 0 };
    if (counts.round1 === 0) {
      return { blocking: true, message: 'В первом туре нет ни одной мелодии с аудио.' };
    }
    const parts: string[] = [];
    if (game.status !== 'ready') parts.push('Игра ещё в черновике.');
    if (counts.round1 < 16) parts.push(`Первый тур: ${counts.round1} из 16 мелодий.`);
    if (counts.round2 < 16) parts.push(`Второй тур: ${counts.round2} из 16.`);
    if (counts.round3 < 3) parts.push(`Третий тур: ${counts.round3} из 3.`);
    if (counts.super < 7) parts.push(`Суперигра: ${counts.super} из 7.`);
    return {
      blocking: false,
      message: parts.length ? `${parts.join(' ')} Запустить сессию?` : null,
    };
  }

  const parts: string[] = [];
  if (game.status !== 'ready') parts.push('Игра ещё в черновике.');
  if (game.type === 'millionaire' && questionCount < 15) {
    parts.push(`Заполнено ${questionCount} из 15 вопросов.`);
  }
  if (game.type === 'svoya' && questionCount < 6) {
    parts.push(`На табло ${questionCount} вопросов.`);
  }

  return {
    blocking: false,
    message: parts.length ? `${parts.join(' ')} Запустить сессию?` : null,
  };
}
