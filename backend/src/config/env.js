import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port: Number.parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  ipHashSalt: process.env.IP_HASH_SALT || process.env.JWT_SECRET,
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  importMaxFileMb: Number.parseInt(process.env.IMPORT_MAX_FILE_MB, 10) || 2,
  importMaxRows: Number.parseInt(process.env.IMPORT_MAX_ROWS, 10) || 1000,
};

export function getMissingEnv() {
  return required.filter((key) => !process.env[key]);
}

export default env;
