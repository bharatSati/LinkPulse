import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip.jsx';
import { CHART_AXIS, CHART_COLORS, CHART_FONT } from '../../utils/chart.js';

export default function HBarChart({ data }) {
  const chartData = data.map((item) => ({ name: item.name, Clicks: item.clicks }));
  const height = Math.max(chartData.length * 40, 120);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={104}
          tick={{ fill: CHART_AXIS, fontSize: 16, fontFamily: CHART_FONT }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(205,242,63,0.1)' }} />
        <Bar dataKey="Clicks" radius={0} barSize={14}>
          {chartData.map((entry, index) => (
            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
