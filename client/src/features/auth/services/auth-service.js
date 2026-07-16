import { authClient } from '../../../lib/auth-client.js';
import { api } from '../../../lib/fetch.js';

export async function signUp(email, password, name) {
  const { data, error } = await authClient.signUp.email(
    { email, password, name },
    { callbackURL: '/dashboard' }
  );

  if (error) {
    throw new Error(error.message || 'Registration failed');
  }

  await api.post('/players/ensure-linked', {}).catch(() => {});

  return data;
}

export async function signIn(email, password) {
  const { data, error } = await authClient.signIn.email(
    { email, password },
    { callbackURL: '/dashboard' }
  );

  if (error) {
    throw new Error(error.message || 'Login failed');
  }

  await api.post('/players/ensure-linked', {}).catch(() => {});

  return data;
}

export async function signOut() {
  const { error } = await authClient.signOut();

  if (error) {
    throw new Error(error.message || 'Logout failed');
  }
}

export async function getSession() {
  const { data, error } = await authClient.getSession();

  if (error) {
    throw new Error(error.message || 'Session fetch failed');
  }

  return data;
}
