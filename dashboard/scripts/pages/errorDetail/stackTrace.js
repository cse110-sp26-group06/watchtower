/**
 * stackTrace.js — renders a syntax-highlighted stack-trace block.
 *
 * Returns an HTML string; no DOM side-effects.
 */

import { escHtml } from '../../utils/dom.js';

/**
 * Renders a stack trace array as a styled <pre> block.
 * @param {string[]} frames - Array of stack frame strings.
 * @returns {string} HTML string.
 */
export function renderStackTrace(frames = []) {
  if (!frames.length) {return '';}

  const lines = frames
    .map(frame => {
      const escaped = escHtml(frame);
      // Dim the [...more...] lines slightly
      if (frame.startsWith('[')) {
        return `<span class="stack-trace__ellipsis">${escaped}</span>`;
      }
      // Highlight "at FunctionName" differently from the file path
      return escaped.replace(
        /^(at\s+)(\S+)(\s+)(\(.+\))$/,
        (_, at, fn, sp, loc) =>
          `<span class="stack-trace__at">${at}</span>` +
          `<span class="stack-trace__fn">${fn}</span>` +
          sp +
          `<span class="stack-trace__loc">${loc}</span>`
      );
    })
    .join('\n');

  return `<pre class="stack-trace" aria-label="Stack trace"><code>${lines}</code></pre>`;
}
