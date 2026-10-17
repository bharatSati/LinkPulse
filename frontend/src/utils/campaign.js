import { formatDate } from './format.js';

export function campaignStatusMeta(status) {
  switch (status) {
    case 'active':
      return { label: 'Active', tone: 'accent' };
    case 'completed':
      return { label: 'Completed', tone: 'neutral' };
    case 'archived':
      return { label: 'Archived', tone: 'warn' };
    default:
      return { label: status || 'Unknown', tone: 'neutral' };
  }
}

export function formatSchedule(startDate, endDate) {
  if (!startDate && !endDate) return 'No schedule';
  const start = startDate ? formatDate(startDate) : 'Any time';
  const end = endDate ? formatDate(endDate) : 'Ongoing';
  return `${start} → ${end}`;
}
