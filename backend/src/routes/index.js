import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import workspaceRoutes from './workspace.routes.js';
import linkRoutes from './link.routes.js';
import analyticsRoutes from './analytics.routes.js';
import campaignRoutes from './campaign.routes.js';
import tagRoutes from './tag.routes.js';
import bioPageRoutes from './bioPage.routes.js';
import publicBioRoutes from './publicBio.routes.js';
import aiRoutes from './ai.routes.js';
import invitationRoutes from './invitation.routes.js';
import notificationRoutes from './notification.routes.js';
import abuseRoutes from './abuse.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/links', linkRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/tags', tagRoutes);
router.use('/bio-pages', bioPageRoutes);
router.use('/public', publicBioRoutes);
router.use('/ai', aiRoutes);
router.use('/invitations', invitationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/abuse', abuseRoutes);

export default router;
