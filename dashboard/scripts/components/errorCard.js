/**
 * errorCard.js — renders a single error entry card as an HTML string.
 *
 * Imported by errorList.js; kept separate so the card template
 * can be reused on the error-detail page without pulling in list logic.
 */

import { escHtml } from '../utils/dom.js';

const BADGE_CLASS = {
  critical: 'badge--critical',
  high:     'badge--high',
  medium:   'badge--medium',
  low:      'badge--low',
};

/** Returns the CSS modifier class for a severity level. */
export function badgeClass(severity) {
  return BADGE_CLASS[(severity ?? '').toLowerCase()] ?? 'badge--low';
}

/**
 * Returns the HTML string for one error card.
 * @param {object} err   - Error data object.
 * @param {number} index - Position in list (used for animation-delay).
 * @param {string} since - Time-range label shown in occurrences line.
 */
export function renderErrorCard(err, index, since = '24h') {
  const cls     = badgeClass(err.severity);
  const label   = (err.severity ?? 'unknown').toUpperCase();
  const message = escHtml(err.message ?? err.title ?? 'Unknown error');
  const deploy  = escHtml(err.deploy  ?? err.version ?? '');
  const occ     = err.occurrences ?? err.count ?? '—';

  return `
    <a class="error-card" href="error-detail.html?id=${escHtml(String(err.id ?? index))}"
       data-id="${escHtml(String(err.id ?? index))}"
       style="animation-delay:${index * 40}ms"
       aria-label="${label}: ${message}">
      <div class="error-card__body">
        <div class="error-card__meta">
          <span class="badge ${cls}">${label}</span>
          ${deploy ? `<span class="error-card__deploy">Deploy: ${deploy}</span>` : ''}
        </div>
        <div class="error-card__message">${message}</div>
        <div class="error-card__occurrences">Occurrences: ${occ} in last ${since}</div>
      </div>
      <svg class="error-card__chevron" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M7.5 5l5 5-5 5" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>`;
}
