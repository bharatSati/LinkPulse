import { Construction, Sparkles } from 'lucide-react';
import Badge from './ui/Badge.jsx';
import Card from './ui/Card.jsx';

export default function PlaceholderPage({ icon: Icon = Construction, title, description, features = [] }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-400 ring-1 ring-accent-600/30">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink-100">{title}</h1>
            <p className="text-sm text-ink-400">{description}</p>
          </div>
        </div>
        <Badge tone="warn" className="w-fit">
          <Construction className="h-3.5 w-3.5" />
          In development
        </Badge>
      </div>

      <Card className="border-dashed">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
          <div>
            <p className="text-sm font-medium text-ink-100">
              This section is not implemented yet.
            </p>
            <p className="mt-1 text-sm text-ink-400">
              The navigation is fully wired so the link above is ready for the upcoming
              implementation prompt.
            </p>
          </div>
        </div>
      </Card>

      {features.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
            Planned capabilities
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature}
                className="rounded-xl border border-base-700 bg-base-900/60 px-4 py-3 text-sm text-ink-300"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
