/**
 * performance.js
 * Performance page for WatchTower dashboard.
 * Uses Chart.js for the response time bar chart.
 * All data is mocked for development/testing.
 */

import { renderNavbar } from '../../components/navbar.js';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_STATS = {
  responseTime: { value: '234ms', delta: '↓ 12% from yesterday', type: 'good' },
  errorRate:    { value: '2.3%',  delta: '↑ 0.8% from yesterday', type: 'bad'  },
  requests:     { value: '1.2k',  delta: '→ No change',            type: 'neutral' },
  activeUsers:  { value: '847',   delta: '↑ 23% from yesterday',   type: 'good' },
};

const MOCK_RESPONSE_TIME_24H = [
  { hour: '0h',  ms: 180 },
  { hour: '2h',  ms: 210 },
  { hour: '4h',  ms: 260 },
  { hour: '6h',  ms: 310 },
  { hour: '8h',  ms: 275 },
  { hour: '10h', ms: 230 },
  { hour: '12h', ms: 290 },
  { hour: '14h', ms: 340 },
  { hour: '16h', ms: 320 },
  { hour: '18h', ms: 295 },
  { hour: '20h', ms: 265 },
  { hour: '22h', ms: 285 },
];

const MOCK_SLOW_ENDPOINTS = [
  { path: '/api/users/profile',     calls: '1234 calls in 24h', ms: 850, severity: 'crit' },
  { path: '/api/analytics/data',    calls: '892 calls in 24h',  ms: 620, severity: 'warn' },
  { path: '/api/errors/list',       calls: '3421 calls in 24h', ms: 410, severity: 'warn' },
  { path: '/api/projects/:id',      calls: '567 calls in 24h',  ms: 390, severity: 'ok'   },
  { path: '/api/feedback/submit',   calls: '234 calls in 24h',  ms: 310, severity: 'ok'   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get CSS variable value from :root */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Read current theme */
function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

// ── Render Stats ──────────────────────────────────────────────────────────────

function renderStats() {
  const map = {
    'stat-response-time':  MOCK_STATS.responseTime,
    'stat-error-rate':     MOCK_STATS.errorRate,
    'stat-requests':       MOCK_STATS.requests,
    'stat-users':          MOCK_STATS.activeUsers,
  };

  const deltaMap = {
    'stat-response-delta':  MOCK_STATS.responseTime,
    'stat-error-delta':     MOCK_STATS.errorRate,
    'stat-requests-delta':  MOCK_STATS.requests,
    'stat-users-delta':     MOCK_STATS.activeUsers,
  };

  Object.entries(map).forEach(([id, stat]) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = stat.value;
    }
  });

  Object.entries(deltaMap).forEach(([id, stat]) => {
    const el = document.getElementById(id);
    if (!el) {
      return;
    } 
    el.textContent = stat.delta;
    el.className = `perf-stat-card__delta perf-stat-card__delta--${stat.type}`;
  });
}

// ── Render Chart ──────────────────────────────────────────────────────────────

let chartInstance = null;

function getChartColors() {
  const accent = cssVar('--color-accent') || '#e8732e';
  const border = cssVar('--color-border') || 'rgba(255,255,255,0.08)';
  const textMuted = cssVar('--color-text-muted') || '#A89080';
  const text = cssVar('--color-text') || '#1C120A';
  return { accent, border, textMuted, text };
}

function renderChart() {
  const canvas = document.getElementById('response-time-chart');
  if (!canvas) {
    return;
  } 

  // Dynamically load Chart.js from CDN
  if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = () => buildChart(canvas);
    document.head.appendChild(script);
  } else {
    buildChart(canvas);
  }
}

function buildChart(canvas) {
  const { accent, textMuted, text } = getChartColors();

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  chartInstance = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: MOCK_RESPONSE_TIME_24H.map(d => d.hour),
      datasets: [{
        label: 'Response Time (ms)',
        data: MOCK_RESPONSE_TIME_24H.map(d => d.ms),
        backgroundColor: accent + 'CC',   // accent with opacity
        borderColor: accent,
        borderWidth: 1.5,
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark() ? '#2C1E14' : '#fff',
          titleColor: text,
          bodyColor: textMuted,
          borderColor: accent,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y}ms`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textMuted, font: { size: 12 } },
          border: { display: false },
        },
        y: {
          grid: {
            color: isDark() ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          },
          ticks: {
            color: textMuted,
            font: { size: 12 },
            callback: val => `${val}ms`,
          },
          border: { display: false },
        },
      },
    },
  });
}

// ── Render Endpoints ──────────────────────────────────────────────────────────

function renderEndpoints() {
  const container = document.getElementById('slow-endpoints');
  if (!container) {
    return;
  }
  const maxMs = Math.max(...MOCK_SLOW_ENDPOINTS.map(e => e.ms));

  container.innerHTML = MOCK_SLOW_ENDPOINTS.map(endpoint => {
    const pct = Math.round((endpoint.ms / maxMs) * 100);
    const barClass = endpoint.severity === 'crit'
      ? 'perf-endpoint__bar perf-endpoint__bar--crit'
      : endpoint.severity === 'warn'
        ? 'perf-endpoint__bar perf-endpoint__bar--warn'
        : 'perf-endpoint__bar';

    return `
      <div class="perf-endpoint">
        <div class="perf-endpoint__info">
          <span class="perf-endpoint__path">${endpoint.path}</span>
          <span class="perf-endpoint__calls">${endpoint.calls}</span>
        </div>
        <div class="perf-endpoint__bar-wrap">
          <div class="${barClass}" style="width: ${pct}%"></div>
        </div>
        <span class="perf-endpoint__time">${endpoint.ms}ms</span>
      </div>
    `;
  }).join('');
}

// ── Theme Change Observer ─────────────────────────────────────────────────────

// Re-render chart when theme toggles so colors update
const themeObserver = new MutationObserver(() => {
  if (window.Chart && chartInstance) {
    buildChart(document.getElementById('response-time-chart'));
  }
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  await renderNavbar('performance');
  renderStats();
  renderChart();
  renderEndpoints();
});