import { useState } from 'react';
import {
  quizRound,
  quizRoundSlots,
  quizRoundTypeLabel,
  quizSettings,
  type Participant,
  type Session,
} from '@quizmaster/shared';
import { QuestionAudio, QuestionImage } from './QuestionMedia';

type Payload = { choice?: number; text?: string };

export default function QuizPlayer({
  session,
  me,
  onSubmit,
  expired,
}: {
  session: Session;
  me: Participant;
  onSubmit: (payload: Payload) => Promise<void>;
  expired: boolean;
}) {
  const settings = session.quizConfig ?? quizSettings(null);
  const roundNo = session.quizRound ?? 1;
  const round = quizRound(settings, roundNo);
  const pq = session.publicQuestion;
  const total = quizRoundSlots(round);
  const index = session.quizQuestionIndex;

  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [pairs, setPairs] = useState<[number, number][]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<Payload | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!pq) {
    return (
      <div className="player-quiz">
        <div className="player-quiz-round">
          <span>{roundNo}. {round.name}</span>
          <span className="qm-badge qm-badge-gold">{me.score ?? 0} очк.</span>
        </div>
        <div className="player-status">Ведущий выбирает вопрос.</div>
      </div>
    );
  }

  const isChoice = round.type === 'choice' || round.type === 'blitz' && pq.options?.length === 4;
  const isPairs = round.type === 'pairs';
  const revealed = Boolean(session.revealedAnswer);

  const pairLabel = pairs.map(([a, b]) => `${a + 1}–${b + 1}`).join(', ');

  const tapPair = (i: number) => {
    const existing = pairs.findIndex((p) => p.includes(i));
    if (existing >= 0) {
      setPairs((prev) => prev.filter((_, idx) => idx !== existing));
      setPicked(i);
      return;
    }
    if (picked === null) {
      setPicked(i);
      return;
    }
    if (picked === i) {
      setPicked(null);
      return;
    }
    setPairs((prev) => [...prev, [picked, i]]);
    setPicked(null);
  };

  const submit = async () => {
    setError('');
    if (expired) return setError('Время вышло');
    let payload: Payload;
    if (isChoice) {
      if (selected === null) return setError('Выберите вариант');
      payload = { choice: selected };
    } else if (isPairs) {
      if (pairs.length !== 5) return setError('Составьте все пять пар');
      payload = { text: pairLabel };
    } else {
      if (!text.trim()) return setError('Введите ответ');
      payload = { text: text.trim() };
    }
    setSaving(true);
    try {
      await onSubmit(payload);
      setSubmitted(payload);
    } catch {
      setError('Не удалось отправить ответ. Попробуйте ещё раз.');
    } finally {
      setSaving(false);
    }
  };

  const submittedLabel = submitted
    ? submitted.choice != null
      ? `${'ABCD'[submitted.choice]} — ${pq.options?.[submitted.choice] ?? ''}`
      : submitted.text
    : '';

  return (
    <div className="player-quiz">
      <div className="player-quiz-round">
        <span>{roundNo}. {round.name}</span>
        <span className="qm-badge qm-badge-gold">{me.score ?? 0} очк.</span>
      </div>
      <div className="player-quiz-type">
        {quizRoundTypeLabel(round.type)}
        {index != null && ` · вопрос ${index + 1} из ${total}`}
        {pq.quizBonus ? ' · общий вопрос' : ''}
      </div>

      <div className="player-question">{pq.text}</div>
      <QuestionImage className="player-media" mediaId={pq.imageMediaId} src={pq.imageUrl} />
      <QuestionAudio className="player-melody-audio" mediaId={pq.audioMediaId} src={pq.audioUrl} />

      {revealed ? (
        <>
          <div className="player-status">
            Правильный ответ: <b style={{ color: '#7dffb0' }}>{session.revealedAnswer}</b>
          </div>
          {submittedLabel && (
            <div className="player-status player-quiz-sent">
              Ваш ответ: {submittedLabel}
            </div>
          )}
        </>
      ) : submitted ? (
        <div className="player-quiz-sent">
          <div className="qm-small">Ответ отправлен ведущему</div>
          <div className="player-quiz-sent-value">{submittedLabel}</div>
          {expired ? (
            <div className="qm-small">Время вышло</div>
          ) : (
            <button className="qm-btn qm-btn-ghost qm-btn-sm" onClick={() => setSubmitted(null)}>
              Изменить ответ
            </button>
          )}
        </div>
      ) : (
        <>
          {isChoice ? (
            <div className="player-answers">
              {(pq.options ?? []).map((option, i) => (
                <button
                  key={i}
                  className={`player-answer${selected === i ? ' selected' : ''}`}
                  onClick={() => setSelected(i)}
                >
                  <b style={{ color: '#ffd447' }}>{'ABCD'[i]}</b> {option}
                </button>
              ))}
            </div>
          ) : isPairs ? (
            <div className="player-quiz-pairs">
              <div className="qm-small">
                Нажмите два элемента, чтобы составить пару. Пар должно быть пять.
              </div>
              <div className="player-quiz-pair-grid">
                {(pq.options ?? []).map((option, i) => {
                  const paired = pairs.findIndex((p) => p.includes(i)) >= 0;
                  return (
                    <button
                      key={i}
                      className={`player-quiz-pair-btn${picked === i ? ' picked' : ''}${paired ? ' paired' : ''}`}
                      onClick={() => tapPair(i)}
                    >
                      <b>{i + 1}</b> {option}
                    </button>
                  );
                })}
              </div>
              {pairs.length > 0 && (
                <div className="player-quiz-pairs-list">
                  {pairs.map(([a, b], i) => (
                    <span key={i} className="qm-badge qm-badge-gold">{a + 1}–{b + 1}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="player-quiz-form">
              <label className="qm-label" htmlFor="quiz-answer">Ваш ответ</label>
              <textarea
                id="quiz-answer"
                className="qm-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Введите ответ команды"
                rows={3}
              />
            </div>
          )}

          {error && <div className="player-toast">{error}</div>}
          <button
            className="qm-btn qm-btn-gold qm-btn-block qm-btn-lg qm-mt"
            disabled={saving || expired}
            onClick={() => void submit()}
          >
            {expired ? 'Время вышло' : saving ? 'Отправляем…' : 'Отправить ответ'}
          </button>
          <div className="player-quiz-note">Ответ можно изменить до показа результата.</div>
        </>
      )}
    </div>
  );
}
