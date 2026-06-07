/**
 * pageState.js — reusable loading, empty, and error state HTML builders.
 *
 * All three functions return HTML strings ready to be set as innerHTML.
 * Styles live in components.css under the .page-state block class.
 *
 * Usage:
 *   import { loadingStateHtml, emptyStateHtml, errorStateHtml } from '../../components/pageState.js';
 *
 *   container.innerHTML = loadingStateHtml('Fetching errors…');
 *   container.innerHTML = emptyStateHtml('No logs found', 'Try adjusting your filters.');
 *   container.innerHTML = errorStateHtml(err.message, 'reloadLogs');
 */

import { escHtml } from '../utils/dom.js';

/**
 * Returns HTML for a centred spinner + optional message.
 * Suitable for inline containers (no extra vertical padding).
 *
 * @param {string} [message='Loading…']
 * @returns {string}
 */
export function loadingStateHtml(message = 'Loading…') {
  return `
    <div class="page-state">
      <div class="spinner"></div>
      <span>${escHtml(message)}</span>
    </div>`;
}

/**
 * Returns HTML for an empty / no-data state with an illustration icon.
 * Renders centred with comfortable vertical padding.
 *
 * @param {string} title  - Short heading (e.g. 'No logs found').
 * @param {string} [body] - Optional supporting sentence shown below the heading.
 * @returns {string}
 */
export function emptyStateHtml(title, body = '') {
  return `
    <div class="page-state page-state--padded">
      <svg class="page-state__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <line x1="8"  y1="8"    x2="16" y2="8"    stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="8"  y1="12"   x2="16" y2="12"   stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="8"  y1="16"   x2="12" y2="16"   stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
      <div class="page-state__title">${escHtml(title)}</div>
      ${body ? `<div class="page-state__body">${escHtml(body)}</div>` : ''}
    </div>`;
}

/**
 * Returns HTML for a fetch-error state with an optional retry button.
 *
 * @param {string} message        - Error message shown to the user.
 * @param {string} [retryFnName]  - window-scoped function name called by the retry button
 *                                  (e.g. 'reloadLogs'). Omit to hide the button.
 * @param {string} [retryLabel]   - Button label (default: 'Try again').
 * @returns {string}
 */
export function errorStateHtml(message, retryFnName, retryLabel = 'Try again') {
  const retryBtn = retryFnName
    ? `<button class="btn btn--outline" onclick="${escHtml(retryFnName)}()" type="button">${escHtml(retryLabel)}</button>`
    : '';
  return `
    <div class="page-state page-state--padded">
      <svg class="page-state__icon page-state__icon--error" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="var(--color-critical)" stroke-width="1.5"/>
        <line x1="12" y1="7" x2="12" y2="13" stroke="var(--color-critical)" stroke-width="1.7" stroke-linecap="round"/>
        <circle cx="12" cy="16.5" r="1" fill="var(--color-critical)"/>
      </svg>
      <div class="page-state__title page-state__title--error">Failed to load</div>
      <div class="page-state__body">${escHtml(message)}</div>
      ${retryBtn}
    </div>`;
}
