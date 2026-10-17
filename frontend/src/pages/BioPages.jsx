import { Contact } from 'lucide-react';
import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function BioPages() {
  return (
    <PlaceholderPage
      icon={Contact}
      title="Bio Pages"
      description="Publish link-in-bio pages under your brand."
      features={[
        'Drag-and-drop blocks',
        'Custom themes',
        'Social icon sets',
        'Mobile-first layouts',
        'Page analytics',
        'Custom domains',
      ]}
    />
  );
}
