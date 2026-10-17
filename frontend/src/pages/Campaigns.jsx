import { Megaphone } from 'lucide-react';
import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function Campaigns() {
  return (
    <PlaceholderPage
      icon={Megaphone}
      title="Campaigns"
      description="Group links into measurable marketing campaigns."
      features={[
        'Campaign grouping',
        'Channel attribution',
        'Goal tracking',
        'Scheduled launches',
        'Campaign comparison',
        'Exportable summaries',
      ]}
    />
  );
}
