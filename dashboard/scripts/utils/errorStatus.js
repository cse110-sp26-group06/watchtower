const STORAGE_KEY = 'watchtower:resolved-error-ids';

/**
 * Reads the set of resolved error IDs from session storage.
 * @returns {string[]}
 */
function readResolvedIds() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Persists the set of resolved error IDs to session storage.
 * @param {Array<string | number>} ids
 * @returns {void}
 */
function writeResolvedIds(ids) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids.map(String))]));
  } catch {
    // Ignore storage failures so the dashboard remains usable.
  }
}

/**
 * Checks whether an error has been marked resolved in the current session.
 * @param {string | number | null} id
 * @returns {boolean}
 */
export function isErrorResolved(id) {
  return readResolvedIds().includes(String(id));
}

/**
 * Marks an error as resolved in the current session.
 * @param {string | number} id
 * @returns {void}
 */
export function markErrorResolved(id) {
  const resolvedIds = readResolvedIds();
  resolvedIds.push(String(id));
  writeResolvedIds(resolvedIds);
}

/**
 * Adds a derived status field to a single error object.
 * @param {Record<string, any> | null | undefined} error
 * @returns {Record<string, any> | null | undefined}
 */
export function withResolvedStatus(error) {
  if (!error) {return error;}
  return {
    ...error,
    status: error.status === 'resolved' || isErrorResolved(error.id) ? 'resolved' : 'unresolved',
  };
}

/**
 * Adds derived resolved/unresolved status to each error object.
 * @param {Array<Record<string, any>>} errors
 * @returns {Array<Record<string, any>>}
 */
export function withResolvedStatuses(errors) {
  return errors.map(withResolvedStatus);
}
