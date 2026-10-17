import { Sparkles } from 'lucide-react';
import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function AiInsights() {
  return (
    <PlaceholderPage
      icon={Sparkles}
      title="AI Insights"
      description="Automated recommendations powered by your analytics."
      features={[
        'Performance summaries',
        'Anomaly detection',
        'Campaign suggestions',
        'Best-time-to-post',
        'Audience segmentation ideas',
        'Natural-language reporting',
      ]}
    />
  );
}
