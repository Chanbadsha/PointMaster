'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '../../../hooks/use-session.js';
import {
  getMatch,
  deleteMatch,
  startMatch,
  pauseMatch,
  resumeMatch,
  finishMatch,
} from '../../../features/matches/services/match-service.js';
import {
  getRounds,
  getScores,
  createRound,
  updateRound,
  undoRound,
} from '../../../features/scores/services/score-service.js';
import { getTeams } from '../../../features/teams/services/team-service.js';
import { MATCH_STATUS } from '../../../constants/index.js';
import TeamSection from './TeamSection.jsx';
import Scoreboard from '../../../features/scores/components/Scoreboard.jsx';
import RoundForm from '../../../features/scores/components/RoundForm.jsx';

export default function MatchDetailContent({ matchId }) {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useSession();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rounds, setRounds] = useState([]);
  const [scores, setScores] = useState(null);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [teams, setTeams] = useState([]);

  const [showRoundForm, setShowRoundForm] = useState(false);
  const [editingRound, setEditingRound] = useState(null);
  const [roundFormError, setRoundFormError] = useState('');

  const canManageScore =
    match?.status === MATCH_STATUS.LIVE || match?.status === MATCH_STATUS.PAUSED;

  const fetchMatchData = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    setError('');
    try {
      const matchData = await getMatch(matchId);
      setMatch(matchData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  const fetchScores = useCallback(async () => {
    if (!matchId) return;
    setScoresLoading(true);
    try {
      const [roundsData, scoresData, teamsData] = await Promise.all([
        getRounds(matchId),
        getScores(matchId),
        getTeams(matchId),
      ]);
      setRounds(roundsData);
      setScores(scoresData);
      setTeams(teamsData);
    } catch {
    } finally {
      setScoresLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (!isAuthenticated || !matchId) return;
    fetchMatchData();
  }, [isAuthenticated, matchId, fetchMatchData]);

  useEffect(() => {
    if (match && (match.status === MATCH_STATUS.LIVE || match.status === MATCH_STATUS.PAUSED || match.status === MATCH_STATUS.FINISHED)) {
      fetchScores();
    }
  }, [match, fetchScores]);

  async function handleStart() {
    try {
      const updated = await startMatch(matchId);
      setMatch(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePause() {
    try {
      const updated = await pauseMatch(matchId);
      setMatch(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResume() {
    try {
      const updated = await resumeMatch(matchId);
      setMatch(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFinish() {
    if (!confirm('Are you sure you want to finish this match?')) return;
    try {
      const updated = await finishMatch(matchId);
      setMatch(updated);
      await fetchScores();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this match?')) return;
    try {
      await deleteMatch(matchId);
      router.push('/rooms');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveRound(roundData) {
    setRoundFormError('');
    try {
      if (editingRound) {
        await updateRound(matchId, editingRound._id, roundData);
      } else {
        await createRound(matchId, roundData);
      }
      setShowRoundForm(false);
      setEditingRound(null);
      await fetchMatchData();
      await fetchScores();
    } catch (err) {
      setRoundFormError(err.message);
    }
  }

  function handleEditRound(round) {
    setEditingRound(round);
    setShowRoundForm(true);
    setRoundFormError('');
  }

  async function handleUndoRound(round) {
    if (!confirm(`Undo Round ${round.roundNumber}? This will remove all scores for this round.`)) return;
    setRoundFormError('');
    try {
      await undoRound(matchId, round._id);
      await fetchMatchData();
      await fetchScores();
    } catch (err) {
      setRoundFormError(err.message);
    }
  }

  function openAddRound() {
    setEditingRound(null);
    setShowRoundForm(true);
    setRoundFormError('');
  }

  function cancelRoundForm() {
    setShowRoundForm(false);
    setEditingRound(null);
    setRoundFormError('');
  }

  function statusBadge(status) {
    const colors = {
      [MATCH_STATUS.PENDING]: 'bg-yellow-900/50 text-yellow-400',
      [MATCH_STATUS.PREPARING]: 'bg-blue-900/50 text-blue-400',
      [MATCH_STATUS.LIVE]: 'bg-green-900/50 text-green-400',
      [MATCH_STATUS.PAUSED]: 'bg-orange-900/50 text-orange-400',
      [MATCH_STATUS.FINISHED]: 'bg-gray-700 text-gray-300',
      [MATCH_STATUS.ARCHIVED]: 'bg-gray-800 text-gray-500',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] || 'bg-gray-700 text-gray-300'}`}>
        {status}
      </span>
    );
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
        <p className="mt-2 text-gray-400">Please sign in to view matches.</p>
      </div>
    );
  }

  if (error && !match) {
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

  if (!match) return null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/rooms/${match.roomId}`}
          className="mb-4 inline-block text-sm text-gray-400 hover:text-white transition"
        >
          &larr; Back to Room
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold capitalize">{match.game} Match</h1>
            <div className="flex gap-2 mt-2 items-center">
              {statusBadge(match.status)}
              {match.winner && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-900/50 text-yellow-400">
                  Winner declared
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {match.status === MATCH_STATUS.PENDING && (
              <button
                onClick={handleStart}
                className="py-2 px-4 bg-green-700 hover:bg-green-600 rounded-lg font-medium transition text-sm"
              >
                Start Match
              </button>
            )}
            {match.status === MATCH_STATUS.LIVE && (
              <>
                <button
                  onClick={handlePause}
                  className="py-2 px-4 bg-orange-700 hover:bg-orange-600 rounded-lg font-medium transition text-sm"
                >
                  Pause
                </button>
                <button
                  onClick={handleFinish}
                  className="py-2 px-4 bg-red-700 hover:bg-red-600 rounded-lg font-medium transition text-sm"
                >
                  Finish
                </button>
              </>
            )}
            {match.status === MATCH_STATUS.PAUSED && (
              <>
                <button
                  onClick={handleResume}
                  className="py-2 px-4 bg-green-700 hover:bg-green-600 rounded-lg font-medium transition text-sm"
                >
                  Resume
                </button>
                <button
                  onClick={handleFinish}
                  className="py-2 px-4 bg-red-700 hover:bg-red-600 rounded-lg font-medium transition text-sm"
                >
                  Finish
                </button>
              </>
            )}
            {match.status === MATCH_STATUS.PENDING && (
              <button
                onClick={handleDelete}
                className="py-2 px-4 bg-red-700 hover:bg-red-600 rounded-lg font-medium transition text-sm"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Game</span>
              <p className="font-medium capitalize">{match.game}</p>
            </div>
            <div>
              <span className="text-gray-400">Status</span>
              <p className="font-medium capitalize">{match.status}</p>
            </div>
            <div>
              <span className="text-gray-400">Created</span>
              <p className="font-medium">
                {new Date(match.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Started</span>
              <p className="font-medium">
                {match.startedAt
                  ? new Date(match.startedAt).toLocaleDateString()
                  : 'Not started'}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Finished</span>
              <p className="font-medium">
                {match.finishedAt
                  ? new Date(match.finishedAt).toLocaleDateString()
                  : 'Not finished'}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Rounds</span>
              <p className="font-medium">{scores?.rounds || 0}</p>
            </div>
          </div>
        </div>

        {(match.status === MATCH_STATUS.LIVE ||
          match.status === MATCH_STATUS.PAUSED ||
          match.status === MATCH_STATUS.FINISHED) && (
          <div className="mb-6">
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Scores</h2>
                {canManageScore && (
                  <button
                    onClick={openAddRound}
                    className="py-1.5 px-3 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition"
                  >
                    Add Round
                  </button>
                )}
              </div>

              {showRoundForm && (
                <div className="mb-4">
                  <RoundForm
                    game={match.game}
                    teams={teams}
                    roundNumber={rounds.length + 1}
                    editingRound={editingRound}
                    onSave={handleSaveRound}
                    onCancel={cancelRoundForm}
                  />
                  {roundFormError && (
                    <p className="mt-2 text-red-400 text-xs">{roundFormError}</p>
                  )}
                </div>
              )}

              <Scoreboard
                scores={scores?.scores || []}
                loading={scoresLoading}
                game={match.game}
              />

              {rounds.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Round History</h3>
                  <div className="space-y-2">
                    {[...rounds].reverse().map((round) => (
                      <div
                        key={round._id}
                        className="flex items-center justify-between p-2 bg-gray-900 rounded border border-gray-600 text-sm"
                      >
                        <div>
                          <span className="text-white font-medium">
                            Round {round.roundNumber}
                          </span>
                          {round.game === 'twenty-nine' && (
                            <span className="text-gray-400 ml-2">
                              Bid: {round.bid} | Suit: {round.trumpSuit}
                              {round.roundWinner && (
                                <span className="text-green-400 ml-2">
                                  Winner
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        {canManageScore && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditRound(round)}
                              className="py-1 px-2 bg-gray-700 hover:bg-gray-600 rounded text-xs transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleUndoRound(round)}
                              className="py-1 px-2 bg-red-800 hover:bg-red-700 rounded text-xs transition"
                            >
                              Undo
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          <TeamSection
            matchId={matchId}
            roomId={match.roomId}
            matchStatus={match.status}
            onError={setError}
          />
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
