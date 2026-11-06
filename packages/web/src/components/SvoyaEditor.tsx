import { Fragment, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  SVOYA_DEFAULT_ROUNDS,
  type GameSettings,
  type Question,
  type QuestionKind,
} from '@quizmaster/shared';

interface Props {
  gameId: string;
  questions: Question[];
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => Promise<void>;
}

const kindLabel: Record<QuestionKind, string> = {
  normal: 'обычный',
  cat: 'кот в мешке',
  auction: 'аукцион',
};

export default function SvoyaEditor({ gameId, questions, settings, onUpdateSettings }: Props) {
  const rounds = settings.rounds?.length ? settings.rounds : SVOYA_DEFAULT_ROUNDS;

  const [round, setRound] = useState(1);
  const [theme, setTheme] = useState('');
  const [value, setValue] = useState(rounds[0]?.values[0] ?? 100);
  const [kind, setKind] = useState<QuestionKind>('normal');
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');
  const [comment, setComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const themes = useMemo(
    () => Array.from(new Set(questions.map((q) => q.theme).filter(Boolean) as string[])).sort(),
    [questions],
  );

  const currentValues = rounds[round - 1]?.values ?? [];

  const resetForm = () => {
    setEditingId(null);
    setTheme('');
    setText('');
    setAnswer('');
    setComment('');
    setKind('normal');
    setError('');
  };

  const changeRound = (next: number) => {
    setRound(next);
    const values = rounds[next - 1]?.values ?? [];
    if (!values.includes(value)) setValue(values[0] ?? 0);
  };

  const save = async () => {
    setError('');
    if (!theme.trim()) return setError('Укажите тему');
    if (!text.trim()) return setError('Введите текст вопроса');
    if (!answer.trim()) return setError('Введите правильный ответ');
    setSaving(true);
    const data = {
      round,
      theme: theme.trim(),
      value,
      kind: settings.allowSpecial === false ? 'normal' : kind,
      text: text.trim(),
      answer: answer.trim(),
      comment: comment.trim(),
    };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'games', gameId, 'questions', editingId), data);
      } else {
        await addDoc(collection(db, 'games', gameId, 'questions'), {
          ...data,
          order: Date.now(),
        });
      }
      resetForm();
    } catch (e: any) {
      setError(e?.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const edit = (q: Question) => {
    setEditingId(q.id);
    setRound(q.round ?? 1);
    setTheme(q.theme ?? '');
    setValue(q.value ?? 0);
    setKind(q.kind ?? 'normal');
    setText(q.text ?? '');
    setAnswer(q.answer ?? '');
    setComment(q.comment ?? '');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (q: Question) => {
    if (!confirm('Удалить вопрос?')) return;
    await deleteDoc(doc(db, 'games', gameId, 'questions', q.id));
    if (editingId === q.id) resetForm();
  };

  return (
    <div>
      <div className="qm-card">
        <h2 className="qm-card-title">Настройки «Своей игры»</h2>
        <p className="qm-card-muted">Раунды и стоимости заданы классическими. Можно включить спецвопросы и финал.</p>
        <div className="qm-divider" />
        <div className="qm-inline" style={{ gap: '1.5rem' }}>
          <label className="qm-inline" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox" className="qm-radio"
              checked={settings.allowSpecial !== false}
              onChange={(e) => void onUpdateSettings({ ...settings, allowSpecial: e.target.checked })}
            />
            «Кот в мешке» и «Аукцион»
          </label>
          <label className="qm-inline" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox" className="qm-radio"
              checked={settings.finalRound === true}
              onChange={(e) => void onUpdateSettings({ ...settings, finalRound: e.target.checked })}
            />
            Финальный раунд
          </label>
        </div>
        <div className="qm-divider" />
        <div className="qm-grid qm-grid-3">
          {rounds.map((r, i) => {
            const count = questions.filter((q) => q.round === i + 1).length;
            return (
              <div className="qm-stat" key={r.name}>
                <b>{count}</b>
                <span>{r.name} · {r.values.join('/')}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="qm-card">
        <h2 className="qm-card-title">{editingId ? 'Изменить вопрос' : 'Новый вопрос'}</h2>
        <div className="qm-row">
          <div className="qm-field">
            <label className="qm-label">Раунд</label>
            <select className="qm-select" value={round} onChange={(e) => changeRound(Number(e.target.value))}>
              {rounds.map((r, i) => (
                <option key={r.name} value={i + 1}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="qm-field">
            <label className="qm-label">Стоимость</label>
            <select className="qm-select" value={value} onChange={(e) => setValue(Number(e.target.value))}>
              {currentValues.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="qm-field">
            <label className="qm-label">Тип</label>
            <select
              className="qm-select" value={kind}
              onChange={(e) => setKind(e.target.value as QuestionKind)}
              disabled={settings.allowSpecial === false}
            >
              <option value="normal">обычный</option>
              <option value="cat">кот в мешке</option>
              <option value="auction">аукцион</option>
            </select>
          </div>
        </div>

        <div className="qm-field">
          <label className="qm-label">Тема</label>
          <input
            className="qm-input" value={theme} list="svoya-themes"
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Например, «История»"
          />
          <datalist id="svoya-themes">
            {themes.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>

        <div className="qm-field">
          <label className="qm-label">Текст вопроса</label>
          <textarea
            className="qm-textarea" value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Этот писатель владел имением Ясная Поляна"
          />
        </div>
        <div className="qm-row">
          <div className="qm-field">
            <label className="qm-label">Правильный ответ</label>
            <input
              className="qm-input" value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Лев Толстой"
            />
          </div>
          <div className="qm-field">
            <label className="qm-label">Комментарий</label>
            <input
              className="qm-input" value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Необязательно"
            />
          </div>
        </div>

        {error && <p className="qm-danger-text">{error}</p>}
        <div className="qm-inline">
          <button className="qm-btn qm-btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? 'Сохраняем…' : editingId ? 'Сохранить изменения' : 'Добавить вопрос'}
          </button>
          {editingId && (
            <button className="qm-btn qm-btn-ghost" onClick={resetForm}>Отмена</button>
          )}
        </div>
      </div>

      {rounds.map((r, i) => {
        const roundNo = i + 1;
        const roundQuestions = questions.filter((q) => q.round === roundNo);
        if (roundQuestions.length === 0) return null;
        const roundThemes = Array.from(new Set(roundQuestions.map((q) => q.theme as string))).sort();
        return (
          <div className="qm-card" key={r.name}>
            <div className="qm-page-head" style={{ marginBottom: '0.5rem' }}>
              <div>
                <div className="qm-eyebrow">{r.name}</div>
                <h2 className="qm-card-title">Вопросы: {roundQuestions.length}</h2>
              </div>
              <span className="qm-badge qm-badge-blue">{r.values.join(' · ')}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `150px repeat(${r.values.length}, minmax(52px, 1fr))`, gap: 4, minWidth: 420 }}>
                <div />
                {r.values.map((v) => (
                  <div key={v} className="qm-badge qm-center" style={{ justifyContent: 'center' }}>{v}</div>
                ))}
                {roundThemes.map((t) => (
                  <Fragment key={t}>
                    <div className="qm-small" style={{ fontWeight: 700, alignSelf: 'center' }}>{t}</div>
                    {r.values.map((v) => {
                      const q = roundQuestions.find((x) => x.theme === t && x.value === v);
                      return (
                        <div
                          key={v}
                          className="qm-center"
                          title={q ? q.text : 'нет вопроса'}
                          style={{
                            padding: '0.35rem',
                            borderRadius: 6,
                            border: `1px solid ${q ? '#9cc7ac' : '#d9c6a4'}`,
                            background: q ? '#eaf6ee' : 'rgba(255,255,255,0.35)',
                            color: q ? 'var(--green)' : '#b9a888',
                            fontWeight: 700,
                            cursor: q ? 'pointer' : 'default',
                          }}
                          onClick={() => q && edit(q)}
                        >
                          {q ? (q.kind === 'cat' ? '🐱' : q.kind === 'auction' ? '🔨' : '✓') : '·'}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="qm-mt">
              {roundThemes.map((t) => (
                <div key={t} className="qm-mt">
                  <div className="qm-eyebrow">{t}</div>
                  {roundQuestions.filter((q) => q.theme === t).sort((a, b) => (a.value ?? 0) - (b.value ?? 0)).map((q) => (
                    <div key={q.id} className="qm-editor-slot done">
                      <div className="qm-slot-head">
                        <div className="qm-inline">
                          <span className="qm-slot-num">{q.value}</span>
                          <span className={`qm-badge ${q.kind === 'cat' ? 'qm-badge-gold' : q.kind === 'auction' ? 'qm-badge-red' : ''}`}>
                            {kindLabel[q.kind ?? 'normal']}
                          </span>
                        </div>
                        <div className="qm-inline">
                          <button className="qm-btn qm-btn-ghost qm-btn-sm" onClick={() => edit(q)}>Изменить</button>
                          <button className="qm-btn qm-btn-danger qm-btn-sm" onClick={() => void remove(q)}>Удалить</button>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{q.text}</div>
                      <div className="qm-small">Ответ: {q.answer}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {questions.length === 0 && (
        <div className="qm-card qm-empty">
          <span className="icon">🧩</span>
          <p>Пока нет вопросов. Добавьте первый — табло соберётся автоматически.</p>
        </div>
      )}
    </div>
  );
}
