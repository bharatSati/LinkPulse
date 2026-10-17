import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-base-950 px-6 text-center">
      <Logo />
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-800 text-accent-400 ring-1 ring-base-700">
        <Compass className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold text-ink-100">Page not found</h1>
        <p className="mt-2 text-sm text-ink-400">
          The page you are looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <Link
        to="/app"
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-base-950 shadow-glow transition hover:bg-accent-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
    </div>
  );
}
