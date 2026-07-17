import { ObjectId } from 'mongodb';
import { getDb } from '../database/index.js';
import { MATCH_STATUS, GAME_TYPES } from '../constants/index.js';
import { getMatchById, updateMatch } from './match-service.js';
import { getTeamsByMatch } from './team-service.js';
import { calculateTwentyNineScore, calculateTwentyNineWinner } from '../game-engine/twenty-nine/index.js';
import { calculateCallBridgeScore, calculateCallBridgeWinner } from '../game-engine/call-bridge/index.js';

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

function getSortedTeams(teams) {
  return [...teams].sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
}

async function getMatchRoundsSorted(matchId) {
  const db = getDb();
  return db.collection(COLLECTION)
    .find({ matchId: new ObjectId(matchId), deletedAt: { $exists: false } })
    .sort({ roundNumber: 1 })
    .toArray();
}

async function recalculateMatchScores(matchId) {
  const db = getDb();

  const match = await getMatchById(matchId);
  if (!match) {
    return { error: 'Match not found', status: 404 };
  }

  const teams = await getTeamsByMatch(matchId);
  if (teams.length === 0) {
    return { error: 'No teams found for match', status: 400 };
  }

  const sortedTeams = getSortedTeams(teams);
  const teamIds = sortedTeams.map((t) => t._id.toString());

  const rounds = await getMatchRoundsSorted(matchId);
  if (rounds.length === 0) {
    await updateMatch(matchId, {
      winner: null,
      status: match.status === MATCH_STATUS.FINISHED ? MATCH_STATUS.LIVE : match.status,
      finishedAt: match.status === MATCH_STATUS.FINISHED ? null : match.finishedAt,
    });
    return { recalculated: true, roundsRecalculated: 0, matchComplete: false, winner: null };
  }

  const cumulative = {};
  for (const tid of teamIds) {
    cumulative[tid] = 0;
  }

  let matchComplete = false;
  let matchWinnerId = null;

  for (const round of rounds) {
    for (const tid of teamIds) {
      cumulative[tid] += round.roundScores[tid] || 0;
    }

    round.cumulativeScores = { ...cumulative };

    if (match.game === GAME_TYPES.TWENTY_NINE) {
      const cumArray = teamIds.map((tid) => cumulative[tid]);
      const winnerResult = calculateTwentyNineWinner({ cumulativeScores: cumArray });

      if (winnerResult.isComplete) {
        matchComplete = true;
        matchWinnerId = winnerResult.winner !== null ? teamIds[winnerResult.winner] : null;
      }

      round.matchWinner = matchComplete ? new ObjectId(matchWinnerId) : null;
    } else if (match.game === GAME_TYPES.CALL_BRIDGE) {
      const cumArray = teamIds.map((tid) => cumulative[tid]);
      const winnerResult = calculateCallBridgeWinner({ cumulativeScores: cumArray });

      if (winnerResult.isComplete) {
        matchComplete = true;
        matchWinnerId = winnerResult.winner !== null ? teamIds[winnerResult.winner] : null;
      }

      round.matchWinner = matchComplete ? new ObjectId(matchWinnerId) : null;
    }

    await db.collection(COLLECTION).updateOne(
      { _id: round._id },
      {
        $set: {
          cumulativeScores: round.cumulativeScores,
          matchWinner: round.matchWinner,
          updatedAt: new Date(),
        },
      }
    );
  }

  const now = new Date();

  if (matchComplete && matchWinnerId) {
    await updateMatch(matchId, {
      winner: new ObjectId(matchWinnerId),
      status: MATCH_STATUS.FINISHED,
      finishedAt: now,
    });
  } else if (match.status === MATCH_STATUS.FINISHED) {
    await updateMatch(matchId, {
      winner: null,
      status: MATCH_STATUS.LIVE,
      finishedAt: null,
    });
  }

  return {
    recalculated: true,
    roundsRecalculated: rounds.length,
    matchComplete,
    winner: matchWinnerId,
  };
}

