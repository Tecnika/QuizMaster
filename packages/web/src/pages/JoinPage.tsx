import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  claimParticipant,
  getStoredClaim,
  lookupSession,
  subscribeParticipants,
  subscribeSession,
} from '../lib/session';
import type { Participant, Session } from '@quizmaster/shared';

export default function JoinPage() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(codeParam || '');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const existing = sessionId ? getStoredClaim(sessionId) : null;

  const find = async (value: string) => {
    setError('');
    const id = await lookupSession(value);
    if (!id) {
      setError('Код не найден. Проверьте написание.');
      return;
    }
    setSessionId(id);
  };

  useEffect(() => {
    if (codeParam) void find(codeParam);
  }, [codeParam]);

  useEffect(() => {
    if (!sessionId) return;
    const unsubSession = subscribeSession(sessionId, setSession);
    const unsubParticipants = subscribeParticipants(sessionId, setParticipants);
    const unsubClaims = onSnapshot(collection(db, 'sessions', sessionId, 'claims'), (snap) => {
      setClaimed(new Set(snap.docs.map((d) => d.id)));
    });
    return () => {
      unsubSession();
      unsubParticipants();
      unsubClaims();
    };
  }, [sessionId]);

  const handleCode = (e: FormEvent) => {
    e.preventDefault();
    void find(code);
  };

  const choose = async (participant: Participant) => {
    if (!sessionId) return;
    if (claimed.has(participant.id)) {
      setError('Это имя уже занято. Выберите другое.');
      return;
    }
    setBusyId(participant.id);
    setError('');
    try {
      await claimParticipant(sessionId, participant.id);
      navigate(`/play/${sessionId}`);
    } catch {
      setError('Не удалось занять имя — возможно, его только что выбрали. Обновите список.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="qm-container-narrow" style={{ margin: '0 auto' }}>
      <div className="qm-card">
        <div className="qm-eyebrow">Игрок</div>
        <h1 className="qm-title">Присоединиться к игре</h1>
        <p className="qm-subtitle qm-mb">Введите код комнаты — аккаунт не нужен.</p>

        {!sessionId && (
          <form onSubmit={handleCode}>
            <div className="qm-field">
              <label className="qm-label" htmlFor="code">Код комнаты</label>
              <input
                id="code" className="qm-input"
                style={{ textTransform: 'uppercase', letterSpacing: 6, fontSize: '1.3rem', textAlign: 'center' }}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={8}
                required
              />
            </div>
            {error && <p className="qm-danger-text">{error}</p>}
            <button className="qm-btn qm-btn-primary qm-btn-block qm-btn-lg" type="submit">Найти игру</button>
          </form>
        )}

        {sessionId && session && (
          <>
            <div className="qm-inline" style={{ justifyContent: 'space-between' }}>
              <div>
                <div className="qm-eyebrow">Комната</div>
                <div className="qm-title" style={{ letterSpacing: 4 }}>{session.code}</div>
              </div>
              <span className={`qm-badge ${session.status === 'lobby' ? 'qm-badge-gold' : session.status === 'finished' ? 'qm-badge-red' : 'qm-badge-green'}`}>
                {session.status === 'lobby' ? 'ожидание' : session.status === 'finished' ? 'завершена' : 'идёт игра'}
              </span>
            </div>

            <div className="qm-divider" />

            {existing && (
              <div className="qm-card" style={{ marginBottom: '1rem', background: '#eaf6ee' }}>
                <p style={{ margin: '0 0 0.6rem' }}>Вы уже закреплены за одним из участников.</p>
                <button className="qm-btn qm-btn-primary" onClick={() => navigate(`/play/${sessionId}`)}>
                  Продолжить игру
                </button>
              </div>
            )}

            <div className="qm-label">Выберите своё имя</div>
            {participants.length === 0 && (
              <p className="qm-small">Ведущий ещё не добавил участников. Подождите и обновите страницу.</p>
            )}
            <div className="qm-grid qm-grid-2 qm-mt">
              {participants.map((p) => {
                const taken = claimed.has(p.id);
                const mine = existing?.participantId === p.id;
                return (
                  <button
                    key={p.id}
                    className="qm-card qm-feature"
                    style={{
                      textAlign: 'left',
                      cursor: taken ? 'not-allowed' : 'pointer',
                      opacity: taken && !mine ? 0.55 : 1,
                      borderColor: mine ? 'var(--green)' : undefined,
                    }}
                    disabled={taken || busyId === p.id}
                    onClick={() => void choose(p)}
                  >
                    <div className="qm-inline" style={{ justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: p.color || '#c9a227', marginRight: 8 }} />
                        {p.name}
                      </span>
                      <span className="qm-badge">{taken ? (mine ? 'вы' : 'занято') : 'свободно'}</span>
                    </div>
                    <div className="qm-small qm-mt">Очки: {p.score ?? 0}</div>
                  </button>
                );
              })}
            </div>
            {error && <p className="qm-danger-text">{error}</p>}
          </>
        )}

        <p className="qm-center qm-mt">
          <Link className="qm-link" to="/">← На главную</Link>
        </p>
      </div>
    </div>
  );
}
