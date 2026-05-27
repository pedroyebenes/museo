const STORAGE_KEY = 'museo:favorites:v1';

export function createFavoritesStore(storage = window.localStorage) {
  let ids = readIds(storage);
  const listeners = new Set();

  function has(id) {
    return ids.has(id);
  }

  function all() {
    return new Set(ids);
  }

  function toggle(id) {
    if (!id) return false;
    const next = new Set(ids);
    const active = !next.has(id);
    if (active) next.add(id);
    else next.delete(id);
    ids = next;
    writeIds(storage, ids);
    notify();
    return active;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function notify() {
    const snapshot = all();
    for (const listener of listeners) listener(snapshot);
  }

  return { has, all, toggle, subscribe };
}

function readIds(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

function writeIds(storage, ids) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Favorites are a convenience feature; the app should keep working if storage is unavailable.
  }
}
