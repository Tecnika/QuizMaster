import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { IconCat, IconCheck, IconGavel } from '../components/icons';
import {
  MILLIONAIRE_LADDER,
  MILLIONAIRE_SAFE_HAVENS,
  applySvoyaScore,
  buildBoard,
  emptyTurn,
  fiftyFiftyOptions,
  prizeFor,
  resolveMillionaireAnswer,
  type Answer,
  type Game,
  type MillionaireTurn,
  type Participant,
  type PublicQuestion,
  type Question,
  type Session,
  type SvoyaCell,
} from '@quizmaster/shared';

const COLORS = ['#c9a227', '#2e6b52', '#a04457', '#3a5ba8', '#8a5a2b', '#5a3d8c'];

function toPublic(q: Question): PublicQuestion {
  const out: PublicQuestion = { id: q.id, text: q.text };
  if (q.options) out.options = q.options;
  if (q.round != null) out.round = q.round;
  if (q.theme) out.theme = q.theme;
  if (q.value != null) out.value = q.value;
  if (q.kind) out.kind = q.kind;
  return out;
}

function audienceDistribution(correctIndex: number, count = 4): number[] {
  const weights = Array.from({ length: count }, () => 4 + Math.random() * 16);
  weights[correctIndex] += 36;
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => Math.round((w / sum) * 100));
}

