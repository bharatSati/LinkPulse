import { MoreHorizontal, Pencil, Power, Copy, Trash2, BarChart3 } from 'lucide-react';
import Dropdown, { DropdownItem, DropdownDivider } from '../ui/Dropdown.jsx';

export default function LinkActions({
  link,
  onEdit,
  onToggle,
  onDelete,
  onCopy,
  onViewAnalytics,
  busy = false,
}) {
  const disabled = link.status === 'disabled';

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          disabled={busy}
          className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-800 hover:text-ink-100 disabled:opacity-50"
          aria-label="Link actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      }
    >
      <DropdownItem icon={Pencil} onClick={() => onEdit(link)}>
        Edit
      </DropdownItem>
      {onViewAnalytics && (
        <DropdownItem icon={BarChart3} onClick={() => onViewAnalytics(link)}>
          View analytics
        </DropdownItem>
      )}
      <DropdownItem icon={Copy} onClick={() => onCopy(link)}>
        Copy short link
      </DropdownItem>
      <DropdownItem icon={Power} onClick={() => onToggle(link)}>
        {disabled ? 'Enable' : 'Disable'}
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem icon={Trash2} danger onClick={() => onDelete(link)}>
        Delete
      </DropdownItem>
    </Dropdown>
  );
}
