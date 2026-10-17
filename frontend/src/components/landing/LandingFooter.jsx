import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Analytics', href: '#analytics' },
      { label: 'QR & Bio pages', href: '#experience' },
      { label: 'AI insights', href: '#ai' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Why LinkPulse', href: '#why' },
      { label: 'How it works', href: '#how' },
      { label: 'Security', href: '#security' },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="border-t-2 border-base-800 bg-base-950">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-ink-400">
            Short links, QR codes, bio pages, and real-time analytics — one workspace built for
            teams who care about every click.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-xs text-accent-400">{column.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-ink-400 transition hover:text-accent-300">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="text-xs text-accent-400">Get started</h3>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link to="/login" className="text-sm text-ink-400 transition hover:text-accent-300">
                Sign in
              </Link>
            </li>
            <li>
              <Link to="/register" className="text-sm text-ink-400 transition hover:text-accent-300">
                Create account
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t-2 border-base-800">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-ink-600 sm:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} LinkPulse. All rights reserved.</p>
          <p className="uppercase tracking-widest">Built for every click</p>
        </div>
      </div>
    </footer>
  );
}
