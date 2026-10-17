import { Router } from 'express';
import * as linkController from '../controllers/link.controller.js';
import * as qrController from '../controllers/qr.controller.js';
import * as importController from '../controllers/import.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loadWorkspace, requireWorkspaceRole } from '../middleware/workspace.middleware.js';
import { loadLinkAccess } from '../middleware/link.middleware.js';
import { loadImportAccess } from '../middleware/import.middleware.js';
import { uploadCsv } from '../middleware/upload.middleware.js';
import { importLimiter, linkCreateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  loadWorkspace,
  requireWorkspaceRole('editor'),
  linkCreateLimiter,
  linkController.create
);

router.get('/', loadWorkspace, requireWorkspaceRole('viewer'), linkController.list);

router.get(
  '/import/template',
  loadWorkspace,
  requireWorkspaceRole('viewer'),
  importController.template
);

router.post(
  '/import',
  loadWorkspace,
  requireWorkspaceRole('editor'),
  importLimiter,
  uploadCsv,
  importController.importLinks
);

router.get(
  '/import/:importId',
  loadImportAccess,
  requireWorkspaceRole('viewer'),
  importController.getImport
);

router.get('/:id', loadLinkAccess, requireWorkspaceRole('viewer'), linkController.getOne);

router.get('/:id/qr', loadLinkAccess, requireWorkspaceRole('viewer'), qrController.getQr);

router.post('/:id/qr', loadLinkAccess, requireWorkspaceRole('editor'), qrController.generateQr);

router.patch('/:id', loadLinkAccess, requireWorkspaceRole('editor'), linkController.update);

router.delete('/:id', loadLinkAccess, requireWorkspaceRole('editor'), linkController.remove);

export default router;
