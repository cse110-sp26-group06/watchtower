import { renderNavbar }              from '../../components/navbar.js';
import { renderErrorCard }           from '../../components/errorCard.js';
import { showToast }                 from '../../utils/toast.js';
import { PAGE_LIMIT, normalizeError } from '../../utils/constants.js';
import { requireAuth }               from '../../utils/auth.js';
import { initFilters, sinceToIso }   from './errorFilter.js';
import { apiGet }                    from '../../api/api.js';

const session = requireAuth();
if (session) { renderNavbar('error-list'); }

// Expose load() to window so onclick="load()" in renderFetchError works
// ES modules are scoped and don't attach to window automatically
window.load = load;

/* ── State ──────────────────────────────────────────────────── */
const state = { severity: '', since: '30d', status: 'unresolved', page: 1, total: 0, loading: false };

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
  if (pagination) { pagination.style.display = 'none'; }
}

/**
 * Renders the empty state when no errors match the current filters.
 * @returns {void}
 */
function renderEmpty() {
  listEl.innerHTML = `<div class="error-card" style="justify-content:center;">
    <span style="color:var(--color-text-muted)">No errors match your filters.</span></div>`;
  if (pagination) { pagination.style.display = 'none'; }
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
  if (pagination) { pagination.style.display = 'none'; }
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
      if (pageInfo) { pageInfo.textContent = `Page ${state.page} of ${totalPages}`; }
      if (prevBtn)  { prevBtn.disabled = state.page <= 1; }
      if (nextBtn)  { nextBtn.disabled = state.page >= totalPages; }
    }
  }
}

/* ── Load ───────────────────────────────────────────────────── */

/**
 * Fetches and renders the error list for the current filter state.
 *
 * Routes through api.js (apiGet) for centralized auth
 *              (api_key query param) and error handling (network/4xx/5xx).
 *              Each raw D1 row is passed through normalizeError() before
 *              any client-side filtering or rendering.
 *
 * @returns {Promise<void>}
 */
async function load() {
  if (state.loading) { return; }
  state.loading = true;
  renderLoading();

  const params = {};
  const sinceIso = sinceToIso(state.since);
  if (sinceIso) { params.since = sinceIso; }
  if (state.status && state.status !== 'all') { params.status = state.status; }

  try {
    const result = await apiGet('', params);

    if (!result.success) {
      console.error(`[WatchTower] ${result.error.type} error:`, result.error.message);
      renderFetchError(result.error.message);
      showToast('Could not fetch errors: ' + result.error.message, true);
      return;
    }

    // Backend responds with { status: "ok", errors: [...] }
    const rawRows    = result.data?.errors ?? [];
    const normalized = rawRows.map(normalizeError);
    const filtered   = applyClientFilters(normalized);

    state.total = filtered.length;
    renderErrors(filtered, filtered.length);

  } finally {
    state.loading = false;
  }
}

/* ── Boot ───────────────────────────────────────────────────── */
initFilters(state, load);
load();
window.addEventListener('pageshow', event => {
  if (event.persisted) { load(); }
});