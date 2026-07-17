'use client';

import { useState } from 'react';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

export default function RoundForm({ game, teams, roundNumber, editingRound, onSave, onCancel }) {
  if (game === 'call-bridge') {
    return (
      <CallBridgeForm
        teams={teams}
        roundNumber={roundNumber}
        editingRound={editingRound}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  return (
    <TwentyNineForm
      teams={teams}
      roundNumber={roundNumber}
      editingRound={editingRound}
      onSave={onSave}
      onCancel={onCancel}
    />
  );
}

function TwentyNineForm({ teams, roundNumber, editingRound, onSave, onCancel }) {
  const [roundNum, setRoundNum] = useState(editingRound?.roundNumber || roundNumber || 1);
  const [bid, setBid] = useState(editingRound?.bid || 1);
  const [bidTeamId, setBidTeamId] = useState(editingRound?.bidTeamId?.toString() || '');
  const [trumpSuit, setTrumpSuit] = useState(editingRound?.trumpSuit || 'hearts');
  const [team0Tricks, setTeam0Tricks] = useState(
    editingRound ? Object.values(editingRound.trickPoints || {})[0] || 0 : 0
  );
  const [team1Tricks, setTeam1Tricks] = useState(
    editingRound ? Object.values(editingRound.trickPoints || {})[1] || 0 : 0
  );
  const [error, setError] = useState('');

  const sortedTeams = [...(teams || [])].sort((a, b) =>
    a._id.toString().localeCompare(b._id.toString())
  );

  function handleTeam0Change(val) {
    const v = parseInt(val) || 0;
    const clamped = Math.max(0, Math.min(29, v));
    setTeam0Tricks(clamped);
    setTeam1Tricks(29 - clamped);
  }

  function handleTeam1Change(val) {
    const v = parseInt(val) || 0;
    const clamped = Math.max(0, Math.min(29, v));
    setTeam1Tricks(clamped);
    setTeam0Tricks(29 - clamped);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!bidTeamId) {
      setError('Please select the bidding team');
      return;
    }

    if (team0Tricks + team1Tricks !== 29) {
      setError('Trick points must sum to 29');
      return;
    }

    if (!editingRound) {
      const teamIdStr = sortedTeams[0]._id.toString();
      const team1IdStr = sortedTeams[1]._id.toString();

      onSave({
        roundNumber: parseInt(roundNum),
        bid: parseInt(bid),
        bidTeamId,
        trumpSuit,
        trickPoints: {
          [teamIdStr]: team0Tricks,
          [team1IdStr]: team1Tricks,
        },
      });
    } else {
      onSave({
        trickPoints: {
          team0: team0Tricks,
          team1: team1Tricks,
        },
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-900 rounded-lg border border-gray-600">
      <h3 className="text-sm font-semibold mb-3">
        {editingRound ? 'Edit Round' : 'Add Round'}
      </h3>

      {!editingRound && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Round Number</label>
            <input
              type="number"
              value={roundNum}
              onChange={(e) => setRoundNum(e.target.value)}
              min="1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Bid</label>
            <input
              type="number"
              value={bid}
              onChange={(e) => setBid(e.target.value)}
              min="1"
              max="29"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Bidding Team</label>
            <select
              value={bidTeamId}
              onChange={(e) => setBidTeamId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select team</option>
              {sortedTeams.map((t) => (
                <option key={t._id} value={t._id.toString()}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Trump Suit</label>
            <select
              value={trumpSuit}
              onChange={(e) => setTrumpSuit(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            >
              {SUITS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {editingRound && (
        <p className="text-xs text-gray-400 mb-2">
          Editing Round {editingRound.roundNumber} — update trick points
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            {sortedTeams[0]?.name || 'Team 1'} Tricks
          </label>
          <input
            type="number"
            value={team0Tricks}
            onChange={(e) => handleTeam0Change(e.target.value)}
            min="0"
            max="29"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            {sortedTeams[1]?.name || 'Team 2'} Tricks
          </label>
          <input
            type="number"
            value={team1Tricks}
            onChange={(e) => handleTeam1Change(e.target.value)}
            min="0"
            max="29"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">Total: {team0Tricks + team1Tricks} / 29</p>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="py-1.5 px-3 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition"
        >
          {editingRound ? 'Save Changes' : 'Record Round'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="py-1.5 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function CallBridgeForm({ teams, roundNumber, editingRound, onSave, onCancel }) {
  const players = teams.length > 0 ? (teams[0].players || []) : [];

  const [roundNum, setRoundNum] = useState(editingRound?.roundNumber || roundNumber || 1);
  const [bids, setBids] = useState(editingRound?.bids || [1, 1, 1, 1]);
  const [tricks, setTricks] = useState(editingRound?.tricks || [0, 0, 0, 0]);
  const [error, setError] = useState('');

  function updateBid(index, value) {
    const v = parseInt(value) || 1;
    const clamped = Math.max(1, Math.min(13, v));
    const newBids = [...bids];
    newBids[index] = clamped;
    setBids(newBids);
  }

  function updateTrick(index, value) {
    const v = parseInt(value) || 0;
    const clamped = Math.max(0, Math.min(13, v));
    const newTricks = [...tricks];
    newTricks[index] = clamped;
    setTricks(newTricks);
  }

  const totalTricks = tricks.reduce((sum, t) => sum + t, 0);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (totalTricks !== 13) {
      setError('Total tricks must sum to 13');
      return;
    }

    if (!editingRound) {
      onSave({
        roundNumber: parseInt(roundNum),
        bids,
        tricks,
      });
    } else {
      onSave({ tricks });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-900 rounded-lg border border-gray-600">
      <h3 className="text-sm font-semibold mb-3">
        {editingRound ? 'Edit Round' : 'Add Round'}
      </h3>

      {!editingRound && (
        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">Round Number</label>
          <input
            type="number"
            value={roundNum}
            onChange={(e) => setRoundNum(e.target.value)}
            min="1"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {editingRound && (
        <p className="text-xs text-gray-400 mb-2">
          Editing Round {editingRound.roundNumber} — update tricks
        </p>
      )}

      <table className="w-full text-sm mb-3">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-1 px-2 text-gray-400">Player</th>
            <th className="text-center py-1 px-2 text-gray-400">Bid</th>
            <th className="text-center py-1 px-2 text-gray-400">Tricks</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, i) => (
            <tr key={player._id} className="border-b border-gray-700/50">
              <td className="py-2 px-2 text-white">{player.name}</td>
              <td className="py-2 px-2">
                <input
                  type="number"
                  value={editingRound ? editingRound.bids?.[i] || 1 : bids[i]}
                  onChange={(e) => updateBid(i, e.target.value)}
                  min="1"
                  max="13"
                  disabled={!!editingRound}
                  className="w-16 text-center px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </td>
              <td className="py-2 px-2">
                <input
                  type="number"
                  value={tricks[i]}
                  onChange={(e) => updateTrick(i, e.target.value)}
                  min="0"
                  max="13"
                  className="w-16 text-center px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-gray-500 mb-3">Total tricks: {totalTricks} / 13</p>

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="py-1.5 px-3 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition"
        >
          {editingRound ? 'Save Changes' : 'Record Round'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="py-1.5 px-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
