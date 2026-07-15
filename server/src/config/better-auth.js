import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import env from './env.js';
import { getDb } from '../database/index.js';

let auth = null;

export function initializeAuth() {
  const db = getDb();

  auth = betterAuth({
    baseURL: `${env.betterAuthUrl}/api/auth`,
    secret: env.betterAuthSecret,
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: [env.clientUrl],
    database: mongodbAdapter(db),
  });

  return auth;
}

export function getAuth() {
  if (!auth) {
    throw new Error('Auth not initialized. Call initializeAuth() first.');
  }
  return auth;
}
