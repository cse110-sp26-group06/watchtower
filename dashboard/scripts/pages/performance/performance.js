/**
 * performance.js
 * Performance page for WatchTower dashboard.
 * Fetches live data from GET /api/errors/performance via apiGetPerformance().
 * Falls back to empty states on error. Uses Chart.js for the response time chart.
 */

import { renderNavbar }         from '../../components/navbar.js';
import { loadingStateHtml, errorStateHtml } from '../../components/pageState.js';
import { statCardsHtml }        from '../../components/statCards.js';
import { requireAuth }          from '../../utils/auth.js';
import { showToast }            from '../../utils/toast.js';
import { escHtml }              from '../../utils/dom.js';
import { apiGetPerformance }    from '../../api/api.js';

const session = requireAuth();
if (session) { renderNavbar('performance'); }

// Expose reload() for the "Try again" button in error state
window.reloadPerformance = load;

// ── State ─────────────────────────────────────────────────────────────────────

let chartInstance = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get CSS variable value from :root */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Read current theme */
function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

// ── Data Normalisation ────────────────────────────────────────────────────────

/**
 * Normalizes a raw performance event row from the backend.
 *
 * Actual D1 row shape (confirmed from live API):
 *   { id, api_key, service, environment, name, entry_type, time, duration,
 *     payload_json, client_timestamp, server_timestamp }
 *
 * payload_json is also stored as a JSON string with { name, entryType, time, duration }.
 *
 * @param {object} row  Raw row from GET /api/performance
 * @returns {object}    Normalized performance event
 */
function normalizeEvent(row) {
  let payload = {};
  try { payload = JSON.parse(row.payload_json ?? '{}'); } catch { /* keep {} */ }

  return {
    name:      row.name       ?? payload.name       ?? 'unknown',
    entryType: row.entry_type ?? payload.entryType  ?? 'resource',
    time:      row.time       ?? payload.time        ?? 0,
    duration:  row.duration   ?? payload.duration    ?? 0,
    timestamp: row.client_timestamp ?? row.server_timestamp ?? null,
  };
}

/**
 * Derives dashboard stats and chart data from a list of normalized events.
 * @param {object[]} events  Normalized performance events
 */
function deriveStats(events) {
  const navEvents      = events.filter(e => e.entryType === 'navigation');
  const resourceEvents = events.filter(e => e.entryType === 'resource');

  // Avg response time — all resource events
  const avgMs = resourceEvents.length
    ? Math.round(resourceEvents.reduce((s, e) => s + e.duration, 0) / resourceEvents.length)
    : null;

  // Page load — average of navigation events
  const avgPageLoad = navEvents.length
    ? Math.round(navEvents.reduce((s, e) => s + e.duration, 0) / navEvents.length)
    : null;

  // Slowest endpoint — max duration resource event
  const slowest = resourceEvents.reduce(
    (max, e) => (e.duration > (max?.duration ?? -1) ? e : max),
    null
  );

  // Build chart data: group resource events by hour bucket
  const chartData = buildChartData(resourceEvents);

  // Build endpoints table: deduplicate by name, pick max duration per name
  const endpointMap = new Map();
  for (const e of resourceEvents) {
    const key = e.name;
    const existing = endpointMap.get(key);
    if (!existing || e.duration > existing.ms) {
      endpointMap.set(key, { path: key, ms: e.duration, calls: 1 });
    } else {
      existing.calls += 1;
    }
  }
  // Also count calls properly in a second pass
  const callCounts = new Map();
  for (const e of resourceEvents) {
    callCounts.set(e.name, (callCounts.get(e.name) ?? 0) + 1);
  }
  for (const [name, ep] of endpointMap) {
    ep.calls = callCounts.get(name) ?? 1;
  }

  const endpoints = Array.from(endpointMap.values())
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 10);

  return { avgMs, avgPageLoad, slowest, chartData, endpoints, total: events.length };
}

/**
 * Groups resource events into hourly buckets for the bar chart.
 * Returns up to 12 buckets sorted ascending by time.
 * @param {object[]} events
 * @returns {{ hour: string, ms: number }[]}
 */
