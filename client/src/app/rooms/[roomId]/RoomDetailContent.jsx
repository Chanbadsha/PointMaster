'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../../hooks/use-session.js';
import {
  getRoom,
  updateRoom,
  deleteRoom,
} from '../../../features/rooms/services/room-service.js';

export default function RoomDetailContent({ roomId }) {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useSession();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    async function fetchRoom() {
      setLoading(true);
      setError('');
      try {
        const data = await getRoom(roomId);
        setRoom(data);
        setFormData({
          name: data.name,
          description: data.description || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRoom();
  }, [isAuthenticated, roomId]);

  function isOwner() {
    return room && user && room.ownerId === user.id;
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const updated = await updateRoom(roomId, formData);
      setRoom(updated);
      setEditing(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this room?')) return;

    try {
      await deleteRoom(roomId);
      router.push('/rooms');
    } catch (err) {
      setError(err.message);
    }
  }

  if (authLoading || loading) {
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
        <p className="mt-2 text-gray-400">Please sign in to view rooms.</p>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
          <button
            onClick={() => router.push('/rooms')}
            className="mt-4 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/rooms')}
          className="mb-4 text-sm text-gray-400 hover:text-white transition"
        >
          &larr; Back to Rooms
        </button>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4 mb-6">
            <div>
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium mb-1"
              >
                Room Name
              </label>
              <input
                id="edit-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                minLength={2}
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium mb-1"
              >
                Description
              </label>
              <textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {formError && (
              <p className="text-red-400 text-sm">{formError}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    name: room.name,
                    description: room.description || '',
                  });
                }}
                className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{room.name}</h1>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-400 rounded-full font-mono">
                    {room.roomCode}
                  </span>
                </div>
              </div>

              {isOwner() && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="py-2 px-4 bg-red-700 hover:bg-red-600 rounded-lg font-medium transition text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {room.description && (
              <p className="mt-4 text-gray-300">{room.description}</p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Status</span>
                <p className="font-medium">Active</p>
              </div>
              <div>
                <span className="text-gray-400">Room Code</span>
                <p className="font-medium font-mono">{room.roomCode}</p>
              </div>
              <div>
                <span className="text-gray-400">Created</span>
                <p className="font-medium">
                  {new Date(room.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Members</span>
                <p className="font-medium">0</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
