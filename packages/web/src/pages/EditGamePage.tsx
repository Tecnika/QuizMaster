import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Game {
  id: string;
  title: string;
  type: 'millioner' | 'svoya_igra';
  questions: any[];
}

export default function EditGamePage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const id = params.get('id');
  const [game, setGame] = useState<Game | null>(null);
  const [questionText, setQuestionText] = useState('');

  useEffect(() => {
    if (!id) { nav('/admin'); return; }
    const unsub = onSnapshot(doc(db, 'games', id), (snap) => {
      if (!snap.exists()) nav('/admin');
      else setGame({ id: snap.id, ...snap.data() } as Game);
    });
    return () => unsub();
  }, [id]);

  const addQuestion = async () => {
    if (!questionText.trim() || !id) return;
    await addDoc(collection(db, 'games', id, 'questions'), {
      text: questionText,
      difficulty: 1,
      createdAt: new Date().toISOString(),
    });
    setQuestionText('');
  };

  if (!game) return <div>Загрузка...</div>;

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1>{game.title}</h1>
      <p>Тип: {game.type === 'millioner' ? 'Кто хочет стать миллионером?' : 'Своя игра'}</p>

      <section style={{ marginTop: '2rem' }}>
        <h2>Вопросы</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Текст вопроса"
            style={{ flex: 1 }}
          />
          <button onClick={addQuestion}>Добавить</button>
        </div>
        <ul style={{ marginTop: '1rem' }}>
          {game.questions?.map((q: any, i: number) => (
            <li key={q.id || i}>{q.text}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
