import { Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import { BIO_PLATFORMS, bioItemKey } from '../../utils/bio.js';

const PLATFORM_OPTIONS = BIO_PLATFORMS.map((item) => ({
  value: item.value,
  label: item.label,
}));

export default function SocialLinksEditor({ socialLinks, onChange, disabled = false }) {
  function addSocial() {
    onChange([...socialLinks, { key: bioItemKey(), platform: 'website', url: '' }]);
  }

  function updateSocial(index, patch) {
    onChange(socialLinks.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-100">Social links</h3>
          <p className="text-xs text-ink-500">Icons shown beneath your bio.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={addSocial}
          disabled={disabled || socialLinks.length >= 12}
        >
          Add social
        </Button>
      </div>

      {socialLinks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-base-700 bg-base-900/40 px-4 py-6 text-center text-sm text-ink-500">
          No social links yet.
        </div>
      ) : (
        <div className="space-y-3">
          {socialLinks.map((item, index) => (
            <div key={item.key} className="flex items-end gap-2">
              <Select
                label="Platform"
                className="w-40 shrink-0"
                value={item.platform}
                options={PLATFORM_OPTIONS}
                disabled={disabled}
                onChange={(event) => updateSocial(index, { platform: event.target.value })}
              />
              <Input
                label={item.platform === 'email' ? 'Email' : 'URL'}
                placeholder={item.platform === 'email' ? 'you@example.com' : 'https://…'}
                value={item.url}
                disabled={disabled}
                onChange={(event) => updateSocial(index, { url: event.target.value })}
              />
              <button
                type="button"
                aria-label="Remove social link"
                disabled={disabled}
                onClick={() => onChange(socialLinks.filter((_, i) => i !== index))}
                className="mb-1 rounded-lg p-2.5 text-danger-400 transition hover:bg-danger-500/10 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
