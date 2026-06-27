export type GameType = 'millioner' | 'svoya_igra';

export type GameStatus = 'draft' | 'published' | 'archived';

export type SessionStatus = 'lobby' | 'active' | 'paused' | 'finished';

export type UserRole = 'admin' | 'player';

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  type: GameType;
  authorId: string;
  status: GameStatus;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionMillioner {
  id: string;
  gameId: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  difficulty: number;
  hint505: string;
  hintCall: string;
  sortOrder: number;
}

export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuestionSvoyaIgra {
  id: string;
  gameId: string;
  category: string;
  value: number;
  questionText: string;
  correctAnswer: string;
  isDailyDouble: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  sessionId: string;
  score?: number;
}

export interface GameSession {
  id: string;
  gameId: string;
  hostId: string;
  status: SessionStatus;
  currentQuestionId: string | null;
  currentState: Record<string, unknown>;
  teams: Team[];
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface FirestoreSession {
  status: SessionStatus;
  currentQuestion: Record<string, unknown> | null;
  teams: Pick<Team, 'id' | 'name' | 'color' | 'score'>[];
  state: Record<string, unknown>;
  updatedAt: number;
}
