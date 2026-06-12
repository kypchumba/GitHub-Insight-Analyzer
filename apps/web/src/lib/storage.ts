const HISTORY_KEY = "gia-search-history";
const FAVORITES_KEY = "gia-favorites";

function readList(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, values: string[]) {
  localStorage.setItem(key, JSON.stringify(values));
}

export function getSearchHistory(): string[] {
  return readList(HISTORY_KEY);
}

export function addSearchHistory(username: string) {
  const normalized = username.trim();
  if (!normalized) return;
  writeList(HISTORY_KEY, [normalized, ...getSearchHistory().filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 8));
}

export function getFavorites(): string[] {
  return readList(FAVORITES_KEY);
}

export function toggleFavorite(username: string): string[] {
  const favorites = getFavorites();
  const exists = favorites.some((item) => item.toLowerCase() === username.toLowerCase());
  const next = exists ? favorites.filter((item) => item.toLowerCase() !== username.toLowerCase()) : [username, ...favorites].slice(0, 12);
  writeList(FAVORITES_KEY, next);
  return next;
}

