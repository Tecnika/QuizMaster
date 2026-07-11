import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, addDoc, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Session {
  id: string;
  gameId: string;
  status: string;
  questionIndex: number;
  joinCode: string;
}

interface Question {
  id: string;
  text: string;
  answers: string[];
  correctIndex: number;
}

interface Team {
  id: string;
  name: string;
  score: number;
}

export default function PlayPage() {
  const [params] = useSearchParams();
  const codeParam = params.get('code');
  const [code, setCode] = useState(codeParam || '');
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answeredCorrect, setAnsweredCorrect] = useState<boolean | null>(null);

  const findSession = async (c: string) => {
    if (!c.trim()) return;
    const q = query(collection(db, 'sessions'), where('joinCode', '==', c.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const d = snap.docs[0];
    const s = { id: d.id, ...d.data() } as Session;
    setSession(s);

    onSnapshot(doc(db, 'sessions', s.id), (docSnap) => {
      if (docSnap.exists()) setSession({ id: docSnap.id, ...docSnap.data() } as Session);
    });

    const qq = query(collection(db, 'games', s.gameId, 'questions'), orderBy('createdAt', 'asc'));
    onSnapshot(qq, (snapQ) => {
      setQuestions(snapQ.docs.map((x) => ({ id: x.id, ...x.data() } as Question)));
    });
  };

  useEffect(() => {
    if (codeParam) findSession(codeParam);
  }, [codeParam]);

  const handleFind = () => findSession(code);

  const join = async () => {
    if (!session || !teamName.trim()) return;
    const ref = await addDoc(collection(db, 'teams'), {
      sessionId: session.id, name: teamName, score: 0, createdAt: new Date().toISOString(),
    });
    setTeamId(ref.id);
  };

  const submit = async () => {
    if (selectedAnswer === null || !session || !teamId || !questions[session.questionIndex]) return;
    const q = questions[session.questionIndex];
    const isCorrect = selectedAnswer === q.correctIndex;
    await addDoc(collection(db, 'answers'), {
      sessionId: session.id, teamId, answerIndex: selectedAnswer,
      isCorrect, questionIndex: session.questionIndex,
      createdAt: new Date().toISOString(),
    });
    setSubmitted(true);
    setAnsweredCorrect(isCorrect);
  };

  const currentQ = session && questions[session.questionIndex];

  useEffect(() => {
    setSelectedAnswer(null);
    setSubmitted(false);
    setAnsweredCorrect(null);
  }, [session?.questionIndex]);

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
      {!session && !codeParam && (
        <>
          <h1>Присоединиться к игре</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Код игры" style={{ textTransform: 'uppercase', letterSpacing: 3 }} />
            <button onClick={handleFind}>Найти</button>
          </div>
        </>
      )}
      {session && !teamId && (
        <div style={{ marginTop: '2rem' }}>
          <h1>Присоединиться к игре</h1>
          <p>Код: <strong>{session.joinCode}</strong></p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Название команды" />
            <button onClick={join}>Войти</button>
          </div>
        </div>
      )}
      {teamId && session && currentQ && session.status === 'active' && (
        <section style={{ marginTop: '1rem' }}>
          <h2>Вопрос #{session.questionIndex + 1}</h2>
          <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>{currentQ.text}</p>
          {!submitted ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentQ.answers.map((a, i) => (
                  <button key={i} onClick={() => setSelectedAnswer(i)} style={{
                    padding: '0.75rem 1rem', textAlign: 'left', borderRadius: 8, cursor: 'pointer',
                    background: selectedAnswer === i ? '#007bff' : '#f8f9fa',
                    color: selectedAnswer === i ? '#fff' : '#000',
                    border: selectedAnswer === i ? '2px solid #0056b3' : '1px solid #ddd',
                  }}>
                    {'ABCD'[i]}: {a}
                  </button>
                ))}
              </div>
              {selectedAnswer !== null && <button onClick={submit} style={{ marginTop: '1rem', padding: '0.75rem 2rem' }}>Ответить</button>}
            </>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <h2 style={{ color: answeredCorrect ? '#28a745' : '#dc3545' }}>
                {answeredCorrect ? 'Правильно! ✓' : 'Неправильно ✗'}
              </h2>
              <p>Ожидание следующего вопроса...</p>
            </div>
          )}
        </section>
      )}
      {teamId && (!session || !currentQ || session.status !== 'active') && (
        <p style={{ marginTop: '2rem', textAlign: 'center', color: '#999' }}>
          {session?.status === 'finished' ? 'Игра завершена!' : 'Ожидание начала игры...'}
        </p>
      )}
    </main>
  );
}
