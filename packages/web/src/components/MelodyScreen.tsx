import { useEffect, useState } from 'react';
import {
  MELODY_SUPER_TRACKS,
  melodyBiddingWinner,
  melodyPrizeAt,
  melodyRoundLabel,
  melodySettings,
  type MelodySettings,
  type Participant,
  type Session,
  type SvoyaCell,
} from '@quizmaster/shared';
import { QuestionAudio, QuestionImage } from './QuestionMedia';

export default function MelodyScreen({
  session,
  participants,
}: {
  session: Session;
  participants: Participant[];
}) {
  const settings: MelodySettings = session.melodyConfig ?? melodySettings(null);
  const board: SvoyaCell[] = session.board ?? [];
  const round = session.melodyRound ?? 1;
  const points = session.melodyPoints ?? {};
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  const pq = session.publicQuestion;
  const roundCells = board.filter((c) => c.round === round);
  const categories = Array.from(new Set(roundCells.map((c) => c.theme)));
  const prize = round === 2 && session.melodyPrizeStartedAt
    ? melodyPrizeAt(settings.startPrize, settings.growthPerSecond, session.melodyPrizeStartedAt, now)
    : session.melodyPrize ?? 0;
  const superState = session.melodySuper;
  const superLeft = superState
    ? Math.max(0, settings.superSeconds - Math.floor((now - superState.startedAt) / 1000))
    : settings.superSeconds;
  const biddingWinner = melodyBiddingWinner(points, settings.pointsToWin);

  return (
    <div className="melody-stage melody-screen">
      <div className="melody-scores">
        {[...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p) => (
          <div key={p.id} className={`melody-score${session.buzzedParticipantId === p.id ? ' active' : ''}`}>
            <span className="name">{p.name}</span>
            <span className="pts">{(p.score ?? 0).toLocaleString('ru-RU')}</span>
            {round >= 3 && <span className="note">торги: {points[p.id] ?? 0}</span>}
          </div>
        ))}
      </div>

      <div className="melody-screen-round">
        <span>{melodyRoundLabel(round)}</span>
        {round === 2 && prize > 0 && <span className="melody-prize">{prize.toLocaleString('ru-RU')}</span>}
        {round === 4 && superState && (
          <span className={`melody-prize${superLeft === 0 ? ' warning' : ''}`}>
            {superLeft > 0 ? `${superLeft} с` : 'Время вышло'}
          </span>
        )}
        {round === 4 && superState && (
          <span className="qm-badge qm-badge-gold">
            найдено {superState.found.length} из {MELODY_SUPER_TRACKS}
          </span>
        )}
      </div>

      {round <= 3 && (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="melody-board">
              <thead>
                <tr>
                  <th>Категория</th>
                  {(round === 1 ? [0, 1, 2, 3] : round === 2 ? [0, 1, 2, 3] : [0]).map((n) => (
                    <th key={n}>
                      {round === 1
                        ? Number(settings.round1Values[n] ?? 0).toLocaleString('ru-RU')
                        : round === 2 ? `№${n + 1}` : 'Мелодия'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(round === 3 ? ['Торги'] : categories).map((theme) => (
                  <tr key={theme}>
                    <th>{theme}</th>
                    {(round === 3 ? [0] : [0, 1, 2, 3]).map((n) => {
                      const cells = round === 3 ? roundCells : roundCells.filter((c) => c.theme === theme);
                      const cell = cells[n];
                      if (!cell) return <td key={n} />;
                      return (
                        <td key={n}>
                          <div className={`melody-cell${cell.used ? ' used' : ''}`}>
                            {cell.used ? '—' : round === 1 ? cell.value : '♪'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {round === 3 && (
            <div className="melody-track-list">
              {roundCells.map((cell, i) => (
                <span key={cell.questionId} className={`melody-track-btn${cell.used ? ' used' : ''}`}>
                  Мелодия {i + 1}
                </span>
              ))}
            </div>
          )}

          {pq ? (
            <div className="melody-current">
              <div className="melody-current-head">
                <span>{pq.theme}{round === 3 ? ' · торги' : ''}</span>
              </div>
              {round === 3 && <div className="melody-hint">{pq.text || 'Ведущий даёт подсказку'}</div>}
              <QuestionAudio className="tv-audio" mediaId={pq.audioMediaId} src={pq.audioUrl} />
              {pq.imageUrl || pq.imageMediaId ? (
                <QuestionImage className="tv-media" mediaId={pq.imageMediaId} src={pq.imageUrl} />
              ) : null}
              {session.revealedAnswer && (
                <div className="melody-revealed">
                  <span>Ответ: <b>{session.revealedAnswer}</b></span>
                </div>
              )}
              {!session.revealedAnswer && round <= 2 && (
                <div className="melody-screen-hint">Угадайте мелодию и нажмите кнопку на телефоне</div>
              )}
              {round === 3 && !session.revealedAnswer && (
                <div className="melody-bids-screen">
                  {Object.entries(session.melodyBids ?? {}).map(([id, notes]) => (
                    <span key={id} className="qm-badge qm-badge-gold">
                      {participants.find((p) => p.id === id)?.name}: с {notes} нот
                    </span>
                  ))}
                  {session.buzzedParticipantId && (
                    <span className="qm-badge qm-badge-blue">
                      отвечает: {participants.find((p) => p.id === session.buzzedParticipantId)?.name}
                    </span>
                  )}
                </div>
              )}
              {round === 3 && biddingWinner && (
                <div className="melody-screen-hint">
                  Победитель торгов: {participants.find((p) => p.id === biddingWinner)?.name} · очки {points[biddingWinner]}
                </div>
              )}
            </div>
          ) : (
            <div className="melody-current">
              <div className="melody-screen-hint">
                {round === 4 ? 'Суперигра' : 'Ведущий выбирает мелодию'}
              </div>
            </div>
          )}
        </>
      )}

      {round === 4 && (
        <div className="melody-current">
          {!superState ? (
            <div className="melody-screen-hint">
              Суперигра: {MELODY_SUPER_TRACKS} мелодий за {settings.superSeconds} секунд
            </div>
          ) : (
            <>
              <div className="melody-super-slots">
                {Array.from({ length: MELODY_SUPER_TRACKS }, (_, i) => (
                  <span key={i} className={`melody-super-slot${i < superState.found.length ? ' found' : ''}`}>
                    {i < superState.found.length ? '♪' : i + 1}
                  </span>
                ))}
              </div>
              {superState.finished && (
                <div className="melody-revealed">
                  <span>
                    {superState.found.length >= MELODY_SUPER_TRACKS
                      ? `Все ${MELODY_SUPER_TRACKS} мелодий найдены! Бонус +${settings.superBonus.toLocaleString('ru-RU')}`
                      : `Найдено ${superState.found.length} из ${MELODY_SUPER_TRACKS}`}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
