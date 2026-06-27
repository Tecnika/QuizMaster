import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  doc, onSnapshot, collection, query, orderBy, addDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';

interface Question {
  id: string;
  text: string;
  answers: string[];
  correctIndex: number;
  difficulty: number;
  createdAt: string;
}

export default function EditGamePage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const gameId = params.get('id');
  const { user } = useAuth();
  const [game, setGame] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [text, setText] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [difficulty, setDifficulty] = useState(1);

  useEffect(() => {
    if (!gameId || !user) { nav('/admin'); return; }
    const unsub = onSnapshot(doc(db, 'games', gameId), (snap) => {
      if (!snap.exists()) nav('/admin');
      else setGame({ id: snap.id, ...snap.data() });
    });
    return () => unsub();
  }, [gameId, user]);

  useEffect(() => {
    if (!gameId) return;
    const q = query(collection(db, 'games', gameId!, 'questions'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Question)));
    });
    return () => unsub();
  }, [gameId]);

  const addQuestion = async () => {
    if (!text.trim() || answers.some((a) => !a.trim()) || !gameId) return;
    await addDoc(collection(db, 'games', gameId!, 'questions'), {
      text,
      answers,
      correctIndex,
      difficulty,
      createdAt: new Date().toISOString(),
    });
    setText('');
    setAnswers(['', '', '', '']);
    setCorrectIndex(0);
    setDifficulty(1);
  };

  const remove = async (id: string) => {
    if (!gameId) return;
    await deleteDoc(doc(db, 'games', gameId!, 'questions', id));
  };

  if (!game) return <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>;

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <h1>{game.title}</h1>
      <p>Тип: {game.type === 'millioner' ? 'Кто хочет стать миллионером?' : 'Своя игра'} | Статус: {game.status}</p>

      <section style={{ marginTop: '2rem', border: '1px solid #ddd', padding: '1.5rem', borderRadius: 8 }}>
        <h2>Новый вопрос</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Текст вопроса" />

          {answers.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', width: 20 }}>{'ABCD'[i]}</span>
              <input
                value={a}
                onChange={(e) => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  setAnswers(next);
                }}
                placeholder={`Вариант ${'ABCD'[i]}`}
                style={{ flex: 1 }}
              />
              <input
                type="radio"
                name="correct"
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
                title="Правильный ответ"
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label>Сложность (1-15):
              <input
                type="number"
                min={1}
                max={15}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                style={{ width: 60, marginLeft: 8 }}
              />
            </label>
            <button onClick={addQuestion}>Добавить вопрос</button>
          </div>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Вопросы ({questions.length})</h2>
        {questions.map((q, i) => (
          <div key={q.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: 8, margin: '0.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>#{i + 1} (сложность {q.difficulty})</strong>
              <button onClick={() => remove(q.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            <p>{q.text}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
              {q.answers?.map((a, ai) => (
                <div key={ai} style={{
                  padding: '0.25rem 0.5rem',
                  background: ai === q.correctIndex ? '#d4edda' : '#f8f9fa',
                  borderRadius: 4,
                }}>
                  {'ABCD'[ai]}: {a} {ai === q.correctIndex && '✓'}
                </div>
              ))}
            </div>
          </div>
        ))}
        {questions.length === 0 && <p>Пока нет вопросов. Добавьте первый!</p>}
      </section>
    </main>
  );
}
