/**
 * logs.js
 * Log Viewer page for the WatchTower dashboard.
 * Fetches live data from GET /api/logs via apiGetLogs().
 * Supports level filtering, time-range filtering, pagination,
 * inline detail drawer, and optional auto-refresh.
 */

import { renderNavbar }                                       from '../../components/navbar.js';
import { emptyStateHtml, errorStateHtml }                    from '../../components/pageState.js';
import { statCardsHtml }                                      from '../../components/statCards.js';
import { requireAuth }                                        from '../../utils/auth.js';
import { showToast }                                          from '../../utils/toast.js';
import { escHtml }                                            from '../../utils/dom.js';
import { apiGetLogs }                                         from '../../api/api.js';

const session = requireAuth();
if (session) { renderNavbar('logs'); }

// Expose reload for "Try again" buttons
window.reloadLogs = load;

// ── State ─────────────────────────────────────────────────────────────────────

const state = {
  level:    'all',
  since:    sinceFromRange('24h'),
  page:     1,
  limit:    20,
  loading:  false,
  lastLogs: /** @type {object[]} */ ([]),
  autoRefreshTimer: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a UI range string to an ISO 8601 timestamp for `since=`. */
function sinceFromRange(range) {
  const now = Date.now();
  const MAP = { '1h': 3_600_000, '24h': 86_400_000, '7d': 604_800_000, '30d': 2_592_000_000 };
  return new Date(now - (MAP[range] ?? MAP['24h'])).toISOString();
}

/** Format an ISO timestamp to a short human-readable string. */
function fmtTime(iso) {
  if (!iso) { return '—'; }
  try {
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
         + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return iso;
  }
}

/** Format an ISO timestamp to a relative string (e.g. "3m ago"). */
function fmtRelative(iso) {
  if (!iso) { return ''; }
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000)     { return 'just now'; }
    if (diff < 3_600_000)  { return `${Math.floor(diff / 60_000)}m ago`; }
    if (diff < 86_400_000) { return `${Math.floor(diff / 3_600_000)}h ago`; }
    return `${Math.floor(diff / 86_400_000)}d ago`;
  } catch {
    return '';
  }
}

/** Render a level badge HTML string. */
function levelBadge(level) {
  const l   = String(level ?? 'info').toLowerCase();
  const dot = { error: '●', warn: '◆', info: '●', debug: '○' }[l] ?? '●';
  const cls = `log-level-badge--${['error','warn','info','debug'].includes(l) ? l : 'info'}`;
  return `<span class="log-level-badge ${cls}" aria-label="Level: ${escHtml(l)}">${dot} ${escHtml(l)}</span>`;
}

// ── Stats Derivation ──────────────────────────────────────────────────────────

/** @param {object[]} logs */
function deriveStats(logs) {
  const total    = logs.length;
  const errors   = logs.filter(l => String(l.level).toLowerCase() === 'error').length;
  const warns    = logs.filter(l => String(l.level).toLowerCase() === 'warn').length;
  const services = new Set(logs.map(l => l.service).filter(Boolean)).size;
  return { total, errors, warns, services };
}

// ── Render Stats Cards ────────────────────────────────────────────────────────

function renderStats(logs) {
  const { total, errors, warns, services } = deriveStats(logs);

  const container = document.getElementById('logs-stats-container');
  if (container) {
    container.innerHTML = statCardsHtml([
      { label: 'Total Logs', value: total, sub: total === 1 ? '1 entry' : `${total} entries this page` },
      { label: 'Errors', value: errors, sub: errors ? `${Math.round((errors / total) * 100)}% error rate` : 'No errors', modifier: 'error' },
      { label: 'Warnings', value: warns, sub: warns ? `${Math.round((warns / total) * 100)}% warn rate` : 'No warnings', modifier: 'warn' },
      { label: 'Services', value: services, sub: services === 1 ? '1 service' : `${services} services` }
    ]);
  }
}

function renderStatsLoading() {
  const container = document.getElementById('logs-stats-container');
  if (container) {
    container.innerHTML = statCardsHtml([
      { label: 'Total Logs', value: '…' },
      { label: 'Errors', value: '…', modifier: 'error' },
      { label: 'Warnings', value: '…', modifier: 'warn' },
      { label: 'Services', value: '…' }
    ]);
  }
}

// ── Render Table ──────────────────────────────────────────────────────────────

