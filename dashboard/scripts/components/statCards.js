/**
 * statCards.js — reusable stat card grid component.
 *
 * Generates the HTML for a grid of label/value/sub-text cards.
 * Styles live in components.css under .stat-cards and .stat-card.
 */

import { escHtml } from '../utils/dom.js';

/**
 * Returns HTML for a grid of stat cards.
 *
 * @param {Array<{ label: string, value: string|number, sub?: string, modifier?: 'error'|'warn'|'good'|'bad', subModifier?: 'good'|'bad'|'neutral' }>} cards
 * @returns {string}
 */
export function statCardsHtml(cards) {
  const cardsHtml = cards.map(c => {
    const modClass = c.modifier ? ` stat-card--${c.modifier}` : '';
    const subModClass = c.subModifier ? ` stat-card__sub--${c.subModifier}` : '';
    return `
      <div class="stat-card${modClass}">
        <div class="stat-card__label">${escHtml(c.label)}</div>
        <div class="stat-card__value">${escHtml(String(c.value))}</div>
        ${c.sub ? `<div class="stat-card__sub${subModClass}">${escHtml(c.sub)}</div>` : ''}
      </div>`;
  }).join('');

  return `<div class="stat-cards">${cardsHtml}</div>`;
}
