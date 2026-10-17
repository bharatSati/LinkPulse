import { useEffect, useState } from 'react';
import { ChevronDown, Lock, Sparkles } from 'lucide-react';
import Dialog from '../ui/Dialog.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Switch from '../ui/Switch.jsx';
import Badge from '../ui/Badge.jsx';
import { cn } from '../../utils/cn.js';
import { toDateTimeLocal } from '../../utils/format.js';
import { isHttpUrl, isValidAlias } from '../../utils/linkDisplay.js';
import { createLink, updateLink } from '../../services/link.service.js';

const EMPTY_RULES = { enabled: false, defaultUrl: '', mobile: '', tablet: '', desktop: '' };

function initialForm(link) {
  if (!link) {
    return {
      originalUrl: '',
      title: '',
      customAlias: '',
      expiresAt: '',
      clickLimit: '',
      password: '',
      clearPassword: false,
      rules: { ...EMPTY_RULES },
    };
  }

  return {
    originalUrl: link.originalUrl || '',
    title: link.title || '',
    customAlias: link.customAlias || '',
    expiresAt: toDateTimeLocal(link.expiresAt),
    clickLimit: link.clickLimit ?? '',
    password: '',
    clearPassword: false,
    rules: {
      enabled: Boolean(link.redirectRules?.enabled),
      defaultUrl: link.redirectRules?.defaultUrl || '',
      mobile: link.redirectRules?.devices?.mobile || '',
      tablet: link.redirectRules?.devices?.tablet || '',
      desktop: link.redirectRules?.devices?.desktop || '',
    },
  };
}

function destinationError(value) {
  if (!value) return null;
  return isHttpUrl(value) ? null : 'Must be a valid http:// or https:// URL';
}

