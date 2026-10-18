import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

const STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export function getDatabaseStatus() {
  const state = mongoose.connection.readyState;
  return {
    status: STATE_LABELS[state] || 'unknown',
    healthy: state === 1,
  };
}

export async function connectDatabase() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('error', (error) => {
    logger.error('[db] MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('[db] MongoDB disconnected');
  });

  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info('[db] MongoDB connected');
  } catch (error) {
    throw new Error(`Unable to connect to MongoDB at "${env.mongodbUri}": ${error.message}`);
  }
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
  logger.info('[db] MongoDB connection closed');
}
