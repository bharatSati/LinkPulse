export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-base-700 bg-base-850/95 px-3 py-2 text-xs shadow-panel">
      {label && <p className="mb-1 font-medium text-ink-300">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="text-ink-100">
          <span className="text-ink-400">{entry.name}: </span>
          {entry.value}
        </p>
      ))}
    </div>
  );
}
