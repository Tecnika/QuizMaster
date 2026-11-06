import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import {
  MILLIONAIRE_LADDER,
  MILLIONAIRE_SAFE_HAVENS,
  SVOYA_DEFAULT_ROUNDS,
  type GameType,
} from '@quizmaster/shared';
import { IconBrain, IconCoins } from '../components/icons';

export default function NewGamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GameType>('millionaire');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      setError('Введите название игры');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const now = new Date().toISOString();
      const settings = type === 'millionaire'
        ? { ladder: MILLIONAIRE_LADDER, safeHavens: MILLIONAIRE_SAFE_HAVENS }
        : { rounds: SVOYA_DEFAULT_ROUNDS, allowSpecial: true, finalRound: false };
      const ref = await addDoc(collection(db, 'games'), {
        title: title.trim(),
        description: description.trim(),
        type,
        authorId: user.uid,
        status: 'draft',
        settings,
        createdAt: now,
        updatedAt: now,
      });
      navigate(`/games/${ref.id}/edit`);
    } catch (e: any) {
      setError(e?.message || 'Не удалось создать игру');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="qm-container-narrow" style={{ margin: '0 auto' }}>
      <p><Link className="qm-link" to="/cabinet">← В кабинет</Link></p>
      <div className="qm-card">
        <div className="qm-eyebrow">Шаг 1 из 2</div>
        <h1 className="qm-title">Новая игра</h1>
        <p className="qm-subtitle qm-mb">Выберите формат — потом добавим вопросы.</p>
        <form onSubmit={handleSubmit}>
          <div className="qm-field">
            <label className="qm-label" htmlFor="title">Название</label>
            <input
              id="title" className="qm-input" value={title}
              onChange={(e) => setTitle(e.target.value)} placeholder="Например, «Новогодний турнир»"
              required
            />
          </div>
          <div className="qm-field">
            <label className="qm-label" htmlFor="desc">Описание (необязательно)</label>
            <textarea
              id="desc" className="qm-textarea" value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Для кого игра, сколько команд ждём…"
            />
          </div>

          <div className="qm-label">Формат</div>
          <div className="qm-grid qm-grid-2 qm-mb">
            <button
              type="button"
              className={`qm-card qm-feature${type === 'millionaire' ? ' qm-selected' : ''}`}
              onClick={() => setType('millionaire')}
              style={{ textAlign: 'left', cursor: 'pointer', borderColor: type === 'millionaire' ? 'var(--green)' : undefined, boxShadow: type === 'millionaire' ? '0 0 0 3px rgba(31,77,58,.2)' : undefined }}
            >
              <div className="icon"><IconCoins size={32} /></div>
              <h3>Кто хочет стать миллионером?</h3>
              <p>15 вопросов, лестница сумм, несгораемые рубежи, подсказки.</p>
            </button>
            <button
              type="button"
              className="qm-card qm-feature"
              onClick={() => setType('svoya')}
              style={{ textAlign: 'left', cursor: 'pointer', borderColor: type === 'svoya' ? 'var(--green)' : undefined, boxShadow: type === 'svoya' ? '0 0 0 3px rgba(31,77,58,.2)' : undefined }}
            >
              <div className="icon"><IconBrain size={32} /></div>
              <h3>Своя игра</h3>
              <p>Табло тем и стоимостей, раунды, «Кот в мешке», «Аукцион», финал.</p>
            </button>
          </div>

          {error && <p className="qm-danger-text">{error}</p>}
          <button className="qm-btn qm-btn-primary qm-btn-block qm-btn-lg" type="submit" disabled={busy}>
            {busy ? 'Создаём…' : 'Создать и перейти к вопросам'}
          </button>
        </form>
      </div>
    </div>
  );
}
