import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { createSession } from '../lib/session';
import { checkGameStart } from '../lib/gameStart';
import { IconBrain, IconCoins, IconFolder, IconPlus } from '../components/icons';
import type { Game } from '@quizmaster/shared';

export default function CabinetPage() {
  const { user, userLogin } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'games'), where('authorId', '==', user.uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Game));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setGames(list);
    });
  }, [user]);

  const startSession = async (game: Game) => {
    if (!user) return;
    setError('');
    setBusyId(game.id);
    try {
      const qs = await getDocs(collection(db, 'games', game.id, 'questions'));
      const check = checkGameStart(game, qs.size);
      if (check.blocking) {
        setError(check.message || 'В игре нет вопросов');
        return;
      }
      if (check.message && !confirm(check.message)) return;
      const id = await createSession(game, user.uid);
      navigate(`/session/${id}`);
    } catch (e: any) {
      setError(e?.message || 'Не удалось создать сессию');
    } finally {
      setBusyId(null);
    }
  };

  const removeGame = async (game: Game) => {
    if (!confirm(`Удалить игру «${game.title}» и все её вопросы?`)) return;
    const qs = await getDocs(collection(db, 'games', game.id, 'questions'));
    await Promise.all(qs.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'games', game.id));
  };

  return (
    <div>
      <div className="qm-page-head">
        <div>
          <div className="qm-eyebrow">Кабинет автора</div>
          <h1 className="qm-title">Мои игры</h1>
          <p className="qm-subtitle">Привет, {userLogin || 'автор'}. Здесь твои игры и запуск сессий.</p>
        </div>
        <Link className="qm-btn qm-btn-primary qm-btn-lg" to="/games/new"><IconPlus size={18} /> Новая игра</Link>
      </div>

      {error && <div className="qm-card qm-danger-text">{error}</div>}

      {games.length === 0 ? (
        <div className="qm-card qm-empty">
          <span className="icon"><IconFolder size={40} /></span>
          <p>Пока нет игр. Создайте первую — это займёт минуту.</p>
          <Link className="qm-btn qm-btn-gold" to="/games/new">Создать игру</Link>
        </div>
      ) : (
        <div className="qm-grid">
          {games.map((game) => (
            <div className="qm-card" key={game.id}>
              <div className="qm-game">
                <div className="qm-game-main">
                  <div className={`qm-game-icon${game.type === 'svoya' ? ' svoya' : ''}`}>
                    {game.type === 'millionaire' ? <IconCoins size={26} /> : <IconBrain size={26} />}
                  </div>
                  <div>
                    <div className="qm-card-title">{game.title}</div>
                    <div className="qm-card-muted">
                      {game.type === 'millionaire' ? 'Кто хочет стать миллионером?' : 'Своя игра'}
                      {' · '}
                      <span className={`qm-badge ${game.status === 'ready' ? 'qm-badge-green' : 'qm-badge-gold'}`}>
                        {game.status === 'ready' ? 'готова' : game.status === 'archived' ? 'в архиве' : 'черновик'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="qm-game-actions">
                  <Link className="qm-btn qm-btn-ghost qm-btn-sm" to={`/games/${game.id}/edit`}>Редактировать</Link>
                  <button
                    className="qm-btn qm-btn-primary qm-btn-sm"
                    onClick={() => void startSession(game)}
                    disabled={busyId === game.id}
                  >
                    {busyId === game.id ? 'Создаём…' : 'Провести'}
                  </button>
                  <button
                    className="qm-btn qm-btn-danger qm-btn-sm"
                    onClick={() => void removeGame(game)}
                    title="Удалить игру"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
