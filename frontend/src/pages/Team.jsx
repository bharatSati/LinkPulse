import { Users } from 'lucide-react';
import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function Team() {
  return (
    <PlaceholderPage
      icon={Users}
      title="Team"
      description="Invite collaborators and manage workspace roles."
      features={[
        'Member invitations',
        'Roles: owner, admin, editor, analyst, viewer',
        'Role-based permissions',
        'Member activity log',
        'Seat management',
        'Access reviews',
      ]}
    />
  );
}
