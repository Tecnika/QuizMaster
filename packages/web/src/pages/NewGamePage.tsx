import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';

export default function NewGamePage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'millioner' | 'svoya_igra'>('millioner');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const ref = await addDoc(collection(db, 'games'), {
      title,
      description: desc,
      type,
      authorId: user.uid,
      status: 'draft',
      createdAt: new Date().toISOString(),
    });
    nav(`/admin/games/edit?id=${ref.id}`);
  };

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '2rem' }}>
      <h1>Новая игра</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea placeholder="Описание" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="millioner">Кто хочет стать миллионером?</option>
          <option value="svoya_igra">Своя игра</option>
        </select>
        <button type="submit">Создать</button>
      </form>
    </main>
  );
}
