import { ChevronsUpDown, Check, Building2 } from 'lucide-react';
import Dropdown, { DropdownItem } from './ui/Dropdown.jsx';
import { useWorkspace } from '../hooks/useWorkspace.js';

export default function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, selectWorkspace } = useWorkspace();

  if (!activeWorkspace) {
    return (
      <span className="text-sm text-ink-500">No workspace</span>
    );
  }

  return (
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
            {activeWorkspace.name}
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
      {workspaces.map((workspace) => (
        <DropdownItem
          key={workspace._id}
          icon={workspace._id === activeWorkspace._id ? Check : Building2}
          onClick={() => selectWorkspace(workspace._id)}
        >
          <span className="truncate">{workspace.name}</span>
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