/** Skeleton loading table — columns match the real table structure. */
function renderTableLoading() {
  const wrap = document.getElementById('logs-table-wrap');
  if (!wrap) { return; }

  const skeletonRow = () => `
    <tr class="logs-skeleton-row">
      <td><div class="skeleton-cell" style="width:130px"></div></td>
      <td><div class="skeleton-cell" style="width:48px"></div></td>
      <td><div class="skeleton-cell" style="width:90px"></div></td>
      <td><div class="skeleton-cell" style="width:60px"></div></td>
      <td><div class="skeleton-cell" style="width:260px"></div></td>
      <td></td>
    </tr>`;

  wrap.innerHTML = `
    <table class="logs-table" aria-busy="true" aria-label="Loading logs">
      <thead>
        <tr>
          <th>Timestamp</th><th>Level</th><th>Service</th>
          <th>Env</th><th>Message</th><th></th>
        </tr>
      </thead>
      <tbody>${Array.from({ length: 8 }, skeletonRow).join('')}</tbody>
    </table>`;
}

/** Empty state — shown when the API returns 0 results. */
function renderEmpty(msg = 'No log entries match the selected filters.') {
  const wrap = document.getElementById('logs-table-wrap');
  if (!wrap) { return; }
  wrap.innerHTML = emptyStateHtml('No logs found', msg);

  const badge = document.getElementById('logs-count-badge');
  if (badge) { badge.textContent = '0 entries'; }
}

/** Fetch-error state — shown when the API call fails. */
function renderFetchError(msg) {
  const wrap = document.getElementById('logs-table-wrap');
  if (!wrap) { return; }
  wrap.innerHTML = errorStateHtml(msg, 'reloadLogs');
}

