import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useCountdown } from '../lib/useCountdown';
import { subscribeParticipants, subscribeSession } from '../lib/session';
import {
  MILLIONAIRE_LADDER,
  MILLIONAIRE_SAFE_HAVENS,
  formatCountdown,
  type Participant,
  type Session,
} from '@quizmaster/shared';
import { IconCat, IconGavel } from '../components/icons';

export default function ScreenPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    return subscribeSession(sessionId, (s) => {
      setSession(s);
      setLoaded(true);
    });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    return subscribeParticipants(sessionId, setParticipants);
  }, [sessionId]);

  const timeLeft = useCountdown(session?.timer?.endsAt ?? null);

  if (!loaded) {
    return (
      <div className="tv tv-millionaire" role="main">
        <div className="tv-top"><span className="tv-logo">Загрузка…</span></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="tv tv-millionaire" role="main">
        <div className="tv-top"><span className="tv-logo">Сессия не найдена</span></div>
      </div>
    );
  }

  const isMillionaire = session.gameType === 'millionaire';
  const title = session.gameTitle || 'QuizMaster';

  return (
    <div className={`tv ${isMillionaire ? 'tv-millionaire' : 'tv-svoya'}`} role="main">
      <div className="tv-top">
        <div className="qm-inline">
          <span className="tv-logo">{title}</span>
          <span className="qm-badge qm-badge-gold">код {session.code}</span>
          <span className="qm-badge">
            {session.status === 'lobby' ? 'ожидание' : session.status === 'finished' ? 'завершена' : 'идёт игра'}
          </span>
        </div>
        <div className="qm-inline">
          {timeLeft != null && (
            <span className={`tv-timer${timeLeft === 0 ? ' warning' : ''}`}>
              {timeLeft > 0 ? formatCountdown(timeLeft) : 'Время вышло'}
            </span>
          )}
          <button
            className="tv-icon-btn"
            onClick={() => void document.documentElement.requestFullscreen?.()}
          >
            На весь экран
          </button>
        </div>
      </div>

      {session.status === 'lobby' ? (
        <ScreenLobby session={session} participants={participants} title={title} />
      ) : session.status === 'finished' ? (
        <ScreenResults participants={participants} />
      ) : isMillionaire ? (
        <MillionaireScreen session={session} participants={participants} />
      ) : (
        <SvoyaScreen session={session} participants={participants} />
      )}
    </div>
  );
}

function ScreenLobby({ session, participants, title }: { session: Session; participants: Participant[]; title: string }) {
  const joinUrl = `${window.location.origin}/QuizMaster/join/${session.code}`;
  return (
    <div className="qm-container" style={{ maxWidth: 760 }}>
      <div className="qm-card qm-center">
        <div className="qm-eyebrow">Ожидание игры</div>
        <h1 className="qm-title">{title}</h1>
        <p className="qm-card-muted" style={{ marginBottom: 0 }}>Код комнаты</p>
        <div className="qm-title" style={{ letterSpacing: 10, fontSize: '3rem', margin: '0.2rem 0 1rem' }}>
          {session.code}
        </div>
        <div className="qm-qr qm-qr-lg" style={{ margin: '0 auto 1rem', maxWidth: 230 }}>
          <QRCodeSVG value={joinUrl} size={190} bgColor="#fffaf0" fgColor="#2b2118" />
          <div className="qm-small">Сканируйте, чтобы войти</div>
        </div>
        <div className="qm-grid">
          {participants.map((p) => (
            <div key={p.id} className="qm-result-row"><span>{p.name}</span><b>0</b></div>
          ))}
          {participants.length === 0 && <p className="qm-small">Пока никто не присоединился</p>}
        </div>
      </div>
    </div>
  );
}

