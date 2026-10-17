import { successResponse } from '../utils/ApiResponse.js';
import { getDatabaseStatus } from '../config/db.js';

export function health(req, res) {
  const database = getDatabaseStatus();

  return successResponse(res, {
    message: 'LinkPulse API is healthy',
    data: {
      application: {
        name: 'LinkPulse API',
        status: 'ok',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: Math.round(process.uptime()),
      },
      database,
      timestamp: new Date().toISOString(),
    },
  });
}
