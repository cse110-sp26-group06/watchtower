const STORAGE_KEY = 'watchtower:resolved-error-ids';

function readResolvedIds() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeResolvedIds(ids) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids.map(String))]));
  } catch {
    // Ignore storage failures so the dashboard remains usable.
  }
}


export function isErrorResolved(id) {
  return readResolvedIds().includes(String(id));
}

export function markErrorResolved(id) {
  const resolvedIds = readResolvedIds();
  resolvedIds.push(String(id));
  writeResolvedIds(resolvedIds);
}

export function withResolvedStatus(error) {
  if (!error) return error;
  return {
    ...error,
    status: isErrorResolved(error.id) ? 'resolved' : 'unresolved',
  };
}

export function withResolvedStatuses(errors) {
  return errors.map(withResolvedStatus);
}
