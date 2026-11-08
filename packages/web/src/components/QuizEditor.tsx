import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  quizPairsLabel,
  quizRound,
  quizRoundSlots,
  quizRoundTypeLabel,
  quizSettings,
  type GameSettings,
  type Question,
} from '@quizmaster/shared';
import { IconTrash, IconUsers } from './icons';
import MediaField from './MediaField';

interface Props {
  gameId: string;
  questions: Question[];
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => Promise<void>;
}

const slotOrder = (round: number, index: number, bonus: boolean) => round * 100 + (bonus ? 99 : index);

export default function QuizEditor({ gameId, questions, settings, onUpdateSettings }: Props) {
  const quiz = quizSettings(settings);
  const [roundNo, setRoundNo] = useState(1);
  const [editing, setEditing] = useState<Question | null>(null);
  const [slot, setSlot] = useState<{ round: number; index: number; bonus: boolean } | null>(null);
  const [error, setError] = useState('');

  const round = quizRound(quiz, roundNo);
  const slots = quizRoundSlots(round);
  const roundQuestions = useMemo(
    () => questions.filter((q) => q.quizRound === roundNo),
    [questions, roundNo],
  );

  const filledCount = (r: number) => {
    const cfg = quizRound(quiz, r);
    const expected = quizRoundSlots(cfg);
    const actual = questions.filter((q) => q.quizRound === r && q.answer).length;
    return { actual, expected };
  };

  const findSlot = (index: number, bonus: boolean) => questions.find(
    (q) => q.quizRound === roundNo && q.order === slotOrder(roundNo, index, bonus),
  );

  const openSlot = (index: number, bonus: boolean) => {
    setEditing(null);
    setSlot({ round: roundNo, index, bonus });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openQuestion = (q: Question) => {
    setSlot(null);
    setEditing(q);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const close = () => {
    setSlot(null);
    setEditing(null);
  };

  const remove = async (q: Question) => {
    if (!confirm('Удалить вопрос?')) return;
    await deleteDoc(doc(db, 'games', gameId, 'questions', q.id));
    if (editing?.id === q.id) close();
  };

  const saveSettings = async (patch: { timePerQuestion?: number; bonusPoints?: number }) => {
    await onUpdateSettings({
      ...settings,
      timeLimitSeconds: patch.timePerQuestion ?? settings.timeLimitSeconds,
      quiz: { ...quiz, ...patch },
    });
  };

  return (
    <div className="qm-editor">
      <div className="qm-card">
        <div className="qm-page-head" style={{ marginBottom: 0 }}>
          <div>
            <h2 className="qm-card-title">Классический квиз</h2>
            <p className="qm-card-muted">
              7 раундов, 51 вопрос. Команды пишут ответы на бланках, ведущий отмечает верные.
            </p>
          </div>
          <span className="qm-badge qm-badge-gold">51 вопрос</span>
        </div>
        <div className="qm-divider" />
        <div className="qm-grid qm-grid-4">
          {quiz.rounds.map((r, i) => {
            const { actual, expected } = filledCount(i + 1);
            return (
              <div key={r.name} className="qm-stat" style={{ background: actual >= expected ? '#eaf6ee' : undefined }}>
                <b>{actual}/{expected}</b>
                <span>{r.name}</span>
              </div>
            );
          })}
        </div>
        <div className="qm-inline qm-mt">
          {quiz.rounds.map((r, i) => (
            <button
              key={r.name}
              className={`qm-btn qm-btn-sm ${roundNo === i + 1 ? 'qm-btn-primary' : 'qm-btn-ghost'}`}
              onClick={() => { setRoundNo(i + 1); close(); }}
            >
              {r.name}
            </button>
          ))}
        </div>
        <div className="qm-row qm-mt">
          <div className="qm-field">
            <label className="qm-label">Время на вопрос, секунд</label>
            <input
              className="qm-input"
              type="number"
              min={0}
              max={300}
              defaultValue={quiz.timePerQuestion}
              onBlur={(e) => void saveSettings({ timePerQuestion: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="qm-field">
            <label className="qm-label">Бонус за общий вопрос</label>
            <input
              className="qm-input"
              type="number"
              min={0}
              max={50}
              defaultValue={quiz.bonusPoints}
              onBlur={(e) => void saveSettings({ bonusPoints: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>

      {(slot || editing) && (
        <QuestionForm
          key={editing?.id ?? `${slot?.round}-${slot?.index}-${slot?.bonus}`}
          gameId={gameId}
          question={editing ?? undefined}
          preset={slot ?? undefined}
          roundType={round.type}
          roundName={round.name}
          points={round.points}
          onClose={close}
        />
      )}

      <div className="qm-card">
        <div className="qm-page-head" style={{ marginBottom: '0.5rem' }}>
          <div>
            <div className="qm-eyebrow">Раунд {roundNo}</div>
            <h2 className="qm-card-title">{round.name}</h2>
            <p className="qm-card-muted">
              {quizRoundTypeLabel(round.type)} · {round.points} {round.points === 1 ? 'очко' : 'очка'} за верный ответ
            </p>
          </div>
          <span className="qm-badge qm-badge-blue">
            {roundQuestions.filter((q) => q.answer).length} из {slots}
          </span>
        </div>

        <div className="qm-quiz-slots">
          {Array.from({ length: slots }, (_, index) => {
            const bonus = round.type === 'backstage' && index === round.count;
            const q = findSlot(index, bonus);
            return (
              <button
                key={index}
                className={`qm-quiz-slot${q?.answer ? ' done' : ''}${bonus ? ' bonus' : ''}`}
                onClick={() => (q ? openQuestion(q) : openSlot(index, bonus))}
              >
                <span className="num">{bonus ? '★' : index + 1}</span>
                <span className="text">
                  {q?.answer ? q.text || q.answer : bonus ? 'Общий вопрос' : 'Добавить вопрос'}
                </span>
                {q && <span className="badge">{round.points} очк.</span>}
              </button>
            );
          })}
        </div>

        {round.type === 'casino' && (
          <p className="qm-small qm-mt">
            В «Казино» ведущий перед вопросом записывает ставки команд, а после ответа отмечает
            «верно» или «неверно»: верный ответ прибавляет ставку, неверный — вычитает.
          </p>
        )}
        {round.type === 'pairs' && (
          <p className="qm-small qm-mt">
            В «Папараме» у вопроса 10 элементов: команды составляют из них 5 пар.
          </p>
        )}
      </div>

      {roundQuestions.length > 0 && (
        <div className="qm-card">
          <h2 className="qm-card-title">Вопросы раунда</h2>
          {roundQuestions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((q) => (
              <div key={q.id} className="qm-editor-slot done">
                <div className="qm-slot-head">
                  <div className="qm-inline">
                    <span className="qm-slot-num">{q.quizBonus ? '★' : q.order % 100 + 1}</span>
                    <span className="qm-badge">{q.quizBonus ? 'общий вопрос' : `${round.points} очк.`}</span>
                    {(q.imageUrl || q.imageMediaId || q.audioUrl || q.audioMediaId) && (
                      <span className="qm-badge qm-badge-blue">медиа</span>
                    )}
                    {q.pairs?.length ? <span className="qm-badge qm-badge-green">{q.pairs.length} пар</span> : null}
                  </div>
                  <div className="qm-inline">
                    <button className="qm-btn qm-btn-ghost qm-btn-sm" onClick={() => openQuestion(q)}>Изменить</button>
                    <button className="qm-btn qm-btn-danger qm-btn-sm" onClick={() => void remove(q)} title="Удалить">
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ fontWeight: 700 }}>{q.text}</div>
                <div className="qm-small">Ответ: {q.answer}</div>
              </div>
            ))}
        </div>
      )}

      {error && <div className="qm-card qm-danger-text">{error}</div>}

      {questions.length === 0 && (
        <div className="qm-card qm-empty">
          <span className="icon"><IconUsers size={40} /></span>
          <p>Пока нет вопросов. Начните с «Разминки» — семь вопросов с вариантами.</p>
        </div>
      )}

      <p className="qm-small">
        Подсказка: в «Пошумим» загрузите аудиофрагмент, в «Папараме» заполните 10 элементов
        и пять правильных пар. Ответы команд ведущий отмечает на пульте сессии.
      </p>
    </div>
  );
}

function QuestionForm({
  gameId,
  question,
  preset,
  roundType,
  roundName,
  points,
  onClose,
}: {
  gameId: string;
  question?: Question;
  preset?: { round: number; index: number; bonus: boolean };
  roundType: string;
  roundName: string;
  points: number;
  onClose: () => void;
}) {
  const roundNo = question?.quizRound ?? preset?.round ?? 1;
  const bonus = question?.quizBonus ?? preset?.bonus ?? false;
  const index = question?.order != null && !bonus ? question.order % 100 : preset?.index ?? 0;
  const order = question?.order ?? slotOrder(roundNo, index, bonus);

  const [text, setText] = useState(question?.text ?? '');
  const [answer, setAnswer] = useState(question?.answer ?? '');
  const [comment, setComment] = useState(question?.comment ?? '');
  const [options, setOptions] = useState<string[]>(() => {
    const base = [...(question?.options ?? [])];
    if (roundType === 'pairs') {
      while (base.length < 10) base.push('');
      return base.slice(0, 10);
    }
    while (base.length < 4) base.push('');
    return base.slice(0, 4);
  });
  const [correct, setCorrect] = useState<number | null>(question?.correctIndex ?? null);
  const [pairs, setPairs] = useState<[number, number][]>(() => {
    const base = question?.pairs ?? [];
    const out: [number, number][] = base.map(([a, b]) => [a, b]);
    while (out.length < 5) out.push([0, 1]);
    return out.slice(0, 5);
  });
  const [imageUrl, setImageUrl] = useState(question?.imageUrl ?? '');
  const [audioUrl, setAudioUrl] = useState(question?.audioUrl ?? '');
  const [imageMediaId, setImageMediaId] = useState(question?.imageMediaId ?? '');
  const [audioMediaId, setAudioMediaId] = useState(question?.audioMediaId ?? '');
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState('');

  const changeOption = (i: number, value: string) => {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  };

  const changePair = (i: number, side: 0 | 1, value: number) => {
    setPairs((prev) => prev.map((pair, idx) => (
      idx === i ? (side === 0 ? [value, pair[1]] : [pair[0], value]) as [number, number] : pair
    )));
  };

  const save = async () => {
    setLocalError('');
    if (!text.trim()) return setLocalError('Введите текст вопроса');

    let data: Record<string, unknown> = {
      order,
      quizRound: roundNo,
      quizBonus: bonus,
      text: text.trim(),
      comment: comment.trim(),
      imageUrl: imageUrl.trim(),
      audioUrl: audioUrl.trim(),
      imageMediaId: imageMediaId || '',
      audioMediaId: audioMediaId || '',
    };

    if (roundType === 'choice') {
      const cleaned = options.map((o) => o.trim());
      if (cleaned.some((o) => !o)) return setLocalError('Заполните все четыре варианта');
      if (correct === null) return setLocalError('Отметьте правильный вариант');
      data = { ...data, options: cleaned, correctIndex: correct, answer: cleaned[correct] };
    } else if (roundType === 'pairs') {
      const cleaned = options.map((o) => o.trim());
      if (cleaned.some((o) => !o)) return setLocalError('Заполните все 10 элементов');
      const used = new Set<number>();
      for (const [a, b] of pairs) {
        if (aidInvalid(a, b, used)) return setLocalError('Пары не должны повторять элементы и сами себя');
      }
      if (used.size !== 10) return setLocalError('В пяти парах должны быть задействованы все 10 элементов');
      data = { ...data, options: cleaned, pairs, answer: quizPairsLabel(pairs) };
    } else {
      if (!answer.trim()) return setLocalError('Введите правильный ответ');
      data = { ...data, answer: answer.trim() };
      if (roundType === 'media' && !audioUrl.trim() && !audioMediaId && !imageUrl.trim() && !imageMediaId) {
        return setLocalError('Добавьте аудио или картинку для медиа-вопроса');
      }
    }

    setSaving(true);
    try {
      if (question) {
        await updateDoc(doc(db, 'games', gameId, 'questions', question.id), data);
      } else {
        await addDoc(collection(db, 'games', gameId, 'questions'), data);
      }
      onClose();
    } catch (e: any) {
      setLocalError(e?.message || 'Не удалось сохранить вопрос');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="qm-card">
      <div className="qm-page-head" style={{ marginBottom: '0.5rem' }}>
        <div>
          <div className="qm-eyebrow">{roundName} · {points} очк. {bonus ? '· общий вопрос' : ''}</div>
          <h2 className="qm-card-title">{question ? 'Изменить вопрос' : 'Новый вопрос'}</h2>
        </div>
        <button className="qm-btn qm-btn-ghost qm-btn-sm" onClick={onClose}>Закрыть</button>
      </div>

      <div className="qm-field">
        <label className="qm-label">Текст вопроса</label>
        <textarea
          className="qm-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Например, «Какая планета ближе всего к Солнцу?»"
          required
        />
      </div>

      {roundType === 'choice' ? (
        <>
          <div className="qm-label">Варианты (отметьте правильный)</div>
          {options.map((opt, i) => (
            <div key={i} className={`qm-option-row${correct === i ? ' correct' : ''}`}>
              <span className="qm-option-letter">{'ABCD'[i]}</span>
              <input
                className="qm-input"
                value={opt}
                onChange={(e) => changeOption(i, e.target.value)}
                placeholder={`Вариант ${'ABCD'[i]}`}
                required
              />
              <input
                className="qm-radio"
                type="radio"
                name={`quiz-correct-${order}`}
                checked={correct === i}
                onChange={() => setCorrect(i)}
                title="Правильный ответ"
              />
            </div>
          ))}
        </>
      ) : roundType === 'pairs' ? (
        <>
          <div className="qm-label">10 элементов</div>
          {options.map((opt, i) => (
            <div key={i} className="qm-inline qm-mt" style={{ gap: '0.5rem' }}>
              <span className="qm-badge">{i + 1}</span>
              <input
                className="qm-input"
                value={opt}
                onChange={(e) => changeOption(i, e.target.value)}
                placeholder={`Элемент ${i + 1}`}
                required
              />
            </div>
          ))}
          <div className="qm-label qm-mt">Пять правильных пар</div>
          {pairs.map(([a, b], i) => (
            <div key={i} className="qm-inline qm-mt" style={{ gap: '0.5rem' }}>
              <span className="qm-badge">{i + 1}</span>
              <select className="qm-select" value={a} onChange={(e) => changePair(i, 0, Number(e.target.value))}>
                {options.map((opt, idx) => (
                  <option key={idx} value={idx}>{idx + 1}{opt ? ` · ${opt}` : ''}</option>
                ))}
              </select>
              <span>—</span>
              <select className="qm-select" value={b} onChange={(e) => changePair(i, 1, Number(e.target.value))}>
                {options.map((opt, idx) => (
                  <option key={idx} value={idx}>{idx + 1}{opt ? ` · ${opt}` : ''}</option>
                ))}
              </select>
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="qm-row">
            <div className="qm-field">
              <label className="qm-label">Правильный ответ</label>
              <input
                className="qm-input"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Ответ для ведущего"
                required
              />
            </div>
            <div className="qm-field">
              <label className="qm-label">Комментарий</label>
              <input
                className="qm-input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Необязательно"
              />
            </div>
          </div>

          {roundType === 'media' && (
            <div className="qm-row">
              <MediaField
                kind="image"
                label="Картинка"
                mediaId={imageMediaId}
                url={imageUrl}
                onChange={({ mediaId, url }) => { setImageMediaId(mediaId); setImageUrl(url); }}
              />
              <MediaField
                kind="audio"
                label="Аудио"
                mediaId={audioMediaId}
                url={audioUrl}
                onChange={({ mediaId, url }) => { setAudioMediaId(mediaId); setAudioUrl(url); }}
              />
            </div>
          )}
        </>
      )}

      {localError && <p className="qm-danger-text">{localError}</p>}

      <div className="qm-inline">
        <button className="qm-btn qm-btn-primary" onClick={() => void save()} disabled={saving}>
          {saving ? 'Сохраняем…' : question ? 'Сохранить изменения' : 'Добавить вопрос'}
        </button>
        {question && (
          <button
            className="qm-btn qm-btn-danger qm-btn-sm"
            onClick={async () => {
              if (!confirm('Удалить вопрос?')) return;
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

function aidInvalid(a: number, b: number, used: Set<number>): boolean {
  if (a === b) return true;
  if (used.has(a) || used.has(b)) return true;
  used.add(a);
  used.add(b);
  return false;
}
