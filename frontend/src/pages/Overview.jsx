import { useMemo } from 'react';
import { MousePointerClick, Link2, QrCode, Users, Sparkles, ArrowUpRight } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Button from '../components/ui/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';

const METRICS = [
  { key: 'clicks', label: 'Total clicks', icon: MousePointerClick },
  { key: 'links', label: 'Active links', icon: Link2 },
  { key: 'scans', label: 'QR scans', icon: QrCode },
  { key: 'members', label: 'Team members', icon: Users },
];

export default function Overview() {
  const { user } = useAuth();

  const firstName = useMemo(() => user?.name?.split(' ')[0] || 'there', [user]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-100">
            Hi {firstName}
          </h1>
          <Badge tone="accent">Foundation release</Badge>
        </div>
        <p className="text-sm text-ink-400">
          Your workspace is set up. Feature modules will populate these metrics as they ship.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-base-800 text-accent-400 ring-1 ring-base-700">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-ink-500">{label}</p>
              <p className="text-xl font-semibold text-ink-100">—</p>
            </div>
          </Card>
        ))}
      </div>

      <EmptyState
        icon={Sparkles}
        title="No analytics yet"
        description="Once you shorten your first link, real-time click data, top referrers, and device breakdowns will appear here."
        action={
          <Button variant="secondary" icon={ArrowUpRight} disabled>
            Create your first link
          </Button>
        }
      />
    </div>
  );
}
