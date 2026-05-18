/**
 * toast.js — reusable toast notification helper
 *
 * Expects a <div id="toast"></div> in the page HTML.
 * CSS for .show / .show.error should be in globals.css.
 */

let toastTimer;

/**
 * Show a toast message for 3 seconds.
 * @param {string}  msg
 * @param {boolean} [isError=false]
 */
export function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) {return;}
  toast.textContent = msg;
  toast.className   = isError ? 'show error' : 'show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = ''; }, 3000);
}
