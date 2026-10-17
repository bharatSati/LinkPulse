import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Ban,
  Eye,
  Flag,
  Link2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Select from '../components/ui/Select.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { CardHeader } from '../components/ui/Card.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useToast } from '../hooks/useToast.js';
import { PERMISSIONS } from '../utils/permissions.js';
import { cn } from '../utils/cn.js';
import { formatDateTime, formatNumber } from '../utils/format.js';
import {
  disableLink,
  getSummary,
  inspectLink,
  listEvents,
  listReports,
  listSuspiciousLinks,
  reactivateLink,
  reviewReport,
  updateEvent,
} from '../services/abuse.service.js';

const TABS = [
  { key: 'links', label: 'Suspicious links', icon: Link2 },
  { key: 'reports', label: 'Reports', icon: Flag },
  { key: 'events', label: 'Security events', icon: Activity },
];

const SEVERITY_TONES = { high: 'danger', medium: 'warn', low: 'neutral' };
const EVENT_STATUS_TONES = {
  open: 'warn',
  reviewing: 'accent',
  resolved: 'neutral',
  dismissed: 'neutral',
};
const REPORT_STATUS_TONES = {
  pending: 'warn',
  reviewing: 'accent',
  resolved: 'neutral',
  dismissed: 'neutral',
};

const EVENT_TYPE_LABELS = {
  link_creation_burst: 'Link creation burst',
  source_request_burst: 'Source request burst',
  click_spike: 'Click spike',
  reported: 'Reported for abuse',
  suspicious_destination: 'Suspicious destination',
  password_failures: 'Password failures',
  admin_action: 'Admin action',
};

const REASON_LABELS = {
  spam: 'Spam',
  phishing: 'Phishing',
  malware: 'Malware',
  harassment: 'Harassment',
  impersonation: 'Impersonation',
  misleading: 'Misleading',
  other: 'Other',
};

function eventTypeLabel(type) {
  return EVENT_TYPE_LABELS[type] || type;
}

function StatCard({ label, value, tone = 'neutral' }) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs uppercase tracking-wider text-ink-500">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold',
          tone === 'danger' ? 'text-danger-400' : tone === 'warn' ? 'text-warn-400' : 'text-ink-100'
        )}
      >
        {formatNumber(value)}
      </p>
    </div>
  );
}

