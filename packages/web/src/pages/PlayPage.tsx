import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Session {
  id: string;
  gameId: string;
  status: string;
  currentQuestion: { text: string; answers: string[] };
  phase: string;
}

export default function PlayPage() {
  const [params] = useSearchParams();
  const code = params.get('code');
  const [session, setSession] = useState<Session | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  useEffect(() => {
    if (!code) return;
    const init = async () => {
      const q = query(collection(db, 'sessions'), where('joinCode', '==', code));
      const snap = await getDocs(q);
      if (snap.empty) return;
      const d = snap.docs[0];
      setSession({ id: d.id, ...d.data() } as Session);
      const unsub = onSnapshot(doc(db, 'sessions', d.id), (s) => {
        if (s.exists()) setSession({ id: s.id, ...s.data() } as Session);
      });
      return () => unsub();
    };
    init();
  }, [code]);

  const join = async () => {
    if (!session || !teamName.trim()) return;
    const ref = await addDoc(collection(db, 'teams'), {
      sessionId: session.id,
      name: teamName,
      score: 0,
      createdAt: new Date().toISOString(),
    });
    setTeamId(ref.id);
  };

  const submit = async () => {
    if (selectedAnswer === null || !session || !teamId) return;
    await addDoc(collection(db, 'answers'), {
      sessionId: session.id,
      teamId,
      answerIndex: selectedAnswer,
      createdAt: new Date().toISOString(),
    });
  };

  if (!code) return <main style={{ padding: '2rem' }}>Код игры не указан. Используйте ?code=XXXX</main>;
  if (!session) return <main style={{ padding: '2rem' }}>Поиск игры...</main>;

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
      {!teamId ? (
        <div>
          <h1>Присоединиться к игре</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Название команды" />
            <button onClick={join}>Войти</button>
          </div>
        </div>
      ) : session.status === 'active' && session.currentQuestion ? (
        <div>
          <h2>{session.currentQuestion.text}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            {session.currentQuestion.answers?.map((a: string, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedAnswer(i)}
                style={{ background: selectedAnswer === i ? '#007bff' : undefined, color: selectedAnswer === i ? '#fff' : undefined }}
              >
                {a}
              </button>
            ))}
          </div>
          {selectedAnswer !== null && <button onClick={submit} style={{ marginTop: '1rem' }}>Ответить</button>}
        </div>
      ) : (
        <p>Ожидание следующего вопроса...</p>
      )}
    </main>
  );
}
