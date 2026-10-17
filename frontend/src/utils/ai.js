import {
  Activity,
  AlertTriangle,
  FolderTree,
  Lightbulb,
  PieChart,
  Sparkles,
  TrendingUp,
  Wand2,
} from 'lucide-react';

export const PRIORITY_META = {
  high: { label: 'High priority', tone: 'danger', order: 3 },
  medium: { label: 'Medium priority', tone: 'warn', order: 2 },
  low: { label: 'Low priority', tone: 'neutral', order: 1 },
};

export const INSIGHT_TYPE_META = {
  performance: { label: 'Performance', icon: TrendingUp },
  trend: { label: 'Trend', icon: Activity },
  distribution: { label: 'Distribution', icon: PieChart },
  organization: { label: 'Organization', icon: FolderTree },
  optimization: { label: 'Optimization', icon: Wand2 },
  anomaly: { label: 'Anomaly', icon: AlertTriangle },
  insight: { label: 'Insight', icon: Lightbulb },
};

export function priorityMeta(priority) {
  return PRIORITY_META[priority] || PRIORITY_META.medium;
}

export function typeMeta(type) {
  return INSIGHT_TYPE_META[type] || INSIGHT_TYPE_META.insight;
}

export const AI_ICON = Sparkles;

export function sortByPriority(items = []) {
  return [...items].sort(
    (a, b) => (priorityMeta(b.priority).order || 0) - (priorityMeta(a.priority).order || 0)
  );
}

export function formatRange(range) {
  if (!range?.from || !range?.to) return '';
  const from = new Date(range.from).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const to = new Date(range.to).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${from} – ${to}`;
}