function buildChartData(events) {
  if (!events.length) { return []; }

  const buckets = new Map();

  for (const e of events) {
    const ts = e.timestamp ? new Date(e.timestamp) : new Date();
    const label = `${ts.getUTCHours()}h`;
    if (!buckets.has(label)) {
      buckets.set(label, { sum: 0, count: 0, hour: ts.getUTCHours() });
    }
    const b = buckets.get(label);
    b.sum   += e.duration;
    b.count += 1;
  }

  return Array.from(buckets.entries())
    .map(([label, b]) => ({ hour: label, ms: Math.round(b.sum / b.count), _h: b.hour }))
    .sort((a, b) => a._h - b._h)
    .slice(0, 12);
}

// ── Severity helper ───────────────────────────────────────────────────────────

function endpointSeverity(ms, maxMs) {
  if (ms >= maxMs * 0.8) { return 'crit'; }
  if (ms >= maxMs * 0.5) { return 'warn'; }
  return 'ok';
}

// ── Render Stats ──────────────────────────────────────────────────────────────

function renderStats({ avgMs, avgPageLoad, slowest, total }) {
  const container = document.getElementById('perf-stats-container');
  if (!container) return;

  const cards = [];

  // Avg response time
  let msSub = 'No resource data', msMod = 'neutral';
  if (avgMs !== null) {
    msSub = avgMs > 600 ? '⚠ High latency' : avgMs > 300 ? 'Moderate' : '✓ Fast';
    msMod = avgMs > 600 ? 'bad' : avgMs > 300 ? 'neutral' : 'good';
  }
  cards.push({ label: 'Avg Response Time', value: avgMs !== null ? `${avgMs}ms` : '—', sub: msSub, subModifier: msMod });

  // Page load
  let loadSub = 'No navigation data', loadMod = 'neutral';
  if (avgPageLoad !== null) {
    loadSub = avgPageLoad > 3000 ? '⚠ Slow page load' : avgPageLoad > 1500 ? 'Moderate' : '✓ Fast load';
    loadMod = avgPageLoad > 3000 ? 'bad' : avgPageLoad > 1500 ? 'neutral' : 'good';
  }
  cards.push({ label: 'Page Load Time', value: avgPageLoad !== null ? `${avgPageLoad}ms` : '—', sub: loadSub, subModifier: loadMod });

  // Slowest endpoint
  let slowSub = 'No endpoints tracked', slowMod = 'neutral';
  if (slowest) {
    slowSub = slowest.name;
    slowMod = slowest.duration > 600 ? 'bad' : 'neutral';
  }
  cards.push({ label: 'Slowest Endpoint', value: slowest ? `${slowest.duration}ms` : '—', sub: slowSub, subModifier: slowMod });

  // Total events
  cards.push({
    label: 'Total Events',
    value: total > 0 ? String(total) : '0',
    sub: total === 1 ? '1 event ingested' : `${total} events ingested`,
    subModifier: 'neutral'
  });

  container.innerHTML = statCardsHtml(cards);
}

// ── Render Chart ──────────────────────────────────────────────────────────────

function getChartColors() {
  const accent    = cssVar('--color-accent')    || '#e8732e';
  const textMuted = cssVar('--color-text-muted') || '#A89080';
  const text      = cssVar('--color-text')       || '#1C120A';
  return { accent, textMuted, text };
}

function renderChart(chartData) {
  const canvas = document.getElementById('response-time-chart');
  if (!canvas) { return; }

  if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = () => buildChart(canvas, chartData);
    document.head.appendChild(script);
  } else {
    buildChart(canvas, chartData);
  }
}

