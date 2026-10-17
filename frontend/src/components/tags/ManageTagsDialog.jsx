import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Tag as TagIcon, Trash2, X } from 'lucide-react';
import Dialog from '../ui/Dialog.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Spinner from '../ui/Spinner.jsx';
import { createTag, deleteTag, updateTag } from '../../services/tag.service.js';
import { formatNumber } from '../../utils/format.js';

export default function ManageTagsDialog({ open, onClose, workspaceId, tags, loading, onChanged }) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNewName('');
      setEditingId(null);
      setConfirmId(null);
      setError('');
    }
  }, [open]);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;

    setCreating(true);
    setError('');
    try {
      await createTag({ workspaceId, name });
      setNewName('');
      await onChanged();
    } catch (err) {
      setError(err.message || 'Unable to create tag');
    } finally {
      setCreating(false);
    }
  }

  async function handleRename(tag) {
    const name = editValue.trim();
    if (!name || name === tag.name) {
      setEditingId(null);
      return;
    }

    setBusyId(tag.id);
    setError('');
    try {
      await updateTag(tag.id, { name });
      setEditingId(null);
      await onChanged();
    } catch (err) {
      setError(err.message || 'Unable to rename tag');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(tag) {
    setBusyId(tag.id);
    setError('');
    try {
      await deleteTag(tag.id);
      setConfirmId(null);
      await onChanged();
    } catch (err) {
      setError(err.message || 'Unable to delete tag');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="max-w-lg"
      title="Manage tags"
      description="Tags help you group and filter links and campaigns."
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-xl border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
            {error}
          </div>
        )}

        <div className="flex items-end gap-2">
          <Input
            label="New tag"
            placeholder="e.g. Newsletter"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleCreate();
              }
            }}
          />
          <Button icon={Plus} loading={creating} onClick={handleCreate} className="shrink-0">
            Add
          </Button>
        </div>

        <div className="max-h-[45vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner label="Loading tags..." />
            </div>
          ) : tags.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-500">
              No tags yet. Create your first tag above.
            </p>
          ) : (
            <ul className="divide-y divide-base-800">
              {tags.map((tag) => (
                <li key={tag.id} className="flex items-center justify-between gap-3 py-2.5">
                  {editingId === tag.id ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(event) => setEditValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') handleRename(tag);
                          if (event.key === 'Escape') setEditingId(null);
                        }}
                        className="h-9 flex-1 rounded-lg border border-base-600 bg-base-850 px-3 text-sm text-ink-100 focus:border-accent-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRename(tag)}
                        disabled={busyId === tag.id}
                        className="rounded-lg p-1.5 text-accent-400 hover:bg-base-800 disabled:opacity-50"
                        aria-label="Save tag name"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-base-800"
                        aria-label="Cancel rename"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex min-w-0 items-center gap-2">
                        <TagIcon className="h-4 w-4 shrink-0 text-accent-400" />
                        <span className="truncate text-sm text-ink-100">{tag.name}</span>
                        <span className="shrink-0 text-xs text-ink-500">
                          {formatNumber(tag.linkCount || 0)} link
                          {(tag.linkCount || 0) === 1 ? '' : 's'}
                        </span>
                      </div>

                      {confirmId === tag.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ink-400">Delete?</span>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={busyId === tag.id}
                            onClick={() => handleDelete(tag)}
                          >
                            Delete
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(tag.id);
                              setEditValue(tag.name);
                            }}
                            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-800 hover:text-ink-100"
                            aria-label={`Rename ${tag.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(tag.id)}
                            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-800 hover:text-danger-400"
                            aria-label={`Delete ${tag.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
}
