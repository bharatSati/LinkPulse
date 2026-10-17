import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartTooltip from './ChartTooltip.jsx';
import { CHART_AXIS, CHART_GRID, CHART_LINE } from '../../utils/chart.js';

function formatKey(value, interval) {
  const date = interval === 'hour' ? new Date(value) : new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ClicksChart({ points, interval = 'day' }) {
  const data = points.map((point) => ({
    date: point.date,
    Clicks: point.clicks,
    Visitors: point.visitors,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22f47f" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#22f47f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => formatKey(value, interval)}
          tick={{ fill: CHART_AXIS, fontSize: 12 }}
          axisLine={{ stroke: CHART_LINE }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: CHART_AXIS, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={40}
          allowDecimals={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART_LINE }} />
        <Area
          type="monotone"
          dataKey="Clicks"
          stroke="#22f47f"
          strokeWidth={2}
          fill="url(#clicksFill)"
        />
        <Area
          type="monotone"
          dataKey="Visitors"
          stroke="#7dffb4"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="none"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
