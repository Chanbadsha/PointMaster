import { ObjectId } from 'mongodb';
import { getDb } from '../database/index.js';
import { MATCH_STATUS, MATCH_TRANSITIONS } from '../constants/index.js';

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
