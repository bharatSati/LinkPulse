import http from 'http';
import app from './app.js';
import env, { getMissingEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import logger from './utils/logger.js';

let server;

async function start() {
  const missing = getMissingEnv();
  if (missing.length > 0) {
    logger.error('[startup] Missing required environment variables:');
    for (const key of missing) {
      logger.error(`  - ${key}`);
    }
    logger.error('[startup] Copy backend/.env.example to backend/.env and fill in the values.');
    process.exit(1);
  }

  await connectDatabase();

  server = http.createServer(app);

  server.listen(env.port, () => {
    logger.info(`[startup] LinkPulse API listening on ${env.backendUrl}`);
    logger.info(`[startup] Health check: ${env.backendUrl}/api/v1/health`);
    logger.info(`[startup] CORS origin: ${env.frontendUrl}`);
  });
}

async function shutdown(signal) {
  logger.info(`\n[shutdown] Received ${signal}. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          logger.error('[shutdown] Error closing HTTP server:', err.message);
        }
        resolve();
      });
    });
  }

  try {
    await disconnectDatabase();
  } catch (error) {
    logger.error('[shutdown] Error closing database connection:', error.message);
  }

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('[fatal] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (error) => {
  logger.error('[fatal] Uncaught exception:', error);
  shutdown('uncaughtException');
});

start().catch((error) => {
  logger.error('[startup] Failed to start LinkPulse API:', error.message);
  logger.error('[startup] Verify your MONGODB_URI and that MongoDB is running and reachable.');
  process.exit(1);
});
