import { Settings as SettingsIcon } from 'lucide-react';
import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function Settings() {
  return (
    <PlaceholderPage
      icon={SettingsIcon}
      title="Settings"
      description="Configure your profile, workspaces, and preferences."
      features={[
        'Profile and account details',
        'Workspace general settings',
        'Branding and custom domains',
        'Notification preferences',
        'API keys',
        'Billing and plans',
      ]}
    />
  );
}