/** Main table render — populates the table and binds row-click handlers. */
function renderTable(logs) {
  const wrap = document.getElementById('logs-table-wrap');
  if (!wrap) { return; }

  if (!logs.length) {
    renderEmpty('No log entries match the selected filters.');
    return;
  }

  const badge = document.getElementById('logs-count-badge');
  if (badge) { badge.textContent = `${logs.length} entr${logs.length === 1 ? 'y' : 'ies'}`; }

  const rows = logs.map((log, i) => `
    <tr data-log-index="${i}" tabindex="0" role="button"
        aria-label="View log from ${escHtml(log.service ?? '?')} at ${escHtml(fmtTime(log.server_timestamp))}">
      <td class="logs-col-time">${escHtml(fmtTime(log.server_timestamp))}</td>
      <td>${levelBadge(log.level)}</td>
      <td class="logs-col-service">${escHtml(log.service ?? '—')}</td>
      <td><span class="logs-col-env">${escHtml(log.environment ?? '—')}</span></td>
      <td class="logs-col-message" title="${escHtml(log.message)}">${escHtml(log.message ?? '')}</td>
      <td class="logs-col-chevron" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 5l5 5-5 5" stroke="currentColor" stroke-width="1.6"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </td>
    </tr>`).join('');

  wrap.innerHTML = `
    <table class="logs-table" aria-label="Log entries">
      <thead>
        <tr>
          <th>Timestamp</th><th>Level</th><th>Service</th>
          <th>Env</th><th>Message</th><th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  // Bind row interactions
  wrap.querySelectorAll('tbody tr').forEach(row => {
    const open = () => openDrawer(logs[Number(row.dataset.logIndex)]);
    row.addEventListener('click', open);
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });
}

// ── Pagination ────────────────────────────────────────────────────────────────

function renderPagination(page, hasNext) {
  const nav     = document.getElementById('logs-pagination');
  const info    = document.getElementById('logs-page-info');
  const prevBtn = document.getElementById('logs-prev-btn');
  const nextBtn = document.getElementById('logs-next-btn');
  if (!nav) { return; }

  const hasPrev = page > 1;
  nav.style.display = (hasPrev || hasNext) ? 'flex' : 'none';

  if (info)    { info.textContent = `Page ${page}`; }
  if (prevBtn) { prevBtn.disabled = !hasPrev; }
  if (nextBtn) { nextBtn.disabled = !hasNext; }
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

function openDrawer(log) {
  const drawer = document.getElementById('logs-drawer');
  const body   = document.getElementById('logs-drawer-body');
  if (!drawer || !body) { return; }

  let payloadDisplay = '(none)';
  if (log.payload_json) {
    try   { payloadDisplay = JSON.stringify(JSON.parse(log.payload_json), null, 2); }
    catch { payloadDisplay = log.payload_json; }
  }

  body.innerHTML = `
    <div class="drawer-field">
      <div class="drawer-field__label">Level</div>
      <div class="drawer-field__value">${levelBadge(log.level)}</div>
    </div>
    <div class="drawer-field">
      <div class="drawer-field__label">Message</div>
      <div class="drawer-field__value">${escHtml(log.message ?? '—')}</div>
    </div>
    <hr class="drawer-divider"/>
    <div class="drawer-field">
      <div class="drawer-field__label">Service</div>
      <div class="drawer-field__value">${escHtml(log.service ?? '—')}</div>
    </div>
    <div class="drawer-field">
      <div class="drawer-field__label">Environment</div>
      <div class="drawer-field__value">${escHtml(log.environment ?? '—')}</div>
    </div>
    <hr class="drawer-divider"/>
    <div class="drawer-field">
      <div class="drawer-field__label">Server Timestamp</div>
      <div class="drawer-field__value">
        ${escHtml(fmtTime(log.server_timestamp))}
        <span style="color:var(--color-text-muted);font-size:13px"> (${fmtRelative(log.server_timestamp)})</span>
      </div>
    </div>
    <div class="drawer-field">
      <div class="drawer-field__label">Client Timestamp</div>
      <div class="drawer-field__value">${escHtml(fmtTime(log.client_timestamp ?? log.payload_timestamp))}</div>
    </div>
    <div class="drawer-field">
      <div class="drawer-field__label">Log ID</div>
      <div class="drawer-field__value" style="font-family:monospace;font-size:13px">${escHtml(log.id ?? '—')}</div>
    </div>
    <hr class="drawer-divider"/>
    <div class="drawer-field">
      <div class="drawer-field__label">Payload JSON</div>
      <pre class="drawer-payload">${escHtml(payloadDisplay)}</pre>
    </div>`;

  drawer.removeAttribute('hidden');
  drawer.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => { document.getElementById('logs-drawer-close')?.focus(); });
}

function closeDrawer() {
  const drawer = document.getElementById('logs-drawer');
  if (!drawer) { return; }
  drawer.setAttribute('hidden', '');
  drawer.setAttribute('aria-hidden', 'true');
}

// ── Auto-refresh ──────────────────────────────────────────────────────────────

const AUTO_REFRESH_MS = 30_000;

function setAutoRefresh(enabled) {
  clearInterval(state.autoRefreshTimer);
  state.autoRefreshTimer = null;

  const btn = document.getElementById('logs-auto-refresh-toggle');
  if (btn) { btn.setAttribute('aria-checked', enabled ? 'true' : 'false'); }

  if (enabled) {
    state.autoRefreshTimer = setInterval(() => load({ silent: true }), AUTO_REFRESH_MS);
  }
}

// ── Load ──────────────────────────────────────────────────────────────────────

/**
 * Fetch logs from the backend and render the page.
 * @param {{ silent?: boolean }} [opts]
 */
async function load(opts = {}) {
  if (state.loading) { return; }
  state.loading = true;

  if (!opts.silent) {
    renderTableLoading();
    renderStatsLoading();
  }

  const params = {
    page:  String(state.page),
    limit: String(state.limit),
  };

  if (state.level && state.level !== 'all') { params.level = state.level; }
  if (state.since) { params.since = state.since; }

  try {
    const result = await apiGetLogs(params);

    if (!result.success) {
      console.error('[WatchTower] Logs fetch error:', result.error);
      renderFetchError(result.error.message);
      if (!opts.silent) { showToast('Could not load logs: ' + result.error.message, true); }
      return;
    }

    const logs = result.data?.logs ?? [];
    state.lastLogs = logs;

    renderStats(logs);
    renderTable(logs);

    // Heuristic: if a full page came back, there's probably a next page
    renderPagination(state.page, logs.length >= state.limit);

  } finally {
    state.loading = false;
  }
}

// ── Filter Wiring ─────────────────────────────────────────────────────────────

function bindFilters() {
  // Level pills
  document.querySelectorAll('.logs-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.logs-pill').forEach(p => p.classList.remove('logs-pill--active'));
      pill.classList.add('logs-pill--active');
      state.level = pill.dataset.level ?? 'all';
      state.page  = 1;
      load();
    });
  });

  // Time range
  const timeFilter = document.getElementById('filter-time');
  timeFilter?.addEventListener('change', () => {
    state.since = sinceFromRange(timeFilter.value);
    state.page  = 1;
    load();
  });

  // Per-page limit
  const limitFilter = document.getElementById('filter-limit');
  limitFilter?.addEventListener('change', () => {
    state.limit = Number(limitFilter.value) || 20;
    state.page  = 1;
    load();
  });

  // Manual refresh
  document.getElementById('logs-refresh-btn')?.addEventListener('click', () => load());

  // Auto-refresh toggle
  document.getElementById('logs-auto-refresh-toggle')?.addEventListener('click', e => {
    const current = e.currentTarget.getAttribute('aria-checked') === 'true';
    setAutoRefresh(!current);
  });

  // Pagination buttons
  document.getElementById('logs-prev-btn')?.addEventListener('click', () => {
    if (state.page > 1) { state.page -= 1; load(); }
  });
  document.getElementById('logs-next-btn')?.addEventListener('click', () => {
    state.page += 1; load();
  });
}

// ── Drawer Wiring ─────────────────────────────────────────────────────────────

function bindDrawer() {
  document.getElementById('logs-drawer-close')?.addEventListener('click', closeDrawer);
  document.getElementById('logs-drawer-backdrop')?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); } });
}

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  bindFilters();
  bindDrawer();
  load();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('pageshow', () => { load(); });
