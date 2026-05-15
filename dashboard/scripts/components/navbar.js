/**
 * navbar.js
 * Reusable left-sidebar navigation component for the WatchTower dashboard.
 * Styles are defined in styles/globals.css — this file only handles DOM construction.
 *
 * Usage (in each page's JS module):
 *   import { renderNavbar } from '../components/navbar.js';
 *   renderNavbar('error-list');  // pass the active page id
 */

const NAV_ITEMS = [
  { id: 'error-list',  label: 'Error List',       href: 'index.html',       icon: 'assets/icons/error-list.svg'  },
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
  // Auto-detect from URL if not provided
  if (!activeId) {
    const page = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    activeId = NAV_ITEMS.find(item => item.href.startsWith(page) || item.id === page)?.id ?? '';
  }

  const svgs = await Promise.all(NAV_ITEMS.map(item => fetchSVG(item.icon)));

  const nav = document.createElement('nav');
  nav.id = 'navbar';
  nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML = `
    <a class="navbar__brand" href="index.html" aria-label="WatchTower home">
      <span class="navbar__brand-title">WatchTower</span>
      <span class="navbar__brand-subtitle">Observability Dashboard</span>
    </a>
    <ul class="navbar__nav" role="list">
      ${NAV_ITEMS.map((item, i) => `
        <li>
          <a id="nav-${item.id}"
             class="navbar__link${item.id === activeId ? ' navbar__link--active' : ''}"
             href="${item.href}"
             aria-current="${item.id === activeId ? 'page' : 'false'}"
             data-nav-id="${item.id}">
            <span class="navbar__icon" aria-hidden="true">${svgs[i]}</span>
            <span class="navbar__label">${item.label}</span>
          </a>
        </li>`).join('')}
    </ul>`;

  const root = document.getElementById('navbar-root') ?? document.body.prepend(document.createElement('div')) ?? document.body.firstChild;
  root.replaceChildren(nav);
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
