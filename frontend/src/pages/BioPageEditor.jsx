import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Power,
  Save,
  Trash2,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import BioLinksEditor from '../components/bio/BioLinksEditor.jsx';
import SocialLinksEditor from '../components/bio/SocialLinksEditor.jsx';
import BioPreview from '../components/bio/BioPreview.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useToast } from '../hooks/useToast.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { listLinks } from '../services/link.service.js';
import {
  checkUsernameAvailability,
  createBioPage,
  deleteBioPage,
  getBioPage,
  publishBioPage,
  updateBioPage,
} from '../services/bioPage.service.js';
import {
  BIO_BUTTON_STYLES,
  BIO_THEMES,
  DEFAULT_BIO_BACKGROUND,
  DEFAULT_BIO_TEXT,
  bioItemKey,
  isHexColor,
  isHttpUrl,
  isValidUsername,
  publicBioUrl,
} from '../utils/bio.js';

const EDIT_ROLES = ['owner', 'admin', 'editor'];

const EMPTY_FORM = {
  username: '',
  title: '',
  description: '',
  avatarUrl: '',
  backgroundColor: DEFAULT_BIO_BACKGROUND,
  textColor: DEFAULT_BIO_TEXT,
  buttonStyle: 'solid',
  theme: 'dark',
  links: [],
  socialLinks: [],
};

function toFormLinks(links = []) {
  return links.map((item) => ({
    key: bioItemKey(),
    title: item.title || '',
    mode: item.link ? 'link' : 'url',
    link: item.link || '',
    url: item.link ? '' : item.url || '',
    resolvedUrl: item.link ? item.url || '' : '',
    enabled: item.enabled !== false,
  }));
}

