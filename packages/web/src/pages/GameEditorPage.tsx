import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { createSession } from '../lib/session';
import { checkGameStart } from '../lib/gameStart';
import MillionaireEditor from '../components/MillionaireEditor';
import SvoyaEditor from '../components/SvoyaEditor';
import type { Game, GameSettings, Question } from '@quizmaster/shared';

export default function GameEditorPage() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!gameId || !user) return;
    const unsub = onSnapshot(doc(db, 'games', gameId), (snap) => {
      if (!snap.exists()) {
        navigate('/cabinet');
        return;
      }
      const data = { id: snap.id, ...snap.data() } as Game;
      if (data.authorId !== user.uid) {
        navigate('/cabinet');
        return;
      }
      setGame(data);
    });
    return () => unsub();
  }, [gameId, user, navigate]);

  useEffect(() => {
    if (!gameId) return;
    const q = query(collection(db, 'games', gameId, 'questions'), orderBy('order', 'asc'));
    return onSnapshot(q, (snap) => {
      setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Question)));
    });
  }, [gameId]);

  useEffect(() => {
    if (game) {
      setTitle(game.title || '');
      setDescription(game.description || '');
    }
  }, [game?.id]);

  if (!game) {
    return <div className="qm-card qm-center">Загрузка…</div>;
  }

  const saveMeta = async (patch: Partial<Game> = {}) => {
    if (!gameId) return;
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'games', gameId), {
        title: title.trim() || game.title,
        description: description.trim(),
        ...patch,
        updatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      setError(e?.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = async (settings: GameSettings) => {
    if (!gameId) return;
    await updateDoc(doc(db, 'games', gameId), {
      settings,
      updatedAt: new Date().toISOString(),
    });
  };

  const startSession = async () => {
    if (!user) return;
    setStarting(true);
    setError('');
    try {
      const check = checkGameStart(game, questions.length);
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
      setStarting(false);
    }
  };

  return (
    <div>
      <p><Link className="qm-link" to="/cabinet">← В кабинет</Link></p>

      <div className="qm-card">
        <div className="qm-page-head">
          <div>
            <div className="qm-eyebrow">
              {game.type === 'millionaire' ? 'Миллионер' : 'Своя игра'} · редактор
            </div>
            <h1 className="qm-title">{game.title}</h1>
            <p className="qm-subtitle">
              {game.type === 'millionaire'
                ? 'Заполните 15 вопросов лестницы.'
                : 'Соберите табло: раунды, темы и стоимости.'}
            </p>
          </div>
          <div className="qm-inline">
            <button
              className={`qm-btn qm-btn-sm ${game.status === 'ready' ? 'qm-btn-ghost' : 'qm-btn-gold'}`}
              onClick={() => void saveMeta({ status: game.status === 'ready' ? 'draft' : 'ready' })}
              disabled={saving}
            >
              {game.status === 'ready' ? 'Вернуть в черновик' : 'Отметить готовой'}
            </button>
            <button className="qm-btn qm-btn-primary qm-btn-sm" onClick={() => void startSession()} disabled={starting}>
              {starting ? 'Создаём…' : 'Провести'}
            </button>
          </div>
        </div>

        <div className="qm-divider" />
        <div className="qm-row">
          <div className="qm-field">
            <label className="qm-label">Название</label>
            <input className="qm-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">Описание</label>
            <input className="qm-input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="qm-row">
          <div className="qm-field">
            <label className="qm-label">Лимит времени на вопрос</label>
            <select
              className="qm-select"
              value={game.settings?.timeLimitSeconds ?? 60}
              onChange={(e) => void updateSettings({ ...(game.settings || {}), timeLimitSeconds: Number(e.target.value) })}
            >
              <option value={0}>без ограничения</option>
              <option value={30}>30 секунд</option>
              <option value={60}>60 секунд</option>
              <option value={90}>90 секунд</option>
              <option value={120}>120 секунд</option>
            </select>
          </div>
        </div>
        <div className="qm-inline">
          <button className="qm-btn qm-btn-ghost" onClick={() => void saveMeta()} disabled={saving}>
            {saving ? 'Сохраняем…' : 'Сохранить название'}
          </button>
          <span className={`qm-badge ${game.status === 'ready' ? 'qm-badge-green' : 'qm-badge-gold'}`}>
            {game.status === 'ready' ? 'готова к игре' : 'черновик'}
          </span>
        </div>
        {error && <p className="qm-danger-text">{error}</p>}
      </div>

      {game.type === 'millionaire' ? (
        <MillionaireEditor gameId={game.id} questions={questions} />
      ) : (
        <SvoyaEditor
          gameId={game.id}
          questions={questions}
          settings={game.settings || {}}
          onUpdateSettings={updateSettings}
        />
      )}
    </div>
  );
}
