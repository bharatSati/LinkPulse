import { useEffect, useMemo, useState } from 'react';
import { Activity, Globe2, Monitor, Radio, Smartphone, Tablet, X } from 'lucide-react';
import LiveGlobe from './LiveGlobe.jsx';
import useLiveClicks from '../../hooks/useLiveClicks.js';
import { countryCode, countryName } from '../../utils/geo.js';

const STATUS_STYLES = {
  idle: {
    label: 'Idle',
    className: 'border-base-700 text-ink-500',
    dot: 'bg-ink-500',
  },
  connecting: {
    label: 'Connecting',
    className: 'border-warn-500/40 text-warn-400',
    dot: 'bg-warn-500',
  },
  live: {
    label: 'Live',
    className: 'border-accent-600/50 text-accent-300',
    dot: 'animate-pulse-glow bg-accent-400',
  },
  reconnecting: {
    label: 'Reconnecting',
    className: 'border-warn-500/40 text-warn-400',
    dot: 'bg-warn-500',
  },
  error: {
    label: 'Offline',
    className: 'border-danger-500/40 text-danger-400',
    dot: 'bg-danger-500',
  },
};

const DEVICE_ICONS = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: Radio,
};

const DEVICE_COLORS = {
  desktop: 'bg-accent-400',
  mobile: 'bg-neon-400',
  tablet: 'bg-ink-200',
  unknown: 'bg-ink-500',
};

function relativeTime(value, now) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return '';

  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 5) return 'now';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function topDevice(clicks) {
  const counts = new Map();
  for (const click of clicks) {
    const device = click.deviceType || 'unknown';
    counts.set(device, (counts.get(device) || 0) + 1);
  }

  let winner = 'unknown';
  let best = 0;
  for (const [device, count] of counts) {
    if (count > best) {
      best = count;
      winner = device;
    }
  }

  return counts.size === 0 ? '—' : winner;
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold capitalize text-ink-100">{value}</p>
    </div>
  );
}

