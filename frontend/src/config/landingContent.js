import {
  Link2,
  Megaphone,
  BarChart3,
  QrCode,
  Contact,
  Sparkles,
  Users,
  ShieldAlert,
  Radio,
  Lock,
  Layers,
  ShieldCheck,
  Gauge,
  Share2,
  TrendingUp,
  Plus,
  Hash,
  ScrollText,
  Bell,
  Filter,
} from 'lucide-react';

export const FEATURES = [
  {
    icon: Link2,
    name: 'Smart short links',
    purpose:
      'Turn any long URL into a clean, branded short link you fully control. Give it a memorable slug, set an expiry date, cap the number of clicks, or lock it behind a password.',
    why: 'You keep ownership of every link — and your own rules decide when, how often, and who can open it.',
  },
  {
    icon: Megaphone,
    name: 'Campaigns & tags',
    purpose:
      'Group links into campaigns that match a launch, a channel, or a season, and apply tags for cross-cutting themes like product, region, or team.',
    why: 'Instead of juggling scattered links, you compare performance by initiative and know which effort actually moved the numbers.',
  },
  {
    icon: BarChart3,
    name: 'Real-time analytics',
    purpose:
      'Every redirect is counted the moment it happens, then broken down by clicks, unique visitors, referrers, devices, and countries with flexible date ranges.',
    why: 'You make decisions from live data, not after-the-fact reports — with consistent UTC boundaries so periods always reconcile.',
  },
  {
    icon: QrCode,
    name: 'QR code studio',
    purpose:
      'Generate branded QR codes for any link with custom colors, a centre logo, and a downloadable format ready for print or packaging.',
    why: 'Offline traffic becomes measurable: scans land in the same analytics as your digital channels.',
  },
  {
    icon: Contact,
    name: 'Link-in-bio pages',
    purpose:
      'Publish a single shareable page that gathers your links and social profiles, with themes and appearance controls, served publicly at your own username.',
    why: 'One tidy destination for every bio — no third-party tools, and every tap feeds the analytics you already trust.',
  },
  {
    icon: Sparkles,
    name: 'AI insights',
    purpose:
      'An assistant reviews aggregated, non-personal metrics to surface trends, flag anomalies, and suggest concrete next steps you can act on.',
    why: 'It catches what you would miss in a dashboard and turns raw activity into plain-language recommendations.',
  },
  {
    icon: Users,
    name: 'Team & permissions',
    purpose:
      'Invite teammates into shared workspaces with roles from owner to viewer, and review a full audit trail of who changed what and when.',
    why: 'Collaboration stays safe and accountable — everyone gets exactly the access they need, and nothing more.',
  },
  {
    icon: ShieldAlert,
    name: 'Security & abuse protection',
    purpose:
      'Suspicious destinations, sudden click spikes, and repeated password attempts are detected automatically, with reports, reviews, and one-click enforcement.',
    why: 'Your brand stays protected: bad actors are caught early and unsafe redirects never reach your audience.',
  },
];

export const FLAGSHIPS = [
  {
    id: 'analytics',
    eyebrow: 'Analytics',
    title: 'See exactly what happens after the click',
    body:
      'LinkPulse treats every redirect as a first-class event. Clicks are counted atomically, unique visitors are de-duplicated, and dimensions like referrer, device, and country are captured without ever storing raw personal data.',
    points: [
      'Live click and unique-visitor counts, updated as traffic arrives',
      'Break down by referrer, device, country, and campaign in seconds',
      'Consistent UTC date boundaries so any two periods compare cleanly',
      'Works identically for short links, QR scans, and bio pages',
    ],
    visual: 'analytics',
  },
  {
    id: 'experience',
    eyebrow: 'QR & Bio pages',
    title: 'One link, every channel',
    body:
      'A short link, a branded QR code, and a link-in-bio page all point at the same underlying destination — so whether someone taps on social, scans on packaging, or types a URL, the traffic lands in one place.',
    points: [
      'Style QR codes with brand colors and a centre logo, ready to download',
      'Build a themed bio page with links and social profiles in minutes',
      'Public pages served at your own username, no external tools needed',
      'Every scan and tap reports into the same analytics pipeline',
    ],
    visual: 'bio',
  },
  {
    id: 'ai',
    eyebrow: 'AI insights',
    title: 'Let the data surface what matters',
    body:
      'Rather than leaving you to hunt through charts, the AI assistant reads aggregated performance and highlights the patterns worth your attention — always on the backend, always from non-personal metrics.',
    points: [
      'Trend detection across clicks, visitors, and channels',
      'Anomaly alerts when traffic suddenly spikes or stalls',
      'Prioritised, plain-language recommendations with context',
      'History you can revisit, and graceful degradation if AI is unavailable',
    ],
    visual: 'ai',
  },
];

export const DIFFERENTIATORS = [
  {
    icon: Radio,
    title: 'Real-time by design',
    body: 'Counts update as traffic arrives — no sampling, no delayed batches, no guesswork.',
  },
  {
    icon: Lock,
    title: 'Privacy-first',
    body: 'Only hashed visitor identifiers are stored, and AI works purely from aggregated metrics.',
  },
  {
    icon: Layers,
    title: 'One connected workspace',
    body: 'Links, campaigns, QR codes, bio pages, and analytics share a single source of truth.',
  },
  {
    icon: Users,
    title: 'Built for teams',
    body: 'Granular roles and an audit trail keep collaboration secure and accountable.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe by default',
    body: 'Detection rules, input sanitisation, and rate limiting are on from the first redirect.',
  },
  {
    icon: Gauge,
    title: 'Fast and focused',
    body: 'A crisp, purpose-built interface that stays quick even as your link library grows.',
  },
];

export const STEPS = [
  {
    icon: Plus,
    title: 'Create your link',
    body: 'Paste any URL and shape it: custom slug, expiry, click limit, password, campaign, and tags.',
  },
  {
    icon: Share2,
    title: 'Share it everywhere',
    body: 'Post the short link, print the QR code, or add it to your bio page — all point to one destination.',
  },
  {
    icon: TrendingUp,
    title: 'Measure and improve',
    body: 'Watch clicks in real time, read AI recommendations, and double down on what performs.',
  },
];

export const SECURITY_POINTS = [
  { icon: Hash, title: 'Hashed identifiers', body: 'Visitor IPs are one-way hashed with a salted key.' },
  { icon: Lock, title: 'Signed sessions', body: 'Auth tokens are HS256-verified; frontend never holds secrets.' },
  { icon: Filter, title: 'Input sanitisation', body: 'Injection-prone payloads are stripped before they reach the database.' },
  { icon: Gauge, title: 'Rate limiting', body: 'Auth, redirects, imports, and AI calls each have their own limits.' },
  { icon: ShieldAlert, title: 'Abuse detection', body: 'Risky destinations, click spikes, and brute-force attempts are flagged.' },
  { icon: ScrollText, title: 'Full audit trail', body: 'Every sensitive action is logged, reviewable, and attributable.' },
  { icon: Bell, title: 'Proactive alerts', body: 'Owners and admins are notified the moment something looks wrong.' },
];
