import {
  MELODY_DEFAULT_SETTINGS,
  MELODY_SUPER_TRACKS,
  melodyBiddingWinner,
  melodyRoundLabel,
  type MelodySettings,
  type Participant,
  type Session,
} from '@quizmaster/shared';
import { useCountdown } from '../lib/useCountdown';
import { IconCheck } from './icons';
import { QuestionAudio } from './QuestionMedia';

export default function MelodyPlayer({
  session,
  participants,
  me,
  settings,
  sent,
  expired,
  onBuzz,
}: {
  session: Session;
  participants: Participant[];
  me: Participant;
  settings?: MelodySettings;
  sent: boolean;
  expired: boolean;
  onBuzz: () => void;
}) {
  const melody = settings ?? MELODY_DEFAULT_SETTINGS;
  const round = session.melodyRound ?? 1;
  const pq = session.publicQuestion;
  const points = session.melodyPoints ?? {};
  const outIds = session.melodyOut ?? [];
  const skipped = (session.melodySkips?.[me.id] ?? 0) > 0;
  const isOut = outIds.includes(me.id);
  const biddingWinner = melodyBiddingWinner(points, melody.pointsToWin);
  const superState = session.melodySuper;
  const superLeft = useCountdown(
    superState ? superState.startedAt + melody.superSeconds * 1000 : null,
  );

  return (
    <div className="player-melody">
      <div className="player-melody-round">
        <span>{melodyRoundLabel(round)}</span>
        {round >= 3 && <span className="qm-badge qm-badge-gold">торги: {points[me.id] ?? 0}</span>}
        {biddingWinner === me.id && <span className="qm-badge qm-badge-green">вы в суперигре</span>}
      </div>

      {isOut && <div className="player-status">Вы выбыли после второго тура, но можете слушать и болеть.</div>}
      {skipped && round === 1 && (
        <div className="player-status">Штраф: пропустите ещё {session.melodySkips?.[me.id]} мелодии.</div>
      )}

      {round === 4 ? (
        <div className="player-status">
          {superState ? (
            <>
              <div className="player-melody-super">
                {superLeft != null && superLeft > 0 ? `${superLeft} с` : 'Время вышло'}
              </div>
              <div>
                Найдено {superState.found.length} из {MELODY_SUPER_TRACKS}
              </div>
              {biddingWinner === me.id && <div style={{ marginTop: 8 }}>Вы играете суперигру. Слушайте ведущего!</div>}
            </>
          ) : (
            'Суперигра ещё не началась.'
          )}
        </div>
      ) : pq ? (
        <>
          {round === 3 && (
            <div className="player-melody-hint">
              <div className="qm-small" style={{ color: '#ffd447' }}>Подсказка ведущего</div>
              {pq.text || 'Слушайте мелодию'}
            </div>
          )}

          <QuestionAudio className="player-melody-audio" mediaId={pq.audioMediaId} src={pq.audioUrl} />

          {session.revealedAnswer ? (
            <div className="player-status">
              <span className="qm-inline" style={{ justifyContent: 'center', color: '#7dffb0' }}>
                <IconCheck size={18} /> {session.revealedAnswer}
              </span>
            </div>
          ) : (
            <>
              {round === 1 && (
                <div className="player-melody-cat">{pq.theme}</div>
              )}
              {round === 3 && (
                <>
                  <div className="player-melody-bids">
                    {Object.entries(session.melodyBids ?? {}).map(([id, notes]) => (
                      <span key={id} className="qm-badge">
                        {participants.find((p) => p.id === id)?.name}: с {notes} нот
                      </span>
                    ))}
                  </div>
                  {session.buzzedParticipantId === me.id ? (
                    <div className="player-status">Отвечаете вы — назовите мелодию вслух.</div>
                  ) : session.buzzedParticipantId ? (
                    <div className="player-status">
                      Отвечает: {participants.find((p) => p.id === session.buzzedParticipantId)?.name}
                    </div>
                  ) : (
                    <div className="player-status">Идёт выбор отвечающего.</div>
                  )}
                </>
              )}

              {round <= 2 && (
                <>
                  <button
                    className="player-buzz"
                    disabled={sent || expired || skipped || isOut || Boolean(session.buzzedParticipantId)}
                    onClick={onBuzz}
                  >
                    {sent
                      ? 'Нажатие отправлено'
                      : session.buzzedParticipantId === me.id
                        ? 'Вы нажали первым — отвечайте!'
                        : 'Я знаю!'}
                  </button>
                  {session.buzzedParticipantId && session.buzzedParticipantId !== me.id && (
                    <div className="player-status">
                      Отвечает: {participants.find((p) => p.id === session.buzzedParticipantId)?.name}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      ) : (
        <div className="player-status">Ведущий выбирает мелодию.</div>
      )}
    </div>
  );
}
