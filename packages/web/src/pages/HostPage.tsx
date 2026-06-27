import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';

interface Session {
  id: string;
  gameId: string;
  status: string;
  currentQuestion: any;
  phase: string;
  hostId: string;
  joinCode: string;
}

interface Team {
  id: string;
  name: string;
  score: number;
}

export default function HostPage() {
  const [params] = useSearchParams();
  const gameId = params.get('id');
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(
      query(collection(db, 'sessions'), where('gameId', '==', gameId)),
      (snap) => {
        if (!snap.empty) {
          const d = snap.docs[0];
          setSession({ id: d.id, ...d.data() } as Session);
          setSessionId(d.id);
        }
      }
    );
    return () => unsub();
  }, [gameId]);

  useEffect(() => {
    if (!sessionId) return;
    const unsub = onSnapshot(
      query(collection(db, 'teams'), where('sessionId', '==', sessionId)),
      (snap) => {
        setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team)));
      }
    );
    return () => unsub();
  }, [sessionId]);

  const createSession = async () => {
    if (!gameId || !user) return;
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ref = await addDoc(collection(db, 'sessions'), {
      gameId,
      hostId: user.uid,
      status: 'created',
      joinCode: code,
      phase: 'lobby',
      createdAt: serverTimestamp(),
    });
    setSessionId(ref.id);
  };

  const startSession = async () => {
    if (!sessionId) return;
    await updateDoc(doc(db, 'sessions', sessionId), {
      status: 'active',
      phase: 'question',
    });
  };

  const nextQuestion = async () => {
    if (!sessionId) return;
    await updateDoc(doc(db, 'sessions', sessionId), {
      status: 'active',
      phase: 'question',
      currentQuestion: { text: 'Пример вопроса?', answers: ['A', 'B', 'C', 'D'] },
    });
  };

  if (!user) return <div>Загрузка...</div>;

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1>Проведение игры</h1>
      {!session ? (
        <button onClick={createSession}>Создать сессию</button>
      ) : (
        <>
          <p>Статус: {session.status}</p>
          <p>Код: <strong>{session.joinCode}</strong></p>
          {session.status === 'created' && <button onClick={startSession}>Начать игру</button>}
          {session.status === 'active' && <button onClick={nextQuestion}>Следующий вопрос</button>}
          <section style={{ marginTop: '2rem' }}>
            <h2>Команды</h2>
            {teams.map((t) => (
              <div key={t.id} style={{ border: '1px solid #ddd', padding: '0.5rem', margin: '0.25rem 0' }}>
                {t.name} — {t.score || 0} очков
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
