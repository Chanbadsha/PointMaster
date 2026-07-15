'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '../../hooks/use-session.js';
import {
  getPlayers,
  searchPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  linkPlayer,
  unlinkPlayer,
} from '../../features/players/services/player-service.js';

export default function PlayersContent() {
  const { user, loading: authLoading, isAuthenticated } = useSession();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({ name: '', isGuest: false });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPlayers = useCallback(async (query) => {
    setLoading(true);
    setError('');
    try {
      const data = query ? await searchPlayers(query) : await getPlayers();
      setPlayers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlayers('');
    }
  }, [isAuthenticated, fetchPlayers]);

  function resetForm() {
    setFormData({ name: '', isGuest: false });
    setFormError('');
    setEditingPlayer(null);
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      if (editingPlayer) {
        const updated = await updatePlayer(editingPlayer._id, formData);
        setPlayers((prev) =>
          prev.map((p) => (p._id === updated._id ? updated : p))
        );
      } else {
        const created = await createPlayer(formData);
        setPlayers((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(player) {
    setEditingPlayer(player);
    setFormData({ name: player.name, isGuest: player.isGuest });
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this player?')) return;

    try {
      await deletePlayer(id);
      setPlayers((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLink(playerId) {
    try {
      const updated = await linkPlayer(playerId);
      setPlayers((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUnlink(playerId) {
    try {
      const updated = await unlinkPlayer(playerId);
      setPlayers((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = e.target.q.value.trim();
    setSearchQuery(q);
    fetchPlayers(q || '');
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
        <p className="mt-2 text-gray-400">Please sign in to manage players.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Players</h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
          >
            Add Player
          </button>
        </div>

        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search players..."
            className="flex-1 px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
          >
            Search
          </button>
        </form>

        {showForm && (
          <div className="mb-6 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">
              {editingPlayer ? 'Edit Player' : 'Create Player'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  minLength={2}
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Player name"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isGuest"
                  type="checkbox"
                  checked={formData.isGuest}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isGuest: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-600 bg-gray-900"
                />
                <label htmlFor="isGuest" className="text-sm font-medium">
                  Guest Player
                </label>
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
                  {saving
                    ? 'Saving...'
                    : editingPlayer
                      ? 'Update'
                      : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading players...</p>
        ) : players.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            {searchQuery
              ? 'No players match your search.'
              : 'No players yet. Create one to get started.'}
          </p>
        ) : (
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player._id}
                className="p-4 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold">{player.name}</h3>
                  <div className="flex gap-2 mt-1">
                    {player.isGuest && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-900/50 text-yellow-400 rounded-full">
                        Guest
                      </span>
                    )}
                    {player.linkedUserId && (
                      <span className="text-xs px-2 py-0.5 bg-green-900/50 text-green-400 rounded-full">
                        Linked
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {player.linkedUserId ? (
                    player.linkedUserId === user?.id && (
                      <button
                        onClick={() => handleUnlink(player._id)}
                        className="text-xs py-1 px-3 bg-yellow-700 hover:bg-yellow-600 rounded-lg transition"
                        title="Unlink from your account"
                      >
                        Unlink
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleLink(player._id)}
                      className="text-xs py-1 px-3 bg-green-700 hover:bg-green-600 rounded-lg transition"
                      title="Link to your account"
                    >
                      Link
                    </button>
                  )}

                  <button
                    onClick={() => handleEdit(player)}
                    className="text-xs py-1 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(player._id)}
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
