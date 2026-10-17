import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import workspaceRoutes from './workspace.routes.js';
import linkRoutes from './link.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/links', linkRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