function ScreenResults({ participants }: { participants: Participant[] }) {
  const sorted = [...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return (
    <div className="qm-container" style={{ maxWidth: 760 }}>
      <div className="qm-card">
        <div className="qm-eyebrow">Итоги</div>
        <h2 className="qm-title">Игра завершена</h2>
        <div className="qm-grid qm-mt">
          {sorted.map((p, i) => (
            <div key={p.id} className="qm-result-row">
              <span>{i + 1}. {p.name}</span>
              <b>{p.score ?? 0}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MillionaireScreen({ session, participants }: { session: Session; participants: Participant[] }) {
  const turn = session.turn;
  const pq = session.publicQuestion;
  const player = participants.find((p) => p.id === turn?.participantId);
  const revealed = session.revealedCorrectIndex != null;
  const currentIdx = turn?.questionIndex ?? 0;

  return (
    <div className="millionaire-stage">
      <div className="millionaire-main">
        <div className="millionaire-players">
          {participants.map((p) => (
            <div key={p.id} className={`millionaire-player${turn?.participantId === p.id ? ' active' : ''}`}>
              <span>{p.name}</span>
              <span className="v">{p.score ?? 0}</span>
            </div>
          ))}
        </div>

        {turn && pq ? (
          <>
            <div className="millionaire-status">
              Играет: {player?.name ?? '…'} · вопрос {currentIdx + 1} из 15
            </div>
            <div className="millionaire-question">{pq.text}</div>
            {pq.imageUrl && <img className="tv-media" src={pq.imageUrl} alt="" />}
            {pq.audioUrl && <audio className="tv-audio" controls src={pq.audioUrl} />}
            <div className="millionaire-answers">
              {(pq.options ?? []).map((text, i) => {
                const hidden = turn.fiftyOptions?.length ? !turn.fiftyOptions.includes(i) : false;
                const correct = revealed && i === session.revealedCorrectIndex;
                const wrong = revealed && i !== session.revealedCorrectIndex && turn.chosenIndex === i;
                const selected = !revealed && turn.chosenIndex === i;
                return (
                  <div
                    key={i}
                    className={[
                      'millionaire-answer',
                      hidden ? 'hidden-5050' : '',
                      correct ? 'correct' : '',
                      wrong ? 'wrong' : '',
                      selected ? 'selected' : '',
                    ].join(' ')}
                  >
                    <span className="letter">{'ABCD'[i]}</span>
                    <span>{text}</span>
                  </div>
                );
              })}
            </div>

            {turn.audience && turn.audience.length > 0 && (
              <div className="millionaire-audience">
                {turn.audience.map((pct, i) => (
                  <div key={i} className="bar" style={{ height: `${Math.max(4, pct)}%` }}>
                    <span>{'ABCD'[i]} {pct}%</span>
                  </div>
                ))}
              </div>
            )}
            {turn.phoneHint != null && (
              <div className="millionaire-status">Друг советует вариант {'ABCD'[turn.phoneHint]}</div>
            )}
            {revealed && (
              <div className="millionaire-status">
                {turn.correct ? 'Верно!' : 'Неверно'} {turn.prize?.toLocaleString('ru-RU')}
              </div>
            )}
          </>
        ) : (
          <div className="millionaire-status">Ведущий выбирает следующего игрока</div>
        )}
      </div>

      <aside className="millionaire-ladder">
        <ol>
          {MILLIONAIRE_LADDER.map((amount, i) => {
            const safe = MILLIONAIRE_SAFE_HAVENS.includes(i + 1);
            const current = turn && turn.questionIndex === i && turn.status !== 'finished';
            const won = turn && turn.questionIndex > i;
            return (
              <li key={i} className={[safe ? 'safe' : '', current ? 'current' : '', won ? 'won' : ''].join(' ')}>
                <span className="n">{i + 1}</span>
                <span className="v">{amount.toLocaleString('ru-RU')}</span>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}

function SvoyaScreen({ session, participants }: { session: Session; participants: Participant[] }) {
  const board = session.board ?? [];
  const pq = session.publicQuestion;
  const used = board.filter((c) => c.used).length;

  return (
    <div className="svoya-stage">
      <div className="svoya-scores">
        {[...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((p) => (
          <div key={p.id} className={`svoya-score${session.buzzedParticipantId === p.id ? ' active' : ''}`}>
            <span className="name">{p.name}</span>
            <span className="pts">{p.score ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="svoya-round-title">Табло · открыто {used} из {board.length}</div>

      {[1, 2, 3].map((round) => {
        const cells = board.filter((c) => c.round === round);
        if (cells.length === 0) return null;
        const themes = Array.from(new Set(cells.map((c) => c.theme)));
        const values = Array.from(new Set(cells.map((c) => c.value))).sort((a, b) => a - b);
        return (
          <div key={round}>
            <div className="svoya-round-title">Раунд {round}</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="svoya-board">
                <thead>
                  <tr>
                    <th>Тема</th>
                    {values.map((v) => <th key={v}>{v}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {themes.map((theme) => (
                    <tr key={theme}>
                      <th>{theme}</th>
                      {values.map((v) => {
                        const cell = cells.find((c) => c.theme === theme && c.value === v);
                        if (!cell) return <td key={v} />;
                        return (
                          <td key={v}>
                            <button
                              className={`svoya-cell${cell.used ? ' used' : ''}${cell.kind === 'cat' ? ' cat' : ''}${cell.kind === 'auction' ? ' auction' : ''}`}
                              disabled
                            >
                              {cell.used ? '—' : cell.kind === 'cat'
                                ? <IconCat size={18} />
                                : cell.kind === 'auction' ? <IconGavel size={18} /> : v}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {pq ? (
        <>
          <div className="svoya-question">
            <span className="meta">
              {pq.theme} · {pq.value}
              {pq.kind === 'cat' ? ' · кот в мешке' : ''}
              {pq.kind === 'auction' ? ' · аукцион' : ''}
            </span>
            {pq.text}
          </div>
          {pq.imageUrl && <img className="tv-media" src={pq.imageUrl} alt="" />}
          {pq.audioUrl && <audio className="tv-audio" controls src={pq.audioUrl} />}
          {session.catRecipientId && (
            <div className="svoya-round-title">
              Кот у: {participants.find((p) => p.id === session.catRecipientId)?.name}
            </div>
          )}
          {session.auctionBid != null && (
            <div className="svoya-round-title">
              Ставка: {session.auctionBid} · отвечает {participants.find((p) => p.id === session.auctionWinnerId)?.name}
            </div>
          )}
          {session.revealedAnswer && (
            <div className="svoya-answer-box">Ответ: {session.revealedAnswer}</div>
          )}
        </>
      ) : (
        <div className="svoya-question">Ведущий выбирает вопрос</div>
      )}
    </div>
  );
}
