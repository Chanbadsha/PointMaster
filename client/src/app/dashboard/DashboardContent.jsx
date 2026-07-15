'use client';

import { useSession } from '../../hooks/use-session.js';
import LogoutButton from '../../features/auth/components/LogoutButton.jsx';

export default function DashboardContent() {
  const { user, loading, isAuthenticated } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-gray-400">
          Please sign in to access the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <LogoutButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold mb-2">Welcome</h2>
          <p className="text-gray-400">{user?.name || 'Player'}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>

        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold mb-2">Rooms</h2>
          <p className="text-gray-400 text-sm">No rooms yet</p>
        </div>

        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold mb-2">Recent Matches</h2>
          <p className="text-gray-400 text-sm">No matches yet</p>
        </div>
      </div>
    </div>
  );
}