export default function Abuse() {
  const { activeWorkspace, ready, can } = useWorkspace();
  const { toast } = useToast();

  const workspaceId = activeWorkspace?._id;
  const canManage = can(PERMISSIONS.ABUSE_MANAGE);

  const [tab, setTab] = useState('links');
  const [summary, setSummary] = useState({ openEvents: 0, highEvents: 0, pendingReports: 0 });
  const [links, setLinks] = useState([]);
  const [reports, setReports] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [busyId, setBusyId] = useState(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const [inspected, setInspected] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [actionReason, setActionReason] = useState('');

  const [reportTarget, setReportTarget] = useState(null);
  const [reportForm, setReportForm] = useState({ status: 'resolved', reviewNotes: '' });
  const [eventTarget, setEventTarget] = useState(null);
  const [eventForm, setEventForm] = useState({ status: 'resolved', note: '' });

  const reload = useCallback(() => setReloadToken((value) => value + 1), []);

  useEffect(() => {
    if (!workspaceId || !canManage) return undefined;

    let current = true;
    setLoading(true);
    setError('');

    const tasks = [getSummary(workspaceId)];
    if (tab === 'links') tasks.push(listSuspiciousLinks(workspaceId, { limit: 50 }));
    if (tab === 'reports') {
      tasks.push(
        listReports(workspaceId, {
          status: statusFilter === 'all' ? undefined : statusFilter,
          limit: 50,
        })
      );
    }
    if (tab === 'events') {
      tasks.push(
        listEvents(workspaceId, {
          status: statusFilter === 'all' ? undefined : statusFilter,
          severity: severityFilter === 'all' ? undefined : severityFilter,
          limit: 50,
        })
      );
    }

    Promise.all(tasks)
      .then((results) => {
        if (!current) return;
        setSummary(results[0]);
        if (tab === 'links') setLinks(results[1].links || []);
        if (tab === 'reports') setReports(results[1].reports || []);
        if (tab === 'events') setEvents(results[1].events || []);
      })
      .catch((err) => {
        if (current) setError(err.message || 'Unable to load the safety console');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [workspaceId, canManage, tab, statusFilter, severityFilter, reloadToken]);

  async function openInspect(linkId) {
    setInspectLoading(true);
    setInspected(null);
    setActionReason('');
    try {
      const data = await inspectLink(workspaceId, linkId);
      setInspected(data);
    } catch (err) {
      toast.error(err.message || 'Unable to inspect link');
    } finally {
      setInspectLoading(false);
    }
  }

  async function handleToggleLink(link, nextStatus, reason) {
    setBusyId(link.id || link.linkId);
    try {
      if (nextStatus === 'disabled') {
        await disableLink(workspaceId, link.id || link.linkId, reason);
        toast.success('Link disabled');
      } else {
        await reactivateLink(workspaceId, link.id || link.linkId, reason);
        toast.success('Link reactivated');
      }
      setInspected(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Unable to update link');
    } finally {
      setBusyId(null);
    }
  }

  function openReportReview(report) {
    setReportTarget(report);
    setReportForm({ status: 'resolved', reviewNotes: '' });
  }

  async function submitReportReview() {
    if (!reportTarget) return;
    setBusyId(reportTarget.id);
    try {
      await reviewReport(workspaceId, reportTarget.id, reportForm);
      toast.success('Report reviewed');
      setReportTarget(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Unable to review report');
    } finally {
      setBusyId(null);
    }
  }

  function openEventReview(event) {
    setEventTarget(event);
    setEventForm({ status: 'resolved', note: '' });
  }

  async function submitEventReview() {
    if (!eventTarget) return;
    setBusyId(eventTarget.id);
    try {
      await updateEvent(workspaceId, eventTarget.id, eventForm);
      toast.success('Security event updated');
      setEventTarget(null);
      reload();
    } catch (err) {
      toast.error(err.message || 'Unable to update event');
    } finally {
      setBusyId(null);
    }
  }

  const filterOptions = useMemo(() => {
    if (tab === 'reports') {
      return {
        first: {
          label: 'Status',
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: 'all', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'reviewing', label: 'Reviewing' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'dismissed', label: 'Dismissed' },
          ],
        },
      };
    }
    return {
      first: {
        label: 'Status',
        value: statusFilter,
        onChange: setStatusFilter,
        options: [
          { value: 'all', label: 'All statuses' },
          { value: 'open', label: 'Open' },
          { value: 'reviewing', label: 'Reviewing' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'dismissed', label: 'Dismissed' },
        ],
      },
      second: {
        label: 'Severity',
        value: severityFilter,
        onChange: setSeverityFilter,
        options: [
          { value: 'all', label: 'All severities' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' },
        ],
      },
    };
  }, [tab, statusFilter, severityFilter]);

  if (!ready && !activeWorkspace) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Preparing your workspace..." />
      </div>
    );
  }

  if (!canManage) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Abuse & safety is restricted"
        description="Only workspace admins and owners can review security events, reports, and enforce link actions."
      />
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-100">Abuse &amp; Safety</h1>
          <p className="mt-1 text-sm text-ink-400">
            Rule-based detection, visitor reports, and link enforcement for {activeWorkspace?.name}.
          </p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={reload} loading={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Open events" value={summary.openEvents} tone="warn" />
        <StatCard label="High severity" value={summary.highEvents} tone="danger" />
        <StatCard label="Pending reports" value={summary.pendingReports} tone="warn" />
      </div>

      <div className="rounded-xl border border-base-700 bg-base-850 px-4 py-3 text-xs text-ink-400">
        Detection runs on deterministic rules over your own data. High traffic or an unfamiliar
        domain alone never disables a link — enforcement is always a human decision here.
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setTab(item.key);
              setStatusFilter('all');
              setSeverityFilter('all');
            }}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
              tab === item.key
                ? 'border-accent-600/40 bg-accent-500/10 text-accent-300'
                : 'border-base-700 bg-base-850 text-ink-300 hover:border-base-600 hover:text-ink-100'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab !== 'links' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
          <Select
            label={filterOptions.first.label}
            value={filterOptions.first.value}
            onChange={(event) => filterOptions.first.onChange(event.target.value)}
            options={filterOptions.first.options}
          />
          {filterOptions.second && (
            <Select
              label={filterOptions.second.label}
              value={filterOptions.second.value}
              onChange={(event) => filterOptions.second.onChange(event.target.value)}
              options={filterOptions.second.options}
            />
          )}
        </div>
      )}

      {error ? (
        <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-5">
          <div className="flex items-center gap-2 text-danger-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Could not load the safety console</span>
          </div>
          <p className="text-sm text-ink-400">{error}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={reload}>
            Retry
          </Button>
        </div>
      ) : loading && links.length === 0 && reports.length === 0 && events.length === 0 ? (
        <div className="flex justify-center py-20">
          <Spinner label="Loading..." />
        </div>
      ) : (
        <>
          {tab === 'links' && (
            <div className="surface-card">
              <div className="border-b border-base-800 p-5">
                <CardHeader
                  title="Suspicious links"
                  description="Links with open security events or visitor reports."
                  className="mb-0"
                />
              </div>
              {links.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={ShieldCheck}
                    title="Nothing flagged"
                    description="No links currently have open security events or pending reports."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-base-800">
                  {links.map((link) => (
                    <li
                      key={link.linkId}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-medium text-ink-100">
                          <span className="truncate">{link.title || 'Untitled link'}</span>
                          <Badge tone={SEVERITY_TONES[link.highestSeverity] || 'neutral'}>
                            {link.highestSeverity}
                          </Badge>
                          {link.status === 'disabled' && <Badge tone="danger">disabled</Badge>}
                        </p>
                        <p className="truncate text-xs text-ink-500">
                          /{link.shortCode} · {formatNumber(link.clickCount)} clicks ·{' '}
                          {link.events} event{link.events === 1 ? '' : 's'} · {link.reports} report
                          {link.reports === 1 ? '' : 's'} · {formatDateTime(link.lastActivityAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" icon={Eye} onClick={() => openInspect(link.linkId)}>
                          Inspect
                        </Button>
                        {link.status === 'disabled' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={RotateCcw}
                            disabled={busyId === link.linkId}
                            onClick={() => handleToggleLink(link, 'active', 'Reactivated from abuse console')}
                          >
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger-400 hover:bg-danger-500/10"
                            icon={Ban}
                            disabled={busyId === link.linkId}
                            onClick={() => handleToggleLink(link, 'disabled', 'Disabled from abuse console')}
                          >
                            Disable
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'reports' && (
            <div className="surface-card">
              <div className="border-b border-base-800 p-5">
                <CardHeader
                  title="Visitor reports"
                  description="Reports submitted by visitors through the public report endpoint."
                  className="mb-0"
                />
              </div>
              {reports.length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={Flag} title="No reports" description="No abuse reports have been submitted." />
                </div>
              ) : (
                <ul className="divide-y divide-base-800">
                  {reports.map((report) => (
                    <li
                      key={report.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-medium text-ink-100">
                          {REASON_LABELS[report.reason] || report.reason}
                          <Badge tone={REPORT_STATUS_TONES[report.status] || 'neutral'}>
                            {report.status}
                          </Badge>
                        </p>
                        <p className="truncate text-xs text-ink-500">
                          /{report.link?.code} · {report.link?.title || 'Untitled'} ·{' '}
                          {formatDateTime(report.createdAt)}
                          {report.reporter?.email ? ` · ${report.reporter.email}` : ''}
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        disabled={busyId === report.id}
                        onClick={() => openReportReview(report)}
                      >
                        Review
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'events' && (
            <div className="surface-card">
              <div className="border-b border-base-800 p-5">
                <CardHeader
                  title="Security events"
                  description="Every detection or report, with the rule that produced it."
                  className="mb-0"
                />
              </div>
              {events.length === 0 ? (
                <div className="p-5">
                  <EmptyState icon={ShieldCheck} title="No events" description="No security events match these filters." />
                </div>
              ) : (
                <ul className="divide-y divide-base-800">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-medium text-ink-100">
                          <span className="truncate">{event.title}</span>
                          <Badge tone={SEVERITY_TONES[event.severity] || 'neutral'}>
                            {event.severity}
                          </Badge>
                          <Badge tone={EVENT_STATUS_TONES[event.status] || 'neutral'}>
                            {event.status}
                          </Badge>
                        </p>
                        <p className="truncate text-xs text-ink-500">
                          {eventTypeLabel(event.type)}
                          {event.link?.code ? ` · /${event.link.code}` : ''} ·{' '}
                          {event.source === 'report' ? 'visitor report' : 'automated rule'} ·{' '}
                          {formatDateTime(event.createdAt)}
                        </p>
                        {event.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-ink-400">{event.description}</p>
                        )}
                      </div>
                      {event.status === 'open' || event.status === 'reviewing' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Eye}
                          disabled={busyId === event.id}
                          onClick={() => openEventReview(event)}
                        >
                          Review
                        </Button>
                      ) : (
                        <span className="text-xs text-ink-500">{event.resolutionNote || 'Reviewed'}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <Dialog
        open={inspectLoading || Boolean(inspected)}
        onClose={() => {
          setInspected(null);
          setInspectLoading(false);
        }}
        title={inspected?.link?.title || 'Inspecting link'}
        description={inspected ? `/${inspected.link.shortCode}` : 'Loading link details...'}
        className="max-w-lg"
        footer={
          inspected && (
            <>
              <Button variant="ghost" onClick={() => setInspected(null)} disabled={Boolean(busyId)}>
                Close
              </Button>
              {inspected.link.status === 'disabled' ? (
                <Button
                  variant="secondary"
                  icon={RotateCcw}
                  loading={busyId === inspected.link.id}
                  onClick={() => handleToggleLink(inspected.link, 'active', actionReason)}
                >
                  Reactivate
                </Button>
              ) : (
                <Button
                  variant="danger"
                  icon={Ban}
                  loading={busyId === inspected.link.id}
                  onClick={() => handleToggleLink(inspected.link, 'disabled', actionReason)}
                >
                  Disable link
                </Button>
              )}
            </>
          )
        }
      >
        {inspected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-base-700 bg-base-850 p-3">
                <p className="text-xs text-ink-500">Destination risk</p>
                <p className="mt-0.5 font-medium text-ink-100">
                  {inspected.destinationRisk.flagged ? 'Flagged' : 'OK'} ({inspected.destinationRisk.score})
                </p>
              </div>
              <div className="rounded-lg border border-base-700 bg-base-850 p-3">
                <p className="text-xs text-ink-500">Clicks</p>
                <p className="mt-0.5 font-medium text-ink-100">{formatNumber(inspected.link.clickCount)}</p>
              </div>
            </div>

            <p className="break-all text-xs text-ink-400">{inspected.link.originalUrl}</p>

            {inspected.destinationRisk.signals?.length > 0 && (
              <ul className="space-y-1 text-xs text-warn-300">
                {inspected.destinationRisk.signals.map((signal) => (
                  <li key={signal.code}>• {signal.label}</li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs text-ink-400">
              <span>Events: {formatNumber(inspected.counts.events)} ({inspected.counts.openEvents} open)</span>
              <span>Reports: {formatNumber(inspected.counts.reports)} ({inspected.counts.pendingReports} pending)</span>
            </div>

            {inspected.recentEvents?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-300">Recent events</p>
                <ul className="mt-1 space-y-1 text-xs text-ink-500">
                  {inspected.recentEvents.slice(0, 5).map((event) => (
                    <li key={event.id}>
                      {event.title} · {formatDateTime(event.createdAt)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label className="field-label" htmlFor="abuse-action-reason">
                Reason (optional, recorded in the audit log)
              </label>
              <input
                id="abuse-action-reason"
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                placeholder="e.g. confirmed phishing"
                className="h-10 w-full rounded-xl border border-base-600 bg-base-850 px-3 text-sm text-ink-100 focus:border-accent-600 focus:outline-none"
              />
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        title="Review report"
        description={
          reportTarget
            ? `${REASON_LABELS[reportTarget.reason] || reportTarget.reason} · /${reportTarget.link?.code}`
            : ''
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setReportTarget(null)} disabled={Boolean(busyId)}>
              Cancel
            </Button>
            <Button loading={busyId === reportTarget?.id} onClick={submitReportReview}>
              Save review
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {reportTarget?.description && (
            <p className="rounded-lg border border-base-700 bg-base-850 p-3 text-sm text-ink-300">
              {reportTarget.description}
            </p>
          )}
          <Select
            label="Status"
            value={reportForm.status}
            onChange={(event) => setReportForm((current) => ({ ...current, status: event.target.value }))}
            options={[
              { value: 'reviewing', label: 'Reviewing' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'dismissed', label: 'Dismissed' },
            ]}
          />
          <div>
            <label className="field-label" htmlFor="report-notes">
              Notes
            </label>
            <textarea
              id="report-notes"
              rows={3}
              value={reportForm.reviewNotes}
              onChange={(event) =>
                setReportForm((current) => ({ ...current, reviewNotes: event.target.value }))
              }
              className="w-full rounded-xl border border-base-600 bg-base-850 px-3 py-2 text-sm text-ink-100 focus:border-accent-600 focus:outline-none"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(eventTarget)}
        onClose={() => setEventTarget(null)}
        title="Review security event"
        description={eventTarget?.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEventTarget(null)} disabled={Boolean(busyId)}>
              Cancel
            </Button>
            <Button loading={busyId === eventTarget?.id} onClick={submitEventReview}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {eventTarget?.description && (
            <p className="rounded-lg border border-base-700 bg-base-850 p-3 text-sm text-ink-300">
              {eventTarget.description}
            </p>
          )}
          <Select
            label="Status"
            value={eventForm.status}
            onChange={(event) => setEventForm((current) => ({ ...current, status: event.target.value }))}
            options={[
              { value: 'reviewing', label: 'Reviewing' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'dismissed', label: 'Dismissed' },
            ]}
          />
          <div>
            <label className="field-label" htmlFor="event-note">
              Note
            </label>
            <textarea
              id="event-note"
              rows={3}
              value={eventForm.note}
              onChange={(event) => setEventForm((current) => ({ ...current, note: event.target.value }))}
              className="w-full rounded-xl border border-base-600 bg-base-850 px-3 py-2 text-sm text-ink-100 focus:border-accent-600 focus:outline-none"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
