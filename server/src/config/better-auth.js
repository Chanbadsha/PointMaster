import { betterAuth } from 'better-auth';
import env from './env.js';

export const auth = betterAuth({
  baseURL: env.betterAuthUrl,
  secret: env.betterAuthSecret,
  emailAndPassword: {
    enabled: true,
  },
});
