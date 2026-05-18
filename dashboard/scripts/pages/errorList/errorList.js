import { renderNavbar }    from '../../components/navbar.js';
import { renderErrorCard } from '../../components/errorCard.js';
import { showToast }       from '../../utils/toast.js';
import { MOCK_ERRORS, PAGE_LIMIT, normalizeError } from '../../utils/constants.js';
import { requireAuth } from '../../utils/auth.js';
import { withResolvedStatuses } from '../../utils/errorStatus.js';
import { buildUrl, initFilters }   from './errorFilter.js';

const session = requireAuth();
if (session) renderNavbar('error-list');

/* ── State ──────────────────────────────────────────────────── */
const state = { severity: '', since: '24h', status: 'unresolved', page: 1, total: 0, loading: false };

/* ── DOM refs ───────────────────────────────────────────────── */
const listEl     = document.getElementById('error-list');
const pagination = document.getElementById('pagination');
const pageInfo   = document.getElementById('pageInfo');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');

/* ── Render helpers ─────────────────────────────────────────── */
/**
 * Applies the current severity and status filters to a list of
 * already-normalized errors.
 *
 * Both fields are top-level strings on the normalized shape, so no
 * payload digging is needed here. The D1 `status` column value
 * ('unresolved' | 'resolved') maps directly to the filter values.
 *
 * @param {object[]} errors  Normalized error objects
 * @returns {object[]}
 */
function applyClientFilters(errors) {
  return errors.filter(err => {
    const matchesSeverity = !state.severity || state.severity === 'all' || err.severity === state.severity;
    const matchesStatus   = !state.status   || state.status   === 'all' || err.status   === state.status;
    return matchesSeverity && matchesStatus;
  });
}

/**
 * Renders the loading state for the error list.
 * @returns {void}
 */
function renderLoading() {
  listEl.innerHTML = `<div class="error-card" style="justify-content:center;gap:12px;">
    <div class="spinner"></div><span>Fetching errors…</span></div>`;
  if (pagination) pagination.style.display = 'none';
}

/**
 * Renders the empty state when no errors match the current filters.
 * @returns {void}
 */
function renderEmpty() {
  listEl.innerHTML = `<div class="error-card" style="justify-content:center;">
    <span style="color:var(--color-text-muted)">No errors match your filters.</span></div>`;
  if (pagination) pagination.style.display = 'none';
}

/**
 * Renders a fetch failure state for the error list.
 * @param {string} msg
 * @returns {void}
 */
function renderFetchError(msg) {
  listEl.innerHTML = `<div class="error-card" style="flex-direction:column;align-items:flex-start;gap:8px;">
    <span style="font-weight:600;color:var(--color-critical)">⚠ Failed to load errors</span>
    <span style="font-size:13px;color:var(--color-text-muted)">${msg}</span>
    <button class="btn btn--outline" onclick="load()" style="margin-top:4px">Try again</button></div>`;
  if (pagination) pagination.style.display = 'none';
}

/**
 * Renders the current page of errors and updates pagination controls.
 * @param {object[]} errors  Normalized, filtered, paged error objects
 * @param {number}   total   Total count after filtering (pre-paging)
 * @returns {void}
 */
function renderErrors(errors, total) {
  if (!errors.length) { renderEmpty(); return; }
  listEl.innerHTML = errors.map((err, i) => renderErrorCard(err, i, state.since)).join('');

  const totalPages = Math.ceil(total / PAGE_LIMIT);
  if (pagination) {
    const show = totalPages > 1;
    pagination.style.display = show ? 'flex' : 'none';
    if (show) {
      if (pageInfo) pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
      if (prevBtn)  prevBtn.disabled = state.page <= 1;
      if (nextBtn)  nextBtn.disabled = state.page >= totalPages;
    }
  }
}

/* ── Load ───────────────────────────────────────────────────── */
/**
 * Fetches and renders the error list for the current filter state.
 *
 * Mock path  — normalizes D1-shaped MOCK_ERRORS rows via normalizeError()
 *              before filtering, so the card layer always receives the
 *              same shape regardless of data source.
 *
 * Real path  — the API is expected to return an array of raw D1 rows
 *              (or a wrapper with an `errors` / `data` / `items` key).
 *              Each row is passed through normalizeError() before any
 *              client-side filtering or rendering.
 *
 * @returns {Promise<void>}
 */
async function load() {
  if (state.loading) return;
  state.loading = true;
  renderLoading();

  // ── MOCK: remove this block when real API is ready ──────────
  if (Array.isArray(MOCK_ERRORS) && MOCK_ERRORS.length) {
    await new Promise(r => setTimeout(r, 500));

    const normalized = withResolvedStatuses(MOCK_ERRORS.map(normalizeError));
    const filtered   = applyClientFilters(normalized);
    const start      = (state.page - 1) * PAGE_LIMIT;
    const paged      = filtered.slice(start, start + PAGE_LIMIT);

    state.total   = filtered.length;
    renderErrors(paged, filtered.length);
    state.loading = false;
    return;
  }
  // ── END MOCK ─────────────────────────────────────────────────

  try {
    const res = await fetch(buildUrl(state), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);

    const data    = await res.json();
    const rawRows = Array.isArray(data) ? data : (data.errors ?? data.data ?? data.items ?? []);

    // Normalize every raw D1 row into the shape the card layer expects.
    const normalized = withResolvedStatuses(rawRows.map(normalizeError));
    const filtered   = applyClientFilters(normalized);

    state.total = filtered.length;
    renderErrors(filtered, filtered.length);
  } catch (err) {
    console.error('[WatchTower] fetch failed:', err);
    renderFetchError(err.message);
    showToast('Could not fetch errors: ' + err.message, true);
  } finally {
    state.loading = false;
  }
}

/* ── Boot ───────────────────────────────────────────────────── */
initFilters(state, load);
load();
window.addEventListener('pageshow', event => {
  if (event.persisted) load();
});