export async function createRound(matchId, data) {
  const db = getDb();

  const match = await getMatchById(matchId);

  if (!match) {
    return { error: 'Match not found', status: 404 };
  }

  if (match.status !== MATCH_STATUS.LIVE && match.status !== MATCH_STATUS.PAUSED) {
    return { error: 'Rounds can only be recorded for live or paused matches', status: 400 };
  }

  if (match.winner) {
    return { error: 'Match is already completed', status: 400 };
  }

  const existingRound = await db.collection(COLLECTION).findOne({
    matchId: new ObjectId(matchId),
    roundNumber: data.roundNumber,
    deletedAt: { $exists: false },
  });

  if (existingRound) {
    return { error: `Round ${data.roundNumber} already exists for this match`, status: 409 };
  }

  const teams = await getTeamsByMatch(matchId);

  if (teams.length === 0) {
    return { error: 'No teams found for this match', status: 400 };
  }

  const sortedTeams = getSortedTeams(teams);
  const teamIds = sortedTeams.map((t) => t._id.toString());

  if (match.game === GAME_TYPES.TWENTY_NINE) {
    if (teams.length !== 2) {
      return { error: 'Twenty-Nine requires exactly 2 teams', status: 400 };
    }

    for (const team of teams) {
      if (team.playerIds.length !== 2) {
        return { error: `Team "${team.name}" must have exactly 2 players for Twenty-Nine`, status: 400 };
      }
    }

    const team0Id = teamIds[0];
    const team1Id = teamIds[1];

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
      .find({ matchId: new ObjectId(matchId), deletedAt: { $exists: false } })
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
      game: GAME_TYPES.TWENTY_NINE,
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
      scoreHistory: [
        {
          action: 'created',
          previousState: null,
          changedAt: now,
        },
      ],
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

  if (match.game === GAME_TYPES.CALL_BRIDGE) {
    if (teams.length !== 1) {
      return { error: 'Call Bridge requires individual scoring (one team per player)', status: 400 };
    }

    if (teamIds.length !== 1) {
      return { error: 'Call Bridge expects one team entry', status: 400 };
    }

    const team = teams[0];
    const players = team.playerIds.map((p) => p.toString());

    if (players.length !== 4) {
      return { error: 'Call Bridge requires exactly 4 players', status: 400 };
    }

    let roundResult;
    try {
      roundResult = calculateCallBridgeScore({
        bids: data.bids,
        tricks: data.tricks,
      });
    } catch (err) {
      return { error: err.message, status: 422 };
    }

    const playerScores = {};
    const playerCumulative = {};

    for (let i = 0; i < 4; i++) {
      playerScores[players[i]] = roundResult.roundScores[i].score;
    }

    const lastRound = await db.collection(COLLECTION)
      .find({ matchId: new ObjectId(matchId), deletedAt: { $exists: false } })
      .sort({ roundNumber: -1 })
      .limit(1)
      .toArray();

    const prevCumulative = lastRound.length > 0
      ? { ...lastRound[0].cumulativeScores }
      : {};

    for (const pid of players) {
      prevCumulative[pid] = prevCumulative[pid] || 0;
    }

    for (let i = 0; i < 4; i++) {
      playerCumulative[players[i]] = prevCumulative[players[i]] + roundResult.roundScores[i].score;
    }

    const cumArray = players.map((pid) => playerCumulative[pid]);
    const winnerResult = calculateCallBridgeWinner({ cumulativeScores: cumArray });

    const now = new Date();

    const round = {
      matchId: new ObjectId(matchId),
      roundNumber: data.roundNumber,
      game: GAME_TYPES.CALL_BRIDGE,
      playerIds: players.map((pid) => new ObjectId(pid)),
      bids: data.bids,
      tricks: data.tricks,
      roundScores: playerScores,
      cumulativeScores: playerCumulative,
      roundWinner: roundResult.roundWinner !== null
        ? new ObjectId(players[roundResult.roundWinner])
        : null,
      matchWinner: null,
      scoreHistory: [
        {
          action: 'created',
          previousState: null,
          changedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    let winnerPlayerId = null;
    if (winnerResult.isComplete) {
      winnerPlayerId = players[winnerResult.winner];
      round.matchWinner = new ObjectId(winnerPlayerId);
    }

    const result = await db.collection(COLLECTION).insertOne(round);

    if (winnerResult.isComplete && winnerPlayerId) {
      await updateMatch(matchId, {
        winner: new ObjectId(winnerPlayerId),
        status: MATCH_STATUS.FINISHED,
        finishedAt: now,
      });
    }

    return {
      round: { ...round, _id: result.insertedId },
      matchComplete: winnerResult.isComplete,
      matchWinner: winnerPlayerId,
    };
  }

  return { error: `Unsupported game type: ${match.game}`, status: 400 };
}

export async function updateRound(matchId, roundId, data, userId) {
  const db = getDb();

  const match = await getMatchById(matchId);

  if (!match) {
    return { error: 'Match not found', status: 404 };
  }

  if (match.status !== MATCH_STATUS.LIVE && match.status !== MATCH_STATUS.PAUSED) {
    return { error: 'Rounds can only be edited when match is live or paused', status: 400 };
  }

  const round = await db.collection(COLLECTION).findOne({
    _id: new ObjectId(roundId),
    matchId: new ObjectId(matchId),
    deletedAt: { $exists: false },
  });

  if (!round) {
    return { error: 'Round not found', status: 404 };
  }

  if (match.game === GAME_TYPES.TWENTY_NINE) {
    if (!data.trickPoints) {
      return { error: 'No updates provided', status: 400 };
    }

    const teams = await getTeamsByMatch(matchId);
    const sortedTeams = getSortedTeams(teams);
    const team0Id = sortedTeams[0]._id.toString();
    const team1Id = sortedTeams[1]._id.toString();

    const bidTeamIndex = getTeamIndex(sortedTeams, round.bidTeamId.toString());
    if (bidTeamIndex === -1) {
      return { error: 'Bid team not found', status: 400 };
    }

    const trickPoints = [data.trickPoints.team0, data.trickPoints.team1];

    let roundResult;
    try {
      roundResult = calculateTwentyNineScore({
        bid: round.bid,
        bidTeamIndex,
        trickPoints,
      });
    } catch (err) {
      return { error: err.message, status: 422 };
    }

    const previousState = {
      trickPoints: { ...round.trickPoints },
      roundScores: { ...round.roundScores },
      cumulativeScores: { ...round.cumulativeScores },
    };

    const now = new Date();

    const updatedRoundScores = {
      [team0Id]: roundResult.roundScores[0].score,
      [team1Id]: roundResult.roundScores[1].score,
    };

    await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(roundId) },
      {
        $set: {
          trickPoints: {
            [team0Id]: data.trickPoints.team0,
            [team1Id]: data.trickPoints.team1,
          },
          roundScores: updatedRoundScores,
          roundWinner: roundResult.roundWinner !== null
            ? new ObjectId(roundResult.roundWinner === 0 ? team0Id : team1Id)
            : null,
          updatedAt: now,
        },
        $push: {
          scoreHistory: {
            action: 'updated',
            previousState,
            changedBy: userId ? new ObjectId(userId) : null,
            changedAt: now,
          },
        },
      }
    );

    const recalcResult = await recalculateMatchScores(matchId);

    if (recalcResult.error) {
      return recalcResult;
    }

    const updatedRound = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(roundId),
    });

    return {
      round: updatedRound,
      matchComplete: recalcResult.matchComplete,
      matchWinner: recalcResult.winner,
    };
  }

  if (match.game === GAME_TYPES.CALL_BRIDGE) {
    if (!data.tricks) {
      return { error: 'No updates provided', status: 400 };
    }

    let roundResult;
    try {
      roundResult = calculateCallBridgeScore({
        bids: round.bids,
        tricks: data.tricks,
      });
    } catch (err) {
      return { error: err.message, status: 422 };
    }

    const previousState = {
      tricks: [...round.tricks],
      roundScores: { ...round.roundScores },
      cumulativeScores: { ...round.cumulativeScores },
    };

    const now = new Date();
    const playerScores = {};

    for (let i = 0; i < 4; i++) {
      playerScores[round.playerIds[i].toString()] = roundResult.roundScores[i].score;
    }

    const roundWinner = roundResult.roundWinner !== null
      ? new ObjectId(round.playerIds[roundResult.roundWinner])
      : null;

    await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(roundId) },
      {
        $set: {
          tricks: data.tricks,
          roundScores: playerScores,
          roundWinner,
          updatedAt: now,
        },
        $push: {
          scoreHistory: {
            action: 'updated',
            previousState,
            changedBy: userId ? new ObjectId(userId) : null,
            changedAt: now,
          },
        },
      }
    );

    const recalcResult = await recalculateMatchScores(matchId);

    if (recalcResult.error) {
      return recalcResult;
    }

    const updatedRound = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(roundId),
    });

    return {
      round: updatedRound,
      matchComplete: recalcResult.matchComplete,
      matchWinner: recalcResult.winner,
    };
  }

  return { error: `Unsupported game type: ${match.game}`, status: 400 };
}

