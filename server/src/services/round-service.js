import { ObjectId } from 'mongodb';
import { getDb } from '../database/index.js';
import { MATCH_STATUS } from '../constants/index.js';
import { getMatchById, updateMatch } from './match-service.js';
import { getTeamsByMatch } from './team-service.js';
import { calculateTwentyNineScore, calculateTwentyNineWinner } from '../game-engine/twenty-nine/index.js';

const COLLECTION = 'rounds';

function getTeamIndex(teams, teamId) {
  const sorted = [...teams].sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
  const teamIdStr = typeof teamId === 'object' ? teamId.toString() : teamId;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i]._id.toString() === teamIdStr) {
      return i;
    }
  }
  return -1;
}

export async function createRound(matchId, data) {
  const db = getDb();

  const match = await getMatchById(matchId);

  if (!match) {
    return { error: 'Match not found', status: 404 };
  }

  if (match.game !== 'twenty-nine') {
    return { error: 'Round scoring is only available for Twenty-Nine matches', status: 400 };
  }

  if (match.status !== MATCH_STATUS.LIVE) {
    return { error: 'Rounds can only be recorded for live matches', status: 400 };
  }

  if (match.winner) {
    return { error: 'Match is already completed', status: 400 };
  }

  const existingRound = await db.collection(COLLECTION).findOne({
    matchId: new ObjectId(matchId),
    roundNumber: data.roundNumber,
  });

  if (existingRound) {
    return { error: `Round ${data.roundNumber} already exists for this match`, status: 409 };
  }

  const teams = await getTeamsByMatch(matchId);

  if (teams.length !== 2) {
    return { error: 'Twenty-Nine requires exactly 2 teams', status: 400 };
  }

  for (const team of teams) {
    if (team.playerIds.length !== 2) {
      return { error: `Team "${team.name}" must have exactly 2 players for Twenty-Nine`, status: 400 };
    }
  }

  const sortedTeams = [...teams].sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
  const team0Id = sortedTeams[0]._id.toString();
  const team1Id = sortedTeams[1]._id.toString();

  const bidTeamIndex = getTeamIndex(sortedTeams, data.bidTeamId);

  if (bidTeamIndex === -1) {
    return { error: 'Bid team is not part of this match', status: 400 };
  }

  const trickPoints = [data.trickPoints.team0, data.trickPoints.team1];

  let roundResult;
  try {
    roundResult = calculateTwentyNineScore({
      bid: data.bid,
      bidTeamIndex,
      trickPoints,
    });
  } catch (err) {
    return { error: err.message, status: 422 };
  }

  const lastRound = await db.collection(COLLECTION)
    .find({ matchId: new ObjectId(matchId) })
    .sort({ roundNumber: -1 })
    .limit(1)
    .toArray();

  const prevCumulative = lastRound.length > 0
    ? { ...lastRound[0].cumulativeScores }
    : { [team0Id]: 0, [team1Id]: 0 };

  const newCumulative = {
    [team0Id]: prevCumulative[team0Id] + roundResult.roundScores[0].score,
    [team1Id]: prevCumulative[team1Id] + roundResult.roundScores[1].score,
  };

  const winnerResult = calculateTwentyNineWinner({
    cumulativeScores: [newCumulative[team0Id], newCumulative[team1Id]],
  });

  const now = new Date();

  const round = {
    matchId: new ObjectId(matchId),
    roundNumber: data.roundNumber,
    bid: data.bid,
    bidTeamId: new ObjectId(data.bidTeamId),
    trumpSuit: data.trumpSuit,
    team0Id: new ObjectId(team0Id),
    team1Id: new ObjectId(team1Id),
    trickPoints: {
      [team0Id]: data.trickPoints.team0,
      [team1Id]: data.trickPoints.team1,
    },
    roundScores: {
      [team0Id]: roundResult.roundScores[0].score,
      [team1Id]: roundResult.roundScores[1].score,
    },
    cumulativeScores: newCumulative,
    roundWinner: roundResult.roundWinner !== null
      ? new ObjectId(roundResult.roundWinner === 0 ? team0Id : team1Id)
      : null,
    matchWinner: null,
    createdAt: now,
    updatedAt: now,
  };

  let winnerTeamId = null;
  if (winnerResult.isComplete) {
    winnerTeamId = winnerResult.winner === 0 ? team0Id : team1Id;
    round.matchWinner = new ObjectId(winnerTeamId);
  }

  const result = await db.collection(COLLECTION).insertOne(round);

  if (winnerResult.isComplete && winnerTeamId) {
    await updateMatch(matchId, {
      winner: new ObjectId(winnerTeamId),
      status: MATCH_STATUS.FINISHED,
      finishedAt: now,
    });
  }

  return {
    round: { ...round, _id: result.insertedId },
    matchComplete: winnerResult.isComplete,
    matchWinner: winnerTeamId,
  };
}

export async function getMatchRounds(matchId) {
  const db = getDb();

  const rounds = await db.collection(COLLECTION)
    .find({ matchId: new ObjectId(matchId) })
    .sort({ roundNumber: 1 })
    .toArray();

  return rounds;
}

export async function getMatchScores(matchId) {
  const db = getDb();

  const match = await getMatchById(matchId);

  if (!match) {
    return { error: 'Match not found', status: 404 };
  }

  const rounds = await db.collection(COLLECTION)
    .find({ matchId: new ObjectId(matchId) })
    .sort({ roundNumber: 1 })
    .toArray();

  const teams = await getTeamsByMatch(matchId);

  const scores = {};
  for (const team of teams) {
    const teamId = team._id.toString();
    scores[teamId] = {
      teamId: team._id,
      teamName: team.name,
      totalScore: 0,
      rounds: [],
    };
  }

  for (const round of rounds) {
    for (const team of teams) {
      const teamId = team._id.toString();
      const roundScore = round.roundScores[teamId] || 0;
      scores[teamId].totalScore += roundScore;
      scores[teamId].rounds.push({
        roundNumber: round.roundNumber,
        score: roundScore,
      });
    }
  }

  return {
    matchId: new ObjectId(matchId),
    status: match.status,
    winner: match.winner,
    scores: Object.values(scores),
    rounds: rounds.length,
  };
}
