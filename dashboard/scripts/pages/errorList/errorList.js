import { renderNavbar }    from '../../components/navbar.js';
import { renderErrorCard } from '../../components/errorCard.js';
import { showToast }       from '../../utils/toast.js';
import { MOCK_ERRORS, PAGE_LIMIT } from '../../utils/constants.js';
import { buildUrl, initFilters }   from './errorFilter.js';

renderNavbar('error-list');

/* ── State ──────────────────────────────────────────────────── */
const state = { severity: '', since: '24h', status: 'unresolved', page: 1, total: 0, loading: false };

/* ── DOM refs ───────────────────────────────────────────────── */
const listEl     = document.getElementById('error-list');
const pagination = document.getElementById('pagination');
const pageInfo   = document.getElementById('pageInfo');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');

/* ── Render helpers ─────────────────────────────────────────── */
function renderLoading() {
  listEl.innerHTML = `<div class="error-card" style="justify-content:center;gap:12px;">
    <div class="spinner"></div><span>Fetching errors…</span></div>`;
  if (pagination) pagination.style.display = 'none';
}

function renderEmpty() {
  listEl.innerHTML = `<div class="error-card" style="justify-content:center;">
    <span style="color:var(--color-text-muted)">No errors match your filters.</span></div>`;
  if (pagination) pagination.style.display = 'none';
}

function renderFetchError(msg) {
  listEl.innerHTML = `<div class="error-card" style="flex-direction:column;align-items:flex-start;gap:8px;">
    <span style="font-weight:600;color:var(--color-critical)">⚠ Failed to load errors</span>
    <span style="font-size:13px;color:var(--color-text-muted)">${msg}</span>
    <button class="btn btn--outline" onclick="load()" style="margin-top:4px">Try again</button></div>`;
  if (pagination) pagination.style.display = 'none';
}

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
async function load() {
  if (state.loading) return;
  state.loading = true;
  renderLoading();

  // ── MOCK: remove this block when real API is ready ──
  if (Array.isArray(MOCK_ERRORS) && MOCK_ERRORS.length) {
    await new Promise(r => setTimeout(r, 500));
    const filtered = MOCK_ERRORS.filter(e =>
      !state.severity || state.severity === 'all' || e.severity === state.severity
    );
    renderErrors(filtered, filtered.length);
    state.loading = false;
    return;
  }
  // ── END MOCK ─────────────────────────────────────────

  try {
    const res = await fetch(buildUrl(state), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    const data   = await res.json();
    const errors = Array.isArray(data) ? data : (data.errors ?? data.data ?? data.items ?? []);
    const total  = Array.isArray(data) ? data.length : (data.total ?? data.count ?? errors.length);
    state.total  = total;
    renderErrors(errors, total);
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
