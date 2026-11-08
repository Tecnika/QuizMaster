import { doc, updateDoc } from 'firebase/firestore';
import {
  formatCountdown,
  quizCorrectCount,
  quizQuestionsOfRound,
  quizRound,
  quizRoundSlots,
  quizRoundTypeLabel,
  quizScores,
  quizSettings,
  type Answer,
  type Game,
  type Participant,
  type PublicQuestion,
  type Question,
  type Session,
} from '@quizmaster/shared';
import { db } from '../lib/firebase';
import { QuestionAudio, QuestionImage } from './QuestionMedia';

interface Props {
  session: Session;
  sessionId: string;
  game: Game;
  participants: Participant[];
  questions: Question[];
  answers: Answer[];
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  onFinish: () => Promise<void>;
  timerLimit: number;
  timeLeft: number | null;
  startTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
}

function quizPublic(q: Question): PublicQuestion {
  const out: PublicQuestion = { id: q.id, text: q.text };
  if (q.options) out.options = q.options;
  if (q.imageUrl) out.imageUrl = q.imageUrl;
  if (q.audioUrl) out.audioUrl = q.audioUrl;
  if (q.imageMediaId) out.imageMediaId = q.imageMediaId;
  if (q.audioMediaId) out.audioMediaId = q.audioMediaId;
  if (q.quizRound != null) out.quizRound = q.quizRound;
  if (q.quizBonus) out.quizBonus = true;
  return out;
}

