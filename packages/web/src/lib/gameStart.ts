import type { Game } from '@quizmaster/shared';

export interface GameStartCheck {
  blocking: boolean;
  message: string | null;
}

/** Проверка перед созданием сессии: пустая игра блокируется, неполная — предупреждает. */
export function checkGameStart(game: Game, questionCount: number): GameStartCheck {
  if (questionCount === 0) {
    return { blocking: true, message: 'В игре нет вопросов. Добавьте хотя бы один вопрос.' };
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