function buildChart(canvas, chartData) {
  const { accent, textMuted, text } = getChartColors();

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (!chartData || !chartData.length) {
    // Show a placeholder message on the canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = textMuted;
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No response time data available', canvas.width / 2, canvas.height / 2);
    return;
  }

  chartInstance = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels: chartData.map(d => d.hour),
      datasets: [{
        label: 'Avg Response Time (ms)',
        data: chartData.map(d => d.ms),
        backgroundColor: accent + 'CC',
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

function renderEndpoints(endpoints) {
  const container = document.getElementById('slow-endpoints');
  if (!container) { return; }

  if (!endpoints || !endpoints.length) {
    container.innerHTML = `<div style="padding:var(--space-md);color:var(--color-text-muted);font-size:14px;">
      No endpoint data available yet.
    </div>`;
    return;
  }

  const maxMs = Math.max(...endpoints.map(e => e.ms));

  container.innerHTML = endpoints.map(endpoint => {
    const pct      = Math.round((endpoint.ms / maxMs) * 100);
    const severity = endpointSeverity(endpoint.ms, maxMs);
    const barClass = severity === 'crit'
      ? 'perf-endpoint__bar perf-endpoint__bar--crit'
      : severity === 'warn'
        ? 'perf-endpoint__bar perf-endpoint__bar--warn'
        : 'perf-endpoint__bar';
    const callLabel = endpoint.calls === 1 ? '1 call' : `${endpoint.calls} calls`;

    return `
      <div class="perf-endpoint">
        <div class="perf-endpoint__info">
          <span class="perf-endpoint__path">${escHtml(endpoint.path)}</span>
          <span class="perf-endpoint__calls">${callLabel}</span>
        </div>
        <div class="perf-endpoint__bar-wrap">
          <div class="${barClass}" style="width: ${pct}%"></div>
        </div>
        <span class="perf-endpoint__time">${endpoint.ms}ms</span>
      </div>
    `;
  }).join('');
}

/** Minimal HTML escape to prevent XSS from endpoint names — imported from utils/dom.js */

// ── Loading / Error States ────────────────────────────────────────────────────

function renderLoading() {
  const endpoints = document.getElementById('slow-endpoints');
  if (endpoints) {
    endpoints.innerHTML = loadingStateHtml('Loading performance data…');
  }

  const container = document.getElementById('perf-stats-container');
  if (container) {
    container.innerHTML = statCardsHtml([
      { label: 'Avg Response Time', value: '…' },
      { label: 'Page Load Time', value: '…' },
      { label: 'Slowest Endpoint', value: '…' },
      { label: 'Total Events', value: '…' }
    ]);
  }
}

function renderFetchError(msg) {
  const endpoints = document.getElementById('slow-endpoints');
  if (endpoints) {
    endpoints.innerHTML = errorStateHtml(msg, 'reloadPerformance');
  }

  const container = document.getElementById('perf-stats-container');
  if (container) {
    container.innerHTML = statCardsHtml([
      { label: 'Avg Response Time', value: '—' },
      { label: 'Page Load Time', value: '—' },
      { label: 'Slowest Endpoint', value: '—' },
      { label: 'Total Events', value: '—' }
    ]);
  }
}

// ── Theme Change Observer ─────────────────────────────────────────────────────

const themeObserver = new MutationObserver(() => {
  if (window.Chart && chartInstance) {
    const canvas = document.getElementById('response-time-chart');
    if (canvas && chartInstance.data?.datasets?.[0]?.data) {
      buildChart(canvas, chartInstance.data.datasets[0].data.map((ms, i) => ({
        hour: chartInstance.data.labels[i],
        ms,
      })));
    }
  }
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});

// ── Load ──────────────────────────────────────────────────────────────────────

let _loading = false;

/**
 * Fetches live performance data from GET /api/errors/performance,
 * normalizes events, derives stats, and renders the full page.
 */
async function load() {
  if (_loading) { return; }
  _loading = true;
  renderLoading();

  try {
    const result = await apiGetPerformance();

    if (!result.success) {
      console.error('[WatchTower] Performance fetch error:', result.error);
      renderFetchError(result.error.message);
      showToast('Could not load performance data: ' + result.error.message, true);
      return;
    }

    // Backend responds with { status: "ok", performance: [...] }
    const raw = result.data?.performance
      ?? result.data?.events
      ?? (Array.isArray(result.data) ? result.data : []);

    const events  = raw.map(normalizeEvent);
    const derived = deriveStats(events);

    renderStats(derived);
    renderChart(derived.chartData);
    renderEndpoints(derived.endpoints);

  } finally {
    _loading = false;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

function init() {
  load();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.addEventListener('pageshow', () => {
  load();
});