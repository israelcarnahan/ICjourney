export function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // Intentionally ignore storage errors; return fallback.
    return fallback;
  }
}

export function setJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Intentionally ignore storage errors.
  }
}

export function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Intentionally ignore storage errors.
  }
}
