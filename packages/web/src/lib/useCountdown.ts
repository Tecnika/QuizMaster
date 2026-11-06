import { useEffect, useState } from 'react';

/** Остаток времени до endsAt в секундах; null — таймер не запущен. */
export function useCountdown(endsAt?: number | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (!endsAt) return null;
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}
