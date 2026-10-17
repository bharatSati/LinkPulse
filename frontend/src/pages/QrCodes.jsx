import { QrCode } from 'lucide-react';
import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function QrCodes() {
  return (
    <PlaceholderPage
      icon={QrCode}
      title="QR Codes"
      description="Generate branded, trackable QR codes."
      features={[
        'Custom colors and logos',
        'Downloadable vector formats',
        'Dynamic destinations',
        'Scan analytics',
        'Bulk QR generation',
        'Print-ready templates',
      ]}
    />
  );
}
