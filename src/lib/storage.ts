// ===== Armazenamento local à prova de falhas =====
// O app guarda histórico, textos e preferências no localStorage. Ele pode estar cheio (capas em base64
// ocupam centenas de KB), bloqueado ou com dados corrompidos; nada disso pode derrubar o app.

export function loadJSON<T>(key: string, fallback: T, validate?: (value: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    if (validate && !validate(value)) return fallback;
    return value as T;
  } catch {
    return fallback;
  }
}

export function loadString(key: string, fallback = ''): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveString(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* sem armazenamento disponível */
  }
}

const BIG_DATA_URL = 1500; // data URLs maiores que isto (capas) são as primeiras a sair quando falta espaço

// Tira capas grandes em base64 dos itens mais antigos até caber. Os itens continuam (com a capa genérica).
function shrink(value: unknown, keepNewest: number): unknown {
  if (!Array.isArray(value)) return value;
  return value.map((item, index) => {
    if (index < keepNewest || !item || typeof item !== 'object') return item;
    const copy: Record<string, unknown> = { ...(item as Record<string, unknown>) };
    for (const field of ['cover', 'customCover']) {
      const v = copy[field];
      if (typeof v === 'string' && v.startsWith('data:') && v.length > BIG_DATA_URL) delete copy[field];
    }
    return copy;
  });
}

let quotaWarned = false;

/** Salva em JSON. Se o armazenamento estiver cheio, remove capas antigas e tenta de novo. */
export function saveJSON(key: string, value: unknown, onQuota?: () => void): boolean {
  const attempts = Array.isArray(value) ? [Infinity, 20, 5, 0] : [Infinity];
  for (const keep of attempts) {
    try {
      localStorage.setItem(key, JSON.stringify(keep === Infinity ? value : shrink(value, keep)));
      if (keep !== Infinity && !quotaWarned) {
        quotaWarned = true;
        onQuota?.();
      }
      return true;
    } catch {
      /* cheio ou indisponível: tenta com menos dados */
    }
  }
  return false;
}

export const isArray = (v: unknown) => Array.isArray(v);
