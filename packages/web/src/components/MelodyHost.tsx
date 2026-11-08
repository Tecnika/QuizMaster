import { useEffect, useMemo, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import {
  MELODY_SUPER_TRACKS,
  melodyBiddingWinner,
  melodyLowestScorers,
  melodyPrizeAt,
  melodyRoundLabel,
  melodySettings,
  type Answer,
  type Game,
  type Participant,
  type PublicQuestion,
  type Question,
  type Session,
  type SvoyaCell,
} from '@quizmaster/shared';
import { db } from '../lib/firebase';
import { QuestionAudio, QuestionImage } from './QuestionMedia';

interface Props {
  session: Session;
  sessionId: string;
  game: Game;
  participants: Participant[];
  questions: Question[];
  answers: Answer[];
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  onFinish: () => Promise<void>;
}

function melodyPublic(q: Question): PublicQuestion {
  const out: PublicQuestion = { id: q.id, text: q.text };
  if (q.audioUrl) out.audioUrl = q.audioUrl;
  if (q.audioMediaId) out.audioMediaId = q.audioMediaId;
  if (q.imageUrl) out.imageUrl = q.imageUrl;
  if (q.imageMediaId) out.imageMediaId = q.imageMediaId;
  if (q.theme) out.theme = q.theme;
  if (q.value != null) out.value = q.value;
  if (q.round != null) out.round = q.round;
  return out;
}

export default function MelodyHost({ session, sessionId, game, participants, questions, answers, onPatch, onFinish }: Props) {
  const settings = melodySettings(game.settings);
  const board: SvoyaCell[] = session.board ?? [];
  const round = session.melodyRound ?? 1;
  const points = session.melodyPoints ?? {};
  const superState = session.melodySuper ?? null;
  const outIds = session.melodyOut ?? [];

  const [now, setNow] = useState(() => Date.now());
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  const active = questions.find((q) => q.id === session.activeCellId) ?? null;
  const trackAnswers = useMemo(
    () => answers.filter((a) => a.questionId === session.activeCellId),
    [answers, session.activeCellId],
  );
  const buzzes = trackAnswers.filter((a) => a.type === 'buzz');

  const livePrize = round === 2 && session.melodyPrizeStartedAt
    ? melodyPrizeAt(settings.startPrize, settings.growthPerSecond, session.melodyPrizeStartedAt, now)
    : (session.melodyPrize ?? active?.value ?? 0);

  const activePlayers = participants.filter((p) => !outIds.includes(p.id));
  const roundCells = board
    .filter((c) => c.round === round)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const categories = Array.from(new Set(roundCells.map((c) => c.theme)));

  const biddingWinner = melodyBiddingWinner(points, settings.pointsToWin);
  const finalist = biddingWinner ?? participants[0]?.id ?? null;
  const superTracks = roundCells.filter((c) => c.round === 4);
  const superFound = superState?.found ?? [];
  const superLeft = superState
    ? Math.max(0, settings.superSeconds - Math.floor((now - superState.startedAt) / 1000))
    : settings.superSeconds;

  const guard = async (action: () => Promise<void>) => {
    setLocalError('');
    try {
      await action();
    } catch (e: any) {
      setLocalError(e?.message || 'Не удалось обновить состояние');
    }
  };

  const openTrack = (cell: SvoyaCell) => guard(async () => {
    const q = questions.find((x) => x.id === cell.questionId);
    if (!q) throw new Error('Мелодия не найдена');
    const skips: Record<string, number> = { ...(session.melodySkips ?? {}) };
    Object.keys(skips).forEach((id) => { skips[id] = Math.max(0, skips[id] - 1); });
    await onPatch({
      board: board.map((c) => (c.questionId === cell.questionId ? { ...c, used: true } : c)),
      activeCellId: q.id,
      publicQuestion: melodyPublic(q),
      revealedAnswer: null,
      buzzedParticipantId: null,
      melodyPrize: round === 2 ? settings.startPrize : q.value ?? 0,
      melodyPrizeStartedAt: round === 2 ? Date.now() : null,
      melodyBids: null,
      melodySkips: skips,
      timer: null,
    });
  });

  const closeTrack = () => guard(async () => {
    await onPatch({
      activeCellId: null,
      publicQuestion: null,
      revealedAnswer: null,
      buzzedParticipantId: null,
      melodyPrize: null,
      melodyPrizeStartedAt: null,
      melodyBids: null,
      timer: null,
    });
  });

  const award = (p: Participant, correct: boolean) => guard(async () => {
    if (!active) return;
    const prize = round === 2
      ? melodyPrizeAt(settings.startPrize, settings.growthPerSecond, session.melodyPrizeStartedAt, Date.now())
      : active.value ?? 0;
    if (correct) {
      await updateDoc(doc(db, 'sessions', sessionId, 'participants', p.id), {
        score: (p.score ?? 0) + prize,
      });
      await onPatch({
        revealedAnswer: active.answer,
        melodyPrize: prize,
        melodyPrizeStartedAt: null,
        buzzedParticipantId: p.id,
      });
    } else {
      const skips: Record<string, number> = { ...(session.melodySkips ?? {}) };
      if (round === 1) skips[p.id] = 2;
      await onPatch({ buzzedParticipantId: null, melodySkips: skips });
    }
  });

  const switchRound = (next: number) => guard(async () => {
    let out = outIds;
    if (next === 3 && round === 2) out = melodyLowestScorers(participants);
    await onPatch({
      melodyRound: next,
      activeCellId: null,
      publicQuestion: null,
      revealedAnswer: null,
      buzzedParticipantId: null,
      melodyPrize: null,
      melodyPrizeStartedAt: null,
      melodyBids: null,
      melodySkips: null,
      melodyOut: out,
      melodySuper: null,
      timer: null,
    });
  });

  const saveBid = (p: Participant, value: string) => {
    setBidInputs((prev) => ({ ...prev, [p.id]: value }));
    const notes = Number(value);
    if (!notes || notes < 3 || notes > 7) return;
    void guard(async () => {
      await onPatch({ melodyBids: { ...(session.melodyBids ?? {}), [p.id]: notes } });
    });
  };

  const awardPoint = (p: Participant) => guard(async () => {
    const next = { ...points, [p.id]: (points[p.id] ?? 0) + 1 };
    await onPatch({
      melodyPoints: next,
      revealedAnswer: active?.answer ?? null,
      melodyBids: session.melodyBids ?? null,
    });
  });

  const startSuper = () => guard(async () => {
    await onPatch({
      melodySuper: { startedAt: Date.now(), found: [], finished: false },
      activeCellId: null,
      publicQuestion: null,
      revealedAnswer: null,
      buzzedParticipantId: null,
      timer: null,
    });
  });

  const toggleFound = (q: Question) => guard(async () => {
    if (!superState) return;
    const exists = superState.found.includes(q.id);
    const found = exists
      ? superState.found.filter((id) => id !== q.id)
      : [...superState.found, q.id];
    const finished = found.length >= MELODY_SUPER_TRACKS;
    await onPatch({ melodySuper: { ...superState, found, finished } });
    if (finished && finalist && !superState.finished) {
      const player = participants.find((p) => p.id === finalist);
      if (player) {
        await updateDoc(doc(db, 'sessions', sessionId, 'participants', player.id), {
          score: (player.score ?? 0) + settings.superBonus,
        });
      }
    }
  });

  return (
    <div className="melody-stage">
      <div className="melody-scores">
        {participants.map((p) => {
          const isOut = outIds.includes(p.id);
          return (
            <div key={p.id} className={`melody-score${isOut ? ' out' : ''}${session.buzzedParticipantId === p.id ? ' active' : ''}`}>
              <span className="name">{p.name}{isOut ? ' · выбыл' : ''}</span>
              <span className="pts">{(p.score ?? 0).toLocaleString('ru-RU')}</span>
              {round >= 3 && <span className="note">торги: {points[p.id] ?? 0}</span>}
              {session.melodySkips?.[p.id] ? <span className="skip">пропуск {session.melodySkips[p.id]}</span> : null}
            </div>
          );
        })}
      </div>

      <div className="qm-inline melody-rounds">
        {[1, 2, 3, 4].map((r) => (
          <button
            key={r}
            className={`tv-icon-btn${round === r ? ' active' : ''}`}
            onClick={() => void switchRound(r)}
          >
            {melodyRoundLabel(r)}
          </button>
        ))}
        {round === 4 && biddingWinner && (
          <span className="qm-badge qm-badge-gold">
            в суперигре: {participants.find((p) => p.id === biddingWinner)?.name}
          </span>
        )}
        <button className="tv-icon-btn" style={{ marginLeft: 'auto' }} onClick={() => void onFinish()}>
          Завершить игру
        </button>
      </div>

      {localError && <div className="tv-answer-key" style={{ color: '#ffb3b3' }}>{localError}</div>}

      {round <= 2 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="melody-board">
              <thead>
                <tr>
                  <th>Категория</th>
                  {[0, 1, 2, 3].map((n) => (
                    <th key={n}>{round === 1 ? Number(settings.round1Values[n] ?? 0).toLocaleString('ru-RU') : `№${n + 1}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((theme) => (
                  <tr key={theme}>
                    <th>{theme}</th>
                    {[0, 1, 2, 3].map((n) => {
                      const cell = roundCells.filter((c) => c.theme === theme)[n];
                      if (!cell) return <td key={n} />;
                      return (
                        <td key={n}>
                          <button
                            className={`melody-cell${cell.used ? ' used' : ''}`}
                            disabled={cell.used || Boolean(session.activeCellId)}
                            onClick={() => void openTrack(cell)}
                          >
                            {cell.used ? '—' : round === 1 ? cell.value : '♪'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {active && (
            <div className="melody-current">
              <div className="melody-current-head">
                <span>{active.theme} · {round === 1 ? active.value : `приз ${livePrize}`}</span>
                {round === 2 && session.melodyPrizeStartedAt && (
                  <span className="melody-prize">{livePrize.toLocaleString('ru-RU')}</span>
                )}
              </div>
              <QuestionAudio className="tv-audio" mediaId={active.audioMediaId} src={active.audioUrl} />
              {active.imageUrl || active.imageMediaId ? (
                <QuestionImage className="tv-media" mediaId={active.imageMediaId} src={active.imageUrl} />
              ) : null}
              <div className="tv-answer-key">Ответ: {active.answer}</div>

              {session.revealedAnswer ? (
                <div className="melody-revealed">
                  <span>Ответ: <b>{session.revealedAnswer}</b></span>
                  <button className="tv-icon-btn" onClick={() => void closeTrack()}>Следующая мелодия →</button>
                </div>
              ) : (
                <>
                  <div className="melody-buzzes">
                    {buzzes.length === 0 && <span className="qm-small">Пока никто не нажал</span>}
                    {buzzes.map((a) => {
                      const p = participants.find((x) => x.id === a.participantId);
                      return p ? (
                        <button
                          key={a.id}
                          className={`tv-icon-btn${session.buzzedParticipantId === p.id ? ' active' : ''}`}
                          onClick={() => void onPatch({ buzzedParticipantId: p.id })}
                        >
                          {p.name}
                        </button>
                      ) : null;
                    })}
                  </div>
                  <div className="melody-actions">
                    {activePlayers.map((p) => (
                      <span key={p.id} className="melody-award">
                        <b>{p.name}</b>
                        <button className="tv-icon-btn ok" onClick={() => void award(p, true)}>Верно +{round === 1 ? active.value : livePrize}</button>
                        <button className="tv-icon-btn bad" onClick={() => void award(p, false)}>Неверно</button>
                      </span>
                    ))}
                  </div>
                  <div className="melody-actions">
                    <button className="tv-icon-btn" onClick={() => void closeTrack()}>Никто не угадал · дальше</button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {round === 3 && (
        <div className="melody-bidding">
          <div className="melody-track-list">
            {roundCells.map((cell) => {
              const q = questions.find((x) => x.id === cell.questionId);
              if (!q) return null;
              return (
                <button
                  key={cell.questionId}
                  className={`melody-track-btn${cell.used ? ' used' : ''}${session.activeCellId === q.id ? ' active' : ''}`}
                  disabled={Boolean(session.activeCellId) && session.activeCellId !== q.id}
                  onClick={() => void openTrack(cell)}
                >
                  {q.answer}
                </button>
              );
            })}
          </div>

          {active && (
            <div className="melody-current">
              <div className="melody-current-head">
                <span>Подсказка ведущего</span>
              </div>
              <div className="melody-hint">{active.text || 'Подсказка не задана'}</div>
              <QuestionAudio className="tv-audio" mediaId={active.audioMediaId} src={active.audioUrl} />

              <div className="melody-bids">
                {activePlayers.map((p) => (
                  <label key={p.id} className="melody-bid">
                    <span>{p.name}</span>
                    <input
                      className="qm-input"
                      type="number"
                      min={3}
                      max={7}
                      value={bidInputs[p.id] ?? String(session.melodyBids?.[p.id] ?? '')}
                      onChange={(e) => saveBid(p, e.target.value)}
                      placeholder="3–7"
                    />
                  </label>
                ))}
              </div>

              {session.revealedAnswer ? (
                <div className="melody-revealed">
                  <span>Ответ: <b>{session.revealedAnswer}</b></span>
                  <button className="tv-icon-btn" onClick={() => void closeTrack()}>Следующая мелодия →</button>
                </div>
              ) : (
                <>
                  <div className="melody-answerer">
                    <span className="qm-small">Отвечает:</span>
                    {activePlayers.map((p) => (
                      <button
                        key={p.id}
                        className={`tv-icon-btn${session.buzzedParticipantId === p.id ? ' active' : ''}`}
                        onClick={() => void onPatch({ buzzedParticipantId: p.id })}
                      >
                        {p.name}{session.melodyBids?.[p.id] ? ` · с ${session.melodyBids[p.id]} нот` : ''}
                      </button>
                    ))}
                  </div>
                  <div className="melody-actions">
                    {activePlayers.map((p) => (
                      <button key={p.id} className="tv-icon-btn ok" onClick={() => void awardPoint(p)}>
                        Очко: {p.name}
                      </button>
                    ))}
                  </div>
                  <div className="melody-actions">
                    <button className="tv-icon-btn" onClick={() => void closeTrack()}>Никто не угадал · дальше</button>
                  </div>
                </>
              )}

              {biddingWinner && (
                <div className="melody-revealed">
                  <span>
                    Победитель торгов: <b>{participants.find((p) => p.id === biddingWinner)?.name}</b>
                  </span>
                  <button className="tv-icon-btn" onClick={() => void switchRound(4)}>В суперигру →</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {round === 4 && (
        <div className="melody-super">
          {!superState ? (
            <div className="melody-current">
              <div className="melody-current-head">
                <span>Суперигра</span>
              </div>
              <p>
                {MELODY_SUPER_TRACKS} мелодий за {settings.superSeconds} секунд.
                {finalist ? ` Играет: ${participants.find((p) => p.id === finalist)?.name}.` : ''}
              </p>
              <button className="qm-btn qm-btn-gold qm-btn-lg" onClick={() => void startSuper()}>Начать суперигру</button>
            </div>
          ) : (
            <>
              <div className="melody-super-head">
                <span className={`melody-prize${superLeft === 0 ? ' warning' : ''}`}>
                  {superLeft > 0 ? `${superLeft} с` : 'Время вышло'}
                </span>
                <span className="qm-badge qm-badge-gold">Найдено {superFound.length} из {MELODY_SUPER_TRACKS}</span>
                <span className="qm-badge">Бонус +{settings.superBonus.toLocaleString('ru-RU')}</span>
                <button className="tv-icon-btn" onClick={() => void onFinish()}>Завершить игру</button>
              </div>

              {superTracks.map((cell) => {
                const q = questions.find((x) => x.id === cell.questionId);
                if (!q) return null;
                const found = superFound.includes(q.id);
                return (
                  <div key={q.id} className={`melody-super-track${found ? ' found' : ''}`}>
                    <span className="title">{q.answer}</span>
                    <QuestionAudio className="melody-super-audio" mediaId={q.audioMediaId} src={q.audioUrl} />
                    <button
                      className={`tv-icon-btn${found ? ' ok' : ''}`}
                      onClick={() => void toggleFound(q)}
                    >
                      {found ? 'Угадано ✓' : 'Угадано'}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
