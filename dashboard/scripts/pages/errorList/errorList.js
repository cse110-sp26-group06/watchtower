import { renderNavbar } from '../../components/navbar.js';

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('error-list');
});

/* ── Config ─────────────────────────────────────────────────── */
const API_BASE   = '/api/errors';
const PROJECT_ID = 'demo';
const PAGE_LIMIT = 20;

/* ── Mock data (remove when real API is ready) ──────────────── */
const MOCK_ERRORS = [
  { id: '1', severity: 'critical', deploy: 'v2.4.1', message: 'TypeError: Cannot read property...', occurrences: 847 },
  { id: '2', severity: 'high',     deploy: 'v2.4.1', message: 'Network request failed: timeout',    occurrences: 234 },
  { id: '3', severity: 'medium',   deploy: 'v2.4.0', message: 'React Hook useEffect has missing...', occurrences: 89 },
  { id: '4', severity: 'low',      deploy: 'v2.3.9', message: 'Console warning: deprecated API',    occurrences: 45 },
];

/* ── State ──────────────────────────────────────────────────── */
let state = {
  severity: '',
  since:    '24h',
  status:   'unresolved',
  page:     1,
  total:    0,
  loading:  false,
};

/* ── DOM refs — matching your HTML ids ──────────────────────── */
const errorList = document.getElementById('error-list');   // was 'listContainer'
const pagination = document.getElementById('pagination');
const pageInfo   = document.getElementById('pageInfo');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');
const toast      = document.getElementById('toast');

/* ── Utilities ──────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let toastTimer;
function showToast(msg, isError = false) {
  if (!toast) return;
  toast.textContent = msg;
  toast.className   = isError ? 'show error' : 'show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = ''; }, 3000);
}

function badgeClass(severity) {
  const map = { critical: 'badge--critical', high: 'badge--high', medium: 'badge--medium', low: 'badge--low' };
  return map[(severity || '').toLowerCase()] ?? 'badge--low';
}

function buildUrl() {
  const params = new URLSearchParams({ projectId: PROJECT_ID, since: state.since, page: state.page, limit: PAGE_LIMIT });
  if (state.severity && state.severity !== 'all') params.set('severity', state.severity);
  if (state.status   && state.status   !== 'all') params.set('status',   state.status);
  return `${API_BASE}?${params}`;
}

/* ── Render ─────────────────────────────────────────────────── */
function renderLoading() {
  errorList.innerHTML = `
    <div class="error-card" style="justify-content:center;gap:12px;">
      <div class="spinner"></div>
      <span>Fetching errors…</span>
    </div>`;
  if (pagination) pagination.style.display = 'none';
}

function renderEmpty() {
  errorList.innerHTML = `
    <div class="error-card" style="justify-content:center;">
      <span style="color:var(--color-text-muted)">No errors match your filters.</span>
    </div>`;
  if (pagination) pagination.style.display = 'none';
}

function renderFetchError(msg) {
  errorList.innerHTML = `
    <div class="error-card" style="flex-direction:column;align-items:flex-start;gap:8px;">
      <span style="font-weight:600;color:var(--color-critical)">⚠ Failed to load errors</span>
      <span style="font-size:13px;color:var(--color-text-muted)">${escHtml(msg)}</span>
      <button class="btn btn--outline" onclick="load()" style="margin-top:4px">Try again</button>
    </div>`;
  if (pagination) pagination.style.display = 'none';
}

function renderErrorCard(err, index) {
  const cls     = badgeClass(err.severity);
  const label   = (err.severity || 'unknown').toUpperCase();
  const message = escHtml(err.message ?? err.title ?? 'Unknown error');
  const deploy  = escHtml(err.deploy ?? err.version ?? '');
  const occ     = err.occurrences ?? err.count ?? '—';

  return `
    <article class="error-card" tabindex="0" data-id="${escHtml(String(err.id ?? index))}"
             style="animation-delay:${index * 40}ms">
      <div class="error-card__body">
        <div class="error-card__meta">
          <span class="badge ${cls}">${label}</span>
          ${deploy ? `<span class="error-card__deploy">Deploy: ${deploy}</span>` : ''}
        </div>
        <div class="error-card__message">${message}</div>
        <div class="error-card__occurrences">Occurrences: ${occ} in last ${state.since}</div>
      </div>
      <svg class="error-card__chevron" width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M7.5 5l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </article>`;
}

function renderErrors(errors, total) {
  if (!errors.length) { renderEmpty(); return; }
  errorList.innerHTML = errors.map((err, i) => renderErrorCard(err, i)).join('');

  const totalPages = Math.ceil(total / PAGE_LIMIT);
  if (pagination) {
    if (totalPages > 1) {
      pagination.style.display = 'flex';
      if (pageInfo) pageInfo.textContent = `Page ${state.page} of ${totalPages}`;
      if (prevBtn)  prevBtn.disabled = state.page <= 1;
      if (nextBtn)  nextBtn.disabled = state.page >= totalPages;
    } else {
      pagination.style.display = 'none';
    }
  }
}

/* ── Load ───────────────────────────────────────────────────── */
async function load() {
  if (state.loading) return;
  state.loading = true;
  renderLoading();

  // ── MOCK: remove this block when real API is ready ──
  await new Promise(r => setTimeout(r, 500));
  const filtered = MOCK_ERRORS.filter(e => {
    if (state.severity && state.severity !== 'all' && e.severity !== state.severity) return false;
    return true;
  });
  renderErrors(filtered, filtered.length);
  state.loading = false;
  return;
  // ── END MOCK ────────────────────────────────────────

  try {
    const res = await fetch(buildUrl(), { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    const data = await res.json();
    const errors = Array.isArray(data) ? data : (data.errors ?? data.data ?? data.items ?? []);
    const total  = Array.isArray(data) ? data.length : (data.total ?? data.count ?? errors.length);
    state.total = total;
    renderErrors(errors, total);
  } catch (err) {
    console.error('[WatchTower] fetch failed:', err);
    renderFetchError(err.message);
    showToast('Could not fetch errors: ' + err.message, true);
  } finally {
    state.loading = false;
  }
}

/* ── Filter wiring — matching your HTML ids ─────────────────── */
document.getElementById('filter-severity')?.addEventListener('change', e => {
  state.severity = e.target.value; state.page = 1; load();
});
document.getElementById('filter-time')?.addEventListener('change', e => {
  state.since = e.target.value; state.page = 1; load();
});
document.getElementById('filter-status')?.addEventListener('change', e => {
  state.status = e.target.value; state.page = 1; load();
});

prevBtn?.addEventListener('click', () => { if (state.page > 1) { state.page--; load(); } });
nextBtn?.addEventListener('click', () => { state.page++; load(); });

/* ── Boot ───────────────────────────────────────────────────── */
load();