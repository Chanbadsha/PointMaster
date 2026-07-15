'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../../hooks/use-session.js';
import {
  getRoom,
  updateRoom,
  deleteRoom,
  getMembers,
  addMember,
  removeMember,
  updateMemberRole,
  leaveRoom,
} from '../../../features/rooms/services/room-service.js';
import { getMyPlayer, searchPlayers } from '../../../features/players/services/player-service.js';

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

  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');

  const [addPlayerQuery, setAddPlayerQuery] = useState('');
  const [playerResults, setPlayerResults] = useState([]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const [myPlayerId, setMyPlayerId] = useState(null);

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

  const fetchMembers = useCallback(async () => {
    try {
      const data = await getMembers(roomId);
      setMembers(data);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  }, [roomId]);

  useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    fetchMembers();
  }, [isAuthenticated, roomId, fetchMembers]);

  useEffect(() => {
    if (!user) return;
    async function findMyPlayer() {
      try {
        const player = await getMyPlayer();
        setMyPlayerId(player._id);
      } catch {
        // Player may not exist yet or not linked
      }
    }
    findMyPlayer();
  }, [user]);

  function isOwner() {
    return room && user && room.ownerId === user.id;
  }

  function isMember(playerId) {
    return members.some((m) => m.playerId === playerId);
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

  async function handleAddPlayer(playerId) {
    setAdding(true);
    setAddError('');
    try {
      await addMember(roomId, playerId);
      setAddPlayerQuery('');
      setPlayerResults([]);
      setShowAddPlayer(false);
      await fetchMembers();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(playerId) {
    if (!confirm('Remove this member from the room?')) return;
    try {
      await removeMember(roomId, playerId);
      await fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRoleChange(playerId, role) {
    try {
      await updateMemberRole(roomId, playerId, role);
      await fetchMembers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLeaveRoom() {
    if (!confirm('Leave this room?')) return;
    try {
      await leaveRoom(roomId);
      router.push('/rooms');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePlayerSearch(query) {
    setAddPlayerQuery(query);
    if (query.length < 2) {
      setPlayerResults([]);
      return;
    }
    try {
      const results = await searchPlayers(query);
      setPlayerResults(results.filter((p) => !isMember(p._id)));
    } catch {
      setPlayerResults([]);
    }
  }

  const filteredMembers = members.filter((m) => {
    if (!memberSearch) return true;
    return (
      m.player?.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.role?.toLowerCase().includes(memberSearch.toLowerCase())
    );
  });

  const myMembership = members.find((m) => m.playerId === myPlayerId);
  const isRoomMember = !!myMembership;

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
                <p className="font-medium">{members.length}</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-700 pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              Members ({members.length})
            </h2>
            <div className="flex items-center gap-2">
              {isRoomMember && !isOwner() && (
                <button
                  onClick={handleLeaveRoom}
                  className="py-1.5 px-3 bg-red-700 hover:bg-red-600 rounded-lg text-sm transition"
                >
                  Leave Room
                </button>
              )}
              {isOwner() && (
                <button
                  onClick={() => setShowAddPlayer(!showAddPlayer)}
                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition"
                >
                  {showAddPlayer ? 'Cancel' : 'Add Player'}
                </button>
              )}
            </div>
          </div>

          {showAddPlayer && isOwner() && (
            <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <label
                htmlFor="add-player"
                className="block text-sm font-medium mb-1"
              >
                Search Players
              </label>
              <input
                id="add-player"
                type="text"
                value={addPlayerQuery}
                onChange={(e) => handlePlayerSearch(e.target.value)}
                placeholder="Type at least 2 characters to search..."
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              />
              {addError && (
                <p className="text-red-400 text-sm mb-2">{addError}</p>
              )}
              {playerResults.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {playerResults.map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-2 bg-gray-700 rounded"
                    >
                      <span className="text-sm">{p.name}</span>
                      <button
                        onClick={() => handleAddPlayer(p._id)}
                        disabled={adding}
                        className="py-1 px-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded text-xs transition"
                      >
                        {adding ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : addPlayerQuery.length >= 2 && !adding ? (
                <p className="text-gray-500 text-sm">
                  No players found
                </p>
              ) : null}
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {filteredMembers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              {memberSearch
                ? 'No members match your search'
                : 'No members yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-900/50 rounded-full flex items-center justify-center text-sm font-bold">
                      {member.player?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {member.player?.name || 'Unknown Player'}
                        {member.playerId === myPlayerId && (
                          <span className="text-gray-500 ml-1">(you)</span>
                        )}
                      </p>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          member.role === 'Admin'
                            ? 'bg-yellow-900/50 text-yellow-400'
                            : member.role === 'Moderator'
                              ? 'bg-purple-900/50 text-purple-400'
                              : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwner() && member.playerId !== myPlayerId && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.playerId, e.target.value)
                          }
                          className="text-xs px-2 py-1 border border-gray-600 rounded bg-gray-900 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Player">Player</option>
                          <option value="Moderator">Moderator</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <button
                          onClick={() =>
                            handleRemoveMember(member.playerId)
                          }
                          className="py-1 px-2 bg-red-700 hover:bg-red-600 rounded text-xs transition"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
