import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import Spinner from '../components/ui/Spinner.jsx';
import BioPageView from '../components/bio/BioPageView.jsx';
import { getPublicBioPage } from '../services/bioPage.service.js';

export default function PublicBioPage() {
  const { username } = useParams();
  const [state, setState] = useState({ status: 'loading', page: null });

  useEffect(() => {
    let current = true;
    setState({ status: 'loading', page: null });

    getPublicBioPage(username)
      .then((page) => {
        if (!current) return;
        setState({ status: 'ready', page });
        document.title = `${page.title || `@${page.username}`} · LinkPulse`;
      })
      .catch((err) => {
        if (!current) return;
        setState({
          status: err.status === 404 ? 'notfound' : 'error',
          page: null,
          message: err.message,
        });
      });

    return () => {
      current = false;
    };
  }, [username]);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-950">
        <Spinner label="Loading page..." />
      </div>
    );
  }

  if (state.status === 'ready') {
    return (
      <div className="min-h-screen bg-base-950">
        <BioPageView page={state.page} footer className="min-h-screen justify-center" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-950 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-900 text-ink-400 ring-1 ring-base-700">
        <SearchX className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-ink-100">
          {state.status === 'notfound' ? 'This page isn’t available' : 'Something went wrong'}
        </h1>
        <p className="mt-1 max-w-sm text-sm text-ink-400">
          {state.status === 'notfound'
            ? 'The bio page may have been unpublished or never existed.'
            : state.message || 'Please try again in a moment.'}
        </p>
      </div>
      <Link
        to="/login"
        className="text-sm font-medium text-accent-400 transition hover:text-accent-300"
      >
        Go to LinkPulse
      </Link>
    </div>
  );
}
