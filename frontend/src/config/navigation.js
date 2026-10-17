import {
  LayoutDashboard,
  Link2,
  Megaphone,
  BarChart3,
  QrCode,
  Contact,
  Sparkles,
  Users,
  Settings,
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview', to: '/app', icon: LayoutDashboard, end: true },
      { name: 'Links', to: '/app/links', icon: Link2 },
      { name: 'Campaigns', to: '/app/campaigns', icon: Megaphone },
      { name: 'Analytics', to: '/app/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Experience',
    items: [
      { name: 'QR Codes', to: '/app/qr-codes', icon: QrCode },
      { name: 'Bio Pages', to: '/app/bio-pages', icon: Contact },
      { name: 'AI Insights', to: '/app/ai-insights', icon: Sparkles },
    ],
  },
  {
    label: 'Manage',
    items: [
      { name: 'Team', to: '/app/team', icon: Users },
      { name: 'Settings', to: '/app/settings', icon: Settings },
    ],
  },
];
