/**
 * skeleton.js — generates skeleton loader HTML strings.
 *
 * Relies on the .skeleton and .skeleton--{slot} CSS utilities already
 * defined in components.css (badge, title, stat, block).
 *
 * Usage:
 *   import { skeletonHtml } from '../../components/skeleton.js';
 *
 *   container.innerHTML = `
 *     <div class="detail-card">
 *       ${skeletonHtml(['badge', 'title'])}
 *       <div class="detail-stats">
 *         ${skeletonHtml(['stat', 'stat', 'stat', 'stat'])}
 *       </div>
 *       ${skeletonHtml(['block', 'block'])}
 *     </div>`;
 */

/**
 * Returns an HTML string of shimmer skeleton placeholder divs.
 *
 * @param {string[]} slots - Array of .skeleton modifier names.
 *                           Recognised values: 'badge' | 'title' | 'stat' | 'block'
 *                           Any other value produces a valid (unstyled) class name.
 * @returns {string}
 */
export function skeletonHtml(slots = []) {
  return slots
    .map(slot => `<div class="skeleton skeleton--${slot}"></div>`)
    .join('\n    ');
}
