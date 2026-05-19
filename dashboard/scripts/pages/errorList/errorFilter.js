/**
 * errorFilter.js — filter & pagination wiring for the Error List page.
 *
 * Exports `initFilters(state, onchange)` which attaches all <select>
 * and pagination button listeners. Keeping this separate from errorList.js
 * means the main file only deals with fetching and rendering.
 */

import { API_BASE, API_KEY, PAGE_LIMIT } from '../../utils/constants.js';

/**
 * Converts a `since` shorthand (e.g. '24h', '7d') into an ISO 8601
 * timestamp string suitable for a D1 `WHERE server_timestamp >= ?` clause.
 *
 * The backend receives this as the `since` query param and should bind it
 * directly in SQL:
 *   SELECT * FROM errors WHERE server_timestamp >= ?
 *
 * @param {string} since  One of '1h' | '24h' | '7d' | '30d' | 'all'
 * @returns {string|null} ISO timestamp string, or null when since === 'all'
 */
export function sinceToIso(since) {
  if (!since || since === 'all') { return null; }

  const units = { h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  const match = since.match(/^(\d+)([hd])$/);
  if (!match) { return null; }

  const ms = parseInt(match[1], 10) * units[match[2]];
  return new Date(Date.now() - ms).toISOString();
}

/**
 * Builds the API query URL from the current state.
 *
 * Param mapping → D1 column:
 *   api_key  → authenticates and scopes results to the right project
 *   since    → server_timestamp  (ISO string; backend does `>= ?`)
 *   severity → severity          
 *   status   → status
 *   page / limit → handled in the Worker for LIMIT / OFFSET
 *
 * @param {object} state
 * @returns {string}
 */
export function buildUrl(state) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    page:    state.page,
    limit:   PAGE_LIMIT,
  });

  const sinceIso = sinceToIso(state.since);
  if (sinceIso) { params.set('since', sinceIso); }
	//if (state.severity && state.severity !== 'all') {params.set('severity', state.severity);}
  if (state.status && state.status !== 'all') { params.set('status', state.status); }

  return `${API_BASE}?${params}`;
}

/**
 * Wires all filter <select> elements and pagination buttons.
 * Calls `onChange()` whenever any value changes.
 *
 * @param {object}   state     Shared mutable state object
 * @param {Function} onChange  Callback to trigger a re-fetch/render
 */
export function initFilters(state, onChange) {
  document.getElementById('filter-severity')?.addEventListener('change', e => {
    state.severity = e.target.value;
    state.page = 1;
    onChange();
  });

  document.getElementById('filter-time')?.addEventListener('change', e => {
    state.since = e.target.value;
    state.page = 1;
    onChange();
  });

  document.getElementById('filter-status')?.addEventListener('change', e => {
    state.status = e.target.value;
    state.page = 1;
    onChange();
  });

  document.getElementById('prevBtn')?.addEventListener('click', () => {
    if (state.page > 1) { state.page--; onChange(); }
  });

  document.getElementById('nextBtn')?.addEventListener('click', () => {
    state.page++;
    onChange();
  });
}
