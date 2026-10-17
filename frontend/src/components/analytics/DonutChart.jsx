import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartTooltip from './ChartTooltip.jsx';
import { CHART_COLORS } from '../../utils/chart.js';
import { formatNumber } from '../../utils/format.js';

export default function DonutChart({ data }) {
  const chartData = data.map((item) => ({ name: item.name || item.type, value: item.clicks }));

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-[190px] w-full sm:w-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={82}
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="w-full flex-1 space-y-2">
        {data.map((item, index) => (
          <li key={item.name || item.type} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="truncate capitalize text-ink-300">{item.name || item.type}</span>
            </span>
            <span className="shrink-0 text-xs text-ink-500">
              {formatNumber(item.clicks)} · {item.percentage}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
