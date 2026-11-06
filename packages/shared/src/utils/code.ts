const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Генерирует код подключения (без похожих символов). */
export function generateJoinCode(length = 6, random: () => number = Math.random): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return out;
}

/** Случайный токен участника (32 символа). */
export function generatePlayerToken(random: () => number = Math.random): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 32; i++) {
    out += chars[Math.floor(random() * chars.length)];
  }
  return out;
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}
