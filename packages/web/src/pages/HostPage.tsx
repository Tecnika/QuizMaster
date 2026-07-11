import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, orderBy, addDoc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';

interface Question {
  id: string;
  text: string;
  answers: string[];
  correctIndex: number;
  difficulty: number;
}

interface Session {
  id: string;
  gameId: string;
  status: string;
  questionIndex: number;
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
  const [game, setGame] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (!gameId || !user) return;
    const unsub = onSnapshot(doc(db, 'games', gameId), (snap) => {
      if (snap.exists()) setGame({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [gameId, user]);

  useEffect(() => {
    if (!gameId) return;
    const q = query(collection(db, 'games', gameId, 'questions'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Question)));
    });
    return () => unsub();
  }, [gameId]);

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
      (snap) => { setTeams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Team))); }
    );
    return () => unsub();
  }, [sessionId]);

  const createSession = async () => {
    if (!gameId || !user) return;
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const ref = await addDoc(collection(db, 'sessions'), {
      gameId, hostId: user.uid, status: 'created', joinCode: code,
      questionIndex: 0, createdAt: serverTimestamp(),
    });
    setSessionId(ref.id);
  };

  const startGame = async () => {
    if (!sessionId) return;
    await updateDoc(doc(db, 'sessions', sessionId), { status: 'active', questionIndex: 0 });
  };

  const nextQuestion = async () => {
    if (!sessionId || !session) return;
    const nextIdx = session.questionIndex + 1;
    if (nextIdx >= questions.length) {
      await updateDoc(doc(db, 'sessions', sessionId), { status: 'finished' });
    } else {
      await updateDoc(doc(db, 'sessions', sessionId), { questionIndex: nextIdx });
    }
  };

  const currentQuestion = session ? questions[session.questionIndex] : null;
  const isLastQuestion = session && session.questionIndex >= questions.length - 1;

  if (!user || !gameId) return <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>;

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1>Проведение: {game?.title || ''}</h1>

      {!session ? (
        <button onClick={createSession}>Создать сессию</button>
      ) : (
        <>
          <p>Статус: <strong>{session.status}</strong> | Код: <strong style={{ fontSize: '1.5rem', letterSpacing: 4 }}>{session.joinCode}</strong></p>
          <p>Вопросы: {session.questionIndex + 1} / {questions.length}</p>

          {session.status === 'created' && (
            <button onClick={startGame} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>Начать игру</button>
          )}

          {session.status === 'active' && currentQuestion && (
            <section style={{ marginTop: '2rem' }}>
              <h2>Вопрос #{session.questionIndex + 1} (сложность {currentQuestion.difficulty})</h2>
              <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>{currentQuestion.text}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {currentQuestion.answers.map((a, i) => (
                  <div key={i} style={{
                    padding: '1rem', borderRadius: 8,
                    background: i === currentQuestion.correctIndex ? '#d4edda' : '#f8f9fa',
                    border: i === currentQuestion.correctIndex ? '2px solid #28a745' : '1px solid #ddd',
                    fontWeight: i === currentQuestion.correctIndex ? 'bold' : 'normal',
                  }}>
                    {'ABCD'[i]}: {a}
                  </div>
                ))}
              </div>
              <button onClick={nextQuestion} style={{ marginTop: '1.5rem', padding: '0.75rem 2rem' }}>
                {isLastQuestion ? 'Завершить игру' : 'Следующий вопрос →'}
              </button>
            </section>
          )}

          {session.status === 'active' && !currentQuestion && questions.length === 0 && (
            <p style={{ color: '#999', marginTop: '2rem' }}>В игре нет вопросов. Добавьте их в редакторе.</p>
          )}

          {session.status === 'finished' && (
            <section style={{ marginTop: '2rem' }}>
              <h2>Игра завершена!</h2>
              <TeamsList teams={teams} />
            </section>
          )}

          <section style={{ marginTop: '2rem' }}>
            <h2>Команды</h2>
            <TeamsList teams={teams} />
          </section>
        </>
      )}
    </main>
  );
}

function TeamsList({ teams }: { teams: Team[] }) {
  if (teams.length === 0) return <p>Пока нет команд.</p>;
  const sorted = [...teams].sort((a, b) => (b.score || 0) - (a.score || 0));
  return (
    <div>
      {sorted.map((t, i) => (
        <div key={t.id} style={{ border: '1px solid #ddd', padding: '0.5rem 1rem', margin: '0.25rem 0', borderRadius: 4 }}>
          {i + 1}. {t.name} — {t.score || 0} очков
        </div>
      ))}
    </div>
  );
}