export default function QuizHost({
  session,
  sessionId,
  game,
  participants,
  questions,
  answers,
  onPatch,
  onFinish,
  timerLimit,
  timeLeft,
  startTimer,
  stopTimer,
}: Props) {
  const settings = quizSettings(game.settings);
  const roundNo = session.quizRound ?? 1;
  const round = quizRound(settings, roundNo);
  const roundQuestions = quizQuestionsOfRound(questions, roundNo);
  const active = questions.find((q) => q.id === session.activeCellId) ?? null;
  const marks = session.quizMarks ?? {};
  const bets = session.quizBets ?? {};
  const activeMarks = active ? marks[active.id] ?? {} : {};
  const activeBets = active ? bets[active.id] ?? {} : {};
  const activeIndex = active ? roundQuestions.findIndex((q) => q.id === active.id) : -1;

  const latestByTeam = new Map<string, Answer>();
  if (active) {
    for (const answer of answers) {
      if (answer.questionId === active.id && answer.type !== 'buzz') {
        latestByTeam.set(answer.participantId, answer);
      }
    }
  }

  const answerText = (answer: Answer) => {
    if (answer.choice != null && active?.options?.[answer.choice] != null) {
      return `${'ABCD'[answer.choice]} — ${active.options[answer.choice]}`;
    }
    return answer.text || '—';
  };

  const answerHint = (answer: Answer): 'match' | 'mismatch' | 'manual' => {
    if (!active) return 'manual';
    if (round.type === 'pairs') return 'manual';
    if (answer.choice != null && active.correctIndex != null) {
      return answer.choice === active.correctIndex ? 'match' : 'mismatch';
    }
    if (answer.text && active.answer) {
      const norm = (value: string) => value.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/gi, '');
      return norm(answer.text) === norm(active.answer) ? 'match' : 'manual';
    }
    return 'manual';
  };

  const sortedTeams = [...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const applyScores = async (
    nextMarks: Record<string, Record<string, boolean>>,
    nextBets: Record<string, Record<string, number>>,
  ) => {
    await onPatch({ quizMarks: nextMarks, quizBets: nextBets });
    const scores = quizScores({
      questions,
      marks: nextMarks,
      bets: nextBets,
      settings,
      participants,
    });
    await Promise.all(participants.map((p) => (
      (p.score ?? 0) === scores[p.id]
        ? Promise.resolve()
        : updateDoc(doc(db, 'sessions', sessionId, 'participants', p.id), { score: scores[p.id] })
    )));
  };

  const openQuestion = async (q: Question) => {
    await onPatch({
      activeCellId: q.id,
      quizQuestionIndex: roundQuestions.findIndex((item) => item.id === q.id),
      publicQuestion: quizPublic(q),
      revealedAnswer: null,
      revealedCorrectIndex: null,
      timer: null,
    });
  };

  const closeQuestion = async () => {
    await onPatch({
      activeCellId: null,
      quizQuestionIndex: null,
      publicQuestion: null,
      revealedAnswer: null,
      revealedCorrectIndex: null,
      timer: null,
    });
  };

  const nextQuestion = async () => {
    if (!roundQuestions.length) return;
    const next = roundQuestions[Math.min(activeIndex + 1, roundQuestions.length - 1)];
    if (next) await openQuestion(next);
  };

  const prevQuestion = async () => {
    if (!roundQuestions.length) return;
    const prev = roundQuestions[Math.max(activeIndex - 1, 0)];
    if (prev) await openQuestion(prev);
  };

  const switchRound = async (next: number) => {
    await onPatch({
      quizRound: next,
      activeCellId: null,
      quizQuestionIndex: null,
      publicQuestion: null,
      revealedAnswer: null,
      revealedCorrectIndex: null,
      timer: null,
    });
  };

  const setMark = (p: Participant, value: boolean) => {
    if (!active) return;
    const current = activeMarks[p.id];
    const nextValue = current === value ? undefined : value;
    const nextQuestionMarks = { ...activeMarks };
    if (nextValue === undefined) delete nextQuestionMarks[p.id];
    else nextQuestionMarks[p.id] = nextValue;
    void applyScores({ ...marks, [active.id]: nextQuestionMarks }, bets);
  };

  const setBet = (p: Participant, raw: string) => {
    if (!active) return;
    const value = Math.max(0, Math.floor(Number(raw) || 0));
    void applyScores(marks, {
      ...bets,
      [active.id]: { ...activeBets, [p.id]: value },
    });
  };

  const reveal = async () => {
    if (!active) return;
    await onPatch({
      revealedAnswer: active.answer,
      revealedCorrectIndex: active.correctIndex ?? null,
    });
  };

  return (
    <div className="quiz-stage">
      <div className="quiz-teams">
        {sortedTeams.map((p) => (
          <div key={p.id} className="quiz-team">
            <span className="name">{p.name}</span>
            <span className="pts">{(p.score ?? 0).toLocaleString('ru-RU')}</span>
          </div>
        ))}
      </div>

      <div className="qm-inline quiz-rounds">
        {settings.rounds.map((r, i) => (
          <button
            key={r.name}
            className={`tv-icon-btn${roundNo === i + 1 ? ' active' : ''}`}
            onClick={() => void switchRound(i + 1)}
          >
            {i + 1}. {r.name}
          </button>
        ))}
        <button className="tv-icon-btn" style={{ marginLeft: 'auto' }} onClick={() => void onFinish()}>
          Завершить игру
        </button>
      </div>

      {round.type === 'casino' && (
        <div className="quiz-hint">
          Казино: ставки команд записываются до ответа. Верный ответ прибавляет ставку, неверный — вычитает.
        </div>
      )}

      <div className="quiz-layout">
        <aside className="quiz-question-list">
          <div className="quiz-list-title">{round.name}</div>
          {roundQuestions.map((q, i) => {
            const marked = Object.keys(marks[q.id] ?? {}).length > 0;
            return (
              <button
                key={q.id}
                className={`quiz-list-item${q.id === active?.id ? ' active' : ''}${marked ? ' marked' : ''}`}
                onClick={() => void openQuestion(q)}
              >
                <span>{q.quizBonus ? '★' : i + 1}</span>
                <span className="label">{q.quizBonus ? 'общий' : q.text.slice(0, 34) || 'вопрос'}</span>
              </button>
            );
          })}
          <div className="quiz-list-foot">
            Открыто {roundQuestions.filter((q) => Object.keys(marks[q.id] ?? {}).length > 0).length} из {quizRoundSlots(round)}
          </div>
        </aside>

        <div className="quiz-main">
          {!active ? (
            <div className="quiz-empty">
              <h2>{round.name}</h2>
              <p>{quizRoundTypeLabel(round.type)} · {round.points} очк. за верный ответ</p>
              <p>Выберите вопрос слева.</p>
            </div>
          ) : (
            <>
              <div className="quiz-question-head">
                <span>{active.quizBonus ? 'Общий вопрос' : `Вопрос ${activeIndex + 1} из ${roundQuestions.length}`}</span>
                <span>{active.quizBonus ? `бонус +${settings.bonusPoints}` : `${round.points} очк.`}</span>
                {timeLeft != null && (
                  <span className={`tv-timer-small${timeLeft === 0 ? ' warning' : ''}`}>
                    {timeLeft > 0 ? formatCountdown(timeLeft) : 'Время вышло'}
                  </span>
                )}
              </div>

              <div className="quiz-question">{active.text}</div>

              <QuestionImage className="tv-media" mediaId={active.imageMediaId} src={active.imageUrl} />
              <QuestionAudio className="tv-audio" mediaId={active.audioMediaId} src={active.audioUrl} />
              <div className="tv-answer-key">Ответ ведущего: {active.answer}</div>

              {active.options?.length ? (
                round.type === 'pairs' ? (
                  <div className="quiz-pairs">
                    {active.options.map((option, i) => (
                      <span key={i} className="quiz-pair-item"><b>{i + 1}</b>{option}</span>
                    ))}
                  </div>
                ) : (
                  <div className="quiz-options">
                    {active.options.map((option, i) => (
                      <div
                        key={i}
                        className={`quiz-option${session.revealedCorrectIndex === i ? ' correct' : ''}`}
                      >
                        <span className="letter">{'ABCD'[i]}</span>
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                )
              ) : null}

              {active.quizBonus && (
                <div className="quiz-hint">
                  Общий вопрос раунда: за верный ответ команда получает +{settings.bonusPoints}.
                </div>
              )}

              <div className="quiz-actions">
                <button className="tv-icon-btn" onClick={() => void prevQuestion()}>←</button>
                <button className="tv-icon-btn" onClick={() => void stopTimer()}>Стоп</button>
                <button className="tv-icon-btn" onClick={() => void startTimer()} disabled={!timerLimit}>
                  {timerLimit ? `Таймер ${timerLimit}с` : 'Таймер'}
                </button>
                <button className="tv-icon-btn" onClick={() => void reveal()}>
                  {session.revealedAnswer ? 'Ответ показан' : 'Показать ответ'}
                </button>
                <button className="tv-icon-btn" onClick={() => void nextQuestion()}>Следующий →</button>
                <button className="tv-icon-btn" onClick={() => void closeQuestion()}>Закрыть</button>
              </div>

              {session.revealedAnswer && (
                <div className="quiz-answer">Ответ: <b>{session.revealedAnswer}</b></div>
              )}

              {round.type === 'casino' && (
                <div className="quiz-bets">
                  <div className="qm-label">Ставки команд</div>
                  <div className="quiz-bet-grid">
                    {participants.map((p) => (
                      <label key={p.id} className="quiz-bet">
                        <span>{p.name}</span>
                        <input
                          className="qm-input"
                          type="number"
                          min={0}
                          value={activeBets[p.id] ?? ''}
                          onChange={(e) => setBet(p, e.target.value)}
                          placeholder={String(round.points)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="quiz-marking">
                <div className="qm-label">
                  Ответы и проверка · {latestByTeam.size} из {participants.length}
                </div>
                {participants.map((p) => {
                  const mark = activeMarks[p.id];
                  const answer = latestByTeam.get(p.id);
                  const hint = answer ? answerHint(answer) : 'manual';
                  return (
                    <div key={p.id} className={`quiz-mark-row${mark === true ? ' correct' : mark === false ? ' wrong' : ''}`}>
                      <div className="quiz-mark-team">
                        <span className="name">{p.name}</span>
                        <span className="score">{p.score ?? 0}</span>
                      </div>
                      <div className="quiz-mark-answer">
                        {answer ? (
                          <>
                            <span className="answer-value">{answerText(answer)}</span>
                            {hint === 'match' && <span className="quiz-answer-flag match">совпадает</span>}
                            {hint === 'mismatch' && <span className="quiz-answer-flag mismatch">не совпадает</span>}
                            {hint === 'manual' && <span className="quiz-answer-flag">сверьте вручную</span>}
                          </>
                        ) : (
                          <span className="empty">ответ не отправлен</span>
                        )}
                      </div>
                      <div className="quiz-mark-actions">
                        <button
                          className={`tv-icon-btn${mark === true ? ' ok' : ''}`}
                          onClick={() => setMark(p, true)}
                          title="Верно"
                        >
                          ✓ Верно
                        </button>
                        <button
                          className={`tv-icon-btn${mark === false ? ' bad' : ''}`}
                          onClick={() => setMark(p, false)}
                          title="Неверно"
                        >
                          ✕ Неверно
                        </button>
                      </div>
                    </div>
                  );
                })}
                <p className="qm-small">
                  Отмечено верно: {quizCorrectCount(marks, active.id)}. Ведущий проверяет присланные ответы
                  и ставит отметку; повторное нажатие снимает её.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