export default function LinkFormDialog({ open, mode, link, workspaceId, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(() => initialForm(link));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialForm(link));
      setErrors({});
      setFormError('');
      setAdvancedOpen(Boolean(link?.redirectRules?.enabled));
    }
  }, [open, link]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function setRule(field, value) {
    setForm((current) => ({ ...current, rules: { ...current.rules, [field]: value } }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const next = {};

    if (!form.originalUrl.trim()) {
      next.originalUrl = 'Original URL is required';
    } else if (!isHttpUrl(form.originalUrl)) {
      next.originalUrl = 'Enter a valid http:// or https:// URL';
    }

    if (form.customAlias.trim() && !isValidAlias(form.customAlias)) {
      next.customAlias =
        'Use 3-50 characters with letters, numbers, hyphens, or underscores';
    }

    if (form.expiresAt) {
      const when = new Date(form.expiresAt);
      if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
        next.expiresAt = 'Expiration must be a future date';
      }
    }

    if (form.clickLimit !== '' && form.clickLimit !== null) {
      const limit = Number(form.clickLimit);
      if (!Number.isInteger(limit) || limit < 1) {
        next.clickLimit = 'Click limit must be a positive whole number';
      }
    }

    if (form.password && form.password.length < 4) {
      next.password = 'Password must be at least 4 characters';
    }

    next.defaultUrl = destinationError(form.rules.defaultUrl);
    next.mobile = destinationError(form.rules.mobile);
    next.tablet = destinationError(form.rules.tablet);
    next.desktop = destinationError(form.rules.desktop);

    const hasRuleDestination =
      form.rules.defaultUrl || form.rules.mobile || form.rules.tablet || form.rules.desktop;
    if (form.rules.enabled && !hasRuleDestination) {
      next.rules = 'Add at least one destination URL to enable redirect rules';
    }

    setErrors(next);
    return !Object.values(next).some(Boolean);
  }

  function buildPayload() {
    const payload = {
      originalUrl: form.originalUrl.trim(),
      title: form.title.trim(),
      redirectRules: {
        enabled: form.rules.enabled,
        defaultUrl: form.rules.defaultUrl.trim() || null,
        devices: {
          mobile: form.rules.mobile.trim() || null,
          tablet: form.rules.tablet.trim() || null,
          desktop: form.rules.desktop.trim() || null,
        },
      },
    };

    const alias = form.customAlias.trim().toLowerCase();
    if (alias) {
      payload.customAlias = alias;
    } else if (isEdit) {
      payload.customAlias = null;
    }

    if (form.expiresAt) {
      payload.expiresAt = new Date(form.expiresAt).toISOString();
    } else if (isEdit) {
      payload.expiresAt = null;
    }

    if (form.clickLimit !== '' && form.clickLimit !== null) {
      payload.clickLimit = Number(form.clickLimit);
    } else if (isEdit) {
      payload.clickLimit = null;
    }

    if (isEdit) {
      if (form.clearPassword) {
        payload.password = '';
      } else if (form.password) {
        payload.password = form.password;
      }
    } else if (form.password) {
      payload.password = form.password;
    }

    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = buildPayload();
      const saved = isEdit
        ? await updateLink(link.id, payload)
        : await createLink({ ...payload, workspaceId });
      onSaved(saved, isEdit ? 'edit' : 'create');
    } catch (error) {
      setFormError(error.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="max-w-2xl"
      title={isEdit ? 'Edit link' : 'Create link'}
      description={
        isEdit
          ? 'Update this link’s destination, limits, and routing.'
          : 'Shorten a URL and optionally customize behavior.'
      }
    >
      <form
        id="link-form"
        onSubmit={handleSubmit}
        className="max-h-[70vh] space-y-5 overflow-y-auto pr-1"
        noValidate
      >
        {formError && (
          <div className="rounded-xl border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
            {formError}
          </div>
        )}

        <Input
          label="Destination URL"
          placeholder="https://example.com/landing-page"
          value={form.originalUrl}
          error={errors.originalUrl}
          onChange={(event) => setField('originalUrl', event.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Title"
            placeholder="Spring campaign"
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
          />
          <Input
            label="Custom alias"
            placeholder="spring-sale"
            value={form.customAlias}
            error={errors.customAlias}
            hint="Optional. Uses letters, numbers, - and _"
            onChange={(event) => setField('customAlias', event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Expiration"
            type="datetime-local"
            value={form.expiresAt}
            error={errors.expiresAt}
            onChange={(event) => setField('expiresAt', event.target.value)}
          />
          <Input
            label="Click limit"
            type="number"
            min="1"
            placeholder="Unlimited"
            value={form.clickLimit}
            error={errors.clickLimit}
            hint="Optional. Stops redirecting after this many clicks."
            onChange={(event) => setField('clickLimit', event.target.value)}
          />
        </div>

        <div>
          <Input
            label={isEdit ? 'Change password' : 'Link password'}
            type="password"
            icon={Lock}
            placeholder={isEdit && link?.hasPassword ? 'Leave blank to keep current' : 'Optional'}
            value={form.password}
            error={errors.password}
            onChange={(event) => setField('password', event.target.value)}
          />
          {isEdit && link?.hasPassword && (
            <label className="mt-2 flex items-center gap-2 text-xs text-ink-400">
              <input
                type="checkbox"
                checked={form.clearPassword}
                onChange={(event) => setField('clearPassword', event.target.checked)}
                className="h-3.5 w-3.5 rounded border-base-600 bg-base-850 accent-accent-500"
              />
              Remove password protection
            </label>
          )}
        </div>

        <div className="rounded-xl border border-base-700 bg-base-900/60">
          <button
            type="button"
            onClick={() => setAdvancedOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-ink-200">
              <Sparkles className="h-4 w-4 text-accent-500" />
              Advanced: device redirect rules
            </span>
            <span className="flex items-center gap-2">
              {form.rules.enabled && <Badge tone="accent">Enabled</Badge>}
              <ChevronDown
                className={cn('h-4 w-4 text-ink-400 transition', advancedOpen && 'rotate-180')}
              />
            </span>
          </button>

          {advancedOpen && (
            <div className="space-y-4 border-t border-base-700 px-4 py-4">
              <Switch
                id="rules-enabled"
                checked={form.rules.enabled}
                onChange={(value) => setRule('enabled', value)}
                label="Enable redirect rules"
                description="Route visitors to different destinations based on their device."
              />

              {errors.rules && <p className="text-xs text-danger-400">{errors.rules}</p>}

              <Input
                label="Default / fallback URL"
                placeholder="https://example.com/default"
                value={form.rules.defaultUrl}
                error={errors.defaultUrl}
                hint="Used when no device rule matches or the device is unknown."
                onChange={(event) => setRule('defaultUrl', event.target.value)}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Mobile"
                  placeholder="https://m.example.com"
                  value={form.rules.mobile}
                  error={errors.mobile}
                  onChange={(event) => setRule('mobile', event.target.value)}
                />
                <Input
                  label="Tablet"
                  placeholder="https://t.example.com"
                  value={form.rules.tablet}
                  error={errors.tablet}
                  onChange={(event) => setRule('tablet', event.target.value)}
                />
                <Input
                  label="Desktop"
                  placeholder="https://example.com"
                  value={form.rules.desktop}
                  error={errors.desktop}
                  onChange={(event) => setRule('desktop', event.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </form>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" form="link-form" loading={submitting}>
          {isEdit ? 'Save changes' : 'Create link'}
        </Button>
      </div>
    </Dialog>
  );
}
