export type GameType = 'millionaire' | 'svoya' | 'melody' | 'quiz';
export type GameStatus = 'draft' | 'ready' | 'archived';
export type UserRole = 'author' | 'admin';

export type SessionStatus = 'lobby' | 'active' | 'paused' | 'finished';
export type QuestionKind = 'normal' | 'cat' | 'auction';
export type MillionaireTurnStatus = 'answering' | 'revealed' | 'finished';
export type QuizRoundType = 'choice' | 'text' | 'media' | 'blitz' | 'backstage' | 'pairs' | 'casino';

export interface UserProfile {
  login: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface SvoyaRound {
  name: string;
  values: number[];
}

export interface MelodySettings {
  /** Названия четырёх категорий первого и второго тура. */
  categories: string[];
  /** Стоимости «нот» первого тура (4 значения). */
  round1Values: number[];
  /** Стартовый приз второго тура. */
  startPrize: number;
  /** Прирост приза за секунду во втором туре. */
  growthPerSecond: number;
  /** Сколько очков нужно для выхода в суперигру. */
  pointsToWin: number;
  /** Длительность суперигры в секундах. */
  superSeconds: number;
  /** Бонус за семь угаданных мелодий в суперигре. */
  superBonus: number;
}

export interface QuizRound {
  name: string;
  type: QuizRoundType;
  /** Очки за один верный ответ. */
  points: number;
  /** Сколько вопросов в раунде (без общего вопроса «За кулисами»). */
  count: number;
}

export interface QuizSettings {
  rounds: QuizRound[];
  /** Бонус за общий вопрос раунда «За кулисами». */
  bonusPoints: number;
  /** Лимит времени на вопрос по умолчанию. */
  timePerQuestion: number;
}

export interface GameSettings {
  /** Лестница «Миллионера» (15 значений). */
  ladder?: number[];
  /** Несгораемые вопросы (1-based). */
  safeHavens?: number[];
  /** Раунды «Своей игры». */
  rounds?: SvoyaRound[];
  /** Разрешить «Кота в мешке» и «Аукцион». */
  allowSpecial?: boolean;
  /** Проводить финальный раунд. */
  finalRound?: boolean;
  /** Лимит времени на вопрос в секундах (0 — без ограничения). */
  timeLimitSeconds?: number;
  /** Настройки «Угадай мелодию». */
  melody?: MelodySettings;
  /** Настройки классического квиза. */
  quiz?: QuizSettings;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  type: GameType;
  authorId: string;
  status: GameStatus;
  settings: GameSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  order: number;
  text: string;
  answer: string;
  comment?: string;
  /** Ссылка на картинку к вопросу. */
  imageUrl?: string;
  /** Ссылка на аудио к вопросу. */
  audioUrl?: string;
  /** Файл картинки в медиатеке Firestore. */
  imageMediaId?: string;
  /** Файл аудио в медиатеке Firestore. */
  audioMediaId?: string;

  /** «Миллионер» */
  options?: string[];
  correctIndex?: number;
  level?: number;

  /** «Своя игра» */
  round?: number;
  theme?: string;
  value?: number;
  kind?: QuestionKind;

  /** Классический квиз */
  quizRound?: number;
  /** Общий вопрос раунда «За кулисами». */
  quizBonus?: boolean;
  /** Правильные пары для раунда «Папарам» (индексы options). */
  pairs?: [number, number][];
}

/** Вопрос, который видят игроки: без правильного ответа. */
export interface PublicQuestion {
  id: string;
  text: string;
  options?: string[];
  imageUrl?: string;
  audioUrl?: string;
  imageMediaId?: string;
  audioMediaId?: string;
  round?: number;
  theme?: string;
  value?: number;
  kind?: QuestionKind;
  quizRound?: number;
  quizBonus?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  score: number;
  color: string;
}

export interface Lifelines {
  fifty: boolean;
  audience: boolean;
  phone: boolean;
}

export interface MillionaireTurn {
  participantId: string;
  /** Идентификатор конкретного прохода — чтобы не смешивать ответы разных попыток. */
  turnId: string;
  questionIndex: number;
  status: MillionaireTurnStatus;
  lifelines: Lifelines;
  /** Индексы вариантов, оставшихся после 50/50. */
  fiftyOptions?: number[];
  /** Результат «Помощи зала» в процентах по вариантам. */
  audience?: number[];
  /** Вариант, который подсказал «звонок другу». */
  phoneHint?: number | null;
  chosenIndex?: number | null;
  correct?: boolean | null;
  /** Текущий гарантированный выигрыш. */
  prize?: number;
}

export interface SvoyaCell {
  questionId: string;
  round: number;
  theme: string;
  value: number;
  kind: QuestionKind;
  used: boolean;
  /** Порядок внутри раунда (для «Угадай мелодию»). */
  order?: number;
}

export interface Session {
  id: string;
  gameId: string;
  gameType: GameType;
  gameTitle?: string;
  hostId: string;
  code: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  publicQuestion: PublicQuestion | null;
  revealedCorrectIndex: number | null;
  revealedAnswer: string | null;
  turn?: MillionaireTurn | null;
  board?: SvoyaCell[] | null;
  activeCellId?: string | null;
  buzzedParticipantId?: string | null;
  /** «Кот в мешке»: кому передан вопрос. */
  catRecipientId?: string | null;
  /** «Аукцион»: победитель и ставка. */
  auctionWinnerId?: string | null;
  auctionBid?: number | null;
  /** Таймер текущего вопроса. */
  timer?: { endsAt: number; duration: number } | null;

  /** «Угадай мелодию»: текущий тур (1–4). */
  melodyRound?: number | null;
  /** Текущий приз второго тура. */
  melodyPrize?: number | null;
  /** Момент, с которого растёт приз второго тура. */
  melodyPrizeStartedAt?: number | null;
  /** Очки третьего тура: участник → победы в торгах. */
  melodyPoints?: Record<string, number> | null;
  /** Ставки торгов: участник → со скольких нот угадает. */
  melodyBids?: Record<string, number> | null;
  /** Кто пропускает мелодии после ошибки: участник → сколько осталось. */
  melodySkips?: Record<string, number> | null;
  /** Выбывшие после второго тура. */
  melodyOut?: string[] | null;
  /** Суперигра: старт, найденные мелодии и завершение. */
  melodySuper?: { startedAt: number; found: string[]; finished: boolean } | null;
  /** Снимок настроек «Угадай мелодию» для экрана и игроков. */
  melodyConfig?: MelodySettings | null;

  /** Классический квиз: текущий раунд 1–7. */
  quizRound?: number | null;
  /** Номер открытого вопроса в раунде (для экрана и игроков). */
  quizQuestionIndex?: number | null;
  /** Отметки ведущего: questionId → participantId → верно/неверно. */
  quizMarks?: Record<string, Record<string, boolean>> | null;
  /** Ставки казино: questionId → participantId → ставка. */
  quizBets?: Record<string, Record<string, number>> | null;
  /** Снимок настроек квиза для экрана и игроков. */
  quizConfig?: QuizSettings | null;

  finalStage?: {
    active: boolean;
    themes: string[];
    theme: string | null;
    question: string | null;
    answer: string | null;
  } | null;
}

export interface Answer {
  id: string;
  participantId: string;
  questionId: string;
  /** Для «Миллионера» — привязка к проходу. */
  turnId?: string | null;
  type: 'choice' | 'buzz' | 'text';
  choice?: number;
  text?: string;
  createdAt: string;
}
