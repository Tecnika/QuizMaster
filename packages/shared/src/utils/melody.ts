import type { GameSettings, MelodySettings, Participant, Question, SvoyaCell } from '../types';

/** Стоимости «нот» первого тура (как в телеверсии: 15–100). */
export const MELODY_ROUND1_VALUES = [15, 30, 50, 100];

/** Мелодий в каждой категории первого и второго тура. */
export const MELODY_TRACKS_PER_CATEGORY = 4;

/** Сколько мелодий должно быть в суперигре. */
export const MELODY_SUPER_TRACKS = 7;

/** Минимум мелодий для третьего тура. */
export const MELODY_MIN_ROUND3 = 3;

export const MELODY_DEFAULT_CATEGORIES = [
  'Кино и сериалы',
  'Хиты 90-х',
  'Русская эстрада',
  'Мультфильмы',
];

export const MELODY_DEFAULT_SETTINGS: MelodySettings = {
  categories: MELODY_DEFAULT_CATEGORIES,
  round1Values: MELODY_ROUND1_VALUES,
  startPrize: 50,
  growthPerSecond: 3,
  pointsToWin: 3,
  superSeconds: 30,
  superBonus: 500,
};

/** Достаёт настройки мелодии с подстановкой значений по умолчанию. */
export function melodySettings(settings?: GameSettings | null): MelodySettings {
  const raw = settings?.melody;
  return {
    categories: raw?.categories?.length ? raw.categories : MELODY_DEFAULT_SETTINGS.categories,
    round1Values: raw?.round1Values?.length === 4 ? raw.round1Values : MELODY_DEFAULT_SETTINGS.round1Values,
    startPrize: raw?.startPrize ?? MELODY_DEFAULT_SETTINGS.startPrize,
    growthPerSecond: raw?.growthPerSecond ?? MELODY_DEFAULT_SETTINGS.growthPerSecond,
    pointsToWin: raw?.pointsToWin ?? MELODY_DEFAULT_SETTINGS.pointsToWin,
    superSeconds: raw?.superSeconds ?? MELODY_DEFAULT_SETTINGS.superSeconds,
    superBonus: raw?.superBonus ?? MELODY_DEFAULT_SETTINGS.superBonus,
  };
}

/**
 * Приз второго тура: стартует с startPrize и растёт каждую секунду.
 * Например, 50 + 3 за каждую полную секунду.
 */
export function melodyPrizeAt(
  startPrize: number,
  growthPerSecond: number,
  startedAt: number | null | undefined,
  now = Date.now(),
): number {
  if (!startedAt) return startPrize;
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  return startPrize + seconds * growthPerSecond;
}

/** Строит табло «Угадай мелодию» из вопросов. */
export function buildMelodyBoard(questions: Question[]): SvoyaCell[] {
  return questions
    .filter((q) => q.round != null && q.round >= 1 && q.round <= 4 && q.answer)
    .map((q) => ({
      questionId: q.id,
      round: q.round as number,
      theme: q.theme ?? (q.round === 3 ? 'Торги' : q.round === 4 ? 'Суперигра' : 'Мелодии'),
      value: q.value ?? 0,
      kind: 'normal' as const,
      used: false,
      order: q.order,
    }))
    .sort((a, b) => a.round - b.round
      || (a.order ?? 0) - (b.order ?? 0)
      || a.value - b.value);
}

export function melodyRoundLabel(round: number): string {
  if (round === 1) return 'Первый тур';
  if (round === 2) return 'Второй тур';
  if (round === 3) return 'Третий тур';
  return 'Суперигра';
}

/** Кто выбывает после второго тура: участники с минимальным счётом. */
export function melodyLowestScorers(participants: Participant[]): string[] {
  if (participants.length < 2) return [];
  const min = Math.min(...participants.map((p) => p.score ?? 0));
  return participants.filter((p) => (p.score ?? 0) === min).map((p) => p.id);
}

/** Есть ли победитель торгов (набрал нужное число очков). */
export function melodyBiddingWinner(
  points: Record<string, number> | null | undefined,
  pointsToWin: number,
): string | null {
  if (!points) return null;
  const entry = Object.entries(points).find(([, value]) => value >= pointsToWin);
  return entry ? entry[0] : null;
}

/** Победитель суперигры: все семь мелодий найдены. */
export function melodySuperWon(found: string[] | null | undefined): boolean {
  return (found?.length ?? 0) >= MELODY_SUPER_TRACKS;
}
