/**
 * errorDetail.js — page script for error-detail.html
 *
 * Reads ?id= from the URL, looks up the error in MOCK_ERRORS
 * (or fetches from the real API when available), and renders
 * all detail sections into the page.
 */

import { renderNavbar }     from '../../components/navbar.js';
import { badgeClass }       from '../../components/errorCard.js';
import { renderStackTrace } from './stackTrace.js';
import { MOCK_ERRORS, normalizeError } from '../../utils/constants.js';
import { apiGet, apiPatch } from '../../api/api.js';
import { requireAuth } from '../../utils/auth.js';
import { escHtml }          from '../../utils/dom.js';
import { markErrorResolved, withResolvedStatus } from '../../utils/errorStatus.js';
import { showToast }        from '../../utils/toast.js';

const session = requireAuth();
if (session) {renderNavbar('error-list');}

/* ── URL param ──────────────────────────────────────────────────── */
const params  = new URLSearchParams(window.location.search);
const errorId = params.get('id');

/* ── DOM refs ───────────────────────────────────────────────────── */
const resolveBtn = document.getElementById('resolve-btn');

/* ── Resolve button ─────────────────────────────────────────────── */
/**
 * Updates the resolve button to reflect the error's current status.
 * `status` is now the D1 column value ('resolved' | 'unresolved');
 * no localStorage check needed — truth comes from the data.
 *
 * @param {boolean} resolved
 */
function syncResolveButton(resolved) {
  if (!resolveBtn) {return;}
  resolveBtn.textContent = resolved ? '✓ Resolved' : 'Mark Resolved';
  resolveBtn.classList.toggle('btn--resolved', resolved);
  resolveBtn.disabled = resolved;
}

/**
 * PATCHes the error status to 'resolved' on the backend,
 * then updates the button on success.
 */
async function handleResolve() {
  if (!errorId) {return;}
  resolveBtn.disabled = true;

  try {
    // ── MOCK: remove this block when real API is ready ──────────
    if (Array.isArray(MOCK_ERRORS) && MOCK_ERRORS.length) {
      await new Promise(r => setTimeout(r, 200));
      markErrorResolved(errorId);
      syncResolveButton(true);
      showToast('Error marked as resolved.');
      return;
    }
    // ── END MOCK ─────────────────────────────────────────────────

    const result = await apiPatch(`/${errorId}`, { status: 'resolved' });
    if (!result.success) throw new Error(result.error.message);

    syncResolveButton(true);
    showToast('Error marked as resolved.');
  } catch (err) {
    console.error('[WatchTower] resolve failed:', err);
    resolveBtn.disabled = false;          // let them retry
    showToast('Could not resolve error: ' + err.message, true);
  }
}

resolveBtn?.addEventListener('click', handleResolve);

/* ── Fetch / mock ───────────────────────────────────────────────── */
/**
 * Loads a single error by ID, normalizing the raw D1 row into the
 * shape renderDetail() expects.
 *
 * Mock path  — finds the matching row in MOCK_ERRORS and normalizes it.
 * Real path  — GETs /api/errors/:id and normalizes the returned row.
 *
 * `withResolvedStatus` is no longer called here: the D1 `status` column
 * ('resolved' | 'unresolved') is preserved by normalizeError() as-is.
 *
 * @param {string} id
 * @returns {Promise<object>} Normalized error object
 */
async function fetchError(id) {
  // ── MOCK: remove this block when real API is ready ──────────
  if (Array.isArray(MOCK_ERRORS) && MOCK_ERRORS.length) {
    await new Promise(r => setTimeout(r, 300));
    const raw = MOCK_ERRORS.find(e => String(e.id) === String(id));
    if (!raw) {throw new Error(`No error found with id "${id}"`);}
    return withResolvedStatus(normalizeError(raw));
  }

  const result = await apiGet('', { status: 'all' });
  if (!result.success) {throw new Error(result.error.message);}
  const errors = result.data?.errors ?? [];
  const row = errors.find(e => String(e.id) === String(id));
  if (!row) {throw new Error('No error found with that ID.');}
  return withResolvedStatus(normalizeError(row));
}


/* ── Timeline icon ──────────────────────────────────────────────── */
/**
 * Returns the timeline marker HTML for an event type.
 * @param {string} type
 * @returns {string}
 */
function timelineIcon(type) {
  switch (type) {
  case 'critical': return `<span class="timeline__dot timeline__dot--critical"></span>`;
  case 'deploy':   return `<span class="timeline__dot timeline__dot--deploy">⬆</span>`;
  default:         return `<span class="timeline__dot timeline__dot--info"></span>`;
  }
}

/* ── Render ─────────────────────────────────────────────────────── */
/**
 * Renders the loaded error detail view.
 *
 * firstSeen / lastSeen are now ISO strings (from client_timestamp /
 * server_timestamp). They're displayed as-is here; swap in a timeAgo()
 * helper if you want relative formatting.
 *
 * @param {object} err  Normalized error object from normalizeError()
 */
