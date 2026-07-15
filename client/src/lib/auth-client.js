import { createAuthClient } from 'better-auth/client';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:5000';

export const authClient = createAuthClient({
  baseURL: `${AUTH_URL}/api/auth`,
});
