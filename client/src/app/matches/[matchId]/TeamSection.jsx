'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  validateTeams,
} from '../../../features/teams/services/team-service.js';
import { getMembers as getRoomMembers } from '../../../features/rooms/services/room-service.js';
import { MATCH_STATUS } from '../../../constants/index.js';

export default function TeamSection({ matchId, roomId, matchStatus, onError }) {
  const [teams, setTeams] = useState([]);
  const [roomMembers, setRoomMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validationResult, setValidationResult] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPlayerIds, setFormPlayerIds] = useState([]);
  const [formError, setFormError] = useState('');

  const canManage = matchStatus === MATCH_STATUS.PENDING || matchStatus === MATCH_STATUS.PREPARING;

  const fetchTeams = useCallback(async () => {
    try {
      const data = await getTeams(matchId);
      setTeams(data);
    } catch (err) {
      onError?.(err.message);
    }
  }, [matchId, onError]);

  const fetchMembers = useCallback(async () => {
    if (!roomId) return;
    try {
      const members = await getRoomMembers(roomId);
      setRoomMembers(members);
    } catch {
    }
  }, [roomId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await fetchTeams();
      if (canManage) {
        await fetchMembers();
      }
      setLoading(false);
    }
    load();
  }, [matchId, canManage, fetchTeams, fetchMembers]);

  function resetForm() {
    setShowForm(false);
    setEditingTeam(null);
    setFormName('');
    setFormPlayerIds([]);
    setFormError('');
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(team) {
    setEditingTeam(team);
    setFormName(team.name);
    setFormPlayerIds(team.playerIds?.map((p) => p._id || p) || []);
    setShowForm(true);
    setFormError('');
  }

  function togglePlayer(playerId) {
    setFormPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Team name is required');
      return;
    }

    if (formPlayerIds.length === 0) {
      setFormError('At least one player must be assigned');
      return;
    }

    try {
      if (editingTeam) {
        const updated = await updateTeam(matchId, editingTeam._id, {
          name: formName.trim(),
          playerIds: formPlayerIds,
        });
        setTeams((prev) =>
          prev.map((t) => (t._id === updated._id ? updated : t))
        );
      } else {
        const created = await createTeam(matchId, {
          name: formName.trim(),
          playerIds: formPlayerIds,
        });
        setTeams((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDelete(teamId) {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await deleteTeam(matchId, teamId);
      setTeams((prev) => prev.filter((t) => t._id !== teamId));
    } catch (err) {
      onError?.(err.message);
    }
  }

  async function handleValidate() {
    try {
      const result = await validateTeams(matchId);
      setValidationResult(result);
    } catch (err) {
      setValidationResult({ valid: false, errors: [err.message] });
    }
  }

  const availablePlayers = roomMembers.filter((m) => {
    if (editingTeam) {
      const assignedToOther = teams
        .filter((t) => t._id !== editingTeam._id)
        .flatMap((t) => t.playerIds?.map((p) => p._id || p) || []);
      return !assignedToOther.includes(m.playerId.toString());
    }
    const assignedIds = teams.flatMap(
      (t) => t.playerIds?.map((p) => p._id || p) || []
    );
    return !assignedIds.includes(m.playerId.toString());
  });

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <p className="text-gray-400 text-sm">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Teams</h2>
        <div className="flex items-center gap-2">
          {teams.length > 0 && (
            <button
              onClick={handleValidate}
              className="py-1.5 px-3 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium transition"
            >
              Validate
            </button>
          )}
          {canManage && (
            <button
              onClick={openCreateForm}
              className="py-1.5 px-3 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition"
            >
              Add Team
            </button>
          )}
        </div>
      </div>

      {validationResult && (
        <div
          className={`mb-4 p-3 rounded-lg border text-sm ${
            validationResult.valid
              ? 'bg-green-900/50 border-green-700 text-green-400'
              : 'bg-red-900/50 border-red-700 text-red-400'
          }`}
        >
          {validationResult.valid
            ? 'All teams are valid'
            : validationResult.errors.join(', ')}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-600">
          <h3 className="text-sm font-semibold mb-3">
            {editingTeam ? 'Edit Team' : 'Create Team'}
          </h3>

          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">Team Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              placeholder="Team A"
              maxLength={50}
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">Assign Players</label>
            {availablePlayers.length === 0 && roomMembers.length > 0 ? (
              <p className="text-xs text-gray-500">All available players are assigned</p>
            ) : roomMembers.length === 0 ? (
              <p className="text-xs text-gray-500">No members in this room</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {availablePlayers.map((m) => {
                  const pid = m.playerId.toString();
                  const isSelected = formPlayerIds.includes(pid);
                  return (
                    <label
                      key={pid}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePlayer(pid)}
                        className="accent-purple-600"
                      />
                      {m.player?.name || 'Unknown Player'}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {formError && (
            <p className="text-red-400 text-xs mb-3">{formError}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="py-1.5 px-3 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition"
            >
              {editingTeam ? 'Save' : 'Create'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="py-1.5 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {teams.length === 0 ? (
        <p className="text-gray-500 text-sm">No teams configured yet.</p>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <div
              key={team._id}
              className="p-3 bg-gray-900 rounded-lg border border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{team.name}</h3>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(team)}
                      className="py-1 px-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(team._id)}
                      className="py-1 px-2 bg-red-800 hover:bg-red-700 rounded text-xs transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {team.players?.length > 0
                  ? team.players.map((p) => (
                      <span
                        key={p._id}
                        className="text-xs px-2 py-0.5 bg-gray-700 rounded-full"
                      >
                        {p.name}
                      </span>
                    ))
                  : team.playerIds?.map((pid) => (
                      <span
                        key={pid._id || pid}
                        className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-400"
                      >
                        Player
                      </span>
                    ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
