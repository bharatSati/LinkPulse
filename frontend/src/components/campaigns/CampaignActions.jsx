import { ArrowUpRight, MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import Dropdown, { DropdownItem, DropdownDivider } from '../ui/Dropdown.jsx';

export default function CampaignActions({
  campaign,
  onOpen,
  onEdit,
  onToggleStatus,
  onDelete,
  busy = false,
}) {
  const archived = campaign.status === 'archived';

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          disabled={busy}
          className="rounded-lg p-1.5 text-ink-400 transition hover:bg-base-800 hover:text-ink-100 disabled:opacity-50"
          aria-label="Campaign actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      }
    >
      <DropdownItem icon={ArrowUpRight} onClick={() => onOpen(campaign)}>
        Open details
      </DropdownItem>
      <DropdownItem icon={Pencil} onClick={() => onEdit(campaign)}>
        Edit
      </DropdownItem>
      <DropdownItem icon={Power} onClick={() => onToggleStatus(campaign)}>
        {archived ? 'Reactivate' : 'Archive'}
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem icon={Trash2} danger onClick={() => onDelete(campaign)}>
        Delete
      </DropdownItem>
    </Dropdown>
  );
}
