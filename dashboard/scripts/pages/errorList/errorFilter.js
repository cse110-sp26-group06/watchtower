/**
 * errorFilter.js — filter & pagination wiring for the Error List page.
 *
 * Exports `initFilters(state, onchange)` which attaches all <select>
 * and pagination button listeners. Keeping this separate from errorList.js
 * means the main file only deals with fetching and rendering.
 */

import { API_BASE, PROJECT_ID, PAGE_LIMIT } from '../../utils/constants.js';

/**
 * Builds the API query URL from the current state.
 * @param {object} state
 */
export function buildUrl(state) {
  const params = new URLSearchParams({
    projectId: PROJECT_ID,
    since:     state.since,
    page:      state.page,
    limit:     PAGE_LIMIT,
  });
  if (state.severity && state.severity !== 'all') params.set('severity', state.severity);
  if (state.status   && state.status   !== 'all') params.set('status',   state.status);
  return `${API_BASE}?${params}`;
}

/**
 * Wires all filter <select> elements and pagination buttons.
 * Calls `onChange()` whenever any value changes.
 *
 * @param {object}   state      - Shared mutable state object.
 * @param {Function} onChange   - Callback to trigger a re-fetch/render.
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
