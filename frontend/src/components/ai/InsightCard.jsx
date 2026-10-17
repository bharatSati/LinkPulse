import { ListChecks, Wand2 } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import AiMark from './AiMark.jsx';
import { priorityMeta, typeMeta } from '../../utils/ai.js';

export default function InsightCard({ item }) {
  const type = typeMeta(item.type);
  const priority = priorityMeta(item.priority);
  const Icon = type.icon;
  const evidence = Array.isArray(item.evidence) ? item.evidence : [];

  return (
    <div className="surface-card space-y-3 border-accent-600/25 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/10 text-accent-300 ring-1 ring-accent-600/30">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug text-ink-100">{item.title}</p>
            <p className="text-[11px] uppercase tracking-wide text-accent-400/80">{type.label}</p>
          </div>
        </div>
        <Badge tone={priority.tone}>{priority.label}</Badge>
      </div>

      <p className="text-sm text-ink-300">{item.summary}</p>

      {evidence.length > 0 && (
        <div className="rounded-xl border border-base-700 bg-base-900/40 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-500">
            <ListChecks className="h-3 w-3" />
            Supporting data
          </p>
          <ul className="space-y-1">
            {evidence.map((line, index) => (
              <li key={index} className="flex gap-2 text-xs text-ink-400">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-none bg-ink-600" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.recommendation && (
        <div className="flex gap-2.5 rounded-xl border border-accent-600/25 bg-accent-500/5 p-3">
          <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-300" />
          <p className="text-xs text-ink-200">{item.recommendation}</p>
        </div>
      )}

      <AiMark className="!text-[10px]" />
    </div>
  );
}
