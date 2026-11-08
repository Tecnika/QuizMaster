import {
  quizRound,
  quizRoundSlots,
  quizRoundTypeLabel,
  quizSettings,
  type Participant,
  type Session,
} from '@quizmaster/shared';
import { QuestionAudio, QuestionImage } from './QuestionMedia';

export default function QuizPlayer({
  session,
  me,
}: {
  session: Session;
  me: Participant;
}) {
  const settings = session.quizConfig ?? quizSettings(null);
  const roundNo = session.quizRound ?? 1;
  const round = quizRound(settings, roundNo);
  const pq = session.publicQuestion;
  const total = quizRoundSlots(round);
  const index = session.quizQuestionIndex;

  return (
    <div className="player-quiz">
      <div className="player-quiz-round">
        <span>{roundNo}. {round.name}</span>
        <span className="qm-badge qm-badge-gold">{me.score ?? 0} очк.</span>
      </div>
      <div className="player-quiz-type">
        {quizRoundTypeLabel(round.type)}
        {index != null && ` · вопрос ${index + 1} из ${total}`}
        {pq?.quizBonus ? ' · общий вопрос' : ''}
      </div>

      {pq ? (
        <>
          <div className="player-question">{pq.text}</div>
          <QuestionImage className="player-media" mediaId={pq.imageMediaId} src={pq.imageUrl} />
          <QuestionAudio className="player-melody-audio" mediaId={pq.audioMediaId} src={pq.audioUrl} />

          {pq.options?.length ? (
            round.type === 'pairs' ? (
              <div className="player-quiz-pairs">
                {pq.options.map((option, i) => (
                  <span key={i} className="player-quiz-pair"><b>{i + 1}</b>{option}</span>
                ))}
              </div>
            ) : (
              <div className="player-answers">
                {pq.options.map((option, i) => (
                  <div key={i} className="player-answer" style={{ cursor: 'default' }}>
                    <b style={{ color: '#ffd447' }}>{'ABCD'[i]}</b> {option}
                  </div>
                ))}
              </div>
            )
          ) : null}

          {session.revealedAnswer ? (
            <div className="player-status">
              Ответ: <b style={{ color: '#7dffb0' }}>{session.revealedAnswer}</b>
            </div>
          ) : (
            <div className="player-status player-quiz-note">
              Обсудите ответ командой и сдайте бланк ведущему.
            </div>
          )}
        </>
      ) : (
        <div className="player-status">Ведущий выбирает вопрос.</div>
      )}
    </div>
  );
}
