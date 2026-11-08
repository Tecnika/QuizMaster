import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  MELODY_MIN_ROUND3,
  MELODY_SUPER_TRACKS,
  MELODY_TRACKS_PER_CATEGORY,
  melodySettings,
  type GameSettings,
  type Question,
} from '@quizmaster/shared';
import { IconMusic, IconTrash } from './icons';
import MediaField from './MediaField';

interface Props {
  gameId: string;
  questions: Question[];
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => Promise<void>;
}

const ROUND_NAMES = ['Первый тур', 'Второй тур', 'Третий тур', 'Суперигра'];

interface Slot {
  round: number;
  theme: string;
  value: number;
  order: number;
}

const slotOrder = (round: number, categoryIndex: number, number: number) =>
  round === 1 ? categoryIndex * MELODY_TRACKS_PER_CATEGORY + number : 100 + categoryIndex * MELODY_TRACKS_PER_CATEGORY + number;

export default function MelodyEditor({ gameId, questions, settings, onUpdateSettings }: Props) {
  const melody = melodySettings(settings);
  const categories = melody.categories;
  const [round, setRound] = useState(1);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [editing, setEditing] = useState<Question | null>(null);
  const [error, setError] = useState('');

  const tracks = useMemo(() => questions.filter((q) => q.round === round), [questions, round]);

  const counts = useMemo(() => {
    const withAudio = (roundNo: number) => questions.filter(
      (q) => q.round === roundNo && Boolean(q.audioUrl || q.audioMediaId),
    ).length;
    return { 1: withAudio(1), 2: withAudio(2), 3: withAudio(3), 4: withAudio(4) };
  }, [questions]);

  const openSlot = (next: Slot) => {
    setEditing(null);
    setSlot(next);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openQuestion = (q: Question) => {
    setSlot(null);
    setEditing(q);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setSlot(null);
    setEditing(null);
  };

  const remove = async (q: Question) => {
    if (!confirm('Удалить мелодию?')) return;
    await deleteDoc(doc(db, 'games', gameId, 'questions', q.id));
    if (editing?.id === q.id) closeForm();
  };

  const addTrack = () => {
    const index = questions.filter((q) => q.round === round).length;
    openSlot({
      round,
      theme: round === 3 ? 'Торги' : round === 4 ? 'Суперигра' : categories[0] ?? 'Мелодии',
      value: round === 4 ? 0 : 0,
      order: (round === 3 ? 200 : 300) + index,    });
  };

  const findSlot = (categoryIndex: number, number: number) =>
    questions.find((q) => q.round === round && q.order === slotOrder(round, categoryIndex, number));

  return (
    <div className="qm-editor">
      <div className="qm-card">
        <div className="qm-page-head" style={{ marginBottom: 0 }}>
          <div>
            <h2 className="qm-card-title">Мелодии</h2>
            <p className="qm-card-muted">
              Первый тур — 16 «нот», второй — 16 мелодий, третий — минимум {MELODY_MIN_ROUND3},
              суперигра — {MELODY_SUPER_TRACKS} мелодий.
            </p>
          </div>
          <span className="qm-badge qm-badge-gold">аудио обязательно</span>
        </div>
        <div className="qm-divider" />
        <div className="qm-grid qm-grid-4">
          {[1, 2, 3, 4].map((r) => (
            <div key={r} className="qm-stat" style={{ background: counts[r as 1 | 2 | 3 | 4] > 0 ? '#eaf6ee' : undefined }}>
              <b>{counts[r as 1 | 2 | 3 | 4]}</b>
              <span>{ROUND_NAMES[r - 1]}</span>
            </div>
          ))}
        </div>
        <div className="qm-inline qm-mt">
          {[1, 2, 3, 4].map((r) => (
            <button
              key={r}
              className={`qm-btn qm-btn-sm ${round === r ? 'qm-btn-primary' : 'qm-btn-ghost'}`}
              onClick={() => { setRound(r); closeForm(); }}
            >
              {ROUND_NAMES[r - 1]}
            </button>
          ))}
        </div>
      </div>

      {(slot || editing) && (
        <TrackForm
          key={editing?.id ?? `${slot?.round}-${slot?.order}`}
          gameId={gameId}
          question={editing ?? undefined}
          preset={slot ?? undefined}
          onClose={closeForm}
          onError={setError}
        />
      )}

      {round === 1 || round === 2 ? (
        <div className="qm-card">
          <div className="qm-page-head" style={{ marginBottom: '0.25rem' }}>
            <div>
              <div className="qm-eyebrow">{ROUND_NAMES[round - 1]}</div>
              <h2 className="qm-card-title">
                {round === 1 ? 'Четыре категории по четыре ноты' : 'Приз растёт, пока играет музыка'}
              </h2>
            </div>
            <span className="qm-badge qm-badge-blue">
              {round === 1 ? melody.round1Values.join(' · ') : `от ${melody.startPrize} +${melody.growthPerSecond}/сек`}
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="qm-melody-editor">
              <thead>
                <tr>
                  <th>Категория</th>
                  {[0, 1, 2, 3].map((n) => (
                    <th key={n}>
                      {round === 1
                        ? Number(melody.round1Values[n] ?? 0).toLocaleString('ru-RU')
                        : `№${n + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((category, ci) => (
                  <tr key={ci}>
                    <th>
                      <CategoryName
                        value={category}
                        onCommit={(name) => void renameCategory({
                          gameId,
                          settings,
                          melody,
                          questions,
                          onUpdateSettings,
                          index: ci,
                          name,
                        })}
                      />
                    </th>
                    {[0, 1, 2, 3].map((n) => {
                      const q = findSlot(ci, n);
                      return (
                        <td key={n}>
                          <button
                            className={`qm-melody-slot${q?.answer ? ' done' : ''}`}
                            onClick={() => (q ? openQuestion(q) : openSlot({
                              round,
                              theme: category,
                              value: round === 1 ? melody.round1Values[n] : melody.startPrize,
                              order: slotOrder(round, ci, n),
                            }))}
                          >
                            {q?.answer ? (
                              <>
                                <IconMusic size={16} />
                                <span>{q.answer}</span>
                              </>
                            ) : (
                              <span className="plus">+</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="qm-small qm-mt">
            Название категории меняется прямо в таблице. Значения первого тура —
            {' '}{melody.round1Values.join('/')}, второго — общий растущий приз.
          </p>
        </div>
      ) : (
        <div className="qm-card">
          <div className="qm-page-head" style={{ marginBottom: '0.5rem' }}>
            <div>
              <div className="qm-eyebrow">{ROUND_NAMES[round - 1]}</div>
              <h2 className="qm-card-title">
                {round === 3 ? 'Мелодии для торгов' : 'Семь мелодий за 30 секунд'}
              </h2>
              <p className="qm-card-muted">
                {round === 3
                  ? 'Ведущий даёт подсказку, игроки торгуются, с каких нот угадают.'
                  : 'Ведущий включает мелодии по одной; игрок должен угадать все семь.'}
              </p>
            </div>
            <button className="qm-btn qm-btn-primary qm-btn-sm" onClick={addTrack}>Добавить мелодию</button>
          </div>

          {tracks.length === 0 && (
            <p className="qm-small">Пока нет мелодий для этого тура.</p>
          )}

          {tracks.map((q) => (
            <div key={q.id} className="qm-editor-slot done">
              <div className="qm-slot-head">
                <div className="qm-inline">
                  <span className="qm-slot-num">{q.answer || 'Без названия'}</span>
                  {(q.audioUrl || q.audioMediaId)
                    ? <span className="qm-badge qm-badge-green">аудио</span>
                    : <span className="qm-badge qm-badge-red">нет аудио</span>}
                  {q.text && <span className="qm-badge">подсказка</span>}
                </div>
                <div className="qm-inline">
                  <button className="qm-btn qm-btn-ghost qm-btn-sm" onClick={() => openQuestion(q)}>Изменить</button>
                  <button className="qm-btn qm-btn-danger qm-btn-sm" onClick={() => void remove(q)} title="Удалить">
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
              {q.text && <div className="qm-small">Подсказка: {q.text}</div>}
            </div>
          ))}
        </div>
      )}

      {error && <div className="qm-card qm-danger-text">{error}</div>}
    </div>
  );
}

async function renameCategory({
  gameId,
  settings,
  melody,
  questions,
  onUpdateSettings,
  index,
  name,
}: {
  gameId: string;
  settings: GameSettings;
  melody: ReturnType<typeof melodySettings>;
  questions: Question[];
  onUpdateSettings: (settings: GameSettings) => Promise<void>;
  index: number;
  name: string;
}) {
  const trimmed = name.trim();
  const old = melody.categories[index];
  if (!trimmed || trimmed === old) return;
  const categories = [...melody.categories];
  categories[index] = trimmed;
  await onUpdateSettings({ ...settings, melody: { ...melody, categories } });
  await Promise.all(
    questions
      .filter((q) => (q.round === 1 || q.round === 2) && q.theme === old)
      .map((q) => updateDoc(doc(db, 'games', gameId, 'questions', q.id), { theme: trimmed })),
  );
}

function CategoryName({ value, onCommit }: { value: string; onCommit: (name: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      className="qm-input qm-category-input"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
      aria-label="Название категории"
    />
  );
}

function TrackForm({
  gameId,
  question,
  preset,
  onClose,
  onError,
}: {
  gameId: string;
  question?: Question;
  preset?: Slot;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const round = question?.round ?? preset?.round ?? 1;
  const theme = question?.theme ?? preset?.theme ?? '';
  const value = question?.value ?? preset?.value ?? 0;
  const order = question?.order ?? preset?.order ?? 0;

  const [answer, setAnswer] = useState(question?.answer ?? '');
  const [hint, setHint] = useState(question?.text ?? '');
  const [audioUrl, setAudioUrl] = useState(question?.audioUrl ?? '');
  const [audioMediaId, setAudioMediaId] = useState(question?.audioMediaId ?? '');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  const save = async () => {
    setLocalError('');
    if (!answer.trim()) return setLocalError('Введите название мелодии или исполнителя');
    if (!audioUrl.trim() && !audioMediaId) return setLocalError('Добавьте аудиофайл или ссылку');
    setSaving(true);
    const data = {
      order,
      round,
      theme,
      value,
      text: hint.trim(),
      answer: answer.trim(),
      audioUrl: audioUrl.trim(),
      audioMediaId: audioMediaId || '',
    };
    try {
      if (question) {
        await updateDoc(doc(db, 'games', gameId, 'questions', question.id), data);
      } else {
        await addDoc(collection(db, 'games', gameId, 'questions'), data);
      }
      onClose();
    } catch (e: any) {
      const message = e?.message || 'Не удалось сохранить мелодию';
      setLocalError(message);
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qm-card">
      <div className="qm-page-head" style={{ marginBottom: '0.5rem' }}>
        <div>
          <div className="qm-eyebrow">
            {ROUND_NAMES[round - 1]} · {theme}
            {round === 1 ? ` · ${value}` : ''}
          </div>
          <h2 className="qm-card-title">{question ? 'Изменить мелодию' : 'Новая мелодия'}</h2>
        </div>
        <button className="qm-btn qm-btn-ghost qm-btn-sm" onClick={onClose}>Закрыть</button>
      </div>

      <div className="qm-row">
        <div className="qm-field">
          <label className="qm-label">Название / исполнитель</label>
          <input
            className="qm-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Например, «Кино — Группа крови»"
            required
          />
        </div>
        <div className="qm-field">
          <label className="qm-label">Подсказка для ведущего</label>
          <input
            className="qm-input"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="О чём песня (нужно для третьего тура)"
          />
        </div>
      </div>

      <MediaField
        kind="audio"
        label="Аудиофрагмент"
        mediaId={audioMediaId}
        url={audioUrl}
        onChange={({ mediaId, url }) => { setAudioMediaId(mediaId); setAudioUrl(url); }}
      />

      {(localError) && <p className="qm-danger-text">{localError}</p>}

      <div className="qm-inline">
        <button className="qm-btn qm-btn-primary" onClick={() => void save()} disabled={saving}>
          {saving ? 'Сохраняем…' : question ? 'Сохранить изменения' : 'Добавить мелодию'}
        </button>
        {question && (
          <button
            className="qm-btn qm-btn-danger qm-btn-sm"
            onClick={async () => {
              if (!confirm('Удалить мелодию?')) return;
              await deleteDoc(doc(db, 'games', gameId, 'questions', question.id));
              onClose();
            }}
          >
            Удалить
          </button>
        )}
      </div>
    </div>
  );
}
