import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  generateJoinCode,
  generatePlayerToken,
  melodySettings,
  normalizeCode,
  type Answer,
  type Game,
  type Participant,
  type Session,
} from '@quizmaster/shared';

const claimKey = (sessionId: string) => `qm_claim_${sessionId}`;

export interface StoredClaim {
  participantId: string;
  token: string;
}

export function getStoredClaim(sessionId: string): StoredClaim | null {
  try {
    const raw = localStorage.getItem(claimKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredClaim;
    return parsed?.participantId && parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

export function storeClaim(sessionId: string, claim: StoredClaim) {
  localStorage.setItem(claimKey(sessionId), JSON.stringify(claim));
}

export function clearStoredClaim(sessionId: string) {
  localStorage.removeItem(claimKey(sessionId));
}

/** Ищет сессию по коду подключения. */
export async function lookupSession(code: string): Promise<string | null> {
  const normalized = normalizeCode(code);
  if (!normalized) return null;
  const snap = await getDoc(doc(db, 'joinCodes', normalized));
  if (!snap.exists()) return null;
  return (snap.data().sessionId as string) || null;
}

/** Создаёт сессию для игры и возвращает её id. */
export async function createSession(game: Game, hostId: string): Promise<string> {
  let code = '';
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = generateJoinCode();
    const exists = await getDoc(doc(db, 'joinCodes', candidate));
    if (!exists.exists()) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new Error('Не удалось подобрать код подключения');

  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'sessions'), {
    gameId: game.id,
    gameType: game.type,
    gameTitle: game.title,
    hostId,
    code,
    status: 'lobby',
    createdAt: now,
    updatedAt: now,
    publicQuestion: null,
    revealedCorrectIndex: null,
    revealedAnswer: null,
    turn: null,
    board: null,
    activeCellId: null,
    buzzedParticipantId: null,
    finalStage: null,
    melodyRound: null,
    melodyPrize: null,
    melodyPrizeStartedAt: null,
    melodyPoints: null,
    melodyBids: null,
    melodySkips: null,
    melodyOut: null,
    melodySuper: null,
    melodyConfig: game.type === 'melody' ? melodySettings(game.settings) : null,
  });
  await setDoc(doc(db, 'joinCodes', code), { sessionId: ref.id, hostId });
  return ref.id;
}

/**
 * Закрепляет участника за браузером.
 * Сначала пишется секретный токен (он же блокировка), затем публичная метка.
 */
export async function claimParticipant(sessionId: string, participantId: string): Promise<StoredClaim> {
  const token = generatePlayerToken();
  await setDoc(doc(db, 'sessions', sessionId, 'tokens', participantId), { token });
  try {
    await setDoc(doc(db, 'sessions', sessionId, 'claims', participantId), {
      claimedAt: new Date().toISOString(),
    });
  } catch {
    // Метка нужна только для отображения; токен уже закрепил имя.
  }
  const claim = { participantId, token };
  storeClaim(sessionId, claim);
  return claim;
}

/** Отправляет ответ или «нажатие» участника. */
export async function submitAnswer(
  sessionId: string,
  claim: StoredClaim,
  payload: { questionId: string; turnId?: string | null; type: Answer['type']; choice?: number; text?: string },
): Promise<void> {
  await addDoc(collection(db, 'sessions', sessionId, 'answers'), {
    participantId: claim.participantId,
    questionId: payload.questionId,
    turnId: payload.turnId ?? null,
    token: claim.token,
    type: payload.type,
    choice: payload.choice ?? null,
    text: payload.text ?? null,
    createdAt: new Date().toISOString(),
  });
}

export function subscribeSession(
  sessionId: string,
  cb: (session: Session | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
    cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as Session) : null);
  });
}

export function subscribeParticipants(
  sessionId: string,
  cb: (participants: Participant[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'sessions', sessionId, 'participants'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Participant)));
  });
}
