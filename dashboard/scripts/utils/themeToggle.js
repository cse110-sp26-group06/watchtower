/* ================================================================
   themeToggle.js — Light / Dark mode toggle
   Add <script src="scripts/themeToggle.js"></script> to every page
   ================================================================ */

(function () {
  const STORAGE_KEY = 'wt-theme';
  
  /* Apply saved theme immediately to avoid flash */
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }
  
  function setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }
  
  function toggleTheme() {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }
  
  /* Attach listener to any .theme-toggle button already/later in DOM */
  function attachToggleButtons() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      if (btn.dataset.wtBound) {
        return;
      } 
      btn.dataset.wtBound = '1';
      btn.addEventListener('click', toggleTheme);
    });
  }

  document.addEventListener('DOMContentLoaded', attachToggleButtons);

  /* Re-attach if navbar renders dynamically */
  const observer = new MutationObserver(attachToggleButtons);
  observer.observe(document.body, { childList: true, subtree: true });
})();