export default function BioPageEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { activeWorkspace, ready } = useWorkspace();
  const { toast } = useToast();

  const workspaceId = activeWorkspace?._id;

  const [role, setRole] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [usernameState, setUsernameState] = useState({ status: 'idle', message: '' });
  const [workspaceLinks, setWorkspaceLinks] = useState([]);

  const canEdit = role ? EDIT_ROLES.includes(role) : true;

  const debouncedUsername = useDebouncedValue(form.username.trim().toLowerCase(), 400);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await getBioPage(id);
      setPage(result.bioPage);
      setRole(result.role);
      setForm({
        username: result.bioPage.username,
        title: result.bioPage.title,
        description: result.bioPage.description,
        avatarUrl: result.bioPage.avatarUrl,
        backgroundColor: result.bioPage.backgroundColor,
        textColor: result.bioPage.textColor,
        buttonStyle: result.bioPage.buttonStyle,
        theme: result.bioPage.theme,
        links: toFormLinks(result.bioPage.links),
        socialLinks: (result.bioPage.socialLinks || []).map((item) => ({
          key: bioItemKey(),
          platform: item.platform,
          url: item.url,
        })),
      });
    } catch (err) {
      setLoadError(err.message || 'Unable to load this bio page');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isNew && id) loadPage();
  }, [isNew, id, loadPage]);

  useEffect(() => {
    if (!workspaceId) return undefined;
    let current = true;
    listLinks({ workspaceId, limit: 100 })
      .then((result) => {
        if (current) setWorkspaceLinks(result.links || []);
      })
      .catch(() => {
        if (current) setWorkspaceLinks([]);
      });
    return () => {
      current = false;
    };
  }, [workspaceId]);

  useEffect(() => {
    const value = debouncedUsername;
    if (!value) {
      setUsernameState({ status: 'idle', message: '' });
      return undefined;
    }
    if (!isValidUsername(value)) {
      setUsernameState({
        status: 'invalid',
        message: 'Use 3–30 lowercase letters, numbers, hyphens, or underscores',
      });
      return undefined;
    }
    if (page && value === page.username) {
      setUsernameState({ status: 'ok', message: 'Current username' });
      return undefined;
    }

    let current = true;
    setUsernameState({ status: 'checking', message: 'Checking availability…' });
    checkUsernameAvailability(value, page?.id)
      .then((result) => {
        if (!current) return;
        setUsernameState(
          result.available
            ? { status: 'ok', message: 'Username is available' }
            : { status: 'taken', message: result.reason || 'Username is already taken' }
        );
      })
      .catch(() => {
        if (current) setUsernameState({ status: 'idle', message: '' });
      });

    return () => {
      current = false;
    };
  }, [debouncedUsername, page]);

  const linkOptions = useMemo(() => {
    const map = new Map(workspaceLinks.map((link) => [link.id, link]));
    form.links
      .filter((item) => item.mode === 'link' && item.link && !map.has(item.link))
      .forEach((item) => {
        map.set(item.link, {
          id: item.link,
          title: item.title,
          shortCode: 'saved',
          shortUrl: item.resolvedUrl || '',
        });
      });
    return [...map.values()];
  }, [workspaceLinks, form.links]);

  function updateForm(patch) {
    setForm((value) => ({ ...value, ...patch }));
  }

  function validate() {
    if (!isValidUsername(form.username.trim().toLowerCase())) {
      return 'Please choose a valid username before saving.';
    }
    if (usernameState.status === 'taken') {
      return 'That username is already taken.';
    }
    if (form.avatarUrl.trim() && !isHttpUrl(form.avatarUrl.trim())) {
      return 'Avatar must be a valid http(s) URL.';
    }
    if (!isHexColor(form.backgroundColor) || !isHexColor(form.textColor)) {
      return 'Background and text colors must be valid hex values.';
    }
    for (const item of form.links) {
      if (item.mode === 'link' && !item.link) {
        return 'Every LinkPulse link needs a selected link.';
      }
      if (item.mode === 'url' && !isHttpUrl(item.url || '')) {
        return 'Custom link URLs must start with http:// or https://.';
      }
    }
    for (const social of form.socialLinks) {
      const value = (social.url || '').trim();
      if (!value) continue;
      if (social.platform === 'email') {
        const ok = value.startsWith('mailto:') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!ok) return 'Email social links need a valid email address.';
      } else if (!isHttpUrl(value)) {
        return 'Social links must start with http:// or https://.';
      }
    }
    return null;
  }

  function buildPayload() {
    return {
      username: form.username.trim().toLowerCase(),
      title: form.title.trim(),
      description: form.description.trim(),
      avatarUrl: form.avatarUrl.trim(),
      backgroundColor: form.backgroundColor,
      textColor: form.textColor,
      buttonStyle: form.buttonStyle,
      theme: form.theme,
      links: form.links
        .map((item) => {
          const entry = { title: item.title.trim(), enabled: item.enabled !== false };
          if (item.mode === 'link') {
            if (!item.link) return null;
            entry.link = item.link;
          } else {
            if (!item.url.trim()) return null;
            entry.url = item.url.trim();
          }
          return entry;
        })
        .filter(Boolean),
      socialLinks: form.socialLinks
        .map((item) => ({ platform: item.platform, url: item.url.trim() }))
        .filter((item) => item.url),
    };
  }

  async function handleSave() {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isNew) {
        if (!workspaceId) throw new Error('No active workspace');
        const created = await createBioPage({ workspaceId, ...payload });
        toast.success('Bio page created');
        navigate(`/app/bio-pages/${created.id}`, { replace: true });
      } else {
        const updated = await updateBioPage(id, payload);
        setPage(updated);
        toast.success('Bio page saved');
      }
    } catch (err) {
      toast.error(err.message || 'Unable to save bio page');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    if (!page) return;
    setBusy(true);
    try {
      const updated = await publishBioPage(page.id, !page.isPublished);
      setPage(updated);
      toast.success(updated.isPublished ? 'Bio page published' : 'Bio page unpublished');
    } catch (err) {
      toast.error(err.message || 'Unable to update bio page');
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!page) return;
    try {
      await navigator.clipboard.writeText(publicBioUrl(page.username));
      setCopied(true);
      toast.success('Public URL copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  async function handleDelete() {
    if (!page) return;
    setBusy(true);
    try {
      await deleteBioPage(page.id);
      toast.success('Bio page deleted');
      navigate('/app/bio-pages');
    } catch (err) {
      toast.error(err.message || 'Unable to delete bio page');
      setBusy(false);
    }
  }

  if (!ready && !activeWorkspace) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Preparing your workspace..." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Loading bio page..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="animate-fade-in space-y-4">
        <Link
          to="/app/bio-pages"
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to bio pages
        </Link>
        <div className="surface-card flex flex-col items-start gap-3 border-danger-500/30 p-5">
          <div className="flex items-center gap-2 text-danger-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Could not load bio page</span>
          </div>
          <p className="text-sm text-ink-400">{loadError}</p>
          <Button variant="secondary" onClick={loadPage}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const usernameError =
    usernameState.status === 'invalid' || usernameState.status === 'taken'
      ? usernameState.message
      : undefined;
  const usernameHint =
    usernameState.status === 'ok' || usernameState.status === 'checking'
      ? usernameState.message
      : 'Your public URL: /bio/' + (form.username.trim().toLowerCase() || 'username');

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/app/bio-pages"
            className="rounded-lg p-2 text-ink-400 transition hover:bg-base-800 hover:text-ink-100"
            aria-label="Back to bio pages"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink-100">
              {isNew ? 'New bio page' : form.title || `@${form.username}`}
            </h1>
            <p className="text-sm text-ink-400">
              {isNew ? 'Design a page that gathers all your links.' : `/bio/${page?.username}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <>
              <Button
                variant="secondary"
                icon={page?.isPublished ? Power : Eye}
                onClick={handleTogglePublish}
                disabled={!canEdit || busy}
              >
                {page?.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
              <Button variant="ghost" icon={copied ? Check : Copy} onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy URL'}
              </Button>
              {page?.isPublished && (
                <Button
                  variant="ghost"
                  icon={ExternalLink}
                  onClick={() => window.open(publicBioUrl(page.username), '_blank', 'noopener')}
                >
                  View
                </Button>
              )}
            </>
          )}
          <Button icon={Save} loading={saving} onClick={handleSave} disabled={!canEdit}>
            {isNew ? 'Create bio page' : 'Save changes'}
          </Button>
        </div>
      </div>

      {!canEdit && (
        <div className="rounded-xl border border-warn-500/40 bg-warn-500/10 px-4 py-3 text-sm text-warn-400">
          You have read-only access to this bio page.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="surface-card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-ink-100">Profile</h2>
            <Input
              label="Username"
              placeholder="your-name"
              value={form.username}
              disabled={!canEdit}
              error={usernameError}
              hint={usernameHint}
              onChange={(event) =>
                updateForm({ username: event.target.value.replace(/\s+/g, '-').toLowerCase() })
              }
            />
            <Input
              label="Title"
              placeholder="Your name or brand"
              value={form.title}
              maxLength={80}
              disabled={!canEdit}
              onChange={(event) => updateForm({ title: event.target.value })}
            />
            <div className="w-full">
              <label className="field-label" htmlFor="bio-description">
                Description
              </label>
              <textarea
                id="bio-description"
                rows={3}
                maxLength={300}
                value={form.description}
                disabled={!canEdit}
                placeholder="A short line about you"
                onChange={(event) => updateForm({ description: event.target.value })}
                className="w-full rounded-xl border border-base-600 bg-base-850 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 transition focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            <Input
              label="Avatar URL"
              placeholder="https://…/avatar.png"
              icon={ImageIcon}
              value={form.avatarUrl}
              disabled={!canEdit}
              onChange={(event) => updateForm({ avatarUrl: event.target.value })}
            />
          </section>

          <section className="surface-card space-y-4 p-5">
            <h2 className="text-sm font-semibold text-ink-100">Appearance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label" htmlFor="bio-bg">
                  Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="bio-bg"
                    type="color"
                    value={form.backgroundColor}
                    disabled={!canEdit}
                    onChange={(event) => updateForm({ backgroundColor: event.target.value })}
                    className="h-11 w-12 cursor-pointer rounded-lg border border-base-600 bg-base-850"
                  />
                  <Input
                    value={form.backgroundColor}
                    disabled={!canEdit}
                    onChange={(event) => updateForm({ backgroundColor: event.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="bio-text">
                  Text
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="bio-text"
                    type="color"
                    value={form.textColor}
                    disabled={!canEdit}
                    onChange={(event) => updateForm({ textColor: event.target.value })}
                    className="h-11 w-12 cursor-pointer rounded-lg border border-base-600 bg-base-850"
                  />
                  <Input
                    value={form.textColor}
                    disabled={!canEdit}
                    onChange={(event) => updateForm({ textColor: event.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Theme"
                value={form.theme}
                options={BIO_THEMES}
                disabled={!canEdit}
                onChange={(event) => updateForm({ theme: event.target.value })}
              />
              <Select
                label="Button style"
                value={form.buttonStyle}
                options={BIO_BUTTON_STYLES}
                disabled={!canEdit}
                onChange={(event) => updateForm({ buttonStyle: event.target.value })}
              />
            </div>
          </section>

          <section className="surface-card p-5">
            <BioLinksEditor
              links={form.links}
              onChange={(links) => updateForm({ links })}
              workspaceLinks={linkOptions}
              disabled={!canEdit}
            />
          </section>

          <section className="surface-card p-5">
            <SocialLinksEditor
              socialLinks={form.socialLinks}
              onChange={(socialLinks) => updateForm({ socialLinks })}
              disabled={!canEdit}
            />
          </section>

          {!isNew && (
            <section className="surface-card flex items-center justify-between gap-4 p-5">
              <div>
                <h2 className="text-sm font-semibold text-ink-100">Danger zone</h2>
                <p className="text-xs text-ink-500">Deleting cannot be undone. Links are kept.</p>
              </div>
              <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)} disabled={!canEdit || busy}>
                Delete
              </Button>
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-ink-500">
            Live preview
          </p>
          <BioPreview
            page={{
              ...form,
              links: form.links.map((item) => ({
                ...item,
                url:
                  item.mode === 'link'
                    ? linkOptions.find((link) => link.id === item.link)?.shortUrl ||
                      item.resolvedUrl ||
                      ''
                    : item.url,
              })),
            }}
          />
        </div>
      </div>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete bio page"
        description="This bio page will be permanently deleted. The underlying links are kept."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={handleDelete}>
              Delete bio page
            </Button>
          </>
        }
      />
    </div>
  );
}
