import { ChevronDown, ChevronUp, Link2, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Switch from '../ui/Switch.jsx';
import { bioItemKey } from '../../utils/bio.js';

const MODE_OPTIONS = [
  { value: 'link', label: 'LinkPulse link' },
  { value: 'url', label: 'Custom URL' },
];

function move(list, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function BioLinksEditor({ links, onChange, workspaceLinks = [], disabled = false }) {
  const linkOptions = workspaceLinks.map((link) => ({
    value: link.id,
    label: link.title ? `${link.title} (${link.shortCode})` : link.shortCode,
  }));

  function addLink() {
    onChange([
      ...links,
      { key: bioItemKey(), title: '', mode: 'link', link: '', url: '', enabled: true },
    ]);
  }

  function updateLink(index, patch) {
    onChange(links.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink-100">Page links</h3>
          <p className="text-xs text-ink-500">Reorder, label, and toggle each button.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={Plus}
          onClick={addLink}
          disabled={disabled || links.length >= 50}
        >
          Add link
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-base-700 bg-base-900/40 px-4 py-8 text-center text-sm text-ink-500">
          No links yet. Add your first button.
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((item, index) => (
            <div
              key={item.key}
              className="space-y-3 rounded-xl border border-base-700 bg-base-900/40 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-ink-500">#{index + 1}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={disabled || index === 0}
                    onClick={() => onChange(move(links, index, -1))}
                    className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-800 hover:text-ink-100 disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={disabled || index === links.length - 1}
                    onClick={() => onChange(move(links, index, 1))}
                    className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-800 hover:text-ink-100 disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove link"
                    disabled={disabled}
                    onClick={() => onChange(links.filter((_, i) => i !== index))}
                    className="rounded-lg p-1.5 text-danger-400 transition hover:bg-danger-500/10 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Input
                label="Button label"
                placeholder="e.g. Read our latest post"
                value={item.title}
                maxLength={120}
                disabled={disabled}
                onChange={(event) => updateLink(index, { title: event.target.value })}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  label="Destination"
                  value={item.mode}
                  options={MODE_OPTIONS}
                  disabled={disabled}
                  onChange={(event) =>
                    updateLink(index, {
                      mode: event.target.value,
                      ...(event.target.value === 'link' ? { url: '' } : { link: '' }),
                    })
                  }
                />
                {item.mode === 'link' ? (
                  <Select
                    label="Link"
                    value={item.link}
                    disabled={disabled || linkOptions.length === 0}
                    hint={linkOptions.length === 0 ? 'No links in this workspace yet' : undefined}
                    onChange={(event) => updateLink(index, { link: event.target.value })}
                  >
                    <option value="">Select a link…</option>
                    {linkOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    label="URL"
                    placeholder="https://example.com"
                    value={item.url}
                    disabled={disabled}
                    icon={Link2}
                    onChange={(event) => updateLink(index, { url: event.target.value })}
                  />
                )}
              </div>

              <Switch
                label="Visible"
                checked={item.enabled !== false}
                disabled={disabled}
                onChange={(value) => updateLink(index, { enabled: value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