function renderDetail(err) {
  // Initialise the resolve button from the data, not localStorage.
  syncResolveButton(err.status === 'resolved');

  const cls     = badgeClass(err.severity);
  const label   = (err.severity ?? 'unknown').toUpperCase();
  const message = escHtml(err.message ?? 'Unknown error');

  // Stats cards
  const stats = `
    <div class="detail-stats">
      <div class="detail-stat">
        <span class="detail-stat__label">Occurrences</span>
        <span class="detail-stat__value">${(err.occurrences ?? 0).toLocaleString()}</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat__label">Affected Users</span>
        <span class="detail-stat__value">${(err.affectedUsers ?? 0).toLocaleString()}</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat__label">First Seen</span>
        <span class="detail-stat__value detail-stat__value--text">${escHtml(err.firstSeen ?? '—')}</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat__label">Last Seen</span>
        <span class="detail-stat__value detail-stat__value--text">${escHtml(err.lastSeen ?? '—')}</span>
      </div>
    </div>`;

  // Deployment context
  const deploy = err.deployment ? `
    <section class="detail-section" aria-labelledby="deploy-heading">
      <h2 class="detail-section__title" id="deploy-heading">Deployment Context</h2>
      <div class="detail-box">
        <p>Version: <strong>${escHtml(err.deployment.version)}</strong></p>
        <p>Deployed: ${escHtml(err.deployment.deployedAt)}</p>
        <p>Commit: <code>${escHtml(err.deployment.commit)}</code></p>
      </div>
    </section>` : '';

  // Stack trace
  const stackFrames = err.stackTrace ? [err.stackTrace] : [];
  const stack = stackFrames.length ? `
    <section class="detail-section" aria-labelledby="stack-heading">
      <h2 class="detail-section__title" id="stack-heading">Stack Trace</h2>
      ${renderStackTrace(stackFrames)}
    </section>` : '';

  // Event timeline
  const timeline = err.timeline?.length ? `
    <section class="detail-section" aria-labelledby="timeline-heading">
      <h2 class="detail-section__title" id="timeline-heading">Event Timeline</h2>
      <ol class="timeline" role="list">
        ${err.timeline.map(ev => `
          <li class="timeline__item">
            ${timelineIcon(ev.type)}
            <div class="timeline__content">
              <span class="timeline__label">${escHtml(ev.label)}</span>
              <span class="timeline__time">${escHtml(ev.time)}</span>
            </div>
          </li>`).join('')}
      </ol>
    </section>` : '';

  document.title = `${label}: ${err.message?.slice(0, 50)} — WatchTower`;

  const detailRoot = document.getElementById('detail-root');
  detailRoot.innerHTML = `
    <div class="detail-card">
      <div class="detail-card__top">
        <span class="badge ${cls}">${label}</span>
        ${err.service     ? `<span class="detail-meta">${escHtml(err.service)}</span>`     : ''}
        ${err.environment ? `<span class="detail-meta">${escHtml(err.environment)}</span>` : ''}
      </div>
      <h1 class="detail-card__message">${message}</h1>
      ${stats}
      ${deploy}
      ${stack}
      ${timeline}
    </div>`;
}

/**
 * Renders the loading skeleton while detail data is fetched.
 */
function renderSkeleton() {
  document.getElementById('detail-root').innerHTML = `
    <div class="detail-card">
      <div class="skeleton skeleton--badge"></div>
      <div class="skeleton skeleton--title"></div>
      <div class="detail-stats">
        <div class="skeleton skeleton--stat"></div>
        <div class="skeleton skeleton--stat"></div>
        <div class="skeleton skeleton--stat"></div>
        <div class="skeleton skeleton--stat"></div>
      </div>
      <div class="skeleton skeleton--block"></div>
      <div class="skeleton skeleton--block"></div>
    </div>`;
}

/**
 * Renders a load failure state for the detail page.
 * @param {string} msg
 */
function renderError(msg) {
  document.getElementById('detail-root').innerHTML = `
    <div class="detail-card" style="align-items:flex-start;gap:12px;">
      <span style="font-weight:600;color:var(--color-critical);">⚠ Could not load error</span>
      <span style="font-size:13px;color:var(--color-text-muted);">${escHtml(msg)}</span>
      <a href="error-list.html" class="btn btn--outline" style="margin-top:4px;">← Back to Error List</a>
    </div>`;
}

/* ── Boot ───────────────────────────────────────────────────────── */
if (!errorId) {
  renderError('No error ID specified in the URL.');
} else {
  renderSkeleton();
  fetchError(errorId)
    .then(renderDetail)
    .catch(err => {
      console.error('[WatchTower] detail fetch failed:', err);
      renderError(err.message);
      showToast('Could not load error: ' + err.message, true);
    });
}
