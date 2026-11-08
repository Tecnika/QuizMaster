import {
  quizRound,
  quizRoundSlots,
  quizRoundTypeLabel,
  quizSettings,
  type Participant,
  type Session,
} from '@quizmaster/shared';
import { QuestionAudio, QuestionImage } from './QuestionMedia';

export default function QuizScreen({
  session,
  participants,
}: {
  session: Session;
  participants: Participant[];
}) {
  const settings = session.quizConfig ?? quizSettings(null);
  const roundNo = session.quizRound ?? 1;
  const round = quizRound(settings, roundNo);
  const pq = session.publicQuestion;
  const total = quizRoundSlots(round);
  const index = session.quizQuestionIndex;
  const bets = pq ? session.quizBets?.[pq.id] ?? {} : {};

  return (
    <div className="quiz-stage quiz-screen">
      <div className="quiz-teams">
        {[...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p) => (
          <div key={p.id} className="quiz-team">
            <span className="name">{p.name}</span>
            <span className="pts">{(p.score ?? 0).toLocaleString('ru-RU')}</span>
          </div>
        ))}
      </div>

      <div className="quiz-screen-round">
        <span>{roundNo}. {round.name}</span>
        <span className="qm-badge qm-badge-gold">{quizRoundTypeLabel(round.type)}</span>
        {index != null && (
          <span className="qm-badge">
            {pq?.quizBonus ? 'общий вопрос' : `вопрос ${index + 1} из ${total}`}
          </span>
        )}
      </div>

      {pq ? (
        <>
          <div className="quiz-question">{pq.text}</div>
          <QuestionImage className="tv-media" mediaId={pq.imageMediaId} src={pq.imageUrl} />
          <QuestionAudio className="tv-audio" mediaId={pq.audioMediaId} src={pq.audioUrl} />

          {pq.options?.length ? (
            round.type === 'pairs' ? (
              <div className="quiz-pairs">
                {pq.options.map((option, i) => (
                  <span key={i} className="quiz-pair-item"><b>{i + 1}</b>{option}</span>
                ))}
              </div>
            ) : (
              <div className="quiz-options">
                {pq.options.map((option, i) => (
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

          {round.type === 'casino' && !session.revealedAnswer && (
            <div className="quiz-bets-screen">
              {Object.entries(bets).map(([id, bet]) => (
                <span key={id} className="qm-badge qm-badge-gold">
                  {participants.find((p) => p.id === id)?.name}: ставка {bet}
                </span>
              ))}
            </div>
          )}

          {session.revealedAnswer ? (
            <div className="quiz-answer">Ответ: <b>{session.revealedAnswer}</b></div>
          ) : (
            <div className="quiz-screen-hint">Команды отправляют ответы с телефонов. Ведущий объявит результат.</div>
          )}
        </>
      ) : (
        <div className="quiz-empty">
          <h2>{round.name}</h2>
          <p>Ведущий выбирает вопрос.</p>
        </div>
      )}
    </div>
  );
}
