import { useEffect, useState } from 'react';
import Dialog from '../ui/Dialog.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import TagInput from '../tags/TagInput.jsx';
import { createCampaign, updateCampaign } from '../../services/campaign.service.js';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function initialForm(campaign) {
  if (!campaign) {
    return { name: '', description: '', status: 'active', startDate: '', endDate: '', tags: [] };
  }

  return {
    name: campaign.name || '',
    description: campaign.description || '',
    status: campaign.status || 'active',
    startDate: toDateInput(campaign.startDate),
    endDate: toDateInput(campaign.endDate),
    tags: (campaign.tags || []).map((tag) => tag.id),
  };
}

export default function CampaignFormDialog({
  open,
  mode,
  campaign,
  workspaceId,
  tags = [],
  onCreateTag,
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(() => initialForm(campaign));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialForm(campaign));
      setErrors({});
      setFormError('');
    }
  }, [open, campaign]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const next = {};

    if (!form.name.trim()) {
      next.name = 'Campaign name is required';
    }

    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      next.endDate = 'End date must be on or after the start date';
    }

    setErrors(next);
    return !Object.values(next).some(Boolean);
  }

  function buildPayload() {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      tags: form.tags,
    };
    if (!isEdit) payload.workspaceId = workspaceId;
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
        ? await updateCampaign(campaign.id, payload)
        : await createCampaign(payload);
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
      className="max-w-xl"
      title={isEdit ? 'Edit campaign' : 'Create campaign'}
      description={
        isEdit
          ? 'Update this campaign’s schedule, status, and tags.'
          : 'Group related links into a measurable campaign.'
      }
    >
      <form
        id="campaign-form"
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
          label="Campaign name"
          placeholder="Spring product launch"
          value={form.name}
          error={errors.name}
          onChange={(event) => setField('name', event.target.value)}
        />

        <div className="w-full">
          <label htmlFor="campaign-description" className="field-label">
            Description
          </label>
          <textarea
            id="campaign-description"
            rows={3}
            placeholder="What is this campaign about?"
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            className="w-full resize-none rounded-xl border border-base-600 bg-base-850 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 transition focus:border-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Status"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(event) => setField('status', event.target.value)}
          />
          <Input
            label="Start date"
            type="date"
            value={form.startDate}
            max={form.endDate || undefined}
            onChange={(event) => setField('startDate', event.target.value)}
          />
          <Input
            label="End date"
            type="date"
            value={form.endDate}
            min={form.startDate || undefined}
            error={errors.endDate}
            onChange={(event) => setField('endDate', event.target.value)}
          />
        </div>

        <TagInput
          label="Tags"
          value={form.tags}
          tags={tags}
          onCreate={onCreateTag}
          onChange={(next) => setField('tags', next)}
          hint="Organize campaigns and links. Press Enter to add or create."
        />
      </form>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" form="campaign-form" loading={submitting}>
          {isEdit ? 'Save changes' : 'Create campaign'}
        </Button>
      </div>
    </Dialog>
  );
}