export async function undoRound(matchId, roundId, userId) {
  const db = getDb();

  const match = await getMatchById(matchId);

  if (!match) {
    return { error: 'Match not found', status: 404 };
  }

  if (match.status !== MATCH_STATUS.LIVE && match.status !== MATCH_STATUS.PAUSED && match.status !== MATCH_STATUS.FINISHED) {
    return { error: 'Rounds can only be undone when match is live, paused, or finished', status: 400 };
  }

  const round = await db.collection(COLLECTION).findOne({
    _id: new ObjectId(roundId),
    matchId: new ObjectId(matchId),
    deletedAt: { $exists: false },
  });

  if (!round) {
    return { error: 'Round not found', status: 404 };
  }

  const now = new Date();

  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(roundId) },
    {
      $set: { deletedAt: now, updatedAt: now },
      $push: {
        scoreHistory: {
          action: 'deleted',
          previousState: {
            trickPoints: round.trickPoints || null,
            roundScores: { ...round.roundScores },
            cumulativeScores: { ...round.cumulativeScores },
          },
          changedBy: userId ? new ObjectId(userId) : null,
          changedAt: now,
        },
      },
    }
  );

  const recalcResult = await recalculateMatchScores(matchId);

  if (recalcResult.error) {
    return recalcResult;
  }

  return {
    undone: true,
    matchComplete: recalcResult.matchComplete,
    matchWinner: recalcResult.winner,
  };
}

