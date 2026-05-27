/**
 * navbar.js
 * Reusable left-sidebar navigation component for the WatchTower dashboard.
 * Styles are defined in styles/layout.css — this file only handles DOM construction.
 *
 * Usage (in each page's JS module):
 *   import { renderNavbar } from '../components/navbar.js';
 *   renderNavbar('error-list');  // pass the active page id
 */

import { clearSession, DASHBOARD_HOME, getSession } from '../utils/auth.js';

const NAV_ITEMS = [
  { id: 'error-list',  label: 'Error List',       href: 'error-list.html',  icon: 'assets/icons/error-list.svg'  },
  { id: 'performance', label: 'Performance',       href: 'performance.html', icon: 'assets/icons/performance.svg' },
  { id: 'feedback',    label: 'Feedback Inbox',    href: 'feedback.html',    icon: 'assets/icons/feedback.svg'    },
  { id: 'alerts',      label: 'Alert Settings',    href: 'alerts.html',      icon: 'assets/icons/alerts.svg'      },
  { id: 'settings',    label: 'Project Settings',  href: 'settings.html',    icon: 'assets/icons/settings.svg'    },
];

/** Fetch and return inline SVG text, or '' on failure. */
async function fetchSVG(path) {
  try {
    const res = await fetch(path);
    return res.ok ? await res.text() : '';
  } catch {
    return '';
  }
}

/** Return current theme: 'dark' | 'light' */
function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** Apply theme to <html> and persist to localStorage */
function setTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('wt-theme', theme);
  updateToggleLabel();
}

/** Update the toggle button text/icon to reflect current theme */
function updateToggleLabel() {
  const btn = document.getElementById('navbar-theme-toggle');
  if (!btn) return;
  const isDark = getTheme() === 'dark';
  btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  btn.querySelector('.theme-toggle__moon').style.display = isDark ? 'none'  : 'block';
  btn.querySelector('.theme-toggle__sun').style.display  = isDark ? 'block' : 'none';
  btn.querySelector('.theme-toggle__text').textContent   = isDark ? 'Light mode' : 'Dark mode';
}

/**
 * Render the navbar into #navbar-root.
 * @param {string} [activeId] - Nav item id for the current page. Auto-detected if omitted.
 */
export async function renderNavbar(activeId = '') {
  const session = getSession();
  if (!session) {return;}

  // Auto-detect from URL if not provided
  if (!activeId) {
    const page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    activeId = NAV_ITEMS.find(item => item.href.startsWith(page) || item.id === page)?.id ?? '';
  }

  const [navSvgs, userIcon, signOutIcon] = await Promise.all([
    Promise.all(NAV_ITEMS.map(item => fetchSVG(item.icon))),
    fetchSVG('assets/icons/user.svg'),
    fetchSVG('assets/icons/sign-out.svg'),
  ]);

  const nav = document.createElement('nav');
  nav.id = 'navbar';
  nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML = `
    <div class="navbar__topbar">
  <div class="navbar__topbar-row">
    <a class="navbar__projects-back" href="${DASHBOARD_HOME}" aria-label="Back to all projects">
      <span class="navbar__projects-back-icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M11.667 5.833 7.5 10l4.167 4.167" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span>All Projects</span>
    </a>
    <a href="${DASHBOARD_HOME}" class="navbar__brand-icon" aria-label="WatchTower home">
      <img src="assets/images/light-logo.png" class="navbar__logo navbar__logo--light" alt="WatchTower" />
      <img src="assets/images/dark-logo.png"  class="navbar__logo navbar__logo--dark"  alt="WatchTower" />
    </a>
  </div>
  <div class="navbar__brand-name">WatchTower</div>
</div>
  
    <div class="navbar__panel">
      <ul class="navbar__nav" role="list">
        ${NAV_ITEMS.map((item, i) => `
          <li>
            <a id="nav-${item.id}"
               class="navbar__link${item.id === activeId ? ' navbar__link--active' : ''}"
               href="${item.href}"
               aria-current="${item.id === activeId ? 'page' : 'false'}"
               data-nav-id="${item.id}">
              <span class="navbar__icon" aria-hidden="true">${navSvgs[i]}</span>
              <span class="navbar__label">${item.label}</span>
            </a>
          </li>`).join('')}
      </ul>
    </div>

    <div class="navbar__theme-toggle-wrap">
      <button
        id="navbar-theme-toggle"
        class="theme-toggle"
        type="button"
        aria-label="Switch to dark mode"
        data-wt-bound="1"
      >
        <span class="theme-toggle__icon" aria-hidden="true">
          <svg class="theme-toggle__moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <svg class="theme-toggle__sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </span>
        <span class="theme-toggle__text">Dark mode</span>
      </button>
    </div>

    <div class="navbar__account">
      <div id="navbar-account-menu" class="navbar__account-menu" hidden>
        <button id="navbar-signout" class="navbar__account-action" type="button">
          <span class="navbar__account-action-icon" aria-hidden="true">${signOutIcon}</span>
          <span>Sign Out</span>
        </button>
      </div>
      <button
        id="navbar-account-trigger"
        class="navbar__account-trigger"
        type="button"
        aria-haspopup="menu"
        aria-controls="navbar-account-menu"
        aria-expanded="false"
      >
        <span class="navbar__account-avatar" aria-hidden="true">${userIcon}</span>
        <span class="navbar__account-email">${session.email}</span>
        <span class="navbar__account-caret" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M5.833 7.917 10 12.083l4.167-4.166" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>
    </div>`;

  const root = document.getElementById('navbar-root');
  if (!root) {return;}
  root.replaceChildren(nav);

  // ── Theme toggle ──────────────────────────────────────────────
  updateToggleLabel(); // sync icon/text to current theme on render
  document.getElementById('navbar-theme-toggle')?.addEventListener('click', () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });

  // ── Account menu ──────────────────────────────────────────────
  const trigger = document.getElementById('navbar-account-trigger');
  const menu = document.getElementById('navbar-account-menu');
  const signOutButton = document.getElementById('navbar-signout');

  /**
   * Toggles the account menu open state.
   * @param {boolean} open
   * @returns {void}
   */
  function setMenuOpen(open) {
    trigger?.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu?.toggleAttribute('hidden', !open);
    nav.classList.toggle('navbar--menu-open', open);
  }

  trigger?.addEventListener('click', event => {
    event.stopPropagation();
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    setMenuOpen(!isOpen);
  });

  signOutButton?.addEventListener('click', () => {
    clearSession();
    window.location.replace('index.html');
  });

  document.addEventListener('click', event => {
    if (!nav.contains(event.target)) {setMenuOpen(false);}
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {setMenuOpen(false);}
  });
}

/** Swap the active highlight without re-rendering. */
export function setActiveNavItem(newId) {
  document.querySelectorAll('.navbar__link').forEach(link => {
    const active = link.dataset.navId === newId;
    link.classList.toggle('navbar__link--active', active);
    link.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

export { NAV_ITEMS };