import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Why LinkPulse', href: '#why' },
  { label: 'How it works', href: '#how' },
  { label: 'Security', href: '#security' },
];

export default function LandingNav() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-base-800 bg-base-950/95">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 lg:px-8">
        <Link to="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="border-2 border-transparent px-3 py-2 text-sm uppercase tracking-wider text-ink-300 transition hover:border-base-700 hover:text-accent-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/app"
              className="border-2 border-accent-400 bg-accent-gradient px-4 py-2 text-sm font-semibold uppercase tracking-wider text-base-950 shadow-glow transition hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden text-sm uppercase tracking-wider text-ink-300 transition hover:text-accent-300 sm:block"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="border-2 border-accent-400 bg-accent-gradient px-4 py-2 text-sm font-semibold uppercase tracking-wider text-base-950 shadow-glow transition hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
