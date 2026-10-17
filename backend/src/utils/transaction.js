import mongoose from 'mongoose';

const UNSUPPORTED_PATTERN =
  /Transaction numbers are only allowed|replica set|does not support transactions|IllegalOperation/i;

export function isTransactionUnsupportedError(error) {
  return Boolean(error && UNSUPPORTED_PATTERN.test(error.message || ''));
}

export async function runInTransaction(work) {
  let session;

  try {
    session = await mongoose.startSession();
  } catch {
    return work(null);
  }

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (isTransactionUnsupportedError(error)) {
      return work(null);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
