import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Lightbulb,
  MousePointerClick,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wand2,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import StatCard from '../components/analytics/StatCard.jsx';
import DateRangeFilter from '../components/analytics/DateRangeFilter.jsx';
import AiMark from '../components/ai/AiMark.jsx';
import InsightCard from '../components/ai/InsightCard.jsx';
import AnomalyAlert from '../components/ai/AnomalyAlert.jsx';
import AiChat from '../components/ai/AiChat.jsx';
import InsightHistory from '../components/ai/InsightHistory.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useToast } from '../hooks/useToast.js';
import { getInsights, getRecommendations } from '../services/ai.service.js';
import { formatDateTime, formatNumber } from '../utils/format.js';
import { formatRange, sortByPriority } from '../utils/ai.js';

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function rangeForPreset(preset) {
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 86400000);
  return { from: isoDate(from), to: isoDate(to) };
}

const SOURCE_LABELS = {
  ai: 'Generated just now',
  cache: 'Saved result',
  rules: 'Rule-based only',
};

export default function AiInsights() {
  const { activeWorkspace, ready } = useWorkspace();
  const { toast } = useToast();

  const [preset, setPreset] = useState('30d');
  const [custom, setCustom] = useState(() => rangeForPreset('30d'));
  const [reloadToken, setReloadToken] = useState(0);
  const forceRef = useRef(false);

  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [recommendations, setRecommendations] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState('');

  const workspaceId = activeWorkspace?._id;
  const range = useMemo(
    () => (preset === 'custom' ? custom : rangeForPreset(preset)),
    [preset, custom]
  );

  const reload = useCallback((force = false) => {
    forceRef.current = force;
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!workspaceId) return undefined;
    let current = true;
    const refresh = forceRef.current;
    forceRef.current = false;

    setLoading(true);
    setError('');
    setRecsLoading(true);
    setRecsError('');

    getInsights({ workspaceId, from: range.from, to: range.to, refresh })
      .then((data) => {
        if (current) setInsights(data);
      })
      .catch((err) => {
        if (current) setError(err.message || 'Unable to load AI insights');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    getRecommendations({ workspaceId, from: range.from, to: range.to, refresh })
      .then((data) => {
        if (current) setRecommendations(data);
      })
      .catch((err) => {
        if (current) setRecsError(err.message || 'Unable to load recommendations');
      })
      .finally(() => {
        if (current) setRecsLoading(false);
      });

    return () => {
      current = false;
    };
  }, [workspaceId, range.from, range.to, reloadToken]);

  function handleRegenerate() {
    reload(true);
    toast.info('Regenerating insights with the AI service…');
  }

  if (!ready && !activeWorkspace) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Preparing your workspace..." />
      </div>
    );
  }

  const metrics = insights?.metrics;
  const totals = metrics?.totals;
  const anomalies = insights?.anomalies || [];
  const aiItems = sortByPriority(insights?.items || []);
  const recItems = sortByPriority(recommendations?.items || []);
  const busy = loading || recsLoading;

  const emptyWorkspace =
    !loading && !error && totals && totals.periodClicks === 0 && totals.allTimeClicks === 0 && totals.linksCount === 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-100">AI Insights</h1>
            <AiMark label="AI-assisted" />
          </div>
          <p className="mt-1 text-sm text-ink-400">
            Recommendations and anomaly detection for{' '}
            <span className="text-ink-200">{activeWorkspace?.name || 'this workspace'}</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter
            preset={preset}
            custom={custom}
            onPresetChange={setPreset}
            onCustomChange={(next) => {
              setCustom(next);
              setPreset('custom');
            }}
          />
          <Button variant="secondary" icon={RefreshCw} loading={busy} onClick={handleRegenerate} disabled={!workspaceId}>
            Regenerate
          </Button>
        </div>
      </div>

      {error && !loading ? (
        <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-5">
          <div className="flex items-center gap-2 text-danger-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Could not load AI insights</span>
          </div>
          <p className="text-sm text-ink-400">{error}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={() => reload(false)}>
            Retry
          </Button>
        </div>
      ) : emptyWorkspace ? (
        <EmptyState
          icon={BarChart3}
          title="Not enough data yet"
          description="Create links and collect clicks — then AI insights will analyze your traffic here."
        />
      ) : (
        <>
          {insights?.notice && (
            <div className="surface-card flex items-start gap-3 border-warn-500/30 bg-warn-500/5 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn-400" />
              <p className="text-sm text-warn-400">{insights.notice}</p>
            </div>
          )}

          {insights && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent-400" />
                {SOURCE_LABELS[insights.source] || 'Insights'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Generated {formatDateTime(insights.generatedAt)}
              </span>
              <span>Covers {formatRange(insights.range)} ({insights.range?.days} days)</span>
              {insights.dataChanged && (
                <Badge tone="warn">Analytics changed since this was generated</Badge>
              )}
              {insights.configured === false && <Badge tone="neutral">AI disabled</Badge>}
            </div>
          )}

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-100">What your data shows</h2>
              <span className="text-xs text-ink-500">Exact values from analytics</span>
            </div>
            <div className="grid grid-cols-1 gap-4 stagger-children sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Clicks in period"
                value={formatNumber(totals?.periodClicks ?? 0)}
                icon={MousePointerClick}
                change={totals?.changePercent}
                loading={loading && !totals}
              />
              <StatCard
                label="Unique visitors"
                value={formatNumber(totals?.uniqueVisitors ?? 0)}
                icon={Users}
                hint="By hashed IP"
                loading={loading && !totals}
              />
              <StatCard
                label="Avg. per day"
                value={totals?.avgDailyClicks ?? 0}
                icon={TrendingUp}
                hint={`${metrics?.range?.days ?? 0} days`}
                loading={loading && !totals}
              />
              <StatCard
                label="Links in workspace"
                value={formatNumber(totals?.linksCount ?? 0)}
                icon={BarChart3}
                hint={`${formatNumber(totals?.allTimeClicks ?? 0)} clicks all time`}
                loading={loading && !totals}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-warn-400" />
              <h2 className="text-sm font-semibold text-ink-100">Anomaly alerts</h2>
              <span className="text-xs text-ink-500">Detected by rules from click history</span>
            </div>
            {anomalies.length === 0 ? (
              <div className="surface-card flex items-center gap-2 p-4 text-sm text-ink-500">
                <ShieldCheck className="h-4 w-4 text-accent-400" />
                No significant spikes or drops detected in this period.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 stagger-children lg:grid-cols-2">
                {anomalies.map((anomaly, index) => (
                  <AnomalyAlert key={`${anomaly.subtype}-${index}`} anomaly={anomaly} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent-400" />
              <h2 className="text-sm font-semibold text-ink-100">Performance insights</h2>
              <AiMark label="AI interpretation" />
            </div>
            {loading && aiItems.length === 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {[0, 1].map((key) => (
                  <div key={key} className="surface-card h-40 animate-pulse border-base-700" />
                ))}
              </div>
            ) : aiItems.length === 0 ? (
              <div className="surface-card p-5 text-sm text-ink-500">
                {insights?.configured === false
                  ? 'AI performance insights require a Groq API key. Add GROQ_API_KEY on the server to enable them.'
                  : 'No AI performance insights are available for this period.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 stagger-children lg:grid-cols-2">
                {aiItems.map((item, index) => (
                  <InsightCard key={`${item.title}-${index}`} item={item} />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-accent-400" />
              <h2 className="text-sm font-semibold text-ink-100">Prioritized recommendations</h2>
              <AiMark label="AI interpretation" />
            </div>
            {recsLoading && recItems.length === 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {[0, 1].map((key) => (
                  <div key={key} className="surface-card h-40 animate-pulse border-base-700" />
                ))}
              </div>
            ) : recsError ? (
              <div className="surface-card flex flex-col items-start gap-3 p-5">
                <p className="text-sm text-danger-400">{recsError}</p>
                <Button variant="secondary" size="sm" onClick={() => reload(false)}>
                  Retry
                </Button>
              </div>
            ) : recItems.length === 0 ? (
              <div className="surface-card p-5 text-sm text-ink-500">
                {recommendations?.notice ||
                  'No recommendations available yet. Generate some traffic and try again.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 stagger-children lg:grid-cols-2">
                {recItems.map((item, index) => (
                  <InsightCard key={`${item.title}-${index}`} item={item} />
                ))}
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
            <AiChat workspaceId={workspaceId} range={range} suggestions={insights?.suggestedQuestions || []} />
            <InsightHistory workspaceId={workspaceId} reloadToken={reloadToken} />
          </section>
        </>
      )}
    </div>
  );
}
