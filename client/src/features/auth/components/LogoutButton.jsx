'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '../services/auth-service.js';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await signOut();
      router.push('/login');
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg font-medium transition"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}
