export type GameType = 'millionaire' | 'svoya';
export type GameStatus = 'draft' | 'ready' | 'archived';
export type UserRole = 'author' | 'admin';

export type SessionStatus = 'lobby' | 'active' | 'paused' | 'finished';
export type QuestionKind = 'normal' | 'cat' | 'auction';
export type MillionaireTurnStatus = 'answering' | 'revealed' | 'finished';

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

  /** «Миллионер» */
  options?: string[];
  correctIndex?: number;
  level?: number;

  /** «Своя игра» */
  round?: number;
  theme?: string;
  value?: number;
  kind?: QuestionKind;
}

/** Вопрос, который видят игроки: без правильного ответа. */
export interface PublicQuestion {
  id: string;
  text: string;
  options?: string[];
  round?: number;
  theme?: string;
  value?: number;
  kind?: QuestionKind;
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
}

export interface Session {
  id: string;
  gameId: string;
  gameType: GameType;
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
  type: 'choice' | 'buzz' | 'text';
  choice?: number;
  text?: string;
  createdAt: string;
}
