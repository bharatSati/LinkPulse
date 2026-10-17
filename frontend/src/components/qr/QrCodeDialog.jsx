import Dialog from '../ui/Dialog.jsx';
import QrPanel from './QrPanel.jsx';

export default function QrCodeDialog({ open, link, canEdit, onClose, onSaved }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="max-w-3xl"
      title="QR code"
      description="Customize, preview, and download a QR code that points to this short link."
    >
      {link && <QrPanel link={link} canEdit={canEdit} onSaved={onSaved} />}
    </Dialog>
  );
}
