import Spinner from './Spinner.jsx';
import Logo from './Logo.jsx';

export default function PageLoader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-base-950">
      <Logo />
      <Spinner label={label} />
    </div>
  );
}
