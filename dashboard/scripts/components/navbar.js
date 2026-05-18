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

/**
 * Render the navbar into #navbar-root.
 * @param {string} [activeId] - Nav item id for the current page. Auto-detected if omitted.
 */
export async function renderNavbar(activeId = '') {
  const session = getSession();
  if (!session) return;

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
    <a class="navbar__brand" href="${DASHBOARD_HOME}" aria-label="WatchTower home">
      <span class="navbar__brand-title">WatchTower</span>
      <span class="navbar__brand-subtitle">Observability Dashboard</span>
    </a>
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
  if (!root) return;
  root.replaceChildren(nav);

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
    if (!nav.contains(event.target)) setMenuOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenuOpen(false);
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
