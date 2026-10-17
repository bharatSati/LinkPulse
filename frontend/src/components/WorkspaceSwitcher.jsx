import { useState } from 'react';
import { ChevronsUpDown, Check, Building2, Plus } from 'lucide-react';
import Dropdown, { DropdownItem, DropdownDivider } from './ui/Dropdown.jsx';
import Dialog from './ui/Dialog.jsx';
import Button from './ui/Button.jsx';
import Input from './ui/Input.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { useToast } from '../hooks/useToast.js';
import { createWorkspace } from '../services/workspace.service.js';

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, selectWorkspace, refresh } = useWorkspace();
  const { toast } = useToast();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate(event) {
    event?.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const workspace = await createWorkspace({ name: name.trim() });
      await refresh();
      selectWorkspace(workspace._id);
      toast.success('Workspace created');
      setCreating(false);
      setName('');
    } catch (error) {
      toast.error(error.message || 'Unable to create workspace');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dropdown
        align="left"
        trigger={
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-base-700 bg-base-850 px-3 py-2 transition hover:border-base-600"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-500/15 text-accent-400">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            <span className="max-w-[10rem] truncate text-sm text-ink-200">
              {activeWorkspace?.name || 'No workspace'}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-ink-500" />
          </button>
        }
      >
        <div className="px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            Workspaces
          </p>
        </div>
        {workspaces.length === 0 && (
          <p className="px-3 py-2 text-xs text-ink-500">No workspaces yet</p>
        )}
        {workspaces.map((workspace) => (
          <DropdownItem
            key={workspace._id}
            icon={workspace._id === activeWorkspace?._id ? Check : Building2}
            onClick={() => selectWorkspace(workspace._id)}
          >
            <span className="truncate">{workspace.name}</span>
          </DropdownItem>
        ))}
        <DropdownDivider />
        <DropdownItem icon={Plus} onClick={() => setCreating(true)}>
          New workspace
        </DropdownItem>
      </Dropdown>

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="Create workspace"
        description="Workspaces keep links, campaigns, and analytics separate."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              icon={Plus}
              loading={saving}
              disabled={!name.trim()}
              onClick={handleCreate}
            >
              Create
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <Input
            label="Workspace name"
            placeholder="Acme Marketing"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </form>
      </Dialog>
    </>
  );
}