export default function LivePulse({ workspaceId, linkId = null, className = '' }) {
  const { clicks, status, error } = useLiveClicks({ workspaceId, linkId });
  const [now, setNow] = useState(Date.now());
  const [tab, setTab] = useState('latest');
  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setSelectedCountry(null);
    setTab('latest');
  }, [workspaceId, linkId]);

  const countryCounts = useMemo(() => {
    const counts = {};
    for (const click of clicks) {
      const code = countryCode(click.country);
      if (!code) continue;
      counts[code] = (counts[code] || 0) + 1;
    }
    return counts;
  }, [clicks]);

  const countryRows = useMemo(() => {
    return Object.entries(countryCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
  }, [countryCounts]);

  const metrics = useMemo(() => {
    const lastMinute = clicks.filter(
      (click) => now - new Date(click.timestamp).getTime() < 60000
    );

    return {
      perMinute: lastMinute.length,
      countries: countryRows.length,
      device: topDevice(clicks),
    };
  }, [clicks, now, countryRows.length]);

  const filteredClicks = useMemo(() => {
    if (!selectedCountry) return clicks;
    return clicks.filter((click) => countryCode(click.country) === selectedCountry);
  }, [clicks, selectedCountry]);

  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.idle;
  const latest = filteredClicks.slice(0, 12);
  const maxCountry = countryRows[0]?.count || 1;

  function toggleCountry(code) {
    if (!code) return;
    setSelectedCountry((current) => (current === code ? null : code));
  }

  const tabClass = (value) =>
    `px-3 py-1 text-[11px] uppercase tracking-[0.18em] transition ${
      tab === value
        ? 'border border-accent-600/60 bg-accent-500/10 text-accent-300'
        : 'border border-transparent text-ink-500 hover:text-ink-300'
    }`;

  return (
    <section className={`surface-card overflow-hidden p-0 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center border-2 border-accent-600/60 bg-accent-500/10 text-accent-400 shadow-glow">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink-100">Live pulse</h2>
            <p className="text-xs text-ink-500">Every click, as it happens.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${statusStyle.className}`}
          >
            <span className={`h-1.5 w-1.5 ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>
          <span className="text-[11px] text-ink-600">{clicks.length} buffered</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="relative overflow-hidden border-b border-base-800 lg:border-b-0 lg:border-r">
          <LiveGlobe
            key={`${workspaceId}:${linkId || 'all'}`}
            clicks={clicks}
            countryCounts={countryCounts}
            selectedCountry={selectedCountry}
            onSelectCountry={toggleCountry}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-base-900 via-base-900/80 to-transparent px-4 pb-14 pt-10">
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Clicks / min" value={metrics.perMinute} />
              <Metric label="Countries" value={metrics.countries} />
              <Metric label="Top device" value={metrics.device} />
            </div>
          </div>
        </div>

        <div className="flex min-h-[280px] flex-col sm:min-h-[340px] lg:min-h-[400px]">
          <div className="flex items-center justify-between gap-2 border-b border-base-800 px-4 py-2">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setTab('latest')} className={tabClass('latest')}>
                Latest
              </button>
              <button
                type="button"
                onClick={() => setTab('countries')}
                className={tabClass('countries')}
              >
                Countries
              </button>
            </div>
            <span className="text-[11px] text-ink-600">
              {tab === 'latest' ? 'newest first' : `${countryRows.length} active`}
            </span>
          </div>

          {selectedCountry && (
            <button
              type="button"
              onClick={() => setSelectedCountry(null)}
              className="flex items-center justify-between gap-2 border-b border-accent-600/40 bg-accent-500/5 px-4 py-1.5 text-left transition hover:bg-accent-500/10"
            >
              <span className="flex items-center gap-2 text-[11px] text-accent-300">
                <Globe2 className="h-3.5 w-3.5" />
                Filtering: {countryName(selectedCountry)}
              </span>
              <X className="h-3.5 w-3.5 text-ink-400" />
            </button>
          )}

          {error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <Radio className="h-6 w-6 text-danger-400" />
              <p className="text-sm text-ink-300">{error}</p>
            </div>
          ) : tab === 'countries' ? (
            countryRows.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                <Globe2 className="h-6 w-6 text-accent-400" />
                <p className="text-sm text-ink-300">No geography yet.</p>
                <p className="max-w-[16rem] text-xs text-ink-500">
                  Country heat appears as clicks arrive.
                </p>
              </div>
            ) : (
              <ul className="max-h-[280px] flex-1 divide-y divide-base-800 overflow-y-auto sm:max-h-[340px] lg:max-h-[400px]">
                {countryRows.slice(0, 24).map((row, index) => (
                  <li key={row.code}>
                    <button
                      type="button"
                      onClick={() => toggleCountry(row.code)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-base-850/60 ${
                        selectedCountry === row.code ? 'bg-accent-500/10' : ''
                      }`}
                    >
                      <span className="w-5 shrink-0 font-mono text-[11px] text-ink-600">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="w-7 shrink-0 font-mono text-[11px] text-accent-400">
                        {row.code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink-200">{countryName(row.code)}</p>
                        <span className="mt-1 block h-1 w-full bg-base-800">
                          <span
                            className="block h-full animate-bar-grow bg-gradient-to-r from-accent-500 to-neon-500"
                            style={{ width: `${Math.max(6, (row.count / maxCountry) * 100)}%` }}
                          />
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-ink-400">{row.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : latest.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <span className="flex h-10 w-10 items-center justify-center border border-base-700 bg-base-850 text-accent-400">
                <Radio className="h-4 w-4 animate-pulse-glow" />
              </span>
              <p className="text-sm text-ink-300">
                {selectedCountry ? 'No clicks from here yet.' : 'Waiting for the next pulse.'}
              </p>
              <p className="max-w-[16rem] text-xs text-ink-500">
                {selectedCountry
                  ? 'Clear the filter or wait for traffic from this country.'
                  : 'Share a short link — clicks will land here in real time.'}
              </p>
            </div>
          ) : (
            <ul className="max-h-[280px] flex-1 divide-y divide-base-800 overflow-y-auto sm:max-h-[340px] lg:max-h-[400px]">
              {latest.map((click) => {
                const DeviceIcon = DEVICE_ICONS[click.deviceType] || DEVICE_ICONS.unknown;
                const code = countryCode(click.country) || '??';

                return (
                  <li
                    key={click.id}
                    className="flex animate-slide-in-right items-center gap-3 px-4 py-2.5"
                  >
                    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center border border-base-700 bg-base-850 text-ink-300">
                      <DeviceIcon className="h-3.5 w-3.5" />
                      <span
                        className={`absolute -right-1 -top-1 h-1.5 w-1.5 ${
                          DEVICE_COLORS[click.deviceType] || DEVICE_COLORS.unknown
                        }`}
                      />
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleCountry(code)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm text-ink-200">
                        {click.title || click.code || 'Short link'}
                      </p>
                      <p className="truncate text-[11px] text-ink-500">
                        {click.code ? `/${click.code}` : 'link'} · {code}
                        {click.browser ? ` · ${click.browser}` : ''}
                      </p>
                    </button>

                    <span className="shrink-0 text-[11px] text-ink-600">
                      {relativeTime(click.timestamp, now)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
