/**
 * errorDetail.js — page script for error-detail.html
 *
 * Reads ?id= from the URL, looks up the error in MOCK_ERRORS
 * (or fetches from the real API when available), and renders
 * all detail sections into the page.
 */

import { renderNavbar }   from '../../components/navbar.js';
import { badgeClass }     from '../../components/errorCard.js';
import { renderStackTrace } from './stackTrace.js';
import { MOCK_ERRORS }    from '../../utils/constants.js';
import { escHtml }        from '../../utils/dom.js';
import { isErrorResolved, markErrorResolved, withResolvedStatus } from '../../utils/errorStatus.js';
import { showToast }      from '../../utils/toast.js';

renderNavbar('error-list');

/* ── URL param ──────────────────────────────────────────────────── */
const params = new URLSearchParams(window.location.search);
const errorId = params.get('id');

/* ── DOM refs ───────────────────────────────────────────────────── */
const resolveBtn = document.getElementById('resolve-btn');

/* ── Resolve button ─────────────────────────────────────────────── */
function syncResolveButton(resolved) {
  if (!resolveBtn) return;
  resolveBtn.textContent = resolved ? '✓ Resolved' : 'Mark Resolved';
  resolveBtn.classList.toggle('btn--resolved', resolved);
  resolveBtn.disabled = resolved;
}

syncResolveButton(isErrorResolved(errorId));

resolveBtn?.addEventListener('click', () => {
  if (!errorId || isErrorResolved(errorId)) return;
  markErrorResolved(errorId);
  syncResolveButton(true);
  showToast('Error marked as resolved.');
});

/* ── Fetch / mock ───────────────────────────────────────────────── */
async function fetchError(id) {
  // Mock path — remove when real API is ready
  if (Array.isArray(MOCK_ERRORS) && MOCK_ERRORS.length) {
    await new Promise(r => setTimeout(r, 300));
    const found = MOCK_ERRORS.find(e => String(e.id) === String(id));
    if (!found) throw new Error(`No error found with id "${id}"`);
    return withResolvedStatus(found);
  }

  const res = await fetch(`/api/errors/${encodeURIComponent(id)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
  const data = await res.json();
  return withResolvedStatus(data);
}

/* ── Timeline icon ──────────────────────────────────────────────── */
function timelineIcon(type) {
  switch (type) {
    case 'critical': return `<span class="timeline__dot timeline__dot--critical"></span>`;
    case 'deploy': return `<span class="timeline__dot timeline__dot--deploy">⬆</span>`;
    default: return `<span class="timeline__dot timeline__dot--info"></span>`;
  }
}

/* ── Render ─────────────────────────────────────────────────────── */
function renderDetail(err) {
  const cls = badgeClass(err.severity);
  const label = (err.severity ?? 'unknown').toUpperCase();
  const message = escHtml(err.message ?? err.title ?? 'Unknown error');

  // Stats cards
  const stats = `
    <div class="detail-stats">
      <div class="detail-stat">
        <span class="detail-stat__label">Occurrences</span>
        <span class="detail-stat__value">${(err.occurrences ?? '—').toLocaleString()}</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat__label">Affected Users</span>
        <span class="detail-stat__value">${(err.affectedUsers ?? '—').toLocaleString()}</span>
      </div>
      <div class="detail-stat">
        <span class="detail-stat__label">First Seen</span>
        <span class="detail-stat__value detail-stat__value--text">${escHtml(err.firstSeen ?? '—')}</span>
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
  const stack = err.stackTrace?.length ? `
    <section class="detail-section" aria-labelledby="stack-heading">
      <h2 class="detail-section__title" id="stack-heading">Stack Trace</h2>
      ${renderStackTrace(err.stackTrace)}
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

  // Inject everything after the back-link / header block
  const detailRoot = document.getElementById('detail-root');
  detailRoot.innerHTML = `
    <div class="detail-card">
      <div class="detail-card__top">
        <span class="badge ${cls}">${label}</span>
      </div>
      <h1 class="detail-card__message">${message}</h1>
      ${stats}
      ${deploy}
      ${stack}
      ${timeline}
    </div>`;
}

function renderSkeleton() {
  const detailRoot = document.getElementById('detail-root');
  detailRoot.innerHTML = `
    <div class="detail-card">
      <div class="skeleton skeleton--badge"></div>
      <div class="skeleton skeleton--title"></div>
      <div class="detail-stats">
        <div class="skeleton skeleton--stat"></div>
        <div class="skeleton skeleton--stat"></div>
        <div class="skeleton skeleton--stat"></div>
      </div>
      <div class="skeleton skeleton--block"></div>
      <div class="skeleton skeleton--block"></div>
    </div>`;
}

function renderError(msg) {
  const detailRoot = document.getElementById('detail-root');
  detailRoot.innerHTML = `
    <div class="detail-card" style="align-items:flex-start;gap:12px;">
      <span style="font-weight:600;color:var(--color-critical);">⚠ Could not load error</span>
      <span style="font-size:13px;color:var(--color-text-muted);">${escHtml(msg)}</span>
      <a href="index.html" class="btn btn--outline" style="margin-top:4px;">← Back to Error List</a>
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
