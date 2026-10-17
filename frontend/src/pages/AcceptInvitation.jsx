import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Building2, CheckCircle2, Mail, ShieldCheck, XCircle } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Logo from '../components/ui/Logo.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useToast } from '../hooks/useToast.js';
import { acceptInvitation, previewInvitation, rejectInvitation } from '../services/invitation.service.js';
import { roleLabel } from '../utils/permissions.js';
import { formatDateTime } from '../utils/format.js';

const STATUS_COPY = {
  accepted: { tone: 'accent', title: 'Invitation already accepted', icon: CheckCircle2 },
  expired: { tone: 'warn', title: 'Invitation expired', icon: AlertTriangle },
  revoked: { tone: 'danger', title: 'Invitation revoked', icon: XCircle },
  declined: { tone: 'neutral', title: 'Invitation declined', icon: XCircle },
};

function Shell({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-950 px-4 py-10">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="surface-card p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user, initializing } = useAuth();
  const { refresh } = useWorkspace();

  const [state, setState] = useState({ loading: true, error: '', preview: null });
  const [submitting, setSubmitting] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);

  const load = useCallback(() => {
    setState({ loading: true, error: '', preview: null });
    previewInvitation(token)
      .then((preview) => setState({ loading: false, error: '', preview }))
      .catch((error) =>
        setState({ loading: false, error: error.message || 'Unable to load invitation', preview: null })
      );
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAccept() {
    setSubmitting(true);
    try {
      const result = await acceptInvitation(token);
      await refresh();
      toast.success(
        result.alreadyMember
          ? `You are already a member of ${result.workspace.name}`
          : `Welcome to ${result.workspace.name}`
      );
      navigate('/app/team', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Unable to accept invitation');
      if (error.status === 403 || error.status === 409 || error.status === 410 || error.status === 404) {
        load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    setSubmitting(true);
    try {
      await rejectInvitation(token);
      toast.success('Invitation declined');
      setLocalStatus('declined');
    } catch (error) {
      toast.error(error.message || 'Unable to decline invitation');
    } finally {
      setSubmitting(false);
    }
  }

  if (state.loading || initializing) {
    return (
      <Shell>
        <div className="flex justify-center py-8">
          <Spinner label="Loading invitation..." />
        </div>
      </Shell>
    );
  }

  if (state.error) {
    return (
      <Shell>
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-500/10 text-danger-400 ring-1 ring-danger-500/30">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <h1 className="text-lg font-semibold text-ink-100">Invitation unavailable</h1>
          <p className="mt-1.5 text-sm text-ink-400">{state.error}</p>
          <Button variant="secondary" className="mt-5" onClick={() => navigate('/app')}>
            Go to dashboard
          </Button>
        </div>
      </Shell>
    );
  }

  const status = localStatus || state.preview.status;
  const statusCopy = STATUS_COPY[status];

  if (statusCopy) {
    const Icon = statusCopy.icon;
    return (
      <Shell>
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-base-800 text-ink-300 ring-1 ring-base-700">
            <Icon className="h-6 w-6" />
          </span>
          <h1 className="text-lg font-semibold text-ink-100">{statusCopy.title}</h1>
          <p className="mt-1.5 text-sm text-ink-400">
            {state.preview.workspaceName
              ? `This invitation to ${state.preview.workspaceName} is no longer active.`
              : 'This invitation is no longer active.'}
          </p>
          <Button className="mt-5" onClick={() => navigate(isAuthenticated ? '/app' : '/login')}>
            {isAuthenticated ? 'Go to dashboard' : 'Sign in'}
          </Button>
        </div>
      </Shell>
    );
  }

  const { preview } = state;

  return (
    <Shell>
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500/12 text-accent-300 ring-1 ring-accent-600/30">
          <Building2 className="h-6 w-6" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
          Workspace invitation
        </p>
        <h1 className="mt-2 text-xl font-semibold text-ink-100">
          Join {preview.workspaceName || 'this workspace'}
        </h1>
        <p className="mt-1.5 text-sm text-ink-400">
          {preview.inviterName ? `${preview.inviterName} invited you` : 'You have been invited'} as{' '}
          <span className="text-ink-200">{roleLabel(preview.role)}</span>.
        </p>
      </div>

      <div className="mt-5 space-y-2 rounded-xl border border-base-700 bg-base-850 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-500">Invited email</span>
          <span className="flex items-center gap-1.5 text-ink-200">
            <Mail className="h-3.5 w-3.5" /> {preview.email}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-500">Role</span>
          <Badge tone="accent">{roleLabel(preview.role)}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-500">Expires</span>
          <span className="text-ink-300">{formatDateTime(preview.expiresAt)}</span>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="mt-5 space-y-3">
          <p className="rounded-xl border border-warn-500/40 bg-warn-500/10 px-3 py-2.5 text-xs text-warn-400">
            Sign in or create an account with <strong>{preview.email}</strong> to accept this
            invitation.
          </p>
          <Button
            className="w-full"
            onClick={() => navigate('/login', { state: { from: `/invite/${token}` } })}
          >
            Sign in
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate('/register', { state: { from: `/invite/${token}` } })}
          >
            Create an account
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <p className="flex items-center justify-start gap-2 text-xs text-ink-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            Signed in as {user?.email}
          </p>
          <Button className="w-full" loading={submitting} onClick={handleAccept}>
            Accept invitation
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            disabled={submitting}
            onClick={handleDecline}
          >
            Decline
          </Button>
        </div>
      )}

      <p className="mt-5 text-center text-xs text-ink-600">
        <Link to="/" className="hover:text-ink-400">
          Back to LinkPulse
        </Link>
      </p>
    </Shell>
  );
}
