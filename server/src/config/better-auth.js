import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { ObjectId } from 'mongodb';
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
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const existingPlayer = await db
              .collection('players')
              .findOne({ linkedUserId: new ObjectId(user.id) });
            if (!existingPlayer) {
              await db.collection('players').insertOne({
                name: user.name,
                isGuest: false,
                createdBy: new ObjectId(user.id),
                linkedUserId: new ObjectId(user.id),
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          },
        },
      },
    },
  });

  return auth;
}

export function getAuth() {
  if (!auth) {
    throw new Error('Auth not initialized. Call initializeAuth() first.');
  }
  return auth;
}
