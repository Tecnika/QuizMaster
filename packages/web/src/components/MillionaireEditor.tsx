import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MILLIONAIRE_LADDER, MILLIONAIRE_SAFE_HAVENS, type Question } from '@quizmaster/shared';

interface Props {
  gameId: string;
  questions: Question[];
}

export default function MillionaireEditor({ gameId, questions }: Props) {
  const byOrder = new Map(questions.map((q) => [q.order, q]));
  const filled = questions.filter((q) => q.text && q.options && q.options.length === 4).length;

  return (
    <div className="qm-editor">
      <div className="qm-card">
        <div className="qm-page-head" style={{ marginBottom: 0 }}>
          <div>
            <h2 className="qm-card-title">Лестница вопросов</h2>
            <p className="qm-card-muted">15 вопросов, по 3 на уровень. Заполнено: {filled} из 15.</p>
          </div>
          <span className={`qm-badge ${filled === 15 ? 'qm-badge-green' : 'qm-badge-gold'}`}>
            {filled === 15 ? 'готова' : 'черновик'}
          </span>
        </div>
        <div className="qm-divider" />
        <div className="qm-grid qm-grid-4">
          {MILLIONAIRE_LADDER.map((amount, i) => {
            const safe = MILLIONAIRE_SAFE_HAVENS.includes(i + 1);
            const done = Boolean(byOrder.get(i)?.text);
            return (
              <div key={i} className="qm-stat" style={{ background: done ? '#eaf6ee' : undefined }}>
                <b style={{ color: safe ? 'var(--burgundy)' : 'var(--green)' }}>{amount.toLocaleString('ru-RU')}</b>
                <span>{i + 1}{safe ? ' · несгораемый' : ''}</span>
              </div>
            );
          })}
        </div>
      </div>

      {Array.from({ length: 15 }, (_, i) => (
        <Slot key={i} index={i} question={byOrder.get(i)} gameId={gameId} />
      ))}
    </div>
  );
}

function Slot({ index, question, gameId }: { index: number; question?: Question; gameId: string }) {
  const [open, setOpen] = useState(!question?.text);
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (question) {
      setText(question.text || '');
      const opts = [...(question.options || [])];
      while (opts.length < 4) opts.push('');
      setOptions(opts.slice(0, 4));
      setCorrect(question.correctIndex ?? 0);
      setComment(question.comment || '');
    } else {
      setText('');
      setOptions(['', '', '', '']);
      setCorrect(0);
      setComment('');
    }
  }, [question?.id]);

  const amount = MILLIONAIRE_LADDER[index] ?? 0;
  const safe = MILLIONAIRE_SAFE_HAVENS.includes(index + 1);
  const level = Math.floor(index / 3) + 1;

  const save = async () => {
    setError('');
    const cleaned = options.map((o) => o.trim());
    if (!text.trim()) return setError('Введите текст вопроса');
    if (cleaned.some((o) => !o)) return setError('Заполните все четыре варианта');
    setSaving(true);
    const data = {
      order: index,
      level,
      text: text.trim(),
      options: cleaned,
      correctIndex: correct,
      answer: cleaned[correct],
      comment: comment.trim(),
    };
    try {
      if (question) {
        await updateDoc(doc(db, 'games', gameId, 'questions', question.id), data);
      } else {
        await addDoc(collection(db, 'games', gameId, 'questions'), data);
      }
      setOpen(false);
    } catch (e: any) {
      setError(e?.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!question) return;
    if (!confirm('Удалить вопрос?')) return;
    await deleteDoc(doc(db, 'games', gameId, 'questions', question.id));
  };

  return (
    <div className={`qm-editor-slot${question?.text ? ' done' : ''}`}>
      <div className="qm-slot-head">
        <div className="qm-inline">
          <span className="qm-slot-num">№{index + 1}</span>
          <span className="qm-badge">уровень {level}</span>
          <span className={`qm-badge ${safe ? 'qm-badge-red' : 'qm-badge-green'}`}>
            {amount.toLocaleString('ru-RU')}
            {safe ? ' · несгораемый' : ''}
          </span>
        </div>
        <div className="qm-inline">
          {question?.text && !open && (
            <button className="qm-btn qm-btn-ghost qm-btn-sm" onClick={() => setOpen(true)}>Изменить</button>
          )}
          {question && (
            <button className="qm-btn qm-btn-danger qm-btn-sm" onClick={() => void remove()}>Удалить</button>
          )}
          {open && question?.text && (
            <button className="qm-btn qm-btn-ghost qm-btn-sm" onClick={() => setOpen(false)}>Свернуть</button>
          )}
        </div>
      </div>

      {!open && question?.text ? (
        <div>
          <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{question.text}</div>
          <div className="qm-small">
            Верно: <b>{'ABCD'[question.correctIndex ?? 0]}</b> — {question.options?.[question.correctIndex ?? 0]}
          </div>
        </div>
      ) : (
        <div>
          <div className="qm-field">
            <label className="qm-label">Текст вопроса</label>
            <textarea
              className="qm-textarea" value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Кто написал «Войну и мир»?"
            />
          </div>
          <div className="qm-label">Варианты ответа (отметьте правильный)</div>
          {options.map((opt, i) => (
            <div key={i} className={`qm-option-row${correct === i ? ' correct' : ''}`}>
              <span className="qm-option-letter">{'ABCD'[i]}</span>
              <input
                className="qm-input" value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  setOptions(next);
                }}
                placeholder={`Вариант ${'ABCD'[i]}`}
              />
              <input
                className="qm-radio" type="radio" name={`correct-${index}`}
                checked={correct === i} onChange={() => setCorrect(i)}
                title="Правильный ответ"
              />
            </div>
          ))}
          <div className="qm-field qm-mt">
            <label className="qm-label">Комментарий (необязательно)</label>
            <input
              className="qm-input" value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Пояснение для ведущего"
            />
          </div>
          {error && <p className="qm-danger-text">{error}</p>}
          <div className="qm-inline">
            <button className="qm-btn qm-btn-primary" onClick={() => void save()} disabled={saving}>
              {saving ? 'Сохраняем…' : 'Сохранить вопрос'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
