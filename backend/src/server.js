import http from 'http';
import app from './app.js';
import env, { getMissingEnv } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';

let server;

async function start() {
  const missing = getMissingEnv();
  if (missing.length > 0) {
    console.error('[startup] Missing required environment variables:');
    for (const key of missing) {
      console.error(`  - ${key}`);
    }
    console.error('[startup] Copy backend/.env.example to backend/.env and fill in the values.');
    process.exit(1);
  }

  await connectDatabase();

  server = http.createServer(app);

  server.listen(env.port, () => {
    console.log(`[startup] LinkPulse API listening on ${env.backendUrl}`);
    console.log(`[startup] Health check: ${env.backendUrl}/api/v1/health`);
    console.log(`[startup] CORS origin: ${env.frontendUrl}`);
  });
}

async function shutdown(signal) {
  console.log(`\n[shutdown] Received ${signal}. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error('[shutdown] Error closing HTTP server:', err.message);
        }
        resolve();
      });
    });
  }

  try {
    await disconnectDatabase();
  } catch (error) {
    console.error('[shutdown] Error closing database connection:', error.message);
  }

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('[fatal] Uncaught exception:', error);
  shutdown('uncaughtException');
});

start().catch((error) => {
  console.error('[startup] Failed to start LinkPulse API:', error.message);
  console.error('[startup] Verify your MONGODB_URI and that MongoDB is running and reachable.');
  process.exit(1);
});