export default function SessionHostPage() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newName, setNewName] = useState('');
  const [bidInput, setBidInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const sessionRef = useMemo(
    () => (sessionId ? doc(db, 'sessions', sessionId) : null),
    [sessionId],
  );

  useEffect(() => {
    if (!sessionId || !user) return;
    return onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
      if (!snap.exists()) {
        navigate('/cabinet');
        return;
      }
      const data = { id: snap.id, ...snap.data() } as Session;
      if (data.hostId !== user.uid) {
        navigate('/cabinet');
        return;
      }
      setSession(data);
    });
  }, [sessionId, user, navigate]);

  useEffect(() => {
    if (!session?.gameId) return;
    return onSnapshot(doc(db, 'games', session.gameId), (snap) => {
      if (snap.exists()) setGame({ id: snap.id, ...snap.data() } as Game);
    });
  }, [session?.gameId]);

  useEffect(() => {
    if (!session?.gameId) return;
    const q = query(collection(db, 'games', session.gameId, 'questions'), orderBy('order', 'asc'));
    return onSnapshot(q, (snap) => setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Question))));
  }, [session?.gameId]);

  useEffect(() => {
    if (!sessionId) return;
    return onSnapshot(collection(db, 'sessions', sessionId, 'participants'), (snap) => {
      setParticipants(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Participant)));
    });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const q = query(collection(db, 'sessions', sessionId, 'answers'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => setAnswers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Answer))));
  }, [sessionId]);

  const currentQuestion = useMemo(() => {
    const id = session?.publicQuestion?.id;
    return id ? questions.find((q) => q.id === id) ?? null : null;
  }, [session?.publicQuestion?.id, questions]);

  const turn = session?.turn ?? null;
  const turnAnswers = useMemo(() => {
    const qid = session?.publicQuestion?.id;
    if (!qid) return [];
    return answers.filter((a) => a.questionId === qid);
  }, [answers, session?.publicQuestion?.id]);

  const patchSession = async (patch: Record<string, unknown>) => {
    if (!sessionRef) return;
    try {
      await updateDoc(sessionRef, { ...patch, updatedAt: new Date().toISOString() });
    } catch (e: any) {
      setError(e?.message || 'Не удалось обновить состояние игры');
    }
  };

  const addParticipant = async () => {
    if (!sessionId || !newName.trim()) return;
    setError('');
    try {
      await addDoc(collection(db, 'sessions', sessionId, 'participants'), {
        name: newName.trim(),
        score: 0,
        color: COLORS[participants.length % COLORS.length],
      });
      setNewName('');
    } catch (e: any) {
      setError(e?.message || 'Не удалось добавить участника');
    }
  };

  const removeParticipant = async (p: Participant) => {
    if (!sessionId) return;
    if (!confirm(`Удалить участника «${p.name}»?`)) return;
    await deleteDoc(doc(db, 'sessions', sessionId, 'claims', p.id));
    await deleteDoc(doc(db, 'sessions', sessionId, 'tokens', p.id));
    await deleteDoc(doc(db, 'sessions', sessionId, 'participants', p.id));
  };

  const startGame = async () => {
    if (!session) return;
    setError('');
    try {
      const patch: Record<string, unknown> = { status: 'active' };
      if (session.gameType === 'svoya') {
        patch.board = buildBoard(questions);
      }
      if (session.gameType === 'millionaire') {
        patch.turn = null;
        patch.publicQuestion = null;
      }
      await patchSession(patch);
    } catch (e: any) {
      setError(e?.message || 'Не удалось начать игру');
    }
  };

  const finishGame = async () => {
    if (!confirm('Завершить игру и показать результаты?')) return;
    await patchSession({ status: 'finished' });
  };

  // ---------- Миллионер ----------
  const startRun = async (p: Participant) => {
    if (!session || questions.length === 0) {
      setError('В игре нет вопросов');
      return;
    }
    setError('');
    await patchSession({
      turn: emptyTurn(p.id),
      publicQuestion: toPublic(questions[0]),
      revealedCorrectIndex: null,
      revealedAnswer: null,
    });
  };

  const revealMillionaire = async () => {
    if (!session || !turn || !currentQuestion) return;
    const mine = turnAnswers.filter((a) => a.participantId === turn.participantId).at(-1);
    const chosen = mine?.choice ?? -1;
    const correct = chosen === currentQuestion.correctIndex;
    const { prize } = resolveMillionaireAnswer(
      turn.questionIndex + 1,
      correct,
      game?.settings?.ladder ?? MILLIONAIRE_LADDER,
    );
    const nextTurn: MillionaireTurn = {
      ...turn,
      status: 'revealed',
      chosenIndex: chosen,
      correct,
      prize,
    };
    await patchSession({
      turn: nextTurn,
      revealedCorrectIndex: currentQuestion.correctIndex,
      revealedAnswer: currentQuestion.answer,
    });
    if (sessionId) {
      await updateDoc(doc(db, 'sessions', sessionId, 'participants', turn.participantId), { score: prize });
    }
  };

  const nextQuestion = async () => {
    if (!session || !turn) return;
    const nextIndex = turn.questionIndex + 1;
    const q = questions[nextIndex];
    if (!q) return;
    const nextTurn: MillionaireTurn = {
      ...turn,
      questionIndex: nextIndex,
      status: 'answering',
      chosenIndex: null,
      correct: null,
      fiftyOptions: [],
      audience: [],
      phoneHint: null,
    };
    await patchSession({
      turn: nextTurn,
      publicQuestion: toPublic(q),
      revealedCorrectIndex: null,
      revealedAnswer: null,
    });
  };

  const useFifty = async () => {
    if (!turn || !currentQuestion) return;
    await patchSession({
      turn: {
        ...turn,
        lifelines: { ...turn.lifelines, fifty: true },
        fiftyOptions: fiftyFiftyOptions(currentQuestion.correctIndex ?? 0),
      },
    });
  };

  const useAudience = async () => {
    if (!turn || !currentQuestion) return;
    await patchSession({
      turn: {
        ...turn,
        lifelines: { ...turn.lifelines, audience: true },
        audience: audienceDistribution(currentQuestion.correctIndex ?? 0),
      },
    });
  };

  const usePhone = async () => {
    if (!turn || !currentQuestion) return;
    const correct = currentQuestion.correctIndex ?? 0;
    const hint = Math.random() < 0.7 ? correct : (correct + 1 + Math.floor(Math.random() * 3)) % 4;
    await patchSession({
      turn: {
        ...turn,
        lifelines: { ...turn.lifelines, phone: true },
        phoneHint: hint,
      },
    });
  };

  const takeMoney = async () => {
    if (!session || !turn) return;
    const prize = turn.questionIndex > 0
      ? prizeFor(turn.questionIndex, game?.settings?.ladder ?? MILLIONAIRE_LADDER)
      : 0;
    await patchSession({
      turn: { ...turn, status: 'finished', prize },
      revealedCorrectIndex: null,
      revealedAnswer: null,
    });
    if (sessionId) {
      await updateDoc(doc(db, 'sessions', sessionId, 'participants', turn.participantId), { score: prize });
    }
  };

  // ---------- Своя игра ----------
  const board: SvoyaCell[] = session?.board ?? [];

  const openCell = async (cell: SvoyaCell) => {
    if (!session) return;
    const q = questions.find((x) => x.id === cell.questionId);
    if (!q) return;
    const nextBoard = board.map((c) => (c.questionId === cell.questionId ? { ...c, used: true } : c));
    const base = {
      board: nextBoard,
      activeCellId: cell.questionId,
      revealedCorrectIndex: null,
      revealedAnswer: null,
      buzzedParticipantId: null,
      catRecipientId: null,
      auctionWinnerId: null,
      auctionBid: null,
    };
    if (q.kind === 'cat') {
      await patchSession({
        ...base,
        publicQuestion: {
          id: q.id,
          text: 'Кот в мешке! Ведущий передаёт вопрос сопернику.',
          theme: q.theme,
          value: q.value,
          kind: 'cat',
        },
      });
    } else if (q.kind === 'auction') {
      await patchSession({
        ...base,
        publicQuestion: {
          id: q.id,
          text: 'Аукцион! Разыграйте вопрос среди участников.',
          theme: q.theme,
          value: q.value,
          kind: 'auction',
        },
      });
    } else {
      await patchSession({ ...base, publicQuestion: toPublic(q) });
    }
  };

  const assignCat = async (p: Participant) => {
    if (!currentQuestion) return;
    await patchSession({
      catRecipientId: p.id,
      buzzedParticipantId: p.id,
      publicQuestion: toPublic(currentQuestion),
    });
  };

  const startAuction = async (p: Participant) => {
    if (!currentQuestion) return;
    const bid = Number(bidInput) || currentQuestion.value || 0;
    await patchSession({
      auctionWinnerId: p.id,
      auctionBid: bid,
      buzzedParticipantId: p.id,
      publicQuestion: toPublic(currentQuestion),
    });
  };

  const revealSvoya = async () => {
    if (!currentQuestion) return;
    await patchSession({
      revealedAnswer: currentQuestion.answer,
      revealedCorrectIndex: currentQuestion.correctIndex ?? null,
    });
  };

  const applyScore = async (p: Participant, correct: boolean) => {
    if (!currentQuestion) return;
    const nominal = currentQuestion.value ?? session?.publicQuestion?.value ?? 0;
    const value = currentQuestion.kind === 'auction' && session?.auctionBid != null
      ? session.auctionBid
      : nominal;
    const score = applySvoyaScore(p.score ?? 0, value, correct);
    if (!sessionId) return;
    await updateDoc(doc(db, 'sessions', sessionId, 'participants', p.id), { score });
    if (correct) {
      await patchSession({
        revealedAnswer: currentQuestion.answer,
        revealedCorrectIndex: currentQuestion.correctIndex ?? null,
      });
    } else {
      await patchSession({ buzzedParticipantId: null });
    }
  };

  const closeCell = async () => {
    await patchSession({
      activeCellId: null,
      publicQuestion: null,
      revealedCorrectIndex: null,
      revealedAnswer: null,
      buzzedParticipantId: null,
      catRecipientId: null,
      auctionWinnerId: null,
      auctionBid: null,
    });
  };

  const totalCells = board.length;
  const usedCells = board.filter((c) => c.used).length;
  const publicQ = session?.publicQuestion;
  const svoyaReady = Boolean(
    publicQ && (
      (publicQ.kind !== 'cat' && publicQ.kind !== 'auction') ||
      (publicQ.kind === 'cat' && session?.catRecipientId) ||
      (publicQ.kind === 'auction' && session?.auctionBid != null)
    ),
  );

  if (!session) {
    return <div className="tv tv-millionaire"><div className="tv-top"><span className="tv-logo">Загрузка…</span></div></div>;
  }

  const joinUrl = `${window.location.origin}/QuizMaster/join/${session.code}`;

  return (
    <div className={`tv ${session.gameType === 'millionaire' ? 'tv-millionaire' : 'tv-svoya'}`}>
      <div className="tv-top">
        <div className="qm-inline">
          <Link to="/cabinet" className="tv-icon-btn">← Кабинет</Link>
          <span className="tv-logo">{game?.title || 'Сессия'}</span>
          <span className="qm-badge qm-badge-gold">код {session.code}</span>
          <span className="qm-badge">{session.status}</span>
        </div>
        <div className="qm-inline">
          <button
            className="tv-icon-btn"
            onClick={() => {
              void navigator.clipboard?.writeText(joinUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? 'Ссылка скопирована' : 'Копировать ссылку игрокам'}
          </button>
          {session.status === 'lobby' && (
            <button className="tv-icon-btn" onClick={() => void startGame()}>Начать игру</button>
          )}
          {session.status === 'active' && (
            <button className="tv-icon-btn" onClick={() => void finishGame()}>Завершить</button>
          )}
        </div>
      </div>

      {error && <div className="tv-top"><span style={{ color: '#ffb3b3' }}>{error}</span></div>}

      {session.status === 'lobby' && (
        <div className="qm-container" style={{ maxWidth: 760 }}>
          <div className="qm-card">
            <div className="qm-eyebrow">Лобби</div>
            <h2 className="qm-card-title">Участники</h2>
            <p className="qm-card-muted">Добавьте имена. Игроки откроют ссылку и выберут своё имя.</p>
            <div className="qm-divider" />
            <div className="qm-inline">
              <input
                className="qm-input" style={{ maxWidth: 320 }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void addParticipant()}
                placeholder="Имя участника или команды"
              />
              <button className="qm-btn qm-btn-primary" onClick={() => void addParticipant()}>Добавить</button>
            </div>
            <div className="qm-grid qm-grid-2 qm-mt">
              {participants.map((p) => (
                <div key={p.id} className="qm-card" style={{ padding: '0.75rem' }}>
                  <div className="qm-inline" style={{ justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700 }}>
                      <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: p.color, marginRight: 8 }} />
                      {p.name}
                    </span>
                    <button className="qm-btn qm-btn-danger qm-btn-sm" onClick={() => void removeParticipant(p)}>Убрать</button>
                  </div>
                </div>
              ))}
              {participants.length === 0 && <p className="qm-small">Пока никого нет.</p>}
            </div>
            <div className="qm-divider" />
            <p className="qm-small">Ссылка для игроков: <code>{joinUrl}</code></p>
            <button className="qm-btn qm-btn-gold qm-btn-lg qm-mt" onClick={() => void startGame()} disabled={participants.length === 0}>
              Начать игру
            </button>
          </div>
        </div>
      )}

      {session.status === 'active' && session.gameType === 'millionaire' && (
        <div className="millionaire-stage">
          <div className="millionaire-main">
            {!turn || turn.status === 'finished' ? (
              <div className="qm-card" style={{ background: 'rgba(255,255,255,0.06)', borderColor: '#2c3a8a', color: '#fff' }}>
                <h2 style={{ color: '#f6d36b' }}>Кто играет?</h2>
                <p style={{ color: '#b9c0ff' }}>Выберите участника — у каждого своя лестница.</p>
                <div className="qm-grid qm-grid-2 qm-mt">
                  {participants.map((p) => (
                    <button key={p.id} className="tv-icon-btn" style={{ justifyContent: 'space-between', display: 'flex' }} onClick={() => void startRun(p)}>
                      <span>{p.name}</span>
                      <span>{p.score ?? 0}</span>
                    </button>
                  ))}
                </div>
                {participants.length === 0 && <p style={{ color: '#ffb3b3' }}>Сначала добавьте участников.</p>}
              </div>
            ) : (
              <>
                <div className="millionaire-status">
                  Играет: {participants.find((p) => p.id === turn.participantId)?.name}
                  {' · '}вопрос {turn.questionIndex + 1} из 15
                </div>
                {session.publicQuestion && (
                  <>
                    <div className="millionaire-question">{session.publicQuestion.text}</div>
                    <div className="millionaire-answers">
                      {(session.publicQuestion.options ?? []).map((text, i) => {
                        const hidden = turn.fiftyOptions?.length ? !turn.fiftyOptions.includes(i) : false;
                        const revealed = session.revealedCorrectIndex !== null;
                        const correct = revealed && i === session.revealedCorrectIndex;
                        const wrong = revealed && i !== session.revealedCorrectIndex && turn.chosenIndex === i;
                        return (
                          <div
                            key={i}
                            className={[
                              'millionaire-answer',
                              hidden ? 'hidden-5050' : '',
                              correct ? 'correct' : '',
                              wrong ? 'wrong' : '',
                            ].join(' ')}
                          >
                            <span className="letter">{'ABCD'[i]}</span>
                            <span>{text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {turn.lifelines && (
                  <div className="millionaire-tools">
                    <button className="millionaire-tool" disabled={turn.lifelines.fifty || turn.status !== 'answering'} onClick={() => void useFifty()}>50 / 50</button>
                    <button className="millionaire-tool" disabled={turn.lifelines.audience || turn.status !== 'answering'} onClick={() => void useAudience()}>Помощь зала</button>
                    <button className="millionaire-tool" disabled={turn.lifelines.phone || turn.status !== 'answering'} onClick={() => void usePhone()}>Звонок другу</button>
                  </div>
                )}

                {turn.audience && turn.audience.length > 0 && (
                  <div className="millionaire-audience">
                    {turn.audience.map((pct, i) => (
                      <div key={i} className="bar" style={{ height: `${Math.max(4, pct)}%` }}>
                        <span>{'ABCD'[i]} {pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {turn.phoneHint != null && (
                  <div className="millionaire-status">Друг советует вариант {'ABCD'[turn.phoneHint]}</div>
                )}

                <div className="tv-top" style={{ padding: 0 }}>
                  {turn.status === 'answering' && (
                    <>
                      <span className="qm-small" style={{ color: '#b9c0ff' }}>
                        {turnAnswers.filter((a) => a.participantId === turn.participantId).length
                          ? 'Ответ получен'
                          : 'Ответ пока не получен'}
                      </span>
                      <div className="qm-inline">
                        <button className="tv-icon-btn" onClick={() => void takeMoney()}>Забрать деньги</button>
                        <button className="tv-icon-btn" onClick={() => void revealMillionaire()}>Показать ответ</button>
                      </div>
                    </>
                  )}
                  {turn.status === 'revealed' && (
                    <div className="qm-inline">
                      <span className="millionaire-status">{turn.correct ? 'Верно!' : 'Неверно'} {turn.prize?.toLocaleString('ru-RU')}</span>
                      {turn.correct && turn.questionIndex + 1 < questions.length && (
                        <button className="tv-icon-btn" onClick={() => void nextQuestion()}>Следующий вопрос →</button>
                      )}
                      <button className="tv-icon-btn" onClick={() => void patchSession({ turn: { ...turn, status: 'finished' } })}>Завершить ход</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <aside className="millionaire-ladder">
            <ol>
              {MILLIONAIRE_LADDER.map((amount, i) => {
                const safe = MILLIONAIRE_SAFE_HAVENS.includes(i + 1);
                const current = turn && turn.questionIndex === i && turn.status !== 'finished';
                const won = turn && turn.questionIndex > i;
                return (
                  <li key={i} className={[safe ? 'safe' : '', current ? 'current' : '', won ? 'won' : ''].join(' ')}>
                    <span className="n">{i + 1}</span>
                    <span className="v">{amount.toLocaleString('ru-RU')}</span>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      )}

      {session.status === 'active' && session.gameType === 'svoya' && (
        <div className="svoya-stage">
          <div className="svoya-scores">
            {[...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p) => (
              <div key={p.id} className={`svoya-score${session.buzzedParticipantId === p.id ? ' active' : ''}`}>
                <span className="name">{p.name}</span>
                <span className="pts">{p.score ?? 0}</span>
              </div>
            ))}
          </div>

          <div className="qm-inline" style={{ justifyContent: 'space-between' }}>
            <span className="svoya-round-title">Табло · открыто {usedCells} из {totalCells}</span>
            <button className="tv-icon-btn" onClick={() => void finishGame()}>Завершить игру</button>
          </div>

          {[1, 2, 3].map((round) => {
            const cells = board.filter((c) => c.round === round);
            if (cells.length === 0) return null;
            const themes = Array.from(new Set(cells.map((c) => c.theme)));
            const values = Array.from(new Set(cells.map((c) => c.value))).sort((a, b) => a - b);
            return (
              <div key={round}>
                <div className="svoya-round-title">Раунд {round}</div>
                <div style={{ overflowX: 'auto' }}>
                <table className="svoya-board">
                  <thead>
                    <tr>
                      <th>Тема</th>
                      {values.map((v) => <th key={v}>{v}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {themes.map((theme) => (
                      <tr key={theme}>
                        <th>{theme}</th>
                        {values.map((v) => {
                          const cell = cells.find((c) => c.theme === theme && c.value === v);
                          if (!cell) return <td key={v} />;
                          return (
                            <td key={v}>
                              <button
                                className={`svoya-cell${cell.used ? ' used' : ''}${cell.kind === 'cat' ? ' cat' : ''}${cell.kind === 'auction' ? ' auction' : ''}`}
                                disabled={cell.used}
                                onClick={() => void openCell(cell)}
                              >
                                {cell.used ? '—' : cell.kind === 'cat' ? <IconCat size={18} /> : cell.kind === 'auction' ? <IconGavel size={18} /> : v}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            );
          })}

          {session.publicQuestion && (
            <div className="svoya-question">
              <span className="meta">
                {session.publicQuestion.theme} · {session.publicQuestion.value}
                {session.publicQuestion.kind === 'cat' ? ' · кот в мешке' : ''}
                {session.publicQuestion.kind === 'auction' ? ' · аукцион' : ''}
              </span>
              {session.publicQuestion.text}
            </div>
          )}

          {session.publicQuestion?.kind === 'cat' && !session.catRecipientId && (
            <div className="svoya-actions">
              <div className="svoya-round-title" style={{ flexBasis: '100%' }}>Кому передаём кота?</div>
              {participants.map((p) => (
                <button key={p.id} className="tv-icon-btn" onClick={() => void assignCat(p)}>{p.name}</button>
              ))}
            </div>
          )}

          {session.publicQuestion?.kind === 'auction' && session.auctionBid == null && (
            <div className="svoya-actions">
              <div className="svoya-round-title" style={{ flexBasis: '100%' }}>Аукцион: победитель и ставка</div>
              <input
                className="qm-input" style={{ maxWidth: 140 }} value={bidInput}
                onChange={(e) => setBidInput(e.target.value)}
                placeholder={String(session.publicQuestion.value ?? 0)}
              />
              {participants.map((p) => (
                <button key={p.id} className="tv-icon-btn" onClick={() => void startAuction(p)}>{p.name}</button>
              ))}
            </div>
          )}

          {session.publicQuestion?.kind === 'cat' && session.catRecipientId && (
            <div className="svoya-round-title">
              Кот у: {participants.find((p) => p.id === session.catRecipientId)?.name}
            </div>
          )}

          {session.publicQuestion?.kind === 'auction' && session.auctionBid != null && (
            <div className="svoya-round-title">
              Ставка: {session.auctionBid} · отвечает {participants.find((p) => p.id === session.auctionWinnerId)?.name}
            </div>
          )}

          {session.publicQuestion && svoyaReady && (
            <div className="svoya-actions">
              {session.revealedAnswer ? (
                <div className="svoya-answer-box">Ответ: {session.revealedAnswer}</div>
              ) : (
                <button className="tv-icon-btn" onClick={() => void revealSvoya()}>Показать ответ</button>
              )}
              <button className="tv-icon-btn" onClick={() => void closeCell()}>Закрыть вопрос</button>
            </div>
          )}

          {session.publicQuestion && svoyaReady && (
            <>
              <div className="svoya-round-title">Нажатия</div>
              <div className="qm-inline" style={{ justifyContent: 'center' }}>
                {turnAnswers.filter((a) => a.type === 'buzz').map((a) => {
                  const p = participants.find((x) => x.id === a.participantId);
                  return p ? (
                    <button
                      key={a.id}
                      className={`svoya-score${session.buzzedParticipantId === p.id ? ' active' : ''}`}
                      style={{ flex: '0 1 180px', cursor: 'pointer' }}
                      onClick={() => void patchSession({ buzzedParticipantId: p.id })}
                    >
                      <span className="name">{p.name}</span>
                      <span className="pts">нажать</span>
                    </button>
                  ) : null;
                })}
                {turnAnswers.filter((a) => a.type === 'buzz').length === 0 && (
                  <span style={{ color: '#8fa0d8' }}>Пока никто не нажал</span>
                )}
              </div>

              <div className="svoya-round-title">Начислить очки</div>
              <div className="qm-grid qm-grid-3">
                {participants.map((p) => (
                  <div key={p.id} className="qm-card" style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.06)', borderColor: '#1c49b8', color: '#fff' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>{p.name}</div>
                    <div className="qm-inline">
                      <button className="tv-icon-btn" onClick={() => void applyScore(p, true)}>Верно +</button>
                      <button className="tv-icon-btn" onClick={() => void applyScore(p, false)}>Неверно −</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {session.status === 'finished' && (
        <div className="qm-container" style={{ maxWidth: 760 }}>
          <div className="qm-card">
            <div className="qm-eyebrow">Итоги</div>
            <h2 className="qm-title">Игра завершена</h2>
            <div className="qm-grid qm-mt">
              {[...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p, i) => (
                <div key={p.id} className="qm-result-row">
                  <span>{i + 1}. {p.name}</span>
                  <b>{p.score ?? 0}</b>
                </div>
              ))}
            </div>
            <div className="qm-inline qm-mt">
              <Link className="qm-btn qm-btn-primary" to="/cabinet">В кабинет</Link>
              <button className="qm-btn qm-btn-ghost" onClick={() => void patchSession({ status: 'lobby' })}>Вернуть в лобби</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
