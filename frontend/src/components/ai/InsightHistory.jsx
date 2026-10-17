import { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import Spinner from '../ui/Spinner.jsx';
import { getHistory } from '../../services/ai.service.js';
import { formatDateTime } from '../../utils/format.js';
import { formatRange } from '../../utils/ai.js';

const KIND_LABELS = {
  insights: 'Insights',
  recommendations: 'Recommendations',
};

export default function InsightHistory({ workspaceId, reloadToken = 0 }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workspaceId) return undefined;
    let current = true;
    setLoading(true);
    setError('');

    getHistory({ workspaceId, limit: 10 })
      .then((data) => {
        if (current) setEntries(data.history || []);
      })
      .catch((err) => {
        if (current) setError(err.message || 'Unable to load history');
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [workspaceId, reloadToken]);

  return (
    <div className="surface-card flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-100">Generation history</h3>
          <p className="mt-0.5 text-xs text-ink-500">Previously saved AI generations.</p>
        </div>
        <History className="h-4 w-4 text-ink-500" />
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-8">
          <Spinner label="Loading history..." />
        </div>
      ) : error ? (
        <p className="text-sm text-danger-400">{error}</p>
      ) : entries.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <RefreshCw className="mb-2 h-4 w-4 text-ink-600" />
          <p className="text-sm text-ink-500">No saved generations yet.</p>
        </div>
      ) : (
        <ul className="space-y-2 overflow-y-auto">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-base-700 bg-base-900/40 px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink-200">
                  {KIND_LABELS[entry.kind] || entry.kind}
                </span>
                <span className="text-[11px] text-ink-600">{entry.itemCount} item(s)</span>
              </div>
              <p className="mt-0.5 text-[11px] text-ink-500">
                {formatRange(entry.range)} · {formatDateTime(entry.generatedAt)}
              </p>
              {entry.notice && (
                <p className="mt-1 text-[11px] text-warn-400">{entry.notice}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
