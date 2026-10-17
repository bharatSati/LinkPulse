import { ArrowDownRight, ArrowUpRight, ShieldCheck } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { priorityMeta } from '../../utils/ai.js';

export default function AnomalyAlert({ anomaly }) {
  const priority = priorityMeta(anomaly.priority);
  const isSpike = anomaly.subtype !== 'drop';
  const Icon = isSpike ? ArrowUpRight : ArrowDownRight;
  const accent = isSpike ? 'text-accent-300' : 'text-warn-400';
  const ring = isSpike ? 'ring-accent-600/30' : 'ring-warn-500/30';
  const evidence = Array.isArray(anomaly.evidence) ? anomaly.evidence : [];

  return (
    <div
      className={`surface-card space-y-2 p-4 ${
        anomaly.priority === 'high' ? 'border-warn-500/30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-base-800 ring-1 ${ring} ${accent}`}>
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-ink-100">{anomaly.title}</p>
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-500">
              <ShieldCheck className="h-3 w-3" />
              Rule-based detection
            </span>
          </div>
        </div>
        <Badge tone={priority.tone}>{priority.label}</Badge>
      </div>

      <p className="text-sm text-ink-400">{anomaly.summary}</p>

      {evidence.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {evidence.map((line, index) => (
            <li key={index} className="text-xs text-ink-500">
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
