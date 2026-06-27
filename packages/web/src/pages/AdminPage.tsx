import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';

interface Game {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    if (!user) { nav('/login'); return; }
    const q = query(collection(db, 'games'), where('authorId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setGames(snap.docs.map((d) => d.data() as Game));
    });
    return () => unsub();
  }, [user]);

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Панель управления</h1>
        <Link to="/admin/games/new">+ Новая игра</Link>
      </div>
      <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
        {games.map((g) => (
          <div key={g.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>{g.title}</strong>
                <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>[{g.type === 'millioner' ? 'Миллионер' : 'Своя игра'}]</span>
                <span style={{ marginLeft: '0.5rem', opacity: 0.4 }}>({g.status})</span>
              </div>
              <div>
                <Link to={`/admin/games/edit?id=${g.id}`}>Редактировать</Link>
                <Link to={`/host?id=${g.id}`} style={{ marginLeft: '1rem' }}>Провести</Link>
              </div>
            </div>
          </div>
        ))}
        {games.length === 0 && <p>У вас пока нет игр.</p>}
      </div>
    </main>
  );
}
