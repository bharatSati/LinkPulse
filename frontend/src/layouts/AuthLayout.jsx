import { Outlet } from 'react-router-dom';
import { Link2, BarChart3, QrCode, Sparkles } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';

const HIGHLIGHTS = [
  { icon: Link2, text: 'Short links with full control' },
  { icon: BarChart3, text: 'Real-time click analytics' },
  { icon: QrCode, text: 'Branded QR codes and bio pages' },
  { icon: Sparkles, text: 'AI insights on performance' },
];

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-base-800 bg-base-900 p-12 lg:flex">
        <div className="absolute inset-0 grid-noise opacity-60" aria-hidden="true" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 border-2 border-accent-700/40 bg-accent-500/5" aria-hidden="true" />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-md">
          <h1 className="text-2xl font-normal leading-relaxed tracking-tight text-ink-100">
            Every link,
            <br />
            <span className="text-gradient">measured in real time.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-400">
            LinkPulse brings short links, campaigns, QR codes, and analytics into one
            premium workspace built for teams.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-ink-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-800 text-accent-400 ring-1 ring-base-700">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-600">
          © {new Date().getFullYear()} LinkPulse. All rights reserved.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
