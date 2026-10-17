import { BarChart3, MapPin, Smartphone, Sparkles, Activity, QrCode, ArrowUpRight } from 'lucide-react';
import TiltCard from './TiltCard.jsx';

function Bar({ height, active }) {
  return (
    <div className="flex h-full flex-1 items-end">
      <div
        className={`w-full border-2 ${
          active ? 'border-accent-400 bg-accent-500/70' : 'border-accent-700 bg-accent-600/25'
        }`}
        style={{ height: `${height}%` }}
      />
    </div>
  );
}

export function AnalyticsVisual() {
  const bars = [38, 52, 44, 68, 58, 82, 74, 94, 66, 88, 71, 100];
  return (
    <TiltCard className="relative">
      <div className="surface-card relative p-5" style={{ transform: 'translateZ(20px)' }}>
        <div className="mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-accent-400">
            <BarChart3 className="h-4 w-4" /> Live analytics
          </span>
          <span className="flex items-center gap-1.5 text-xs text-ink-400">
            <span className="h-2 w-2 animate-blink bg-accent-500" /> streaming
          </span>
        </div>

        <div className="flex h-40 items-end gap-1.5 border-b-2 border-base-700 pb-1">
          {bars.map((height, index) => (
            <Bar key={index} height={height} active={index > 7} />
          ))}
        </div>
        <div className="mt-3 flex justify-between text-[11px] uppercase tracking-widest text-ink-500">
          <span>Clicks</span>
          <span>Unique visitors</span>
        </div>
      </div>

      <div
        className="animate-float absolute -right-4 -top-6 w-40 border-2 border-base-700 bg-base-850 p-3 shadow-panel"
        style={{ transform: 'translateZ(70px)' }}
      >
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-ink-400">
          <Smartphone className="h-3.5 w-3.5" /> Device
        </span>
        <p className="mt-1 text-sm text-ink-200">Mobile leading</p>
      </div>

      <div
        className="animate-float absolute -bottom-6 -left-4 w-40 border-2 border-base-700 bg-base-850 p-3 shadow-panel"
        style={{ transform: 'translateZ(55px)', animationDelay: '1.2s' }}
      >
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-ink-400">
          <MapPin className="h-3.5 w-3.5" /> Top country
        </span>
        <p className="mt-1 text-sm text-ink-200">Reported live</p>
      </div>
    </TiltCard>
  );
}

export function BioVisual() {
  return (
    <TiltCard className="relative">
      <div
        className="mx-auto w-full max-w-[19rem] border-2 border-base-700 bg-base-900 p-6 text-center shadow-panel"
        style={{ transform: 'translateZ(25px)' }}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent-600 bg-base-800 text-xl text-accent-300">
          LP
        </div>
        <p className="mt-3 font-display text-[11px] text-ink-100">@yourname</p>
        <p className="mt-1 text-xs text-ink-500">All your links in one place</p>

        <div className="mt-5 space-y-2.5">
          {['Website', 'Latest drop', 'Newsletter'].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between border-2 border-base-700 bg-base-850 px-3 py-2 text-sm text-ink-200 transition hover:border-accent-600"
            >
              <span>{label}</span>
              <ArrowUpRight className="h-4 w-4 text-accent-400" />
            </div>
          ))}
        </div>
      </div>

      <div
        className="animate-float absolute -right-6 top-6 border-2 border-base-700 bg-base-950 p-3 shadow-panel"
        style={{ transform: 'translateZ(80px)' }}
      >
        <QrCode className="h-16 w-16 text-accent-400" />
      </div>
    </TiltCard>
  );
}

export function AiVisual() {
  return (
    <TiltCard className="relative">
      <div className="surface-card relative p-5" style={{ transform: 'translateZ(20px)' }}>
        <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-accent-400">
          <Sparkles className="h-4 w-4" /> AI Insights
        </div>

        <div className="space-y-3">
          <div className="max-w-[85%] border-2 border-base-700 bg-base-850 px-3 py-2 text-sm text-ink-300">
            Summarise this period&apos;s performance.
          </div>
          <div className="ml-auto max-w-[90%] border-2 border-accent-600/60 bg-accent-500/10 px-3 py-2 text-sm text-ink-100">
            Engagement is trending up, with most growth coming from mobile and social referrers.
          </div>
        </div>

        <div className="mt-5 flex items-start gap-3 border-2 border-warn-500/50 bg-warn-500/10 p-3">
          <Activity className="mt-0.5 h-4 w-4 text-warn-400" />
          <div>
            <p className="text-xs uppercase tracking-widest text-warn-400">Anomaly detected</p>
            <p className="mt-0.5 text-sm text-ink-200">Traffic shifted to a new referrer today.</p>
          </div>
        </div>
      </div>

      <div
        className="animate-float absolute -bottom-6 -right-5 w-44 border-2 border-base-700 bg-base-850 p-3 shadow-panel"
        style={{ transform: 'translateZ(65px)', animationDelay: '0.8s' }}
      >
        <p className="text-[11px] uppercase tracking-widest text-ink-400">Recommendation</p>
        <p className="mt-1 text-sm text-accent-300">Boost the best campaign</p>
      </div>
    </TiltCard>
  );
}