export async function getMatchRounds(matchId) {
  const db = getDb();

  const rounds = await db.collection(COLLECTION)
    .find({ matchId: new ObjectId(matchId), deletedAt: { $exists: false } })
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
    .find({ matchId: new ObjectId(matchId), deletedAt: { $exists: false } })
    .sort({ roundNumber: 1 })
    .toArray();

  const teams = await getTeamsByMatch(matchId);

  if (match.game === GAME_TYPES.TWENTY_NINE) {
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
      game: match.game,
      scores: Object.values(scores),
      rounds: rounds.length,
    };
  }

  if (match.game === GAME_TYPES.CALL_BRIDGE) {
    const scores = {};

    if (teams.length > 0) {
      const team = teams[0];
      for (const playerId of team.playerIds) {
        const pid = playerId.toString();
        scores[pid] = {
          playerId: playerId,
          playerName: null,
          totalScore: 0,
          rounds: [],
        };
      }

      for (const round of rounds) {
        if (round.playerIds) {
          for (const playerObjId of round.playerIds) {
            const pid = playerObjId.toString();
            if (!scores[pid]) {
              scores[pid] = {
                playerId: playerObjId,
                playerName: null,
                totalScore: 0,
                rounds: [],
              };
            }
            const roundScore = round.roundScores[pid] || 0;
            scores[pid].totalScore += roundScore;
            scores[pid].rounds.push({
              roundNumber: round.roundNumber,
              score: roundScore,
            });
          }
        }
      }

      if (team.players) {
        for (const player of team.players) {
          const pid = player._id.toString();
          if (scores[pid]) {
            scores[pid].playerName = player.name;
          }
        }
      }
    }

    return {
      matchId: new ObjectId(matchId),
      status: match.status,
      winner: match.winner,
      game: match.game,
      scores: Object.values(scores),
      rounds: rounds.length,
    };
  }

  return {
    matchId: new ObjectId(matchId),
    status: match.status,
    winner: match.winner,
    game: match.game,
    scores: [],
    rounds: rounds.length,
  };
}
