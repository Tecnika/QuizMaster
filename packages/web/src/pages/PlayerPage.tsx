import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getStoredClaim,
  submitAnswer,
  subscribeParticipants,
  subscribeSession,
} from '../lib/session';
import type { Participant, Session } from '@quizmaster/shared';

export default function PlayerPage() {
  const { sessionId } = useParams();
  const claim = useMemo(() => (sessionId ? getStoredClaim(sessionId) : null), [sessionId]);
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    const a = subscribeSession(sessionId, setSession);
    const b = subscribeParticipants(sessionId, setParticipants);
    return () => { a(); b(); };
  }, [sessionId]);

  const qid = session?.publicQuestion?.id;
  useEffect(() => {
    setSelected(null);
    setSent(false);
  }, [qid, session?.turn?.participantId, session?.buzzedParticipantId]);

  if (!sessionId || !claim) {
    return (
      <div className="player-screen">
        <div className="qm-card qm-center" style={{ margin: 'auto' }}>
          <p>Вы ещё не присоединились к игре.</p>
          <Link className="qm-btn qm-btn-primary" to="/join">Ввести код комнаты</Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return <div className="player-screen"><div className="player-status">Загрузка…</div></div>;
  }

  const me = participants.find((p) => p.id === claim.participantId);
  if (!me) {
    return (
      <div className="player-screen">
        <div className="qm-card qm-center" style={{ margin: 'auto' }}>
          <p>Ведущий удалил этого участника из сессии.</p>
          <Link className="qm-btn qm-btn-primary" to={`/join/${session.code}`}>Выбрать другое имя</Link>
        </div>
      </div>
    );
  }

  const isMillionaire = session.gameType === 'millionaire';
  const turn = session.turn;
  const myTurn = isMillionaire && turn?.participantId === me.id;
  const question = session.publicQuestion;
  const opponent = turn ? participants.find((p) => p.id === turn.participantId) : null;

  const send = async (payload: { type: 'choice' | 'buzz'; choice?: number }) => {
    if (!question?.id) return;
    setError('');
    try {
      await submitAnswer(sessionId, claim, { ...payload, questionId: question.id });
      setSent(true);
    } catch {
      setError('Не удалось отправить ответ. Попробуйте ещё раз.');
    }
  };

  const answerOptions = question?.options?.map((text, index) => ({ text, index })) ?? [];
  const visibleOptions = turn?.fiftyOptions?.length
    ? answerOptions.filter((o) => turn.fiftyOptions!.includes(o.index))
    : answerOptions;

  return (
    <div className="player-screen">
      <div className="player-head">
        <div className="qm-inline" style={{ justifyContent: 'space-between' }}>
          <span className="tv-logo" style={{ color: '#ffd447' }}>
            {isMillionaire ? 'Миллионер' : 'Своя игра'}
          </span>
          <span className="player-code">{session.code}</span>
        </div>
        <div className="qm-inline" style={{ justifyContent: 'center', marginTop: '0.5rem', gap: '0.8rem' }}>
          <span style={{ fontWeight: 700 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: me.color || '#c9a227', marginRight: 6 }} />
            {me.name}
          </span>
          <span className="qm-badge qm-badge-gold">Очки: {me.score ?? 0}</span>
        </div>
      </div>

      {session.status === 'lobby' && (
        <div className="player-status">Ждём начала игры. Ведущий скоро запустит сессию.</div>
      )}

      {session.status === 'finished' && (
        <div style={{ padding: '0 0.5rem' }}>
          <h2 style={{ textAlign: 'center', color: '#ffd447' }}>Игра завершена!</h2>
          <div className="qm-grid qm-mt">
            {[...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p, i) => (
              <div
                key={p.id}
                className="svoya-score"
                style={{ borderColor: p.id === me.id ? '#ffd447' : undefined }}
              >
                <span className="name">{i + 1}. {p.name}</span>
                <span className="pts">{p.score ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {session.status === 'active' && isMillionaire && (
        <div>
          {!myTurn && (
            <div className="player-status">
              {opponent ? `Сейчас играет: ${opponent.name}` : 'Ведущий выбирает следующего участника.'}
            </div>
          )}

          {myTurn && question && (
            <>
              <div className="player-question">{question.text}</div>

              {turn?.status === 'answering' && (
                <>
                  <div className="player-answers">
                    {visibleOptions.map((o) => (
                      <button
                        key={o.index}
                        className={`player-answer${selected === o.index ? ' selected' : ''}`}
                        disabled={sent}
                        onClick={() => setSelected(o.index)}
                      >
                        <b style={{ color: '#ffd447' }}>{'ABCD'[o.index]}</b> {o.text}
                      </button>
                    ))}
                  </div>
                  <button
                    className="qm-btn qm-btn-gold qm-btn-block qm-btn-lg qm-mt"
                    disabled={selected === null || sent}
                    onClick={() => selected !== null && void send({ type: 'choice', choice: selected })}
                  >
                    {sent ? 'Ответ отправлен' : 'Ответить'}
                  </button>
                </>
              )}

              {turn?.status === 'revealed' && (
                <div className="player-status">
                  {turn.correct ? '✅ Верно!' : '❌ Увы, ответ неверный.'}
                  {turn.prize != null && <> Выигрыш: <b>{turn.prize.toLocaleString('ru-RU')}</b></>}
                </div>
              )}

              {turn?.status === 'finished' && (
                <div className="player-status">
                  Ваш результат: <b>{(turn.prize ?? 0).toLocaleString('ru-RU')}</b>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {session.status === 'active' && !isMillionaire && (
        <div>
          {!question && (
            <div className="player-status">Ведущий выбирает вопрос на табло.</div>
          )}

          {question && (
            <>
              <div className="player-question">
                <div className="qm-small" style={{ color: '#ffd447', marginBottom: 4 }}>
                  {question.theme} · {question.value}
                </div>
                {question.text}
              </div>

              {!session.revealedAnswer && (
                <>
                  {question.options?.length ? (
                    <div className="player-answers">
                      {question.options.map((text, index) => (
                        <button
                          key={index}
                          className={`player-answer${selected === index ? ' selected' : ''}`}
                          disabled={sent}
                          onClick={() => setSelected(index)}
                        >
                          <b style={{ color: '#ffd447' }}>{'ABCD'[index]}</b> {text}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {question.options?.length ? (
                    <button
                      className="qm-btn qm-btn-gold qm-btn-block qm-btn-lg qm-mt"
                      disabled={selected === null || sent}
                      onClick={() => selected !== null && void send({ type: 'choice', choice: selected })}
                    >
                      {sent ? 'Ответ отправлен' : 'Ответить'}
                    </button>
                  ) : (
                    <button
                      className="player-buzz"
                      disabled={sent || Boolean(session.buzzedParticipantId)}
                      onClick={() => void send({ type: 'buzz' })}
                    >
                      {sent ? 'Нажатие отправлено' : 'Ответить!'}
                    </button>
                  )}

                  {session.buzzedParticipantId && (
                    <div className="player-status">
                      {session.buzzedParticipantId === me.id
                        ? 'Вы нажали первым — отвечайте!'
                        : `Отвечает: ${participants.find((p) => p.id === session.buzzedParticipantId)?.name ?? 'соперник'}`}
                    </div>
                  )}
                </>
              )}

              {session.revealedAnswer && (
                <div className="player-status">
                  Правильный ответ: <b style={{ color: '#7dffb0' }}>{session.revealedAnswer}</b>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && <div className="player-toast">{error}</div>}

      <div style={{ marginTop: 'auto', paddingTop: '1rem', textAlign: 'center' }}>
        <Link to="/" style={{ color: '#8fa0d8', fontSize: '0.85rem' }}>Выйти на главную</Link>
      </div>
    </div>
  );
}
