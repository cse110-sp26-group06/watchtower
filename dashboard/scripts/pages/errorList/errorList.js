/* ── Config ──────────────────────────────────────────────────────────────── */
const API_BASE   = '/api/errors'; //need to replace with the actual Endpoint
const PROJECT_ID = 'demo';          
const PAGE_LIMIT = 20;

/* ── State ───────────────────────────────────────────────────────────────── */
let state = {
  severity: '',
  since:    '24h',
  status:   'unresolved',
  page:     1,
  total:    0,
  loading:  false,
};

/* ── DOM refs ─────────────────────────────────────────────────────────────── */
const listContainer = document.getElementById('listContainer');
const pagination    = document.getElementById('pagination');
const pageInfo      = document.getElementById('pageInfo');
const prevBtn       = document.getElementById('prevBtn');
const nextBtn       = document.getElementById('nextBtn');
const toast         = document.getElementById('toast');

/* ── Utilities ───────────────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let toastTimer;
function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.className   = isError ? 'show error' : 'show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = ''; }, 3000);
}

function badgeClass(severity) {
  const map = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  return map[(severity || '').toLowerCase()] ?? 'badge-low';
}

function badgeLabel(severity) {
  return severity ? severity.toUpperCase() : 'UNKNOWN';
}

function buildUrl() {
  const params = new URLSearchParams({
    projectId: PROJECT_ID,
    since:     state.since,
    page:      state.page,
    limit:     PAGE_LIMIT,
  });
  if (state.severity) params.set('severity', state.severity);
  if (state.status)   params.set('status',   state.status);
  return `${API_BASE}?${params}`;
}

/* ── Render helpers ──────────────────────────────────────────────────────── */
function renderLoading() {
  listContainer.innerHTML = `
    <div class="state-box">
      <div class="spinner"></div>
      <span>Fetching errors…</span>
    </div>`;
  pagination.style.display = 'none';
}

function renderEmpty() {
  listContainer.innerHTML = `
    <div class="state-box">
      <div class="state-icon">✅</div>
      <div class="state-title">No errors found</div>
      <span>Try adjusting your filters or time range.</span>
    </div>`;
  pagination.style.display = 'none';
}

function renderFetchError(msg) {
  listContainer.innerHTML = `
    <div class="state-box">
      <div class="state-icon">⚠️</div>
      <div class="state-title">Failed to load errors</div>
      <span>${escHtml(msg)}</span>
      <button class="btn-page" onclick="load()">Try again</button>
    </div>`;
  pagination.style.display = 'none';
}

function renderErrorRow(err, index) {
  const cls     = badgeClass(err.severity);
  const label   = badgeLabel(err.severity);
  const message = escHtml(err.message ?? err.title ?? 'Unknown error');
  const deploy  = escHtml(err.deploy ?? err.version ?? '');
  const occ     = err.occurrences ?? err.count ?? '—';
  const since   = state.since;

  return `
    <div class="error-row" style="animation-delay:${index * 40}ms" tabindex="0" data-id="${escHtml(String(err.id ?? index))}">
      <div class="row-left">
        <div class="row-top">
          <span class="badge ${cls}">${label}</span>
          ${deploy ? `<span class="deploy-tag">Deploy: ${deploy}</span>` : ''}
        </div>
        <div class="error-message">${message}</div>
        <div class="error-occurrences">Occurrences: ${occ} in last ${since}</div>
      </div>
      <span class="row-chevron">›</span>
    </div>`;
}

function renderErrors(errors, total) {
  if (!errors.length) { renderEmpty(); return; }

  const rows = errors.map((err, i) => renderErrorRow(err, i)).join('');

  listContainer.innerHTML = `<div class="error-list-wrapper">${rows}</div>`;

  /* Pagination */
  const totalPages = Math.ceil(total / PAGE_LIMIT);
  if (totalPages > 1) {
    pagination.style.display = 'flex';
    pageInfo.textContent     = `Page ${state.page} of ${totalPages}`;
    prevBtn.disabled         = state.page <= 1;
    nextBtn.disabled         = state.page >= totalPages;
  } else {
    pagination.style.display = 'none';
  }
}

/* ── Fetch ───────────────────────────────────────────────────────────────── */
async function load() {
  if (state.loading) return;
  state.loading = true;
  renderLoading();

  try {
    const res = await fetch(buildUrl(), { headers: { Accept: 'application/json' } });

    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);

    const data = await res.json();

    /*  Normalise two common response shapes:
        1. Array of errors directly
        2. Object with errors/data/items + total/count  */
    let errors, total;
    if (Array.isArray(data)) {
      errors = data;
      total  = data.length;
    } else {
      errors = data.errors ?? data.data ?? data.items ?? [];
      total  = data.total  ?? data.count ?? errors.length;
    }

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

/* ── Filter wiring ───────────────────────────────────────────────────────── */
function onFilterChange() {
  state.severity = document.getElementById('filterSeverity').value;
  state.since    = document.getElementById('filterSince').value;
  state.status   = document.getElementById('filterStatus').value;
  state.page     = 1;
  load();
}

document.getElementById('filterSeverity').addEventListener('change', onFilterChange);
document.getElementById('filterSince').addEventListener('change', onFilterChange);
document.getElementById('filterStatus').addEventListener('change', onFilterChange);

prevBtn.addEventListener('click', () => { if (state.page > 1) { state.page--; load(); } });
nextBtn.addEventListener('click', () => { state.page++; load(); });

/* ── Boot ────────────────────────────────────────────────────────────────── */
load();