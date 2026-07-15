'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from '../../hooks/use-session.js';
import { getRooms, deleteRoom } from '../../features/rooms/services/room-service.js';

export default function RoomsContent() {
  const { loading: authLoading, isAuthenticated } = useSession();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
    }
  }, [isAuthenticated, fetchRooms]);

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await deleteRoom(id);
      setRooms((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (authLoading) {
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
        <p className="mt-2 text-gray-400">Please sign in to manage rooms.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Rooms</h1>
          <Link
            href="/rooms/create"
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
          >
            Create Room
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No rooms yet. Create one to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="p-4 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-between"
              >
                <div>
                  <Link
                    href={`/rooms/${room._id}`}
                    className="font-semibold hover:text-blue-400 transition"
                  >
                    {room.name}
                  </Link>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded-full font-mono">
                      {room.roomCode}
                    </span>
                    {room.description && (
                      <span className="text-xs text-gray-400 truncate max-w-[200px]">
                        {room.description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/rooms/${room._id}`}
                    className="text-xs py-1 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(room._id)}
                    className="text-xs py-1 px-3 bg-red-700 hover:bg-red-600 rounded-lg transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
