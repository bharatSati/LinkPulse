import { useEffect, useRef, useState } from 'react';
import { Loader2, Plus, Tag as TagIcon, X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function TagInput({
  label,
  value = [],
  tags = [],
  onChange,
  onCreate,
  error,
  hint,
  disabled = false,
  placeholder = 'Add a tag and press Enter',
}) {
  const containerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    function onDocumentClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  const selectedIds = new Set(value.map(String));
  const selectedTags = value
    .map((id) => tags.find((tag) => tag.id === String(id)))
    .filter(Boolean);

  const term = query.trim();
  const lower = term.toLowerCase();
  const suggestions = tags.filter(
    (tag) => !selectedIds.has(tag.id) && (!term || tag.name.toLowerCase().includes(lower))
  );
  const exact = tags.find((tag) => tag.name.toLowerCase() === lower);
  const canCreate = Boolean(term) && !exact;

  function addTag(id) {
    const normalized = String(id);
    if (!selectedIds.has(normalized)) onChange([...value, normalized]);
    setQuery('');
    setOpen(false);
    setLocalError('');
  }

  function removeTag(id) {
    onChange(value.filter((item) => String(item) !== String(id)));
  }

  async function commit() {
    if (!term) return;
    if (exact) {
      addTag(exact.id);
      return;
    }
    if (!onCreate) return;

    setCreating(true);
    setLocalError('');
    try {
      const tag = await onCreate(term);
      if (tag) addTag(tag.id);
    } catch (err) {
      setLocalError(err.message || 'Unable to create tag');
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Backspace' && query === '' && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="w-full" ref={containerRef}>
      {label && <label className="field-label">{label}</label>}

      <div className="relative">
        <div
          className={cn(
            'flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border bg-base-850 px-2 py-1.5 transition',
            error ? 'border-danger-500/60' : 'border-base-600 focus-within:border-accent-600'
          )}
        >
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-none border border-base-600 bg-base-800 px-2 py-0.5 text-xs text-ink-200"
            >
              <TagIcon className="h-3 w-3 text-accent-400" />
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag.id)}
                  className="text-ink-500 transition hover:text-danger-400"
                  aria-label={`Remove ${tag.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}

          <input
            value={query}
            disabled={disabled}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : ''}
            className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none disabled:cursor-not-allowed"
          />
          {creating && <Loader2 className="mr-1 h-4 w-4 animate-spin text-ink-400" />}
        </div>

        {open && !disabled && (suggestions.length > 0 || canCreate) && (
          <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-base-700 bg-base-850 p-1 shadow-panel">
            {suggestions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => addTag(tag.id)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-200 transition hover:bg-base-800"
              >
                <TagIcon className="h-3.5 w-3.5 text-ink-500" />
                {tag.name}
              </button>
            ))}
            {canCreate && (
              <button
                type="button"
                onClick={commit}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-accent-300 transition hover:bg-base-800"
              >
                <Plus className="h-3.5 w-3.5" />
                Create &ldquo;{term}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-danger-400">{error}</p>
      ) : localError ? (
        <p className="mt-1.5 text-xs text-danger-400">{localError}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      )}
    </div>
  );
}
