import { ObjectId } from 'mongodb';
import { getDb } from '../database/index.js';
import { MATCH_STATUS, MATCH_TRANSITIONS, GAME_TYPES } from '../constants/index.js';

const COLLECTION = 'matches';

export async function createMatch(data) {
  const db = getDb();
  const now = new Date();

  const match = {
    roomId: new ObjectId(data.roomId),
    game: data.game,
    status: MATCH_STATUS.PENDING,
    createdBy: new ObjectId(data.createdBy),
    startedAt: null,
    finishedAt: null,
    winner: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection(COLLECTION).insertOne(match);
  return { ...match, _id: result.insertedId };
}

export async function getMatchById(matchId) {
  const db = getDb();
  const match = await db.collection(COLLECTION).findOne({
    _id: new ObjectId(matchId),
    deletedAt: { $exists: false },
  });
  return match;
}

export async function getRoomMatches(roomId) {
  const db = getDb();
  const matches = await db
    .collection(COLLECTION)
    .find({
      roomId: new ObjectId(roomId),
      deletedAt: { $exists: false },
    })
    .sort({ createdAt: -1 })
    .toArray();
  return matches;
}

export async function updateMatch(matchId, updates) {
  const db = getDb();
  const now = new Date();

  const setFields = { ...updates, updatedAt: now };

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(matchId), deletedAt: { $exists: false } },
    { $set: setFields },
    { returnDocument: 'after' }
  );

  return result;
}

export async function deleteMatch(matchId) {
  const db = getDb();
  const now = new Date();

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(matchId), deletedAt: { $exists: false } },
    { $set: { deletedAt: now, updatedAt: now } },
    { returnDocument: 'after' }
  );

  return result;
}

export async function transitionMatchStatus(matchId, newStatus) {
  const db = getDb();
  const match = await getMatchById(matchId);

  if (!match) {
    return { error: 'Match not found', status: 404 };
  }

  const allowedTransitions = MATCH_TRANSITIONS[match.status];

  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      error: `Cannot transition from '${match.status}' to '${newStatus}'`,
      status: 400,
    };
  }

  if (newStatus === MATCH_STATUS.LIVE) {
    if (match.game === GAME_TYPES.TWENTY_NINE) {
      const teams = await db.collection('teams').find({
        matchId: new ObjectId(matchId),
      }).toArray();

      if (teams.length !== 2) {
        return { error: 'Twenty-Nine requires exactly 2 teams to start', status: 400 };
      }

      for (const team of teams) {
        if (team.playerIds.length !== 2) {
          return { error: `Team "${team.name}" must have exactly 2 players for Twenty-Nine`, status: 400 };
        }
      }

      const teamSizes = teams.map((t) => t.playerIds.length);
      if (new Set(teamSizes).size > 1) {
        return { error: 'All teams must have the same number of players', status: 400 };
      }

      const allPlayerIds = teams.flatMap((t) =>
        t.playerIds.map((p) => p.toString())
      );
      const uniquePlayerIds = new Set(allPlayerIds);
      if (allPlayerIds.length !== uniquePlayerIds.size) {
        return { error: 'A player cannot be assigned to multiple teams', status: 400 };
      }
    }
  }

  const now = new Date();
  const setFields = { status: newStatus, updatedAt: now };

  if (newStatus === MATCH_STATUS.LIVE && !match.startedAt) {
    setFields.startedAt = now;
  }

  if (newStatus === MATCH_STATUS.FINISHED) {
    setFields.finishedAt = now;
  }

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(matchId), deletedAt: { $exists: false } },
    { $set: setFields },
    { returnDocument: 'after' }
  );

  return { match: result };
}
